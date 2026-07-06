import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface GoogleAdsSettings {
  isApproved: boolean; // Persetujuan Iklan Google oleh Admin
  publisherId: string; // ID Publisher Google AdSense (e.g. ca-pub-3906503668371928)
  approvedBy: string; // Nama Admin yang memberikan persetujuan
  approvedAt: string; // Tanggal persetujuan
  notes?: string;
  adPositions: {
    headerBanner: boolean; // Banner di bawah Navbar
    inArticle: boolean;    // Banner di dalam konten Artikel
    sidebarUnit: boolean;  // Banner di Sidebar Trending
    bottomBanner: boolean; // Banner Melayang di Bawah
  };
  adTypes: {
    responsiveDisplay: boolean;
    inFeedNews: boolean;
    autoAds: boolean;
  };
}

export const DEFAULT_ADS_SETTINGS: GoogleAdsSettings = {
  isApproved: false, // Default ditutup agar tampilan portal berita bersih, dapat diaktifkan oleh Admin
  publisherId: 'ca-pub-3906503668371928',
  approvedBy: 'Admin SGA Redaksi',
  approvedAt: '4 Juli 2026',
  notes: 'Pengaturan iklan Google AdSense SGA News Portal. Dapat diaktifkan melalui Panel Redaksi.',
  adPositions: {
    headerBanner: false,
    inArticle: true,
    sidebarUnit: true,
    bottomBanner: false,
  },
  adTypes: {
    responsiveDisplay: true,
    inFeedNews: true,
    autoAds: true,
  }
};

const SETTINGS_KEY = 'sga_news_google_ads_v1';
const SETTINGS_DOC = 'google_ads';
const SETTINGS_COL = 'app_settings';

export function getStoredAdsSettings(): GoogleAdsSettings {
  try {
    const local = localStorage.getItem(SETTINGS_KEY);
    if (local) {
      return { ...DEFAULT_ADS_SETTINGS, ...JSON.parse(local) };
    }
  } catch (e) {
    console.warn('Failed to parse Google Ads settings from localStorage', e);
  }
  return DEFAULT_ADS_SETTINGS;
}

export function saveStoredAdsSettings(settings: GoogleAdsSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save Google Ads settings to localStorage', e);
  }
}

export async function saveAdsSettingsToFirestore(settings: GoogleAdsSettings): Promise<void> {
  saveStoredAdsSettings(settings);
  try {
    const docRef = doc(db, SETTINGS_COL, SETTINGS_DOC);
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.warn('Could not save Google Ads settings to Firestore:', err);
  }
}

export function subscribeToAdsSettings(onUpdate: (settings: GoogleAdsSettings) => void): () => void {
  const docRef = doc(db, SETTINGS_COL, SETTINGS_DOC);

  // Send initial local data
  onUpdate(getStoredAdsSettings());

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as GoogleAdsSettings;
        const merged = { ...DEFAULT_ADS_SETTINGS, ...data };
        saveStoredAdsSettings(merged);
        onUpdate(merged);
      } else {
        setDoc(docRef, DEFAULT_ADS_SETTINGS).catch(() => {});
      }
    },
    (error) => {
      console.warn('Firestore Ads Settings subscription warning:', error);
      onUpdate(getStoredAdsSettings());
    }
  );

  return unsubscribe;
}
