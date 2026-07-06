import { Article, User, ArticleComment, UserRole, Category } from '../types';
import { INITIAL_ARTICLES, INITIAL_USERS, INITIAL_COMMENTS } from '../data/initialData';

const ARTICLES_KEY = 'sga_news_articles_v1';
const USERS_KEY = 'sga_news_users_v1';
const COMMENTS_KEY = 'sga_news_comments_v1';
const BOOKMARKS_KEY = 'sga_news_bookmarks_v1';
const CURRENT_USER_KEY = 'sga_news_current_user_v1';
const LIKES_KEY = 'sga_news_user_likes_v1';

// Get Articles
export function getStoredArticles(): Article[] {
  try {
    const data = localStorage.getItem(ARTICLES_KEY);
    let articles: Article[] = data ? JSON.parse(data) : INITIAL_ARTICLES;
    const cleanArticles = articles
      .filter(a => a && (a.category as string) !== 'Politik' && a.id !== 'art-4')
      .map(a => ((a.category as string) === 'Opini' ? { ...a, category: 'Hiburan' as Category } : a));
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(cleanArticles));
    return cleanArticles;
  } catch (e) {
    console.error('Failed to parse articles from localStorage', e);
    return INITIAL_ARTICLES.filter(a => (a.category as string) !== 'Politik' && a.id !== 'art-4');
  }
}

// Save Articles
export function saveArticles(articles: Article[]): void {
  try {
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
  } catch (e) {
    console.error('Failed to save articles to localStorage', e);
  }
}

// Add New Article (From Contributor / Editor)
export function addArticle(articleData: Omit<Article, 'id' | 'createdAt' | 'views' | 'likes'>): Article {
  const articles = getStoredArticles();
  const id = 'art-' + Date.now();
  const newArticle: Article = {
    ...articleData,
    id,
    createdAt: new Date().toISOString(),
    views: 0,
    likes: 0,
    reactions: { suka: 0, inspiratif: 0, haru: 0, kaget: 0 }
  };
  const updated = [newArticle, ...articles];
  saveArticles(updated);
  return newArticle;
}

// Update Article (Approval / Rejection / Edit)
export function updateArticle(articleId: string, updates: Partial<Article>): Article | null {
  const articles = getStoredArticles();
  const index = articles.findIndex(a => a.id === articleId);
  if (index === -1) return null;

  const updatedArticle = { ...articles[index], ...updates };
  articles[index] = updatedArticle;
  saveArticles(articles);
  return updatedArticle;
}

// Delete Article
export function deleteArticle(articleId: string): void {
  const articles = getStoredArticles();
  const filtered = articles.filter(a => a.id !== articleId);
  saveArticles(filtered);
}

// Increment View Count
export function incrementArticleViews(articleId: string): void {
  const articles = getStoredArticles();
  const article = articles.find(a => a.id === articleId);
  if (article) {
    article.views = (article.views || 0) + 1;
    saveArticles(articles);
  }
}

export const OFFICIAL_ADMIN_USER: User = {
  id: 'user-admin-owner',
  name: 'Admin SGA Redaksi',
  email: 'admin@sganews.id',
  role: 'admin',
  avatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
  bio: 'Pemimpin Redaksi Utama & Owner SGA News Portal. Bertanggung jawab atas kebijakan jurnalistik, verifikasi berita, dan pengawasan tim redaksi.',
  joinedDate: 'Januari 2024',
  articlesCount: 18,
  isVerified: true,
  followersCount: 1250,
  profileLikesCount: 890
};

// Get Users
export function getStoredUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    let users: User[] = data ? JSON.parse(data) : [];

    const userMap = new Map<string, User>();
    // Baseline initial users
    INITIAL_USERS.forEach(u => {
      if (u && u.id) userMap.set(u.id, u);
    });
    userMap.set(OFFICIAL_ADMIN_USER.id, OFFICIAL_ADMIN_USER);

    if (Array.isArray(users)) {
      users.forEach(u => {
        if (!u || !u.id) return;
        if (
          u.id === 'user-admin-1' || 
          u.id === 'user-admin-owner' || 
          u.email === 'admin@sganews.id'
        ) {
          const existing = userMap.get(OFFICIAL_ADMIN_USER.id) || OFFICIAL_ADMIN_USER;
          userMap.set(OFFICIAL_ADMIN_USER.id, { ...existing, ...u });
        } else {
          const existing = userMap.get(u.id) || {};
          userMap.set(u.id, { ...existing, ...u });
        }
      });
    }

    const normalizedUsers = Array.from(userMap.values());
    localStorage.setItem(USERS_KEY, JSON.stringify(normalizedUsers));
    return normalizedUsers;
  } catch (e) {
    return [OFFICIAL_ADMIN_USER, ...INITIAL_USERS.filter(u => u.id !== OFFICIAL_ADMIN_USER.id)];
  }
}

