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
import { db } from '../lib/firebase';
import { Article, ArticleComment, User, ArticleReaction, Category } from '../types';
import { INITIAL_ARTICLES, INITIAL_COMMENTS, INITIAL_USERS } from '../data/initialData';

const ARTICLES_COL = 'articles';
const COMMENTS_COL = 'comments';
const USERS_COL = 'users';

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
  const articlesRef = collection(db, ARTICLES_COL);

  // Initial check & seed trigger
  getDocs(articlesRef).then((snapshot) => {
    if (snapshot.empty) {
      onUpdate(INITIAL_ARTICLES);
      seedInitialDataIfEmpty();
    }
  }).catch((err) => {
    console.error('Error checking articles collection:', err);
    onUpdate(INITIAL_ARTICLES);
  });

  const unsubscribe = onSnapshot(
    articlesRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_ARTICLES);
        return;
      }
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

      // Ensure any INITIAL_ARTICLES missing from Firestore are merged and seeded
      INITIAL_ARTICLES.forEach((initArt) => {
        if (!idMap.has(initArt.id) && (!initArt.slug || !slugMap.has(initArt.slug))) {
          articles.push(initArt);
          idMap.add(initArt.id);
          // Sync missing initial article to Firestore
          try {
            setDoc(doc(db, ARTICLES_COL, initArt.id), initArt, { merge: true }).catch(() => {});
          } catch (e) {}
        }
      });

      // Sort by createdAt descending
      articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      onUpdate(articles);
    },
    (error) => {
      console.error('Firestore articles snapshot error:', error);
      onUpdate(INITIAL_ARTICLES);
    }
  );

  return unsubscribe;
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

  const docRef = doc(db, ARTICLES_COL, id);
  await setDoc(docRef, newArticle);
  return newArticle;
}

export async function updateArticleInFirestore(
  articleId: string, 
  updates: Partial<Article>
): Promise<void> {
  const docRef = doc(db, ARTICLES_COL, articleId);
  await updateDoc(docRef, updates);
}

export async function deleteArticleFromFirestore(articleId: string): Promise<void> {
  const docRef = doc(db, ARTICLES_COL, articleId);
  await deleteDoc(docRef);
}

export async function incrementArticleViewsInFirestore(articleId: string): Promise<void> {
  try {
    const docRef = doc(db, ARTICLES_COL, articleId);
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
  const commentsRef = collection(db, COMMENTS_COL);
  const q = query(commentsRef, where('articleId', '==', articleId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const comments: ArticleComment[] = [];
      snapshot.forEach((docSnap) => {
        comments.push({
          ...(docSnap.data() as ArticleComment),
          id: docSnap.id
        });
      });

      // Sort comments by createdAt descending
      comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      onUpdate(comments);
    },
    (error) => {
      console.error('Firestore comments snapshot error:', error);
      const fallbackComments = INITIAL_COMMENTS.filter(c => c.articleId === articleId);
      onUpdate(fallbackComments);
    }
  );

  return unsubscribe;
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

  const docRef = doc(db, COMMENTS_COL, id);
  await setDoc(docRef, newComment);
  return newComment;
}

// --- USERS REAL-TIME SYNC & OPERATIONS ---

export function subscribeToUsers(onUpdate: (users: User[]) => void): () => void {
  const usersRef = collection(db, USERS_COL);

  const unsubscribe = onSnapshot(
    usersRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_USERS);
        return;
      }
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
          try {
            setDoc(doc(db, USERS_COL, initUsr.id), initUsr, { merge: true }).catch(() => {});
          } catch (e) {}
        }
      });

      onUpdate(users);
    },
    (error) => {
      console.error('Firestore users snapshot error:', error);
      onUpdate(INITIAL_USERS);
    }
  );

  return unsubscribe;
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

