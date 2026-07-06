import { Article } from '../types';
import { GoogleGenAI } from '@google/genai';
import { deleteArticleFromFirestore, deleteUserAccountAndArticlesFromFirestore } from './firestoreService';

export interface CrawlerAuditResult {
  isViolating: boolean;
  violationType?: string;
  violationReason?: string;
  auditTimestamp: string;
}

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) 
    || (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      aiInstance = new GoogleGenAI({ apiKey });
      return aiInstance;
    } catch (e) {
      console.warn('Google Crawler AI failed to initialize:', e);
      return null;
    }
  }
  return null;
}

// Fallback safety keyword audit (in case AI key is offline or rate limited)
function fallbackKeywordAudit(title: string, content: string): CrawlerAuditResult {
  const text = `${title} ${content}`.toLowerCase();
  
  const severeRules = [
    { type: 'Penipuan / Phishing', keywords: ['transfer uang sekarang', 'dapatkan 100 juta gratis', 'situs judi slot gacor', 'hack akun bank', 'pinjol ilegal pasti cair'] },
    { type: 'Konten Ilegal / Malware', keywords: ['download virus', 'jual obat terlarang', 'jual narkoba', 'trojan gratis', 'doxxing data pribadi'] },
    { type: 'Ujaran Kebencian / Diskriminasi Ekstrem', keywords: ['pembantaian etnis', 'hancurkan suku', 'seruan kekerasan masal'] },
    { type: 'Konten Eksplisit / Dewasa', keywords: ['situs bokep', 'video porno', 'jual jasad'] }
  ];

  for (const rule of severeRules) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        return {
          isViolating: true,
          violationType: rule.type,
          violationReason: `Sistem Crawler mendeteksi kata kunci berisiko tinggi (${kw}) yang melanggar Pedoman Keselamatan Penerbit Google.`,
          auditTimestamp: new Date().toISOString()
        };
      }
    }
  }

  return {
    isViolating: false,
    auditTimestamp: new Date().toISOString()
  };
}

/**
 * Merayapi (crawl) dan mengaudit konten artikel berdasarkan Google Safety & Publisher Policy.
 */
export async function auditArticleWithGoogleCrawler(article: Article): Promise<CrawlerAuditResult> {
  const client = getAiClient();

  if (!client) {
    return fallbackKeywordAudit(article.title, article.content);
  }

  try {
    const prompt = `Anda adalah "Google AI Safety & Policy Crawler Engine".
Tugas Anda adalah merayapi dan memeriksa artikel berita berikut dari SGA News Portal untuk memastikan TIDAK ADA pelanggaran Kebijakan Keselamatan Google (Google Safety & Publisher Policy).

Kriteria Pelanggaran Berat:
1. Penipuan / Phishing / Fraud / Promosi Perjudian Ilegal / Skema Cepat Kaya
2. Ujaran Kebencian Ekstrem / Diskriminasi SARA / Seruan Kekerasan
3. Konten Ilegal / Malware / Doxxing / Peretasan / Narkotika
4. Kekerasan Ekstrem / Propaganda Terorisme / Sadisme
5. Konten Eksplisit / Pornografi / Dewasa
6. Pencemaran Nama Baik Berat / Disinformasi Berbahaya bagi Keselamatan Publik

ARTIKEL UNTUK DIAUDIT:
Judul: "${article.title}"
Kategori: "${article.category}"
Ringkasan: "${article.excerpt}"
Isi Naskah:
"${article.content.slice(0, 3000)}"

Berikan evaluasi dalam format JSON murni persis tanpa backtick:
{
  "isViolating": false, // true jika melanggar salah satu kriteria berat di atas
  "violationType": "Kategori Pelanggaran" // Kosongkan atau tulis jenis pelanggaran jika true
  "violationReason": "Alasan detail mengapa artikel melanggar kebijakan Google" // Kosongkan jika false
}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);

    return {
      isViolating: Boolean(result.isViolating),
      violationType: result.violationType || undefined,
      violationReason: result.violationReason || undefined,
      auditTimestamp: new Date().toISOString()
    };

  } catch (err) {
    console.warn('Crawler AI Gemini call failed, using fallback audit:', err);
    return fallbackKeywordAudit(article.title, article.content);
  }
}

/**
 * Menjalankan Crawler Google secara otomatis saat artikel diterbitkan.
 * Jika melanggar: Menghapus artikel DAN Menghapus/Memblokir akun pembuatnya.
 */
export async function processAutoGoogleCrawler(article: Article, authorId: string): Promise<{
  passed: boolean;
  message: string;
  auditResult: CrawlerAuditResult;
}> {
  console.log(`[Google AI Crawler] Scanning article "${article.title}" (ID: ${article.id}) by User ${authorId}...`);

  const auditResult = await auditArticleWithGoogleCrawler(article);

  if (auditResult.isViolating) {
    console.error(`[GOOGLE POLICY CRAWLER ALERT] Violation detected on article "${article.title}"!`);
    console.error(`Violation Type: ${auditResult.violationType}`);
    console.error(`Reason: ${auditResult.violationReason}`);

    // Action 1: Delete violating article & Action 2: Delete/Ban violator account
    await deleteUserAccountAndArticlesFromFirestore(authorId, article.id);

    // Record crawler enforcement log
    saveCrawlerViolationLog({
      articleId: article.id,
      articleTitle: article.title,
      authorId,
      authorName: article.authorName,
      violationType: auditResult.violationType || 'Pelanggaran Kebijakan Google',
      violationReason: auditResult.violationReason || 'Artikel tidak memenuhi standar keselamatan konten.',
      timestamp: new Date().toISOString()
    });

    return {
      passed: false,
      message: `[GOOGLE AI SAFETY CRAWLER] Artikel Anda melanggar Kebijakan Keselamatan Google (${auditResult.violationType}). Artikel telah dihapus dan akun Anda telah dinonaktifkan permanen untuk menjaga keamanan platform SGA News.`,
      auditResult
    };
  }

  return {
    passed: true,
    message: '[GOOGLE AI SAFETY CRAWLER] Artikel lolos pemeriksaan otomatis Kebijakan Google Publisher.',
    auditResult
  };
}

// Helper to store violation logs in localStorage for transparency
function saveCrawlerViolationLog(log: any) {
  try {
    const existingStr = localStorage.getItem('sga_news_crawler_logs_v1');
    const logs = existingStr ? JSON.parse(existingStr) : [];
    logs.unshift(log);
    localStorage.setItem('sga_news_crawler_logs_v1', JSON.stringify(logs.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to save crawler log locally:', e);
  }
}

export function getCrawlerViolationLogs(): any[] {
  try {
    const existingStr = localStorage.getItem('sga_news_crawler_logs_v1');
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (e) {
    return [];
  }
}