// Get Current Logged In User / Active Persona
export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (data) {
      const parsed: User = JSON.parse(data);
      if (parsed && parsed.name && parsed.id) {
        if (parsed.email === 'admin@sganews.id' || parsed.role === 'admin' || parsed.id === 'user-admin-1' || parsed.id === 'user-admin-owner') {
          return { ...OFFICIAL_ADMIN_USER, ...parsed };
        }
        return parsed;
      }
    }
  } catch (e) {
    // fallback
  }

  return null;
}

// Switch User Role / Persona
export function setCurrentUser(user: User | null): void {
  if (user === null) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

// Save or Update User in Local Storage
export function saveStoredUser(user: User): void {
  try {
    const users = getStoredUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const current = getCurrentUser();
    if (current && current.id === user.id) {
      setCurrentUser({ ...current, ...user });
    }
  } catch (e) {
    console.error('Failed to save user to localStorage', e);
  }
}

// Comments
export function getArticleComments(articleId: string): ArticleComment[] {
  try {
    const data = localStorage.getItem(COMMENTS_KEY);
    const comments: ArticleComment[] = data ? JSON.parse(data) : INITIAL_COMMENTS;
    return comments.filter(c => c.articleId === articleId);
  } catch (e) {
    return INITIAL_COMMENTS.filter(c => c.articleId === articleId);
  }
}

export function addComment(articleId: string, content: string, user: User | null): ArticleComment {
  const data = localStorage.getItem(COMMENTS_KEY);
  const allComments: ArticleComment[] = data ? JSON.parse(data) : INITIAL_COMMENTS;
  
  const newComment: ArticleComment = {
    id: 'comm-' + Date.now(),
    articleId,
    authorName: user?.name || 'Pembaca SGA',
    authorAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    authorRole: user ? (user.role === 'admin' ? 'Pemred' : user.role === 'editor' ? 'Redaktur' : user.role === 'author' ? 'Penulis' : 'Pembaca') : 'Pembaca',
    content,
    createdAt: new Date().toISOString(),
    likes: 0
  };

  const updated = [newComment, ...allComments];
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(updated));
  return newComment;
}

// Bookmarks
export function getBookmarks(): string[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function toggleBookmark(articleId: string): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(articleId);
  let isBookmarked = false;
  if (index >= 0) {
    bookmarks.splice(index, 1);
    isBookmarked = false;
  } else {
    bookmarks.push(articleId);
    isBookmarked = true;
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return isBookmarked;
}

// User Likes
export function getUserLikes(): string[] {
  try {
    const data = localStorage.getItem(LIKES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function toggleArticleLike(articleId: string): { liked: boolean; totalLikes: number } {
  const userLikes = getUserLikes();
  const articles = getStoredArticles();
  const article = articles.find(a => a.id === articleId);
  
  let liked = false;
  const index = userLikes.indexOf(articleId);

  if (index >= 0) {
    userLikes.splice(index, 1);
    if (article && article.likes > 0) article.likes -= 1;
    liked = false;
  } else {
    userLikes.push(articleId);
    if (article) article.likes = (article.likes || 0) + 1;
    liked = true;
  }

  localStorage.setItem(LIKES_KEY, JSON.stringify(userLikes));
  saveArticles(articles);

  return {
    liked,
    totalLikes: article ? article.likes : 0
  };
}

// Add Reaction to Article
export function addArticleReaction(articleId: string, reactionType: 'suka' | 'inspiratif' | 'haru' | 'kaget'): Article | null {
  const articles = getStoredArticles();
  const article = articles.find(a => a.id === articleId);
  if (!article) return null;

  if (!article.reactions) {
    article.reactions = { suka: 0, inspiratif: 0, haru: 0, kaget: 0 };
  }
  article.reactions[reactionType] = (article.reactions[reactionType] || 0) + 1;
  saveArticles(articles);
  return article;
}

// User Profile Follow System
const FOLLOWS_KEY = 'sga_news_follows_v1';
const PROFILE_LIKES_KEY = 'sga_news_profile_likes_v1';

export function getFollowedAuthors(): string[] {
  try {
    const data = localStorage.getItem(FOLLOWS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function toggleFollowAuthor(targetAuthorKey: string): { isFollowing: boolean; updatedFollowersCount?: number } {
  const followed = getFollowedAuthors();
  const index = followed.indexOf(targetAuthorKey);
  let isFollowing = false;

  if (index >= 0) {
    followed.splice(index, 1);
    isFollowing = false;
  } else {
    followed.push(targetAuthorKey);
    isFollowing = true;
  }

  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(followed));
  return { isFollowing };
}

// User Profile Likes System
export function getLikedProfiles(): string[] {
  try {
    const data = localStorage.getItem(PROFILE_LIKES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function toggleProfileLike(targetAuthorKey: string): { hasLiked: boolean } {
  const liked = getLikedProfiles();
  const index = liked.indexOf(targetAuthorKey);
  let hasLiked = false;

  if (index >= 0) {
    liked.splice(index, 1);
    hasLiked = false;
  } else {
    liked.push(targetAuthorKey);
    hasLiked = true;
  }

  localStorage.setItem(PROFILE_LIKES_KEY, JSON.stringify(liked));
  return { hasLiked };
}
