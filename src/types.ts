export type UserRole = 'admin' | 'editor' | 'author' | 'reader';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  bio?: string;
  joinedDate: string;
  articlesCount?: number;
  isVerified?: boolean;
  followersCount?: number;
  profileLikesCount?: number;
  followers?: string[];
}

export type Category = 
  | 'Sepak Bola'
  | 'Teknologi'
  | 'Olahraga'
  | 'Hiburan'
  | 'Bisnis'
  | 'Ekonomi'
  | 'Gaya Hidup'
  | 'Sains'
  | 'Internasional'
  | 'Edukasi'
  | 'Lingkungan';

export type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface ArticleReaction {
  suka: number;
  inspiratif: number;
  haru: number;
  kaget: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: Category;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  status: ArticleStatus;
  createdAt: string;
  publishedAt?: string;
  updatedAt?: string;
  views: number;
  likes: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  editorialNotes?: string;
  reactions?: ArticleReaction;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  authorName: string;
  authorAvatar: string;
  authorRole?: string;
  content: string;
  createdAt: string;
  likes: number;
  userLiked?: boolean;
}

export interface SiteStats {
  totalArticles: number;
  totalViews: number;
  activeAuthors: number;
  pendingReviews: number;
}
