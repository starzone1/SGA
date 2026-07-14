import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  increment,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Article, ArticleComment, User, ArticleReaction, Category, SecureResetRequest } from '../types';
import { INITIAL_ARTICLES, INITIAL_COMMENTS, INITIAL_USERS } from '../data/initialData';
import { getStoredArticles, saveArticles, getStoredUsers, saveStoredUser } from '../utils/storage';

const ARTICLES_COL = 'articles';
const COMMENTS_COL = 'comments';
const USERS_COL = 'users';

// --- TIME-BASED CACHE LAYER FOR NO-COST UNLIMITED SCALING (SPARK PLAN SAFE) ---
interface CacheStore {
  articles: {
    data: Article[] | null;
    lastFetched: number;
  };
  users: {
    data: User[] | null;
    lastFetched: number;
  };
  comments: Record<string, {
    data: ArticleComment[];
    lastFetched: number;
  }>;
}

const dbCache: CacheStore = {
  articles: { data: null, lastFetched: 0 },
  users: { data: null, lastFetched: 0 },
  comments: {}
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes Cache Lifetime

// Background fetch helpers to fetch once and update memory & local caches
async function fetchArticlesAndCache(): Promise<Article[]> {
  const now = Date.now();
  if (dbCache.articles.data && (now - dbCache.articles.lastFetched < CACHE_DURATION)) {
    return dbCache.articles.data;
  }

  try {
    const articlesRef = collection(db, ARTICLES_COL);
    const snapshot = await getDocs(articlesRef);
    
    const articles: Article[] = [];
    const idMap = new Set<string>();
    const slugMap = new Set<string>();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Article;
      if (data && (data.category as string) !== 'Politik' && docSnap.id !== 'art-4') {
        const cat = (data.category as string) === 'Opini' ? 'Hiburan' : data.category;
        const artObj: Article = {
          ...data,
          category: cat as Category,
          id: docSnap.id
        };
        articles.push(artObj);
        idMap.add(docSnap.id);
        if (artObj.slug) slugMap.add(artObj.slug);
      }
    });

    // Merge baseline initial articles
    INITIAL_ARTICLES.forEach((initArt) => {
      if (!idMap.has(initArt.id) && (!initArt.slug || !slugMap.has(initArt.slug))) {
        articles.push(initArt);
        idMap.add(initArt.id);
      }
    });

    // Merge any unique local articles from LocalStorage
    try {
      const localArts = getStoredArticles();
      localArts.forEach((la) => {
        if (la && la.id && !idMap.has(la.id)) {
          articles.push(la);
          idMap.add(la.id);
        }
      });
    } catch (e) {}

    // Sort by date descending
    articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    dbCache.articles.data = articles;
    dbCache.articles.lastFetched = now;

    // Save to LocalStorage as hard backup
    try {
      saveArticles(articles);
    } catch (e) {}

    return articles;
  } catch (error) {
    console.warn('[Firestore Cache] Quota or connection issue fetching articles, using localStorage backup instead.');
    const local = getStoredArticles();
    dbCache.articles.data = local;
    return local;
  }
}

async function fetchUsersAndCache(): Promise<User[]> {
  const now = Date.now();
  if (dbCache.users.data && (now - dbCache.users.lastFetched < CACHE_DURATION)) {
    return dbCache.users.data;
  }

  try {
    const usersRef = collection(db, USERS_COL);
    const snapshot = await getDocs(usersRef);

    const users: User[] = [];
    const userIds = new Set<string>();

    snapshot.forEach((docSnap) => {
      users.push({
        ...(docSnap.data() as User),
        id: docSnap.id
      });
      userIds.add(docSnap.id);
    });

    INITIAL_USERS.forEach((initUsr) => {
      if (!userIds.has(initUsr.id)) {
        users.push(initUsr);
        userIds.add(initUsr.id);
      }
    });

    // Merge local storage users
    try {
      const localUsers = getStoredUsers();
      localUsers.forEach((lu) => {
        if (lu && lu.id && !userIds.has(lu.id)) {
          users.push(lu);
          userIds.add(lu.id);
        }
      });
    } catch (e) {}

    // Sync to localStorage
    try {
      users.forEach((u) => {
        saveStoredUser(u);
      });
    } catch (e) {}

    dbCache.users.data = users;
    dbCache.users.lastFetched = now;

    return users;
  } catch (error) {
    console.warn('[Firestore Cache] Quota or connection issue fetching users, using localStorage backup.');
    const local = getStoredUsers();
    dbCache.users.data = local;
    return local;
  }
}

