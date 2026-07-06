import { Article, Category, User } from '../types';

/**
 * Clean HTML or Markdown formatting into clean plain text
 */
export function stripFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/#+\s?/g, '') // Remove Markdown headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italics
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove Markdown links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove Markdown images
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code blocks
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

/**
 * List of stop words to filter out when extracting SEO keywords
 */
const STOP_WORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'dengan', 'pada', 'adalah', 
  'sebagai', 'akan', 'dapat', 'oleh', 'atau', 'saat', 'dalam', 'bisa', 'hal', 'kami', 
  'mereka', 'juga', 'sudah', 'ada', 'tidak', 'tentang', 'serta', 'karena', 'maka', 
  'namun', 'antara', 'hingga', 'agar', 'satu', 'dua', 'banyak', 'beberapa', 'para', 
  'seperti', 'ia', 'dia', 'anda', 'kamu', 'saya', 'kita', 'bahkan', 'maupun', 'secara',
  'tersebut', 'hanya', 'harus', 'telah', 'menjadi', 'terjadi', 'kembali', 'sangat',
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were', 'been', 'has', 'have'
]);

/**
 * Automatically generates a clean search-engine optimized description (approx 150-160 chars)
 * based on article excerpt or content.
 */
export function generateArticleDescription(article: Partial<Article>): string {
  if (article.excerpt && article.excerpt.trim()) {
    const cleanExcerpt = stripFormatting(article.excerpt);
    if (cleanExcerpt.length <= 160) return cleanExcerpt;
    return cleanExcerpt.substring(0, 157).trim() + '...';
  }

  if (article.content && article.content.trim()) {
    const plainContent = stripFormatting(article.content);
    if (plainContent.length <= 160) return plainContent;
    
    // Truncate cleanly at word boundary
    const truncated = plainContent.substring(0, 157);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 100) {
      return truncated.substring(0, lastSpace).trim() + '...';
    }
    return truncated.trim() + '...';
  }

  return 'Portal berita independen dan media komunitas SGA News. Menyajikan berita terkini dan terpercaya.';
}

/**
 * Automatically extracts relevant SEO keywords from article title, tags, category, and content text
 */
export function generateArticleKeywords(article: Partial<Article>): string {
  const keywordsList: string[] = [];

  // 1. Custom Tags if available
  if (article.tags && Array.isArray(article.tags)) {
    article.tags.forEach(t => {
      if (!t) return;
      const clean = t.toString().trim();
      if (clean && !keywordsList.includes(clean)) {
        keywordsList.push(clean);
      }
    });
  }

  // 2. Category
  if (article.category && !keywordsList.includes(article.category)) {
    keywordsList.push(article.category);
  }

  // 3. Extract key terms from title
  if (article.title) {
    const cleanTitle = stripFormatting(article.title);
    const words = cleanTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/);

    words.forEach(word => {
      if (word.length > 3 && !STOP_WORDS.has(word)) {
        const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
        if (!keywordsList.some(k => k.toLowerCase() === word)) {
          keywordsList.push(capitalized);
        }
      }
    });
  }

  // 4. Extract top frequent words from content
  if (article.content && keywordsList.length < 10) {
    const plainContent = stripFormatting(article.content);
    const words = plainContent
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/);

    const freqMap: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 3 && !STOP_WORDS.has(w)) {
        freqMap[w] = (freqMap[w] || 0) + 1;
      }
    });

    const sortedWords = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
    for (const word of sortedWords) {
      if (keywordsList.length >= 10) break;
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
      if (!keywordsList.some(k => k.toLowerCase() === word)) {
        keywordsList.push(capitalized);
      }
    }
  }

  // 5. Core branding keywords
  ['SGA News', 'KANCAH4D', 'berita terkini', 'portal berita'].forEach(brand => {
    if (!keywordsList.includes(brand)) {
      keywordsList.push(brand);
    }
  });

  return keywordsList.join(', ');
}

/**
 * Returns object containing auto-generated description and keywords for an article
 */
