/**
 * Download ANC Makina product categories with images.
 * Data extracted via browser MCP from https://www.anacmakina.com/urunler.php
 * 
 * Structure: ul.products > li > a[href] > img[src] + div.content > div.name > p
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.anacmakina.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'products');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'category_images');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// All 46 categories extracted from the live DOM via chrome-devtools MCP
const CATEGORIES = [
  { name: "AĞIR DÖKÜM GRUBU", href: "urunler/AĞIR-DÖKÜM-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559095/k-agir-dokum-grubu-16123362377574.jpg" },
  { name: "MOTOR PARÇALARI", href: "urunler/MOTOR-PARÇALARI.html", imgSrc: "yuklenen/kategoriler/1517227120/k-motor-parcalari-16044066896047.jpg" },
  { name: "RADYATÖR & YAĞ SOĞUTUCU GRUBU", href: "urunler/RADYATÖR-YAĞ-SOĞUTUCU-GRUBU.html", imgSrc: "yuklenen/kategoriler/1611567024/k-radyator-&-yag-sogutucu-grubu-16115690413478.jpg" },
  { name: "CATERPİLLAR GRUBU", href: "urunler/CATERPİLLAR-GRUBU.html", imgSrc: "yuklenen/kategoriler/1613554767/k-caterpillar-grubu-16139873764449.jpg" },
  { name: "ZF HİDROMEK GRUBU", href: "urunler/ZF-HİDROMEK-GRUBU.html", imgSrc: "yuklenen/kategoriler/1613456611/k-zf-hidromek-grubu-16139874231742.jpg" },
  { name: "CARRARO PARÇA GRUBU", href: "urunler/CARRARO-PARÇA-GRUBU.html", imgSrc: "yuklenen/kategoriler/1551943525/k-carraro-parca-grubu-16139875959756.jpg" },
  { name: "AKS GRUBU", href: "urunler/AKS-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559276/k-aks-grubu-16617562029408.png" },
  { name: "BALATA GRUBU", href: "urunler/BALATA-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559287/k-balata-grubu-16044053596451.jpg" },
  { name: "CONTA GRUPLARI", href: "urunler/CONTA-GRUPLARI.html", imgSrc: "yuklenen/kategoriler/1432559393/k-em8338.jpg" },
  { name: "ÇELİK BURÇ GRUBU", href: "urunler/ÇELİK-BURÇ-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559471/k-asdasd.jpg" },
  { name: "BİLYA GRUBU", href: "urunler/BİLYA-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559313/k-jcb-bearings-500x500.jpg" },
  { name: "DİŞLİ GRUBU", href: "urunler/DİŞLİ-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559492/k-images.jpg" },
  { name: "ELEKTRİK GRUBU", href: "urunler/ELEKTRİK-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559698/k-elektrik-grubu-16126185623783.jpg" },
  { name: "AMORTİSÖR GRUBU", href: "urunler/AMORTİSÖR-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441789374/k-gazovyie-pruzhinyi-kategoriya-1-_7.jpg" },
  { name: "FİLTRE GRUBU", href: "urunler/FİLTRE-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559707/k-filtre-grubu-160440555934.jpg" },
  { name: "KAYIŞ GRUBU", href: "urunler/KAYIŞ-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559824/k-17.jpg" },
  { name: "TURBOLAR", href: "urunler/TURBOLAR.html", imgSrc: "yuklenen/kategoriler/1441725138/k-k-24.jpg" },
  { name: "BOŞLUK PULLARI GRUBU", href: "urunler/BOŞLUK-PULLARI-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559330/k-30_nitronic_washer.jpg" },
  { name: "KOL GRUPLARI", href: "urunler/KOL-GRUPLARI.html", imgSrc: "yuklenen/kategoriler/1432559836/k-kol-gruplari-16121651422592.jpg" },
  { name: "DÜĞME GRUBU", href: "urunler/DÜĞME-GRUBU.html", imgSrc: "yuklenen/kategoriler/1573279451/k-jcb_701-60004.png" },
  { name: "CAM GRUBU", href: "urunler/CAM-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559354/k-cam-grubu-16139919245455.jpg" },
  { name: "LAMBA GRUBU", href: "urunler/LAMBA-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559852/k-lambagrubu.png" },
  { name: "MÜŞÜR GRUBU", href: "urunler/MÜŞÜR-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559869/k-musur-grubu-1613989143648.jpg" },
  { name: "PİM GRUBU", href: "urunler/PİM-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559884/k-pins.png" },
  { name: "DİĞER", href: "urunler/DİĞER.html", imgSrc: "yuklenen/kategoriler/1603720541/k-diger-16043079937472.jpg" },
  { name: "PİSTON GRUBU", href: "urunler/PİSTON-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559900/k-piston-grubu-16119326209653.jpg" },
  { name: "PİSTON KEÇELERİ", href: "urunler/PİSTON-KEÇELERİ.html", imgSrc: "yuklenen/kategoriler/1441789400/k-k-27.jpg" },
  { name: "ETİKETLER", href: "urunler/ETİKETLER.html", imgSrc: "yuklenen/kategoriler/1603723746/k-etiketler-16044067679356.jpg" },
  { name: "POMPA GRUPLARI", href: "urunler/POMPA-GRUPLARI.html", imgSrc: "yuklenen/kategoriler/1432559956/k-elementy-ukladu-hydraulicznego-1499172744.png" },
  { name: "SARI BURÇ GRUBU", href: "urunler/SARI-BURÇ-GRUBU.html", imgSrc: "yuklenen/kategoriler/1432559991/k-bronze-products-500x500.jpg" },
  { name: "SEKMAN GRUPLARI", href: "urunler/SEKMAN-GRUPLARI.html", imgSrc: "yuklenen/kategoriler/1432560014/k-sekman-gruplari-16139906832906.jpg" },
  { name: "CİVATA GRUBU", href: "urunler/CİVATA-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715434/k-civata-grubu-16139936921496.jpg" },
  { name: "PERVANE GRUBU", href: "urunler/PERVANE-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715457/k-jcb-radiator-fan-500x500.jpg" },
  { name: "EGZOZ GRUBU", href: "urunler/EGZOZ-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715468/k-egzoz-grubu-16139900667296.jpg" },
  { name: "TAKOZ GRUBU", href: "urunler/TAKOZ-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715507/k-takoz-grubu-16139978861513.jpg" },
  { name: "HORTUM GRUBU", href: "urunler/HORTUM-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715520/k-hortum-grubu-16121630907360.jpg" },
  { name: "ISTAVROZ GRUBU", href: "urunler/ISTAVROZ-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715549/k-k-20.jpg" },
  { name: "YAĞ KEÇELERİ", href: "urunler/YAĞ-KEÇELERİ.html", imgSrc: "yuklenen/kategoriler/1441715560/k-yag-keceleri-16139861913540.png" },
  { name: "YARIKLI BURÇLAR", href: "urunler/YARIKLI-BURÇLAR.html", imgSrc: "yuklenen/kategoriler/1441715577/k-spring-bushes-250x250-250x250.jpg" },
  { name: "PLASTİK GRUBU", href: "urunler/PLASTİK-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715595/k-plastik-grubu-16123406769406.jpg" },
  { name: "ŞAFT GRUBU", href: "urunler/ŞAFT-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715611/k-saft-grubu-16139967805721.jpg" },
  { name: "JANT GRUBU", href: "urunler/JANT-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715621/k-jant-grubu-16119338414674.jpg" },
  { name: "KAPAK GRUBU", href: "urunler/KAPAK-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441715644/k-kapak-grubu-16121225851144.jpg" },
  { name: "TIRNAK GRUBU", href: "urunler/TIRNAK-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441720323/k-spare-part-bucket-tooth--1_big--17022318193456025500.jpg" },
  { name: "KOVA & ATAŞMAN GRUBU", href: "urunler/KOVA-ATAŞMAN-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441720371/k-kovalar.jpg" },
  { name: "GAZ TELİ GRUBU", href: "urunler/GAZ-TELİ-GRUBU.html", imgSrc: "yuklenen/kategoriler/1441725016/k-gaz-teli-grubu-16121202487761.jpg" },
];

// English translations for category names
const TRANSLATIONS = {
  "AĞIR DÖKÜM GRUBU": "Heavy Casting Group",
  "MOTOR PARÇALARI": "Engine Parts",
  "RADYATÖR & YAĞ SOĞUTUCU GRUBU": "Radiator & Oil Cooler Group",
  "CATERPİLLAR GRUBU": "Caterpillar Group",
  "ZF HİDROMEK GRUBU": "ZF Hidromek Group",
  "CARRARO PARÇA GRUBU": "Carraro Parts Group",
  "AKS GRUBU": "Axle Group",
  "BALATA GRUBU": "Brake Pad Group",
  "CONTA GRUPLARI": "Gasket Groups",
  "ÇELİK BURÇ GRUBU": "Steel Bushing Group",
  "BİLYA GRUBU": "Bearing Group",
  "DİŞLİ GRUBU": "Gear Group",
  "ELEKTRİK GRUBU": "Electrical Group",
  "AMORTİSÖR GRUBU": "Shock Absorber Group",
  "FİLTRE GRUBU": "Filter Group",
  "KAYIŞ GRUBU": "Belt Group",
  "TURBOLAR": "Turbochargers",
  "BOŞLUK PULLARI GRUBU": "Shim Washer Group",
  "KOL GRUPLARI": "Arm Groups",
  "DÜĞME GRUBU": "Button / Switch Group",
  "CAM GRUBU": "Glass Group",
  "LAMBA GRUBU": "Lamp Group",
  "MÜŞÜR GRUBU": "Sensor / Switch Group",
  "PİM GRUBU": "Pin Group",
  "DİĞER": "Other",
  "PİSTON GRUBU": "Piston Group",
  "PİSTON KEÇELERİ": "Piston Seals",
  "ETİKETLER": "Labels / Stickers",
  "POMPA GRUPLARI": "Pump Groups",
  "SARI BURÇ GRUBU": "Bronze Bushing Group",
  "SEKMAN GRUPLARI": "Piston Ring Groups",
  "CİVATA GRUBU": "Bolt Group",
  "PERVANE GRUBU": "Fan Blade Group",
  "EGZOZ GRUBU": "Exhaust Group",
  "TAKOZ GRUBU": "Mount / Block Group",
  "HORTUM GRUBU": "Hose Group",
  "ISTAVROZ GRUBU": "Universal Joint Group",
  "YAĞ KEÇELERİ": "Oil Seals",
  "YARIKLI BURÇLAR": "Split Bushings",
  "PLASTİK GRUBU": "Plastic Group",
  "ŞAFT GRUBU": "Shaft Group",
  "JANT GRUBU": "Rim / Wheel Group",
  "KAPAK GRUBU": "Cover / Cap Group",
  "TIRNAK GRUBU": "Bucket Tooth Group",
  "KOVA & ATAŞMAN GRUBU": "Bucket & Attachment Group",
  "GAZ TELİ GRUBU": "Throttle Cable Group",
};

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redir = res.headers.location;
        if (redir.startsWith('/')) redir = `${parsedUrl.protocol}//${parsedUrl.host}${redir}`;
        return downloadFile(redir, filepath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
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
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ANC Makina Category Scraper — 46 Categories               ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Output: ${OUTPUT_DIR}`);
  console.log(`║  Images: ${IMAGES_DIR}`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const results = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const idx = String(i + 1).padStart(2, '0');
    
    // Create safe filename
    const safeName = cat.name
      .replace(/&/g, 'and')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 50);
    
    const ext = path.extname(cat.imgSrc).split('?')[0] || '.jpg';
    const filename = `${idx}_${safeName}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Build full image URL — encode path properly
    const imgUrl = `${BASE_URL}/${encodeURI(cat.imgSrc)}`;
    const categoryUrl = `${BASE_URL}/${encodeURI(cat.href)}`;
    
    process.stdout.write(`  [${idx}/46] ${cat.name.padEnd(32)} `);
    
    try {
      await downloadFile(imgUrl, filepath);
      const stats = fs.statSync(filepath);
      console.log(`✓ ${(stats.size / 1024).toFixed(0)}KB → ${filename}`);
      
      results.push({
        id: i + 1,
        name_tr: cat.name,
        name_en: TRANSLATIONS[cat.name] || '',
        category_url: categoryUrl,
        source_image_url: imgUrl,
        local_image: `category_images/${filename}`,
        image_filename: filename,
      });
      success++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      results.push({
        id: i + 1,
        name_tr: cat.name,
        name_en: TRANSLATIONS[cat.name] || '',
        category_url: categoryUrl,
        source_image_url: imgUrl,
        local_image: null,
        error: err.message,
      });
      failed++;
    }
    
    await delay(150);
  }

  // Save JSON catalog
  const catalogPath = path.join(OUTPUT_DIR, 'anc_categories.json');
  fs.writeFileSync(catalogPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log('\n' + '═'.repeat(62));
  console.log(`  ✅ Downloaded: ${success}/${CATEGORIES.length} category images`);
  if (failed > 0) console.log(`  ⚠  Failed: ${failed}`);
  console.log(`  📄 Catalog: ${catalogPath}`);
  console.log(`  📁 Images:  ${IMAGES_DIR}`);
  console.log('═'.repeat(62));
}

main().catch(console.error);