async function fetchCommentsAndCache(articleId: string): Promise<ArticleComment[]> {
  const now = Date.now();
  const cached = dbCache.comments[articleId];
  if (cached && (now - cached.lastFetched < CACHE_DURATION)) {
    return cached.data;
  }

  try {
    const commentsRef = collection(db, COMMENTS_COL);
    const q = query(commentsRef, where('articleId', '==', articleId));
    const snapshot = await getDocs(q);

    const comments: ArticleComment[] = [];
    snapshot.forEach((docSnap) => {
      comments.push({
        ...(docSnap.data() as ArticleComment),
        id: docSnap.id
      });
    });

    comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    dbCache.comments[articleId] = {
      data: comments,
      lastFetched: now
    };

    return comments;
  } catch (error) {
    console.warn(`[Firestore Cache] Quota/connection issue fetching comments for ${articleId}.`);
    const fallbackComments = INITIAL_COMMENTS.filter(c => c.articleId === articleId);
    return fallbackComments;
  }
}

// --- SEED INITIAL DATA IF FIRESTORE IS EMPTY ---
let isSeeding = false;

export async function seedInitialDataIfEmpty(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;

  try {
    // Check Articles
    const articlesRef = collection(db, ARTICLES_COL);
    const articlesSnapshot = await getDocs(articlesRef);
    if (articlesSnapshot.empty) {
      console.log('Seeding initial articles to Firestore...');
      const batch = writeBatch(db);
      INITIAL_ARTICLES.forEach((art) => {
        const docRef = doc(db, ARTICLES_COL, art.id);
        batch.set(docRef, art);
      });
      await batch.commit();
    }

    // Check Users
    const usersRef = collection(db, USERS_COL);
    const usersSnapshot = await getDocs(usersRef);
    if (usersSnapshot.empty) {
      console.log('Seeding initial users to Firestore...');
      const batch = writeBatch(db);
      INITIAL_USERS.forEach((usr) => {
        const docRef = doc(db, USERS_COL, usr.id);
        batch.set(docRef, usr);
      });
      await batch.commit();
    }

    // Check Comments
    const commentsRef = collection(db, COMMENTS_COL);
    const commentsSnapshot = await getDocs(commentsRef);
    if (commentsSnapshot.empty) {
      console.log('Seeding initial comments to Firestore...');
      const batch = writeBatch(db);
      INITIAL_COMMENTS.forEach((comm) => {
        const docRef = doc(db, COMMENTS_COL, comm.id);
        batch.set(docRef, comm);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error seeding initial data to Firestore:', error);
  } finally {
    isSeeding = false;
  }
}

// --- ARTICLES REAL-TIME SYNC & OPERATIONS ---

export function subscribeToArticles(onUpdate: (articles: Article[]) => void): () => void {
  // 1. Immediately return currently stored articles from LocalStorage to load instantly
  const local = getStoredArticles();
  onUpdate(local);

  // 2. Fetch or reuse memory cache
  fetchArticlesAndCache().then((articles) => {
    onUpdate(articles);
  }).catch((err) => {
    console.error('Cache fetch articles failed:', err);
    onUpdate(getStoredArticles());
  });

  // Since we use background fetch and cache, we don't need persistent onSnapshot active listeners.
  // This saves thousands of read units! We return a simple no-op function.
  return () => {};
}

export async function addArticleToFirestore(
  articleData: Omit<Article, 'id' | 'createdAt' | 'views' | 'likes'>
): Promise<Article> {
  const id = 'art-' + Date.now();
  const newArticle: Article = {
    ...articleData,
    id,
    createdAt: new Date().toISOString(),
    views: 0,
    likes: 0,
    reactions: { suka: 0, inspiratif: 0, haru: 0, kaget: 0 }
  };

  // 1. Instantly update LocalStorage and in-memory cache
  try {
    const localArts = getStoredArticles();
    const updated = [newArticle, ...localArts];
    saveArticles(updated);
    
    if (dbCache.articles.data) {
      dbCache.articles.data = [newArticle, ...dbCache.articles.data];
    } else {
      dbCache.articles.data = updated;
    }
    dbCache.articles.lastFetched = Date.now();
  } catch (e) {
    console.warn('LocalStorage and memory cache update failed on add:', e);
  }

  // 2. Attempt background Firestore write
  try {
    const docRef = doc(db, ARTICLES_COL, id);
    await setDoc(docRef, newArticle);
  } catch (error: any) {
    console.error('Failed to add article to Firestore (using LocalStorage fallback instead):', error);
  }
  return newArticle;
}

export async function updateArticleInFirestore(
  articleId: string, 
  updates: Partial<Article>
): Promise<void> {
  // 1. Instantly update LocalStorage and in-memory cache
  try {
    const localArts = getStoredArticles();
    const idx = localArts.findIndex(a => a.id === articleId);
    if (idx !== -1) {
      localArts[idx] = { ...localArts[idx], ...updates };
      saveArticles(localArts);
      
      if (dbCache.articles.data) {
        const cIdx = dbCache.articles.data.findIndex(a => a.id === articleId);
        if (cIdx !== -1) {
          dbCache.articles.data[cIdx] = { ...dbCache.articles.data[cIdx], ...updates };
        }
      }
    } else {
      const original = INITIAL_ARTICLES.find(a => a.id === articleId);
      if (original) {
        const newArt = { ...original, ...updates };
        localArts.push(newArt);
        saveArticles(localArts);
        if (dbCache.articles.data) {
          dbCache.articles.data.push(newArt);
        }
      }
    }
  } catch (e) {
    console.warn('LocalStorage and memory cache update failed on edit:', e);
  }

  // 2. Attempt background Firestore write
  try {
    const docRef = doc(db, ARTICLES_COL, articleId);
    await setDoc(docRef, updates, { merge: true });
  } catch (error: any) {
    console.error('Failed to update article in Firestore (using LocalStorage fallback):', error);
  }
}

export async function deleteArticleFromFirestore(articleId: string): Promise<void> {
  // 1. Instantly update LocalStorage and in-memory cache
  try {
    const localArts = getStoredArticles();
    const filtered = localArts.filter(a => a.id !== articleId);
    saveArticles(filtered);
    
    if (dbCache.articles.data) {
      dbCache.articles.data = dbCache.articles.data.filter(a => a.id !== articleId);
    }
  } catch (e) {
    console.warn('LocalStorage and memory cache update failed on delete:', e);
  }

  // 2. Attempt background Firestore delete
  try {
    const docRef = doc(db, ARTICLES_COL, articleId);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Failed to delete article from Firestore (using LocalStorage fallback):', error);
  }
}

export async function incrementArticleViewsInFirestore(articleId: string): Promise<void> {
  try {
    const docRef = doc(db, ARTICLES_COL, articleId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const initArt = INITIAL_ARTICLES.find(a => a.id === articleId);
      if (initArt) {
        const newArt = {
          ...initArt,
          views: (initArt.views || 0) + 1
        };
        await setDoc(docRef, newArt);
      }
      return;
    }
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Failed to increment views in Firestore:', error);
  }
}

export async function toggleArticleLikeInFirestore(
  articleId: string, 
  currentlyLiked: boolean
): Promise<void> {
  try {
    const docRef = doc(db, ARTICLES_COL, articleId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const initArt = INITIAL_ARTICLES.find(a => a.id === articleId);
      if (initArt) {
        const newArt = {
          ...initArt,
          likes: Math.max(0, (initArt.likes || 0) + (currentlyLiked ? -1 : 1))
        };
        await setDoc(docRef, newArt);
      }
      return;
    }
    await updateDoc(docRef, {
      likes: increment(currentlyLiked ? -1 : 1)
    });
  } catch (error) {
    console.error('Failed to toggle like in Firestore:', error);
  }
}

export async function addArticleReactionInFirestore(
  articleId: string, 
  reactionType: 'suka' | 'inspiratif' | 'haru' | 'kaget'
): Promise<void> {
  try {
    const docRef = doc(db, ARTICLES_COL, articleId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const initArt = INITIAL_ARTICLES.find(a => a.id === articleId);
      if (initArt) {
        const reactions = { ...initArt.reactions };
        reactions[reactionType] = (reactions[reactionType] || 0) + 1;
        const newArt = {
          ...initArt,
          reactions
        };
        await setDoc(docRef, newArt);
      }
      return;
    }
    await updateDoc(docRef, {
      [`reactions.${reactionType}`]: increment(1)
    });
  } catch (error) {
    console.error('Failed to add reaction in Firestore:', error);
  }
}

// --- COMMENTS REAL-TIME SYNC & OPERATIONS ---

export function subscribeToArticleComments(
  articleId: string, 
  onUpdate: (comments: ArticleComment[]) => void
): () => void {
  // 1. Immediately return currently cached comments (if any) or local fallback
  const cached = dbCache.comments[articleId];
  if (cached) {
    onUpdate(cached.data);
  } else {
    onUpdate(INITIAL_COMMENTS.filter(c => c.articleId === articleId));
  }

  // 2. Fetch or update cache in background
  fetchCommentsAndCache(articleId).then((comments) => {
    onUpdate(comments);
  }).catch(() => {
    onUpdate(INITIAL_COMMENTS.filter(c => c.articleId === articleId));
  });

  return () => {};
}

export async function addCommentToFirestore(
  articleId: string, 
  content: string, 
  user: User | null
): Promise<ArticleComment> {
  const id = 'comm-' + Date.now();
  const newComment: ArticleComment = {
    id,
    articleId,
    authorName: user?.name || 'Pembaca SGA',
    authorAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    authorRole: user ? (user.role === 'admin' ? 'Pemred' : user.role === 'editor' ? 'Redaktur' : user.role === 'author' ? 'Penulis' : 'Pembaca') : 'Pembaca',
    content,
    createdAt: new Date().toISOString(),
    likes: 0
  };

  // Instantly push to memory cache so user sees their comment appear immediately!
  const cached = dbCache.comments[articleId];
  if (cached) {
    cached.data = [newComment, ...cached.data];
    cached.lastFetched = Date.now();
  } else {
    dbCache.comments[articleId] = {
      data: [newComment],
      lastFetched: Date.now()
    };
  }

  // Attempt to write in the background
  try {
    const docRef = doc(db, COMMENTS_COL, id);
    await setDoc(docRef, newComment);
  } catch (error) {
    console.error('Failed to add comment to Firestore (stored in local cache):', error);
  }
  return newComment;
}

// --- USERS REAL-TIME SYNC & OPERATIONS ---

export function subscribeToUsers(onUpdate: (users: User[]) => void): () => void {
  // 1. Immediately return local users from localStorage
  const local = getStoredUsers();
  onUpdate(local);

  // 2. Fetch or reuse memory cache
  fetchUsersAndCache().then((users) => {
    onUpdate(users);
  }).catch((err) => {
    console.error('Cache fetch users failed:', err);
    onUpdate(getStoredUsers());
  });

  return () => {};
}

export async function verifyUserLoginInFirestore(userId: string): Promise<{ isValid: boolean; user?: User; message?: string }> {
  try {
    if (!userId) {
      return { isValid: false, message: 'ID akun pengguna tidak ditemukan. Silakan masuk kembali.' };
    }
    const userDocRef = doc(db, USERS_COL, userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      // Check if user is in INITIAL_USERS as fallback, and auto-sync
      const initialMatch = INITIAL_USERS.find(u => u.id === userId);
      if (initialMatch) {
        await setDoc(userDocRef, initialMatch);
        return { isValid: true, user: initialMatch };
      }
      return { 
        isValid: false, 
        message: `Status pengguna (${userId}) tidak terdaftar atau telah dinonaktifkan di database Firestore SGA News.` 
      };
    }

    const userData = docSnap.data() as User;
    return { isValid: true, user: userData };
  } catch (error: any) {
    console.error('Verifikasi login Firestore gagal:', error);
    return { 
      isValid: false, 
      message: 'Gagal memverifikasi akun ke Firestore. Periksa koneksi internet Anda.' 
    };
  }
}

/**
 * MEMPERBARUI AKUN PENGGUNA (PERAN, STATUS VERIFIKASI/LENCANA, DST) DI FIRESTORE
 */
export async function updateUserInFirestore(userId: string, updates: Partial<User>): Promise<void> {
  try {
    if (!userId) return;
    const userRef = doc(db, USERS_COL, userId);
    await setDoc(userRef, updates, { merge: true });
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
  }
}

/**
 * MENGHAPUS AKUN & SELURUH ARTIKEL PEMBUAT (BILA MELANGGAR KEBIJAKAN GOOGLE SAFETY CRAWLER)
 */
export async function deleteUserAccountAndArticlesFromFirestore(userId: string, targetArticleId?: string): Promise<void> {
  try {
    console.log(`[POLISI SIBER SGA/GOOGLE] Menghapus akun pengguna (${userId}) dan artikelnya karena pelanggaran kebijakan...`);
    
    // 1. Hapus dokumen akun pengguna dari Firestore
    if (userId) {
      const userRef = doc(db, USERS_COL, userId);
      await deleteDoc(userRef).catch(e => console.warn('User doc delete failed:', e));
    }

    // 2. Hapus artikel spesifik dari Firestore
    if (targetArticleId) {
      const artRef = doc(db, ARTICLES_COL, targetArticleId);
      await deleteDoc(artRef).catch(e => console.warn('Target article delete failed:', e));
    }

    // 3. Cari dan hapus seluruh artikel yang dibuat pengguna ini dari Firestore
    if (userId) {
      const articlesRef = collection(db, ARTICLES_COL);
      const q = query(articlesRef, where('authorId', '==', userId));
      const querySnap = await getDocs(q);
      const deletePromises = querySnap.docs.map(d => deleteDoc(doc(db, ARTICLES_COL, d.id)));
      await Promise.all(deletePromises);
    }

    // 4. Bersihkan dari LocalStorage
    try {
      // Hapus pengguna dari daftar users local
      const storedUsersStr = localStorage.getItem('sga_news_users_v1');
      if (storedUsersStr) {
        const users: User[] = JSON.parse(storedUsersStr);
        const updatedUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('sga_news_users_v1', JSON.stringify(updatedUsers));
      }

      // Hapus artikel dari daftar articles local
      const storedArticlesStr = localStorage.getItem('sga_news_articles_v1');
      if (storedArticlesStr) {
        const articles: Article[] = JSON.parse(storedArticlesStr);
        const updatedArticles = articles.filter(a => a.authorId !== userId && a.id !== targetArticleId);
        localStorage.setItem('sga_news_articles_v1', JSON.stringify(updatedArticles));
      }

      // Jika user yang dihapus adalah user aktif saat ini, hapus sesi login & ganti ke reader
      const currentStoredUserStr = localStorage.getItem('sga_news_current_user_v1');
      if (currentStoredUserStr) {
        const currentUser: User = JSON.parse(currentStoredUserStr);
        if (currentUser.id === userId) {
          localStorage.removeItem('sga_news_current_user_v1');
        }
      }
    } catch (e) {
      console.warn('LocalStorage cleanup note:', e);
    }

  } catch (err) {
    console.error('Error in deleteUserAccountAndArticlesFromFirestore:', err);
  }
}

/**
 * DAFTAR USER BARU DENGAN FIREBASE AUTH & SIMPAN PROFIL KE FIRESTORE
 */
export async function signUpUserWithAuth(
  email: string, 
  pass: string, 
  name: string, 
  bio?: string,
  recoveryPin?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const cleanPin = recoveryPin?.trim() || '';

  try {
    // 1. Create in Firebase Auth
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const uid = userCred.user.uid;

    // 2. Create profile in Firestore
    const newUser: User = {
      id: uid,
      name,
      email: cleanEmail,
      role: 'author',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      bio: bio || 'Penulis Komunitas Baru di SGA News Portal.',
      joinedDate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      articlesCount: 0,
      followersCount: 0,
      profileLikesCount: 0,
      followers: [],
      isVerified: false,
      password: cleanPass, // Keep for compatibility
      recoveryPin: cleanPin
    };

    await setDoc(doc(db, USERS_COL, uid), newUser);
    return newUser;
  } catch (error: any) {
    console.warn('Firebase Auth user registration failed, attempting Firestore fallback...', error);

    // Check if email already registered in Firestore
    const usersRef = collection(db, USERS_COL);
    const q = query(usersRef, where('email', '==', cleanEmail));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      throw new Error('Alamat email ini sudah terdaftar. Silakan gunakan email lain atau reset sandi Anda.');
    }

    // Direct Firestore fallback for registration
    const customId = 'user-' + Date.now();
    const newUser: User = {
      id: customId,
      name,
      email: cleanEmail,
      role: 'author',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      bio: bio || 'Penulis Komunitas Baru di SGA News Portal.',
      joinedDate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      articlesCount: 0,
      followersCount: 0,
      profileLikesCount: 0,
      followers: [],
      isVerified: false,
      password: cleanPass,
      recoveryPin: cleanPin
    };

    await setDoc(doc(db, USERS_COL, customId), newUser);
    return newUser;
  }
}

/**
 * MASUK DENGAN FIREBASE AUTH & AMBIL PROFIL FIRESTORE (DENGAN TRANSPARENT FALLBACK MIGRASI USER AWAL)
 */
export async function signInUserWithAuth(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  // If Admin SGA bypass
  if (cleanEmail === 'admin@sganews.id' || cleanEmail === 'admin') {
    if (cleanPass !== 'SGA2026-Pemred-Owner') {
      throw new Error('Sandi Pemred salah!');
    }
    // Return admin user
    const adminRef = doc(db, USERS_COL, 'user-admin-owner');
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      return adminSnap.data() as User;
    } else {
      const adminUsr = INITIAL_USERS.find(u => u.id === 'user-admin-owner')!;
      await setDoc(adminRef, adminUsr);
      return adminUsr;
    }
  }

  try {
    // 1. Attempt standard sign in
    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const uid = userCred.user.uid;

    // Fetch profile
    const userDocRef = doc(db, USERS_COL, uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    } else {
      // Create user profile if authenticated but no Firestore doc exists
      const newUser: User = {
        id: uid,
        name: userCred.user.displayName || email.split('@')[0],
        email: cleanEmail,
        role: 'author',
        avatar: userCred.user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        bio: 'Penulis Komunitas Baru di SGA News Portal.',
        joinedDate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        articlesCount: 0,
        followersCount: 0,
        profileLikesCount: 0,
        followers: [],
        isVerified: false
      };
      await setDoc(userDocRef, newUser);
      return newUser;
    }
  } catch (error: any) {
    console.warn('Firebase Auth standard login failed, checking fallback database query...', error);
    
    // Check if the email exists in preloaded initial users or in Firestore database users
    const usersRef = collection(db, USERS_COL);
    const q = query(usersRef, where('email', '==', cleanEmail));
    const querySnap = await getDocs(q);

    let matchedUser: User | undefined = undefined;
    if (!querySnap.empty) {
      matchedUser = querySnap.docs[0].data() as User;
    } else {
      matchedUser = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    }

    if (matchedUser) {
      const correctPassword = matchedUser.password || 'sga123';
      if (cleanPass === correctPassword) {
        // Correct password! Try to migrate this user to Firebase Auth if possible
        try {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
          const uid = userCred.user.uid;

          // Save profile to Firestore under the new Firebase Auth uid
          const newUser: User = {
            ...matchedUser,
            id: uid, // Update the id to the actual Auth uid
          };
          // Delete old document if the old id was different
          if (matchedUser.id !== uid) {
            await deleteDoc(doc(db, USERS_COL, matchedUser.id)).catch(() => {});
          }
          await setDoc(doc(db, USERS_COL, uid), newUser);
          return newUser;
        } catch (migrationError: any) {
          console.warn('Migration to Firebase Auth failed (likely because Email/Password provider is not enabled), logging in with local fallback profile:', migrationError);
          return matchedUser; // Return matched user from Firestore fallback
        }
      } else {
        // Passwords do not match! Throw a strict error to prevent account hijacking
        throw new Error('Kata sandi salah! Silakan coba lagi atau reset sandi Anda.');
      }
    }

    // Translate common Firebase auth errors to readable Indonesian
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Kata sandi salah! Silakan coba lagi atau reset sandi Anda.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('Alamat email tidak terdaftar.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Format email tidak valid.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Masuk dengan Email/Sandi belum diaktifkan di Firebase Console. Harap aktifkan Email/Sandi di tab Authentication.');
    } else {
      throw new Error(error.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    }
  }
}

/**
 * PROSES RESEND/KIRIM EMAIL RESET SANDI VIA FIREBASE AUTH
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  
  // First, check if the email is in INITIAL_USERS or Firestore but not yet in Firebase Auth
  const usersRef = collection(db, USERS_COL);
  const q = query(usersRef, where('email', '==', cleanEmail));
  const querySnap = await getDocs(q);

  let matchedUser: User | undefined = undefined;
  if (!querySnap.empty) {
    matchedUser = querySnap.docs[0].data() as User;
  } else {
    matchedUser = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail);
  }

  if (matchedUser) {
    try {
      const defaultPass = matchedUser.password || 'sga123';
      await createUserWithEmailAndPassword(auth, cleanEmail, defaultPass);
    } catch (e: any) {
      // If already in Auth, ignore the error
    }
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error: any) {
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Fitur Reset Sandi Email belum diaktifkan di Firebase Console. Hubungi Pemimpin Redaksi untuk bantuan reset.');
    }
    throw error;
  }
}

/**
 * KELUAR AKUN DARI FIREBASE AUTH
 */
export async function signOutUserWithAuth(): Promise<void> {
  await signOut(auth);
}

/**
 * RESET PASSWORD INSTAN MANDIRI (VERIFIKASI PIN PEMULIHAN AMAN TANPA TUNGGU EMAIL)
 */
export async function instantResetPassword(
  email: string,
  verificationCodeOrPin: string,
  newPass: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const inputPin = verificationCodeOrPin.trim();
  const cleanPass = newPass.trim();

  if (cleanPass.length < 6) {
    throw new Error('Kata sandi baru minimal harus 6 karakter.');
  }

  if (!inputPin) {
    throw new Error('PIN Pemulihan / Kode Keamanan wajib diisi.');
  }

  // 1. Find user in Firestore users collection
  const usersRef = collection(db, USERS_COL);
  const q = query(usersRef, where('email', '==', cleanEmail));
  const querySnap = await getDocs(q);

  let matchedUser: User | undefined = undefined;
  let matchedDocId: string | undefined = undefined;

  if (!querySnap.empty) {
    matchedDocId = querySnap.docs[0].id;
    matchedUser = querySnap.docs[0].data() as User;
  } else {
    // Check in preloaded users list
    matchedUser = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      matchedDocId = matchedUser.id;
    }
  }

  if (!matchedUser || !matchedDocId) {
    throw new Error('Alamat email tidak terdaftar di database SGA News.');
  }

  // 2. Security Verification
  const savedPin = matchedUser.recoveryPin?.trim();

  if (savedPin) {
    if (inputPin !== savedPin) {
      throw new Error('Verifikasi Gagal: PIN Pemulihan Akun Anda tidak cocok. Silakan periksa kembali PIN Anda.');
    }
  } else {
    // Fallback for pre-existing system accounts that do not have a recoveryPin yet
    const MASTER_RECOVERY_CODE = 'SGA2026-REDAKSI';
    if (inputPin !== MASTER_RECOVERY_CODE) {
      throw new Error('Verifikasi Gagal: Akun bawaan belum dikonfigurasi dengan PIN pribadi. Silakan masukkan Kode Pemulihan Redaksi Khusus (SGA2026-REDAKSI) atau hubungi Pemimpin Redaksi.');
    }
  }

  // 3. Update the password in Firestore document (for fallback access)
  const updatedUser: User = {
    ...matchedUser,
    password: cleanPass
  };

  await setDoc(doc(db, USERS_COL, matchedDocId), updatedUser, { merge: true });
}