export function generateArticleMetaTags(article: Partial<Article>): { description: string; keywords: string } {
  return {
    description: generateArticleDescription(article),
    keywords: generateArticleKeywords(article)
  };
}

/**
 * Automatically applies/injects <meta name="description"> and <meta name="keywords"> tags to document.head
 */
export function applyArticleMetaTags(article: Partial<Article>): void {
  const { description, keywords } = generateArticleMetaTags(article);
  updateMetaTag('meta[name="description"]', 'name', 'description', description);
  updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
}

/**
 * Updates head meta tag value by selector or creates it if missing
 */
export function updateMetaTag(selector: string, attributeName: string, attributeValue: string, content: string) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Updates link tag (like canonical)
 */
export function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Injects or updates Schema.org JSON-LD structured data
 */
export function updateJsonLd(data: object | null) {
  const scriptId = 'sga-jsonld-schema';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!data) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(data);
}

export function createSlug(text: string): string {
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

/**
 * Generates custom search-engine optimized meta tags for author profile pages
 */
export function generateAuthorMetaTags(
  authorName: string,
  authorUser?: Partial<User> | null,
  publishedCount?: number,
  authorArticles?: Article[]
): {
  pageTitle: string;
  description: string;
  keywords: string;
  authorUrl: string;
  avatar: string;
  roleLabel: string;
} {
  const authorSlug = createSlug(authorName);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sganews.vercel.app';
  const authorUrl = `${origin}/${authorSlug}`;

  let roleLabel = 'Penulis & Kontributor';
  if (authorUser?.role === 'admin') {
    roleLabel = 'Pemimpin Redaksi';
  } else if (authorUser?.role === 'editor') {
    roleLabel = 'Editor Redaksi';
  } else if (authorUser?.role === 'author') {
    roleLabel = 'Jurnalis & Penulis';
  }

  // 1. Custom Meta Title
  const pageTitle = `Profil ${authorName} (${roleLabel}) - SGA News Portal`;

  // 2. Custom Meta Description
  let description = '';
  if (authorUser?.bio && authorUser.bio.trim().length > 10) {
    const cleanBio = stripFormatting(authorUser.bio);
    description = `Profil ${authorName}, ${roleLabel} di SGA News. ${cleanBio}`;
  } else {
    const countText = publishedCount && publishedCount > 0 
      ? `Jelajahi ${publishedCount} karya berita dan opini` 
      : 'Portofolio karya jurnalistik dan opini';
    description = `Profil resmi & karya tulis ${authorName} (${roleLabel}) di SGA News Portal. ${countText} terbaru karya ${authorName}.`;
  }

  // Ensure description is optimal length (~155-160 chars max)
  if (description.length > 160) {
    description = description.substring(0, 157).trim() + '...';
  }

  // 3. Custom Keywords
  const keywordsList = [
    `Profil ${authorName}`,
    `Penulis ${authorName}`,
    `Artikel ${authorName}`,
    `Berita ${authorName}`,
    `Tulisan ${authorName}`,
    `Wartawan ${authorName}`,
    roleLabel,
    'SGA News',
    'Portal Berita',
    'Jurnalistik Komunitas'
  ];

  if (authorArticles && authorArticles.length > 0) {
    const categories = Array.from(new Set(authorArticles.map(a => a.category)));
    categories.slice(0, 3).forEach(c => keywordsList.push(`Berita ${c}`));
  }

  const keywords = keywordsList.join(', ');
  const avatar = authorUser?.avatar || 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png';

  return {
    pageTitle,
    description,
    keywords,
    authorUrl,
    avatar,
    roleLabel
  };
}

/**
 * Helper to safely format dates into ISO 8601 string for Google Structured Data
 */
function toIsoDate(dateVal: any): string {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch (e) {}
  return new Date().toISOString();
}

/**
 * Generates Google-compliant NewsArticle JSON-LD Structured Data
 */
export function getNewsArticleJsonLd(article: Article): object {
  const DEFAULT_IMAGE = 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sganews.vercel.app';
  
  const { description, keywords } = generateArticleMetaTags(article);
  const authorSlug = createSlug(article.authorName || 'penulis');
  const articleSlug = article.slug ? createSlug(article.slug) : (createSlug(article.title) || article.id);
  const articleUrl = `${origin}/${authorSlug}/${articleSlug}`;
  const authorUrl = `${origin}/${authorSlug}`;
  const coverImage = article.coverImage || DEFAULT_IMAGE;

  const plainContent = stripFormatting(article.content || '');
  const wordCount = plainContent ? plainContent.split(/\s+/).filter(Boolean).length : 0;

  const publishedIso = toIsoDate(article.publishedAt || article.createdAt);
  const modifiedIso = toIsoDate(article.updatedAt || article.createdAt);
  const publishYear = new Date(article.createdAt || Date.now()).getFullYear();

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    'headline': article.title,
    'description': description,
    'image': [
      coverImage
    ],
    'datePublished': publishedIso,
    'dateModified': modifiedIso,
    'author': [
      {
        '@type': 'Person',
        'name': article.authorName || 'Redaksi SGA News',
        'jobTitle': article.authorRole || 'Jurnalis SGA News',
        'url': authorUrl
      }
    ],
    'publisher': {
      '@type': 'NewsMediaOrganization',
      'name': 'SGA News Portal',
      'url': origin,
      'logo': {
        '@type': 'ImageObject',
        'url': DEFAULT_IMAGE,
        'width': 600,
        'height': 60
      },
      'sameAs': [
        origin
      ]
    },
    'articleSection': article.category || 'Berita Utama',
    'keywords': keywords,
    'inLanguage': 'id-ID',
    'isAccessibleForFree': 'true',
    'wordCount': wordCount,
    'articleBody': plainContent,
    'copyrightYear': publishYear,
    'copyrightHolder': {
      '@type': 'Organization',
      'name': 'SGA News Portal'
    }
  };
}

