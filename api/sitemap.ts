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

// Fast REST fetch for Firestore articles in Node.js serverless environment
async function fetchArticlesFromFirestore(): Promise<any[]> {
  const projectId = 'gen-lang-client-0169314778';
  const dbId = 'ai-studio-sganewsportal-90700467-8452-46fc-a827-8eff7eea9caf';
  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/articles`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s maximum

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Sitemap API] Firestore REST HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data || !data.documents || !Array.isArray(data.documents)) {
      return [];
    }

    return data.documents.map((doc: any) => {
      const fields = doc.fields || {};
      return {
        title: fields.title?.stringValue || '',
        authorName: fields.authorName?.stringValue || 'penulis',
        status: fields.status?.stringValue || 'published',
        category: fields.category?.stringValue || '',
        slug: fields.slug?.stringValue || '',
        isFeatured: fields.isFeatured?.booleanValue || false,
        isBreaking: fields.isBreaking?.booleanValue || false,
        updatedAt: fields.updatedAt?.stringValue || fields.publishedAt?.stringValue || fields.createdAt?.stringValue || doc.updateTime
      };
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[Sitemap API] Firestore REST fetch skipped:', err?.message || err);
    return [];
  }
}

export default async function handler(req: any, res: any) {
  const BASE_URL = 'https://sganews.vercel.app';
  const todayStr = new Date().toISOString().split('T')[0];
  const urlMap = new Map<string, any>();

  const addUrl = (loc: string, priority: string, changefreq = 'weekly', lastmod = todayStr) => {
    if (!urlMap.has(loc)) {
      urlMap.set(loc, { loc, priority, changefreq, lastmod });
    }
  };

  // 1. Homepage
  addUrl(`${BASE_URL}/`, '1.0', 'daily', todayStr);

  // 2. Main Categories
  const categories = ['teknologi', 'sepak-bola', 'bisnis', 'hiburan', 'gaya-hidup', 'sains', 'opini'];
  categories.forEach(cat => {
    addUrl(`${BASE_URL}/kategori/${cat}`, '0.8', 'daily', todayStr);
  });

  // 3. Fallback / Baseline Authors
  const baselineAuthors = [
    'kancah4d-official',
    'admin-sga-redaksi',
    'siti-rahma-mikom',
    'budi-santoso',
    'jeje',
    'bandi',
    'andi-wijaya'
  ];

  baselineAuthors.forEach(author => {
    addUrl(`${BASE_URL}/${author}`, '0.7', 'weekly', todayStr);
  });

  // 4. Fallback / Baseline Articles
  const baselineArticles = [
    { author: 'admin-sga-redaksi', slug: 'live-streaming-portugal-vs-spanyol-world-cup-kancah4d', priority: '0.9' },
    { author: 'kancah4d-official', slug: 'kancah4d-platform-hiburan-online-resmi-2026', priority: '0.9' },
    { author: 'kancah4d-official', slug: 'tren-era-baru-2026-mengapa-kancah4d-menjadi-platform-hiburan-paling-dicari', priority: '0.9' },
    { author: 'kancah4d-official', slug: 'kancah4d-mengenal-tren-pencarian-digital-dan-fenomena-komunitas-kancah4d-di-kalangan-pengguna-internet', priority: '0.9' },
    { author: 'jeje', slug: 'fenomena-micro-retirement-generasi-z-mulai-ambil-pensiun-dini-tiap-5-tahun', priority: '0.9' },
    { author: 'bandi', slug: 'memasuki-paruh-kedua-2026-lompatan-besar-ai-fisik-hingga-kebutuhan-infrastruktur-digital-global-kancah4d', priority: '0.9' },
    { author: 'siti-rahma-mikom', slug: 'transformasi-ekonomi-digital-indonesia-2026', priority: '0.9' },
    { author: 'admin-sga-redaksi', slug: 'timnas-indonesia-tembus-kualifikasi-final-asia-2026', priority: '0.9' },
    { author: 'budi-santoso', slug: 'peluncuran-satelit-komunikasi-nusantara-3-sukses', priority: '0.8' },
    { author: 'budi-santoso', slug: 'festival-film-nusantara-2026-siap-digelar-di-bali', priority: '0.8' },
    { author: 'siti-rahma-mikom', slug: 'panduan-gaya-hidup-sehat-meditasi-mindful-living', priority: '0.8' }
  ];

  baselineArticles.forEach(art => {
    addUrl(`${BASE_URL}/${art.author}/${art.slug}`, art.priority, 'weekly', todayStr);
  });

  // 5. Dynamic Articles from Firestore via REST
  try {
    const liveArticles = await fetchArticlesFromFirestore();
    liveArticles.forEach((art) => {
      const status = art.status || 'published';
      const category = art.category || '';
      if (status === 'published' && category !== 'Politik') {
        const authorSlug = createSlug(art.authorName);
        const articleSlug = art.slug ? createSlug(art.slug) : createSlug(art.title);

        if (authorSlug) {
          addUrl(`${BASE_URL}/${authorSlug}`, '0.7', 'weekly', todayStr);
        }

        if (authorSlug && articleSlug) {
          let lastmod = todayStr;
          if (typeof art.updatedAt === 'string') {
            const datePart = art.updatedAt.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
              lastmod = datePart;
            }
          }
          const priority = (art.isFeatured || art.isBreaking) ? '0.9' : '0.8';
          addUrl(`${BASE_URL}/${authorSlug}/${articleSlug}`, priority, 'weekly', lastmod);
        }
      }
    });
  } catch (err) {
    console.warn('[Sitemap API] Skipping dynamic articles, relying on static baseline.');
  }

  const urlsList = Array.from(urlMap.values());

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsList.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  res.status(200).send(xmlContent.trim());
}
