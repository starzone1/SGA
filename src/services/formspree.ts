/// <reference types="vite/client" />

export interface EditorialNotificationPayload {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  articleId?: string;
}

export async function sendEditorialNotificationFormspree(
  data: EditorialNotificationPayload
): Promise<{ success: boolean; message: string }> {
  // Use VITE_FORMSPREE_FORM_ID from environment or default form ID
  const envFormId = (import.meta as any).env?.VITE_FORMSPREE_FORM_ID;
  const formId = envFormId || 'xknkyyy';
  const endpoint = `https://formspree.io/f/${formId}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `[SGA News Redaksi] Pengajuan Artikel Baru: "${data.title}"`,
        email: data.authorEmail,
        authorName: data.authorName,
        authorRole: data.authorRole,
        category: data.category,
        title: data.title,
        excerpt: data.excerpt,
        contentSnippet: data.content.length > 300 ? data.content.substring(0, 300) + '...' : data.content,
        submittedAt: new Date().toLocaleString('id-ID'),
        portalUrl: window.location.origin
      })
    });

    if (response.ok) {
      return { 
        success: true, 
        message: 'Notifikasi email instan telah terkirim ke Tim Redaksi SGA via Formspree.' 
      };
    } else {
      const errorJson = await response.json().catch(() => ({}));
      const errorMessage = errorJson?.errors?.[0]?.message || errorJson?.error || 'Respon Formspree tidak valid.';
      console.warn('Formspree response warning:', errorJson);
      return { 
        success: false, 
        message: `Peringatan Formspree: ${errorMessage}` 
      };
    }
  } catch (err: any) {
    console.error('Gagal mengirim notifikasi Formspree:', err);
    return { 
      success: false, 
      message: err.message || 'Koneksi ke Formspree gagal.' 
    };
  }
}