const SECURE_RESETS_COL = 'secure_resets';

/**
 * GENERATE SECURE RESET REQUEST (EMAIL OTP & SECURE LINK VERIFICATION)
 */
export async function generateSecureResetRequest(email: string): Promise<SecureResetRequest> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Verify email exists in USERS_COL or INITIAL_USERS
  const usersRef = collection(db, USERS_COL);
  const q = query(usersRef, where('email', '==', cleanEmail));
  const querySnap = await getDocs(q);

  let matchedUserExists = !querySnap.empty;

  if (!matchedUserExists) {
    const isPredefined = INITIAL_USERS.some(u => u.email.toLowerCase() === cleanEmail);
    if (!isPredefined) {
      throw new Error('Alamat email tidak terdaftar di sistem SGA News.');
    }
  }

  // 2. Generate secure OTP (6 digit numeric)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Generate secure random token (link)
  const token = 'sec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const id = 'reset_' + Math.random().toString(36).substring(2, 10);
  const now = new Date();
  const expires = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes expiration

  const request: SecureResetRequest = {
    id,
    email: cleanEmail,
    otp,
    token,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    isUsed: false,
  };

  // 4. Save to Firestore
  await setDoc(doc(db, SECURE_RESETS_COL, id), request);

  return request;
}

/**
 * VERIFY SECURE EMAIL OTP AND RESET PASSWORD
 */
