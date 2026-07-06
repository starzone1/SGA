import { Article, Category } from '../types';
import { createSlug } from './seo';

export const CATEGORIES_LIST: Category[] = [
  'Sepak Bola',
  'Teknologi',
  'Olahraga',
  'Hiburan',
  'Bisnis',
  'Gaya Hidup',
  'Sains'
];

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  title?: string;
  category?: string;
}

/**
 * Generates a full W3C compliant XML sitemap for SGA News
 * dynamically derived from all published articles and core site pages.
 */
export function generateSitemapXml(
  articles: Article[],
  baseUrl: string = 'https://sganews.vercel.app'
): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const publishedArticles = articles.filter(a => a.status === 'published' || !a.status);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Core Pages
  const entries: SitemapUrlEntry[] = [
    {
      loc: `${cleanBaseUrl}/`,
      lastmod: todayStr,
      changefreq: 'daily',
      priority: '1.0',
      title: 'Halaman Utama SGA News'
    }
  ];

  // 2. Author Profile Pages
  const authorNames = Array.from(new Set(publishedArticles.map(a => a.authorName || 'Penulis')));
  authorNames.forEach((name) => {
    const authorSlug = createSlug(name);
    if (authorSlug) {
      entries.push({
        loc: `${cleanBaseUrl}/${authorSlug}`,
        lastmod: todayStr,
        changefreq: 'weekly',
        priority: '0.7',
        title: `Profil Penulis ${name}`
      });
    }
  });

  // 3. Published Articles URLs
  publishedArticles.forEach((art) => {
    const authorSlug = createSlug(art.authorName || 'penulis');
    const articleSlug = art.slug ? createSlug(art.slug) : (createSlug(art.title) || art.id);
    const loc = `${cleanBaseUrl}/${authorSlug}/${articleSlug}`;

    let rawDate = art.publishedAt || art.createdAt || todayStr;
    let formattedDate = rawDate.split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      formattedDate = todayStr;
    }

    entries.push({
      loc,
      lastmod: formattedDate,
      changefreq: 'weekly',
      priority: art.isFeatured || art.isBreaking ? '0.9' : '0.8',
      title: art.title,
      category: art.category
    });
  });

  // Build XML String
  const xmlEntries = entries.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Utility to trigger browser download of sitemap.xml
 */
export function downloadSitemapFile(xmlContent: string, fileName: string = 'sitemap.xml'): void {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Utility to copy sitemap XML to clipboard
 */
export async function copySitemapToClipboard(xmlContent: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(xmlContent);
    return true;
  } catch (err) {
    console.error('Failed to copy sitemap XML to clipboard:', err);
    return false;
  }
}
