import fs from 'fs';
import path from 'path';

// Load config dynamically from firebase-applet-config.json
let PROJECT_ID = 'gen-lang-client-0169314778';
let DATABASE_ID = 'ai-studio-sganewsportal-90700467-8452-46fc-a827-8eff7eea9caf';
let API_KEY = '';
const BASE_URL = 'https://sganews.vercel.app';

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    PROJECT_ID = config.projectId || PROJECT_ID;
    DATABASE_ID = config.firestoreDatabaseId || DATABASE_ID;
    API_KEY = config.apiKey || '';
  }
} catch (e) {
  console.warn('[Sitemap Generator] Could not load firebase-applet-config.json:', e.message);
}

function createSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function run() {
  console.log('[Sitemap Generator] Initializing build-time sitemap compilation...');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const urlset = [];

  // 1. Add Homepage
  urlset.push({
    loc: `${BASE_URL}/`,
    lastmod: todayStr,
    changefreq: 'daily',
    priority: '1.0'
  });

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/articles?pageSize=100${API_KEY ? `&key=${API_KEY}` : ''}`;
    console.log(`[Sitemap Generator] Fetching live articles from Firestore REST API...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Firestore REST API returned status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const documents = data.documents || [];
    console.log(`[Sitemap Generator] Found ${documents.length} raw articles in Firestore.`);

    const authorNames = new Set();
    const articles = [];

    documents.forEach((doc) => {
      const fields = doc.fields;
      if (!fields) return;

      const title = fields.title?.stringValue || '';
      const authorName = fields.authorName?.stringValue || 'penulis';
      const status = fields.status?.stringValue || 'published';
      const category = fields.category?.stringValue || '';
      const slugField = fields.slug?.stringValue || '';
      const isFeatured = fields.isFeatured?.booleanValue || false;
      const isBreaking = fields.isBreaking?.booleanValue || false;

      // Extract date
      const rawDate = fields.updatedAt?.stringValue || fields.publishedAt?.stringValue || fields.createdAt?.stringValue || todayStr;
      let lastmod = rawDate.split('T')[0];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
        lastmod = todayStr;
      }

      // Filter: only published articles (or default empty status as published)
      if (status === 'published' || !status) {
        // Exclude politik
        if (category !== 'Politik') {
          articles.push({
            title,
            authorName,
            slugField,
            lastmod,
            priority: (isFeatured || isBreaking) ? '0.9' : '0.8'
          });

          if (authorName) {
            authorNames.add(authorName);
          }
        }
      }
    });

    // 2. Add Author Profiles to URLset
    authorNames.forEach((name) => {
      const authorSlug = createSlug(name);
      if (authorSlug) {
        urlset.push({
          loc: `${BASE_URL}/${authorSlug}`,
          lastmod: todayStr,
          changefreq: 'weekly',
          priority: '0.7'
        });
      }
    });

    // 3. Add Articles to URLset
    articles.forEach((art) => {
      const authorSlug = createSlug(art.authorName);
      const articleSlug = art.slugField ? createSlug(art.slugField) : createSlug(art.title);
      const loc = `${BASE_URL}/${authorSlug}/${articleSlug}`;
      
      urlset.push({
        loc,
        lastmod: art.lastmod,
        changefreq: 'weekly',
        priority: art.priority
      });
    });

    console.log(`[Sitemap Generator] Compilation complete. Total URLs generated: ${urlset.length}`);

  } catch (err) {
    console.warn('[Sitemap Generator] Warning: Firestore fetch failed. Reverting to static fallback list.', err.message);
    // Fallback static list (initial articles)
    const fallbacks = [
      { author: 'kancah4d-official', slug: 'kancah4d-platform-hiburan-online-resmi-2026', priority: '1.0' },
      { author: 'kancah4d-official', slug: 'tren-era-baru-2026-mengapa-kancah4d-menjadi-platform-hiburan-paling-dicari', priority: '0.9' },
      { author: 'kancah4d-official', slug: 'kancah4d-mengenal-tren-pencarian-digital-dan-fenomena-komunitas-kancah4d-di-kalangan-pengguna-internet', priority: '0.9' },
      { author: 'jeje', slug: 'fenomena-micro-retirement-generasi-z-mulai-ambil-pensiun-dini-tiap-5-tahun', priority: '0.9' },
      { author: 'bandi', slug: 'memasuki-paruh-kedua-2026-lompatan-besar-ai-fisik-hingga-kebutuhan-infrastruktur-digital-global-kancah4d', priority: '0.9' },
      { author: 'kancahtoto', slug: 'lompatan-teknologi-2026-indonesia-garap-riset-ai-dan-quantum-computing', priority: '0.8' },
      { author: 'siti-rahma-mikom', slug: 'transformasi-ekonomi-digital-indonesia-2026-proyeksi-pertumbuhan-umkm-berbasis-ai', priority: '0.9' },
      { author: 'admin-sga-redaksi', slug: 'timnas-sepak-bola-indonesia-tembus-babak-kualifikasi-final-kejuaraan-asia-2026', priority: '0.9' },
      { author: 'budi-santoso', slug: 'peluncuran-satelit-komunikasi-nusantara-3-sukses-mengorbit-di-ketinggian-geostasioner', priority: '0.8' },
      { author: 'budi-santoso', slug: 'festival-film-nusantara-2026-siap-digelar-di-bali-dengan-ratusan-karya-inovatif', priority: '0.8' },
      { author: 'siti-rahma-mikom', slug: 'panduan-gaya-hidup-sehat-efektivitas-metode-meditasi-dan-mindful-living-di-era-serba-cepat', priority: '0.8' }
    ];

    const authors = ['kancah4d-official', 'jeje', 'bandi', 'kancahtoto', 'siti-rahma-mikom', 'budi-santoso', 'admin-sga-redaksi'];
    
    authors.forEach((name) => {
      urlset.push({
        loc: `${BASE_URL}/${name}`,
        lastmod: todayStr,
        changefreq: 'weekly',
        priority: '0.7'
      });
    });

    fallbacks.forEach((fb) => {
      urlset.push({
        loc: `${BASE_URL}/${fb.author}/${fb.slug}`,
        lastmod: '2026-07-05',
        changefreq: 'weekly',
        priority: fb.priority
      });
    });
  }

  // Compile XML string
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xmlContent, 'utf8');
  console.log(`[Sitemap Generator] Success: Wrote updated sitemap XML with ${urlset.length} URLs to ${sitemapPath}`);
}

run();
