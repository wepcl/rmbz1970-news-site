export type UserRole = 'creator' | 'admin' | 'reader';
export type UserStatus = 'pending' | 'approved' | 'banned' | 'rejected';
export type ArticleStatus = 'draft' | 'pending_approval' | 'published' | 'rejected' | 'offline';

export interface NewsUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  banReason?: string;
  createdAt: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content: string;
  coverUrl?: string;
  categoryId: string;
  categoryName?: string;
  authorId: string;
  authorName?: string;
  status: ArticleStatus;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: NewsUser;
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
  role: 'admin' | 'reader';
}

export interface RegisterResponse {
  id: string;
  username: string;
  status: UserStatus;
}

export interface ArticleListQuery {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  status?: ArticleStatus;
}

export interface ArticleListResponse {
  items: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  status?: UserStatus;
  role?: UserRole;
}

export interface UserListResponse {
  items: NewsUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApproveUserRequest {
  userId: string;
}

export interface BanUserRequest {
  userId: string;
  reason: string;
}

export interface RenameUserRequest {
  userId: string;
  displayName: string;
}

export interface CreateArticleRequest {
  title: string;
  summary?: string;
  content: string;
  coverUrl?: string;
  categoryId: string;
}

export interface ApproveArticleRequest {
  articleId: string;
}

export interface RejectArticleRequest {
  articleId: string;
  reason: string;
}
