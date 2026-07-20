import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

function createSlug(text: string): string {
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

function escapeXml(unsafe: any): string {
  if (!unsafe) return '';
  return unsafe.toString().replace(/[<>&'"]/g, (c: string) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export default async function handler(req: any, res: any) {
  console.log('[Sitemap API] Dynamic sitemap compilation request received.');
  
  const BASE_URL = 'https://sganews.vercel.app';
  const todayStr = new Date().toISOString().split('T')[0];
  const urlset: any[] = [];

  // 1. Add Homepage
  urlset.push({
    loc: `${BASE_URL}/`,
    lastmod: todayStr,
    changefreq: 'daily',
    priority: '1.0'
  });

  try {
    const querySnapshot = await getDocs(collection(db, 'articles'));
    
    const authorNames = new Set<string>();
    const articles: any[] = [];

    querySnapshot.forEach((docSnap) => {
      const art = docSnap.data();
      const title = art.title || '';
      const authorName = art.authorName || 'penulis';
      const status = art.status || 'published';
      const category = art.category || '';
      const slugField = art.slug || '';
      const isFeatured = art.isFeatured || false;
      const isBreaking = art.isBreaking || false;

      // Extract date
      const rawDate = art.updatedAt || art.publishedAt || art.createdAt || todayStr;
      let lastmod = typeof rawDate === 'string' ? rawDate.split('T')[0] : todayStr;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
        lastmod = todayStr;
      }

      // Filter: only published articles
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

    console.log(`[Sitemap API] Dynamic compilation complete. Total URLs: ${urlset.length}`);

  } catch (err: any) {
    console.error('[Sitemap API] Error fetching from Firebase, reverting to static fallback.', err.message);
    // Fallback static list (initial articles)
    const fallbacks = [
      { author: 'kancah4d-official', slug: 'kancah4d-platform-hiburan-online-resmi-2026', priority: '1.0' },
      { author: 'kancah4d-official', slug: 'tren-era-baru-2026-mengapa-kancah4d-menjadi-platform-hiburan-paling-dicari', priority: '0.9' },
      { author: 'kancah4d-official', slug: 'kancah4d-mengenal-tren-pencarian-digital-dan-fenomena-komunitas-kancah4d-di-kalangan-pengguna-internet', priority: '0.9' },
      { author: 'jeje', slug: 'fenomena-micro-retirement-generasi-z-mulai-ambil-pensiun-dini-tiap-5-tahun', priority: '0.9' },
      { author: 'bandi', slug: 'memasuki-paruh-kedua-2026-lompatan-besar-ai-fisik-hingga-kebutuhan-infrastruktur-digital-global-kancah4d', priority: '0.9' },
      { author: 'siti-rahma-mikom', slug: 'transformasi-ekonomi-digital-indonesia-2026-proyeksi-pertumbuhan-umkm-berbasis-ai', priority: '0.9' },
      { author: 'admin-sga-redaksi', slug: 'timnas-sepak-bola-indonesia-tembus-babak-kualifikasi-final-kejuaraan-asia-2026', priority: '0.9' },
      { author: 'budi-santoso', slug: 'peluncuran-satelit-komunikasi-nusantara-3-sukses-mengorbit-di-ketinggian-geostasioner', priority: '0.8' },
      { author: 'budi-santoso', slug: 'festival-film-nusantara-2026-siap-digelar-di-bali-dengan-ratusan-karya-inovatif', priority: '0.8' },
      { author: 'siti-rahma-mikom', slug: 'panduan-gaya-hidup-sehat-efektivitas-metode-meditasi-dan-mindful-living-di-era-serba-cepat', priority: '0.8' }
    ];

    const authors = ['kancah4d-official', 'jeje', 'bandi', 'siti-rahma-mikom', 'budi-santoso', 'admin-sga-redaksi'];
    
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
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${escapeXml(u.changefreq || 'weekly')}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // Cache response for 60 seconds at Edge, but revalidate in background
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  res.status(200).send(xmlContent.trim());
}