export async function verifyOtpAndResetPassword(
  email: string,
  otp: string,
  newPass: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();
  const cleanPass = newPass.trim();

  if (cleanPass.length < 6) {
    throw new Error('Kata sandi baru minimal harus 6 karakter.');
  }

  // 1. Find valid reset request
  const resetsRef = collection(db, SECURE_RESETS_COL);
  const q = query(
    resetsRef, 
    where('email', '==', cleanEmail), 
    where('otp', '==', cleanOtp), 
    where('isUsed', '==', false)
  );
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    throw new Error('Kode OTP salah, telah digunakan, atau tidak berlaku untuk email ini.');
  }

  const resetDoc = querySnap.docs[0];
  const resetData = resetDoc.data() as SecureResetRequest;

  // 2. Check expiration
  if (new Date(resetData.expiresAt).getTime() < Date.now()) {
    throw new Error('Kode OTP telah kedaluwarsa (berlaku hanya 5 menit). Silakan kirim ulang kode baru.');
  }

  // 3. Find User Document to Update
  const usersRef = collection(db, USERS_COL);
  const uq = query(usersRef, where('email', '==', cleanEmail));
  const userSnap = await getDocs(uq);

  let matchedUser: User | undefined = undefined;
  let matchedDocId: string | undefined = undefined;

  if (!userSnap.empty) {
    matchedDocId = userSnap.docs[0].id;
    matchedUser = userSnap.docs[0].data() as User;
  } else {
    // Check in preloaded users list and provision on the fly
    matchedUser = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      matchedDocId = matchedUser.id;
    }
  }

  if (!matchedUser || !matchedDocId) {
    throw new Error('Alamat email tidak ditemukan untuk pembaruan kata sandi.');
  }

  // 4. Mark request as used
  await updateDoc(doc(db, SECURE_RESETS_COL, resetDoc.id), { isUsed: true });

  // 5. Update password in user profile
  const updatedUser: User = {
    ...matchedUser,
    password: cleanPass
  };
  await setDoc(doc(db, USERS_COL, matchedDocId), updatedUser, { merge: true });
}