/**
 * Dynamically updates document SEO metadata based on current article or view state
 */
export function updateArticleSEO(
  article: Article | null, 
  selectedCategory?: Category | 'Semua', 
  activeView?: string, 
  authorName?: string | null,
  authorUser?: User | null,
  authorArticlesCount?: number,
  authorArticles?: Article[]
) {
  const DEFAULT_TITLE = 'SGA News - Portal Berita & Media Komunitas Independen';
  const DEFAULT_DESC = 'Portal berita independen dan media komunitas SGA News. Menyajikan berita terkini teknologi, olahraga, bisnis, dan opini terpercaya.';
  const DEFAULT_IMAGE = 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png';
  const DEFAULT_URL = window.location.origin + window.location.pathname;

  if (activeView === 'detail' && article) {
    // 1. Auto-generate Article Meta Description & Keywords
    const { description, keywords } = generateArticleMetaTags(article);
    const pageTitle = `${article.title} - SGA News`;
    const coverImage = article.coverImage || DEFAULT_IMAGE;
    const authorSlug = createSlug(article.authorName || 'penulis');
    const articleSlug = article.slug ? createSlug(article.slug) : (createSlug(article.title) || article.id);
    const articleUrl = `${window.location.origin}/${authorSlug}/${articleSlug}`;

    // Update Title
    document.title = pageTitle;

    // Standard Meta (Auto generated)
    updateMetaTag('meta[name="title"]', 'name', 'title', pageTitle);
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    updateMetaTag('meta[name="author"]', 'name', 'author', article.authorName || 'Redaksi SGA News');

    // Open Graph
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article');
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', coverImage);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', articleUrl);

    // Article specific OG tags
    updateMetaTag('meta[property="article:published_time"]', 'property', 'article:published_time', toIsoDate(article.publishedAt || article.createdAt));
    updateMetaTag('meta[property="article:author"]', 'property', 'article:author', article.authorName);
    updateMetaTag('meta[property="article:section"]', 'property', 'article:section', article.category);

    // Twitter Card
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', coverImage);

    // Canonical
    updateLinkTag('canonical', articleUrl);

    // Detailed Google-compliant Schema.org NewsArticle Structured Data
    updateJsonLd(getNewsArticleJsonLd(article));

  } else if (activeView === 'author-profile' && authorName) {
    // 2. Author Profile Custom SEO Meta Tags
    const authorMeta = generateAuthorMetaTags(
      authorName, 
      authorUser, 
      authorArticlesCount, 
      authorArticles
    );

    document.title = authorMeta.pageTitle;

    updateMetaTag('meta[name="title"]', 'name', 'title', authorMeta.pageTitle);
    updateMetaTag('meta[name="description"]', 'name', 'description', authorMeta.description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', authorMeta.keywords);
    updateMetaTag('meta[name="author"]', 'name', 'author', authorName);

    // OpenGraph Profile Tags
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', 'profile');
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', authorMeta.pageTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', authorMeta.description);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', authorMeta.avatar);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', authorMeta.authorUrl);

    const nameParts = authorName.split(' ');
    const firstName = nameParts[0] || authorName;
    const lastName = nameParts.slice(1).join(' ') || '';
    updateMetaTag('meta[property="profile:first_name"]', 'property', 'profile:first_name', firstName);
    if (lastName) {
      updateMetaTag('meta[property="profile:last_name"]', 'property', 'profile:last_name', lastName);
    }
    updateMetaTag('meta[property="profile:username"]', 'property', 'profile:username', createSlug(authorName));

    // Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', authorMeta.pageTitle);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', authorMeta.description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', authorMeta.avatar);

    // Canonical Link
    updateLinkTag('canonical', authorMeta.authorUrl);

    // Schema.org ProfilePage Structured Data
    updateJsonLd({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      'name': authorMeta.pageTitle,
      'url': authorMeta.authorUrl,
      'description': authorMeta.description,
      'mainEntity': {
        '@type': 'Person',
        'name': authorName,
        'description': authorUser?.bio || authorMeta.description,
        'image': authorMeta.avatar,
        'jobTitle': authorMeta.roleLabel,
        'worksFor': {
          '@type': 'Organization',
          'name': 'SGA News Portal',
          'url': window.location.origin
        }
      }
    });

  } else {
    // 3. Home / Category / Dashboard Meta
    let pageTitle = DEFAULT_TITLE;
    let description = DEFAULT_DESC;

    if (selectedCategory && selectedCategory !== 'Semua') {
      pageTitle = `Berita ${selectedCategory} Terkini - SGA News`;
      description = `Kumpulan berita ${selectedCategory} terbaru, terpercaya, dan mendalam di SGA News Portal.`;
    } else if (activeView === 'author-cms') {
      pageTitle = 'Portal Penulis - SGA News';
      description = 'Dashboard Penulis SGA News untuk membuat dan mengelola artikel berita komunitas.';
    } else if (activeView === 'editor-cms') {
      pageTitle = 'Portal Redaksi & Editor - SGA News';
      description = 'Dashboard Redaksi SGA News untuk peninjauan, moderasi, dan penerbitan berita.';
    }

    document.title = pageTitle;

    updateMetaTag('meta[name="title"]', 'name', 'title', pageTitle);
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', 'SGA News, KANCAH4D, berita indonesia, berita terkini, jurnalistik, portal berita');
    updateMetaTag('meta[name="author"]', 'name', 'author', 'Redaksi SGA News');

    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', DEFAULT_IMAGE);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', DEFAULT_URL);

    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', DEFAULT_IMAGE);

    updateLinkTag('canonical', DEFAULT_URL);

    // Schema.org WebSite Structured Data
    updateJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'SGA News Portal',
      'url': DEFAULT_URL,
      'description': DEFAULT_DESC,
      'publisher': {
        '@type': 'Organization',
        'name': 'SGA News Portal',
        'logo': {
          '@type': 'ImageObject',
          'url': DEFAULT_IMAGE
        }
      }
    });
  }
}

