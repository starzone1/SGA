import fs from 'fs';
import path from 'path';

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

interface CacheStore {
  articles: any[] | null;
  users: any[] | null;
  lastFetched: number;
}

let cache: CacheStore = {
  articles: null,
  users: null,
  lastFetched: 0
};
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes Cache Lifetime

// Fast REST fetch for Firestore in Node.js serverless environment
async function fetchFirestoreData() {
  const projectId = 'gen-lang-client-0169314778';
  const dbId = 'ai-studio-sganewsportal-90700467-8452-46fc-a827-8eff7eea9caf';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s max

  try {
    const artUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/articles`;
    const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/users`;

    const [artRes, userRes] = await Promise.all([
      fetch(artUrl, { signal: controller.signal, headers: { 'Accept': 'application/json' } }),
      fetch(userUrl, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
    ]);
    clearTimeout(timeoutId);

    const fetchedArticles: any[] = [];
    if (artRes.ok) {
      const artData = await artRes.json();
      if (artData && Array.isArray(artData.documents)) {
        artData.documents.forEach((doc: any) => {
          const d = doc.fields || {};
          const cat = d.category?.stringValue || '';
          if (cat !== 'Politik') {
            fetchedArticles.push({
              id: doc.name ? doc.name.split('/').pop() : '',
              title: d.title?.stringValue || '',
              slug: d.slug?.stringValue || '',
              excerpt: d.excerpt?.stringValue || '',
              imageUrl: d.coverImage?.stringValue || d.imageUrl?.stringValue || '',
              authorName: d.authorName?.stringValue || '',
              status: d.status?.stringValue || 'published'
            });
          }
        });
      }
    }

    const fetchedUsers: any[] = [];
    if (userRes.ok) {
      const userData = await userRes.json();
      if (userData && Array.isArray(userData.documents)) {
        userData.documents.forEach((doc: any) => {
          const d = doc.fields || {};
          fetchedUsers.push({
            id: doc.name ? doc.name.split('/').pop() : '',
            name: d.name?.stringValue || '',
            bio: d.bio?.stringValue || ''
          });
        });
      }
    }

    return { fetchedArticles, fetchedUsers };
  } catch (err) {
    clearTimeout(timeoutId);
    return { fetchedArticles: [], fetchedUsers: [] };
  }
}

export default async function handler(req: any, res: any) {
  const urlPath = req.url || '/';
  
  // Parse path and query parameters
  const parsedUrl = new URL(urlPath, 'https://sganews.vercel.app');
  const pathname = parsedUrl.pathname;

  // Handle static/system exclusions
  if (
    pathname.includes('.') || 
    pathname.startsWith('/assets/') || 
    pathname.startsWith('/api/') ||
    ['/sitemap.xml', '/sitemap.xsl', '/robots.txt', '/favicon.ico'].includes(pathname)
  ) {
    return res.status(404).send('Not Found');
  }

  // Load index.html
  let htmlPath = path.join(process.cwd(), 'dist/index.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(process.cwd(), 'index.html');
  }
  
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Parse path segments
  const segments = pathname.split('/').filter(Boolean);

  // Defaults for Homepage / General
  let pageTitle = 'SGA News - Portal Berita & Media Komunitas Independen';
  let pageDesc = 'SGA News Portal - Portal Berita & Media Komunitas Independen Terpercaya. Menyajikan berita terkini seputar politik, teknologi, bisnis, hiburan, olahraga, dan wawasan analisis mendalam.';
  let pageImage = 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png';
  let pageCanonical = `https://sganews.vercel.app${pathname}`;
  let robotsTag = 'index, follow';

  // Static baseline data fallbacks
  const fallbackUsers = [
    { id: 'kancah4d-official', name: 'KANCAH4D Official', bio: 'SITUS DARING ONLINE TERPERCAYA DI KANCAH4D [Exclusive]' },
    { id: 'user-admin-owner', name: 'Admin SGA Redaksi', bio: 'Pemimpin Redaksi Utama & Owner SGA News Portal.' },
    { id: 'user-editor-1', name: 'Siti Rahma, M.I.Kom', bio: 'Redaktur Senior bidang Sains & Teknologi SGA News.' },
    { id: 'user-author-1', name: 'Budi Santoso', bio: 'Jurnalis Komunitas & Pengamat Industri Digital Nusantara.' },
    { id: 'user-reader-1', name: 'Andi Wijaya', bio: 'Kontributor & Penulis Berita Teknologi dan Ekonomi Digital.' }
  ];

  const fallbackArticles = [
    {
      title: 'Saksikan Live Streaming World Cup Portugal vs Spanyol via SGA News! Kancah4D',
      slug: 'live-streaming-portugal-vs-spanyol-world-cup-kancah4d',
      excerpt: 'Saksikan siaran langsung & live streaming piala dunia World Cup Portugal vs Spanyol dengan kualitas tayangan HD, akses cepat, dan update skor teraktual via SGA News dan KANCAH4D.',
      authorName: 'Admin SGA Redaksi',
      status: 'published'
    },
    {
      title: 'KANCAH4D Platform Hiburan Online Resmi 2026',
      slug: 'kancah4d-platform-hiburan-online-resmi-2026',
      excerpt: 'Platform hiburan online resmi 2026 KANCAH4D menyajikan pengalaman interaktif dengan sistem keamanan tingkat tinggi, variasi hiburan terlengkap, dan layanan responsif 24 jam.',
      authorName: 'KANCAH4D Official',
      imageUrl: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
      status: 'published'
    },
    {
      title: 'Tren Era Baru 2026: Mengapa KANCAH4D Menjadi Platform Hiburan Paling Dicari',
      slug: 'tren-era-baru-2026-mengapa-kancah4d-menjadi-platform-hiburan-paling-dicari',
      excerpt: 'Ulasan mendalam mengenai fenomena popularitas KANCAH4D di kalangan pecinta hiburan digital modern di Indonesia.',
      authorName: 'KANCAH4D Official',
      status: 'published'
    },
    {
      title: 'Transformasi Ekonomi Digital Indonesia 2026: Proyeksi Pertumbuhan UMKM Berbasis AI',
      slug: 'transformasi-ekonomi-digital-indonesia-2026',
      excerpt: 'Pemerintah merilis peta jalan baru untuk mengakselerasi digitalisasi lebih dari 10 juta UMKM lokal dengan memanfaatkan integrasi AI dan kecerdasan buatan terapan.',
      authorName: 'Siti Rahma, M.I.Kom',
      status: 'published'
    },
    {
      title: 'Peluncuran Satelit Komunikasi Nusantara 3 Sukses Mengorbit di Ketinggian Geostasioner',
      slug: 'peluncuran-satelit-komunikasi-nusantara-3-sukses',
      excerpt: 'Satelit komunikasi tercanggih generasi terbaru Indonesia berhasil mengorbit untuk memperluas jangkauan internet broadband ke seluruh pelosok daerah 3T.',
      authorName: 'Budi Santoso',
      status: 'published'
    },
    {
      title: 'Timnas Sepak Bola Indonesia Tembus Babak Kualifikasi Final Kejuaraan Asia 2026',
      slug: 'timnas-indonesia-tembus-kualifikasi-final-asia-2026',
      excerpt: 'Dukungan penuh jutaan suporter di Stadion Gelora Bung Karno membakar semangat Tim Garuda menundukkan lawan kuat dengan skor meyakinkan 3-1.',
      authorName: 'Admin SGA Redaksi',
      status: 'published'
    },
    {
      title: 'Festival Film Nusantara 2026 Siap Digelar di Bali dengan Ratusan Karya Inovatif',
      slug: 'festival-film-nusantara-2026-siap-digelar-di-bali',
      excerpt: 'Ajang bergengsi perfilman tanah air siap menyapa para sineas muda dari 34 negara. Menampilkan karya sinematografi berbasis teknologi efek visual terdepan.',
      authorName: 'Budi Santoso',
      status: 'published'
    },
    {
      title: 'Panduan Gaya Hidup Sehat: Efektivitas Metode Meditasi dan Mindful Living di Era Serba Cepat',
      slug: 'panduan-gaya-hidup-sehat-meditasi-mindful-living',
      excerpt: 'Para ahli kesehatan mental merekomendasikan jeda 15 menit mindful breathing setiap hari untuk meredakan kelelahan emosional dan meningkatkan fokus produktivitas.',
      authorName: 'Siti Rahma, M.I.Kom',
      status: 'published'
    }
  ];

  let articles = cache.articles;
  let users = cache.users;

  // Fetch or utilize cache
  if (!articles || !users || (Date.now() - cache.lastFetched > CACHE_DURATION)) {
    const { fetchedArticles, fetchedUsers } = await fetchFirestoreData();

    // Deduplicate and merge baseline with db
    const articleSlugs = new Set(fetchedArticles.map(a => a.slug || createSlug(a.title)));
    const finalArticles = [...fetchedArticles];
    fallbackArticles.forEach(fa => {
      const faSlug = fa.slug || createSlug(fa.title);
      if (!articleSlugs.has(faSlug)) {
        finalArticles.push(fa);
      }
    });

    const userIds = new Set(fetchedUsers.map(u => u.id));
    const finalUsers = [...fetchedUsers];
    fallbackUsers.forEach(fu => {
      if (!userIds.has(fu.id)) {
        finalUsers.push(fu);
      }
    });

    cache.articles = finalArticles;
    cache.users = finalUsers;
    cache.lastFetched = Date.now();
  }

  articles = cache.articles || fallbackArticles;
  users = cache.users || fallbackUsers;

  // Process segment values
  if (segments.length === 1) {
    const s1 = segments[0];
    const nonProfilePaths = ['redaksi', 'admin', 'profil', 'login', 'bookmark', 'search'];
    
    if (nonProfilePaths.includes(s1.toLowerCase())) {
      if (s1.toLowerCase() === 'redaksi' || s1.toLowerCase() === 'admin') {
        pageTitle = 'Portal Redaksi - SGA News';
        pageDesc = 'Dashboard utama tim redaksi SGA News untuk moderasi, penerbitan, dan penulisan artikel komunitas secara profesional.';
        robotsTag = 'noindex, nofollow';
      }
    } else {
      // Check if it matches an author's slug
      const matchedAuthor = users.find((u: any) => createSlug(u.name) === s1 || createSlug(u.id) === s1);
      if (matchedAuthor) {
        pageTitle = `${matchedAuthor.name} - Profil Penulis SGA News`;
        pageDesc = matchedAuthor.bio || `Temukan kumpulan artikel berita, ulasan terpercaya, dan opini terhangat yang diterbitkan oleh ${matchedAuthor.name} di portal berita SGA News.`;
        pageCanonical = `https://sganews.vercel.app/${s1}`;
        robotsTag = 'index, follow';
      } else {
        pageTitle = 'SGA News - Halaman Tidak Ditemukan';
        pageDesc = 'Maaf, halaman atau profil penulis yang Anda cari tidak dapat ditemukan atau telah dihapus dari portal berita SGA News.';
        robotsTag = 'noindex, nofollow';
      }
    }
  } else if (segments.length === 2) {
    const s1 = segments[0];
    const s2 = segments[1];

    if (s1 === 'kategori') {
      const allowedCategories = ['Teknologi', 'Sepak Bola', 'Bisnis', 'Hiburan', 'Gaya Hidup', 'Sains', 'Opini'];
      const matchedCat = allowedCategories.find(c => createSlug(c) === s2);
      const catName = matchedCat || s2.charAt(0).toUpperCase() + s2.slice(1);

      pageTitle = `Berita ${catName} Terkini - SGA News`;
      pageDesc = `Baca liputan berita terkini, artikel pilihan terhangat, dan tulisan analisis jurnalisme mendalam seputar kategori ${catName} di SGA News.`;
      pageCanonical = `https://sganews.vercel.app/kategori/${s2}`;
      robotsTag = 'index, follow';
    } else {
      // Handle :authorSlug/:articleSlug
      const matchedArticle = articles.find((art: any) => {
        const artSlug = art.slug ? createSlug(art.slug) : createSlug(art.title);
        return artSlug === s2 && (art.status === 'published' || !art.status);
      });

      if (matchedArticle) {
        pageTitle = `${matchedArticle.title} - SGA News`;
        pageDesc = matchedArticle.excerpt || `${matchedArticle.title}. Baca ulasan dan liputan jurnalisme selengkapnya secara indeks independen hanya di SGA News.`;
        if (matchedArticle.imageUrl) {
          pageImage = matchedArticle.imageUrl;
        }
        pageCanonical = `https://sganews.vercel.app/${s1}/${s2}`;
        robotsTag = 'index, follow';
      } else {
        pageTitle = 'SGA News - Artikel Tidak Ditemukan';
        pageDesc = 'Maaf, artikel berita yang Anda cari tidak dapat ditemukan atau sudah dihapus dari portal berita SGA News.';
        robotsTag = 'noindex, nofollow';
      }
    }
  } else if (segments.length > 2) {
    pageTitle = 'SGA News - Halaman Tidak Ditemukan';
    pageDesc = 'Maaf, halaman yang Anda tuju tidak tersedia.';
    robotsTag = 'noindex, nofollow';
  }

  // Perform surgical find-and-replace on header elements
  html = html.replace(/<title>.*?<\/title>/gi, `<title>${pageTitle}</title>`);
  html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, `<meta name="title" content="${pageTitle}" />`);
  html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${pageTitle}" />`);
  html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${pageTitle}" />`);

  html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${pageDesc}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${pageDesc}" />`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${pageDesc}" />`);

  html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${pageImage}" />`);
  html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${pageImage}" />`);

  html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${pageCanonical}" />`);
  html = html.replace(/<meta\s+name="robots"\s+content=".*?"\s*\/?>/gi, `<meta name="robots" content="${robotsTag}" />`);

  const isAdminOrSearch = pathname.startsWith('/admin') || pathname.startsWith('/redaksi') || pathname.startsWith('/search');
  if (!isAdminOrSearch && robotsTag === 'index, follow') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  } else {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
