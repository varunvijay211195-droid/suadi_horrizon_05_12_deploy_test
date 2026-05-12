/**
 * Download all ANC Makina products with images across all categories.
 * 
 * Target: https://www.anacmakina.com/urunler/CATEGORY.html
 * DOM Structure: 
 * li > a[href] > img[src]
 * li > div.content > div.data > div.name > p (Name) + p (Ref No)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.anacmakina.com';
const DATA_DIR = path.join(__dirname, '..', 'products');
const IMAGES_DIR = path.join(DATA_DIR, 'product_images');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redir = res.headers.location;
        if (redir.startsWith('/')) redir = BASE_URL + redir;
        else if (!redir.startsWith('http')) redir = BASE_URL + '/' + redir;
        return fetchUrl(redir).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    // If file already exists and is non-empty, skip
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      if (stats.size > 0) return resolve(filepath);
    }
    
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redir = res.headers.location;
        if (redir.startsWith('/')) redir = BASE_URL + redir;
        else if (!redir.startsWith('http')) redir = BASE_URL + '/' + redir;
        return downloadFile(redir, filepath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const ws = fs.createWriteStream(filepath);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve(filepath); });
      ws.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const catalogPath = path.join(DATA_DIR, 'anc_categories.json');
  if (!fs.existsSync(catalogPath)) {
    console.error(`Catalog not found: ${catalogPath}`);
    return;
  }
  
  const categories = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const allProducts = [];
  let totalImagesDownloaded = 0;
  let totalImagesFailed = 0;
  
  console.log(`Starting product scrape for ${categories.length} categories...`);

  // Use simple regex to extract product li blocks
  const productBlockPattern = /<li>\s*<a href="([^"]+)">\s*<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<div class="name">\s*<p>([\s\S]*?)<\/p>(?:\s*<p[^>]*>([\s\S]*?)<\/p>)?[\s\S]*?<\/li>/gi;

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    console.log(`\n[${i + 1}/${categories.length}] Processing Category: ${cat.name_tr}`);
    
    try {
      const html = await fetchUrl(cat.category_url);
      
      // Match products using regex
      let match;
      let count = 0;
      
      const productsInCategory = [];
      
      while ((match = productBlockPattern.exec(html)) !== null) {
        const [_, href, imgSrc, nameHtml, refHtml] = match;
        
        const name = nameHtml.replace(/<[^>]+>/g, '').trim();
        const refNo = refHtml ? refHtml.replace(/<[^>]+>/g, '').replace('Ref No :', '').trim() : '';
        
        // Fix URLs
        const productUrl = href.startsWith('http') ? href : `${BASE_URL}/urunler/${href}`;
        const imageUrl = imgSrc.startsWith('http') ? imgSrc : `${BASE_URL}/${imgSrc}`;
        
        // Create filename
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
        const ext = path.extname(imgSrc).split('?')[0] || '.jpg';
        const filename = `${cat.id}_${count + 1}_${safeName}${ext}`;
        const localImagePath = `product_images/${filename}`;
        
        productsInCategory.push({
          category_id: cat.id,
          category_name: cat.name_en || cat.name_tr,
          name: name,
          ref_no: refNo,
          product_url: productUrl,
          source_image_url: imageUrl,
          local_image: localImagePath,
          image_filename: filename
        });
        
        count++;
      }
      
      console.log(`  Found ${count} products.`);
      
      // Download images for this category sequentially
      for (let p = 0; p < productsInCategory.length; p++) {
        const prod = productsInCategory[p];
        const absoluteImgPath = path.join(DATA_DIR, prod.local_image);
        
        try {
          await downloadFile(prod.source_image_url, absoluteImgPath);
          totalImagesDownloaded++;
          process.stdout.write('.');
        } catch (err) {
          totalImagesFailed++;
          process.stdout.write('x');
          prod.local_image = null; // Mark as failed
        }
        
        if (p % 10 === 0) await delay(100); // Be polite
      }
      console.log('');
      
      allProducts.push(...productsInCategory);
      
    } catch (err) {
      console.error(`  Failed to fetch category: ${err.message}`);
    }
  }
  
  const outputPath = path.join(DATA_DIR, 'anc_products.json');
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2), 'utf-8');
  
  console.log('\n======================================');
  console.log(`✅ Scrape Complete!`);
  console.log(`Total Products Extracted: ${allProducts.length}`);
  console.log(`Images Downloaded: ${totalImagesDownloaded}`);
  console.log(`Images Failed: ${totalImagesFailed}`);
  console.log(`Products saved to: ${outputPath}`);
  console.log('======================================');
}

main().catch(console.error);