/**
 * VERIFY SECURE RESET LINK TOKEN AND RESET PASSWORD
 */
export async function verifyTokenAndResetPassword(
  email: string,
  token: string,
  newPass: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();
  const cleanPass = newPass.trim();

  if (cleanPass.length < 6) {
    throw new Error('Kata sandi baru minimal harus 6 karakter.');
  }

  // 1. Find valid reset request
  const resetsRef = collection(db, SECURE_RESETS_COL);
  const q = query(
    resetsRef, 
    where('email', '==', cleanEmail), 
    where('token', '==', cleanToken), 
    where('isUsed', '==', false)
  );
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    throw new Error('Tautan verifikasi salah, telah digunakan, atau kedaluwarsa.');
  }

  const resetDoc = querySnap.docs[0];
  const resetData = resetDoc.data() as SecureResetRequest;

  // 2. Check expiration
  if (new Date(resetData.expiresAt).getTime() < Date.now()) {
    throw new Error('Tautan verifikasi keamanan telah kedaluwarsa (berlaku hanya 5 menit). Silakan minta tautan baru.');
  }

  // 3. Find User Document to Update
  const usersRef = collection(db, USERS_COL);
  const uq = query(usersRef, where('email', '==', cleanEmail));
  const userSnap = await getDocs(uq);

  let matchedUser: User | undefined = undefined;
  let matchedDocId: string | undefined = undefined;

  if (!userSnap.empty) {
    matchedDocId = userSnap.docs[0].id;
    matchedUser = userSnap.docs[0].data() as User;
  } else {
    matchedUser = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      matchedDocId = matchedUser.id;
    }
  }

  if (!matchedUser || !matchedDocId) {
    throw new Error('Alamat email tidak ditemukan untuk pembaruan kata sandi.');
  }

  // 4. Mark request as used
  await updateDoc(doc(db, SECURE_RESETS_COL, resetDoc.id), { isUsed: true });

  // 5. Update password in user profile
  const updatedUser: User = {
    ...matchedUser,
    password: cleanPass
  };
  await setDoc(doc(db, USERS_COL, matchedDocId), updatedUser, { merge: true });
}

