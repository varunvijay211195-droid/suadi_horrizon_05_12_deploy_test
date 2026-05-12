/**
 * Download all ANC Makina detailed product data for each of the 2,722 products.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'products');
const PRODUCTS_FILE = path.join(DATA_DIR, 'anc_products.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'anc_products_detailed.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'anc_products_detailed_progress.json');

const CONCURRENCY = 15; // Concurrent requests
const BASE_URL = 'https://www.anacmakina.com';

function fetchUrl(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redir = res.headers.location;
        if (redir.startsWith('/')) redir = BASE_URL + redir;
        else if (!redir.startsWith('http')) redir = BASE_URL + '/' + redir;
        return fetchUrl(redir, retries).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        if (retries > 0) return resolve(fetchUrl(url, retries - 1));
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', err => {
          if (retries > 0) return resolve(fetchUrl(url, retries - 1));
          reject(err);
      });
    }).on('error', err => {
        if (retries > 0) return resolve(fetchUrl(url, retries - 1));
        reject(err);
    }).on('timeout', () => {
        if (retries > 0) return resolve(fetchUrl(url, retries - 1));
        reject(new Error('Timeout'));
    });
  });
}

function parseTables(html) {
  const tablesPattern = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const rowsPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const colsPattern = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
  
  const tables = [];
  let tMatch;
  while ((tMatch = tablesPattern.exec(html)) !== null) {
    const tableHtml = tMatch[1];
    const rows = [];
    let rMatch;
    while ((rMatch = rowsPattern.exec(tableHtml)) !== null) {
      const rowHtml = rMatch[1];
      const cols = [];
      let cMatch;
      while ((cMatch = colsPattern.exec(rowHtml)) !== null) {
        cols.push(cMatch[1].replace(/<[^>]*>/g, '').trim());
      }
      if (cols.length > 0) rows.push(cols);
    }
    if (rows.length > 0) tables.push(rows);
  }
  return tables;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    console.error(`Products file not found!`);
    return;
  }
  
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  let detailedProducts = [];
  let processedCount = 0;
  
  // Load progress if exists
  if (fs.existsSync(PROGRESS_FILE)) {
      detailedProducts = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      processedCount = detailedProducts.length;
      console.log(`Resuming from ${processedCount} products...`);
  }
  
  const pendingProducts = products.slice(processedCount);
  console.log(`Total remaining to process: ${pendingProducts.length}`);

  let activeCount = 0;
  let queueIndex = 0;
  let successCount = 0;
  let failCount = 0;

  return new Promise((resolve) => {
    function runNext() {
      if (queueIndex >= pendingProducts.length) {
        if (activeCount === 0) {
            // Save final
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(detailedProducts, null, 2));
            if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
            resolve();
        }
        return;
      }
      
      const idx = queueIndex++;
      const prod = pendingProducts[idx];
      activeCount++;
      
      const realUrl = prod.product_url.replace('/urunler/', '/');
      fetchUrl(realUrl)
        .then(html => {
          const tables = parseTables(html);
          
          let crossReferences = [];
          let features = {};
          
          // Heuristics: first table is usually cross ref, second is specs
          if (tables.length > 0) {
              const t1 = tables[0];
              // check if it's the OLD NUMBER table
              if (t1.length > 1 && t1[1].length >= 2 && t1[1][0].includes('OLD NUMBER')) {
                  for (let i = 2; i < t1.length; i++) {
                      if (t1[i].length >= 2 && t1[i][0] !== '-') {
                          crossReferences.push({
                              old_number: t1[i][0],
                              new_number: t1[i][1]
                          });
                      }
                  }
              }
          }
          if (tables.length > 1) {
              const t2 = tables[1];
              // features table
              t2.forEach(row => {
                  if (row.length >= 2 && row[0]) {
                      const key = row[0].replace(/:/g, '').trim();
                      if (key) features[key] = row[1];
                  }
              });
          }
          
          detailedProducts.push({
              ...prod,
              cross_references: crossReferences,
              features: features
          });
          successCount++;
        })
        .catch(err => {
            console.error(`\nFailed [${idx}]: ${prod.product_url} -> ${err.message}`);
            // Push empty details so we don't lose the product entirely
            detailedProducts.push({
              ...prod,
              cross_references: [],
              features: {},
              fetch_error: err.message
          });
          failCount++;
        })
        .finally(() => {
          activeCount--;
          const done = successCount + failCount;
          if (done % 50 === 0) {
              process.stdout.write(`\rProgress: ${done} / ${pendingProducts.length} `);
              // Save progress
              fs.writeFileSync(PROGRESS_FILE, JSON.stringify(detailedProducts, null, 2));
          }
          runNext();
        });
    }

    // Start workers
    for (let i = 0; i < CONCURRENCY; i++) {
      runNext();
    }
  }).then(() => {
      console.log('\n======================================');
      console.log(`✅ Detailed Scrape Complete!`);
      console.log(`Successfully fetched details: ${successCount}`);
      console.log(`Failed: ${failCount}`);
      console.log(`Detailed products saved to: ${OUTPUT_FILE}`);
      console.log('======================================');
  });
}

main().catch(console.error);
