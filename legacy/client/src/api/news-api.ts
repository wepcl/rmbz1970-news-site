import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  NewsUser,
  NewsCategory,
  ArticleListQuery,
  ArticleListResponse,
  NewsArticle,
  CreateArticleRequest,
  UserListQuery,
  UserListResponse,
} from '@shared/api.interface';

function getToken(): string | null {
  return localStorage.getItem('news_token');
}

function authHeaders(): { headers: { Authorization: string } } | Record<string, never> {
  const token = getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await axiosForBackend.post('/api/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await axiosForBackend.post('/api/auth/register', data);
  return res.data;
}

export async function getCurrentUser(): Promise<NewsUser> {
  const res = await axiosForBackend.get('/api/auth/me', authHeaders());
  return res.data;
}

export async function getCategories(): Promise<NewsCategory[]> {
  const res = await axiosForBackend.get('/api/news/categories');
  return res.data;
}

export async function getPublishedArticles(params?: ArticleListQuery): Promise<ArticleListResponse> {
  const res = await axiosForBackend.get('/api/news/articles', { params });
  return res.data;
}

export async function getArticle(id: string): Promise<NewsArticle> {
  const res = await axiosForBackend.get(`/api/news/articles/${id}`);
  return res.data;
}

export async function createArticle(data: CreateArticleRequest): Promise<NewsArticle> {
  const res = await axiosForBackend.post('/api/news/articles', data, authHeaders());
  return res.data;
}

export async function getPendingRegistrations(params?: UserListQuery): Promise<UserListResponse> {
  const res = await axiosForBackend.get('/api/admin/registrations/pending', { ...authHeaders(), params });
  return res.data;
}

export async function approveRegistration(userId: string): Promise<NewsUser> {
  const res = await axiosForBackend.post(`/api/admin/registrations/${userId}/approve`, {}, authHeaders());
  return res.data;
}

export async function rejectRegistration(userId: string, reason: string): Promise<NewsUser> {
  const res = await axiosForBackend.post(`/api/admin/registrations/${userId}/reject`, { reason }, authHeaders());
  return res.data;
}

export async function getUsers(params?: UserListQuery): Promise<UserListResponse> {
  const res = await axiosForBackend.get('/api/admin/users', { ...authHeaders(), params });
  return res.data;
}

export async function banUser(userId: string, reason: string): Promise<NewsUser> {
  const res = await axiosForBackend.post(`/api/admin/users/${userId}/ban`, { reason }, authHeaders());
  return res.data;
}

export async function unbanUser(userId: string): Promise<NewsUser> {
  const res = await axiosForBackend.post(`/api/admin/users/${userId}/unban`, {}, authHeaders());
  return res.data;
}

export async function renameUser(userId: string, displayName: string): Promise<NewsUser> {
  const res = await axiosForBackend.post(`/api/admin/users/${userId}/rename`, { displayName }, authHeaders());
  return res.data;
}

export async function deleteUser(userId: string): Promise<void> {
  await axiosForBackend.delete(`/api/admin/users/${userId}`, authHeaders());
}

export async function getAdminArticles(params?: ArticleListQuery): Promise<ArticleListResponse> {
  const res = await axiosForBackend.get('/api/admin/articles', { ...authHeaders(), params });
  return res.data;
}

export async function getPendingApprovalArticles(params?: ArticleListQuery): Promise<ArticleListResponse> {
  const res = await axiosForBackend.get('/api/admin/articles/pending-approval', { ...authHeaders(), params });
  return res.data;
}

export async function approveArticle(articleId: string): Promise<NewsArticle> {
  const res = await axiosForBackend.post(`/api/admin/articles/${articleId}/approve`, {}, authHeaders());
  return res.data;
}

export async function rejectArticle(articleId: string): Promise<NewsArticle> {
  const res = await axiosForBackend.post(`/api/admin/articles/${articleId}/reject`, {}, authHeaders());
  return res.data;
}

export async function offlineArticle(articleId: string): Promise<NewsArticle> {
  const res = await axiosForBackend.post(`/api/admin/articles/${articleId}/offline`, {}, authHeaders());
  return res.data;
}

export async function deleteArticle(articleId: string): Promise<void> {
  await axiosForBackend.delete(`/api/admin/articles/${articleId}`, authHeaders());
}

export function setToken(token: string): void {
  localStorage.setItem('news_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('news_token');
}
