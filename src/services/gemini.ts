import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  // In browser, process.env or import.meta.env may or may not have GEMINI_API_KEY
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) 
    || (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      aiInstance = new GoogleGenAI({ apiKey });
      return aiInstance;
    } catch (e) {
      console.warn('Failed to initialize Gemini AI client:', e);
      return null;
    }
  }
  return null;
}

export async function generateNewsHeadlineAndExcerpt(topicOrDraft: string, category: string): Promise<{ titles: string[]; excerpt: string }> {
  const client = getAiClient();
  
  if (!client) {
    // Smart fallback if API Key is not set
    return {
      titles: [
        `${topicOrDraft.slice(0, 50)}...: Peluang dan Tantangan di Era Digital`,
        `Perkembangan Terbaru ${category}: ${topicOrDraft.slice(0, 40)}`,
        `Kupas Tuntas ${topicOrDraft.slice(0, 45)} Bagi Masyarakat Indonesia`
      ],
      excerpt: `Berita terbaru mengenai ${topicOrDraft.slice(0, 100)}. Simak ulasan komprehensif dan dampaknya bagi perkembangan ${category} nasional.`
    };
  }

  try {
    const prompt = `Anda adalah Asisten Redaktur Senior untuk Portal Berita SGA News di Indonesia.
Berdasarkan draf atau topik berikut:
"${topicOrDraft}"
Kategori: ${category}

Hasilkan:
1. 3 opsi Judul Berita yang menarik, objektif, sesuai kaidah Jurnalistik Indonesia (tanpa clickbait berlebihan).
2. 1 Meta Deskripsi SEO yang ringkas dan informatif (120-150 karakter) untuk berita tersebut.

Format output JSON persis seperti berikut tanpa tanda backtick markdown:
{
  "titles": ["Judul 1", "Judul 2", "Judul 3"],
  "excerpt": "Ringkasan berita disini..."
}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return {
      titles: parsed.titles || [],
      excerpt: parsed.excerpt || ''
    };
  } catch (err) {
    console.error('Error generating AI headline:', err);
    return {
      titles: [
        `Inovasi Terbaru ${category}: ${topicOrDraft.slice(0, 40)}`,
        `Mengulas ${topicOrDraft.slice(0, 45)} secara Komprehensif`,
        `Dampak ${topicOrDraft.slice(0, 40)} Terhadap Perkembangan Terkini`
      ],
      excerpt: `Ulasan berita terkini seputar ${topicOrDraft.slice(0, 80)} untuk pembaca SGA News.`
    };
  }
}

export async function summarizeArticleText(fullContent: string): Promise<string> {
  const client = getAiClient();
  if (!client) {
    return 'Garis besar artikel: Membahas poin-poin utama perkembangan berita terkini dengan dampak strategis bagi pembaca.';
  }

  try {
    const prompt = `Rangkum artikel berita berikut dalam 3 poin utama (bullet points) ringkas berbahasa Indonesia yang jelas:\n\n${fullContent}`;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || 'Gagal merangkum artikel.';
  } catch (e) {
    console.error(e);
    return 'Ringkasan otomatis tidak tersedia saat ini.';
  }
}
