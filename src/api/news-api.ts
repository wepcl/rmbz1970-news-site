import axios, { type AxiosInstance } from 'axios';
import { logger } from '@/lib/logger';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  NewsUser,
  NewsCategory,
  NewsArticle,
  ArticleListQuery,
  ArticleListResponse,
  UserListQuery,
  UserListResponse,
  CreateArticleRequest,
} from '@shared/api.interface';

const TOKEN_KEY = 'news_token';

let authToken: string | null = null;
try {
  authToken = localStorage.getItem(TOKEN_KEY);
} catch {
  authToken = null;
}

export function setToken(token: string | null): void {
  authToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getToken(): string | null {
  return authToken;
}

export function clearToken(): void {
  setToken(null);
}

let clientInstance: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (clientInstance) return clientInstance;
  const client = axios.create({
    baseURL: '/',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const url: string = error?.config?.url || '';
      const isSilentAuthCheck = url.includes('/auth/me');
      const message =
        error?.response?.data?.message || error?.message || '请求失败';
      if (!isSilentAuthCheck) {
        logger.error('API请求失败:', message);
      }
      error.message = message;
      return Promise.reject(error);
    },
  );

  clientInstance = client;
  return client;
}

/* ---------------- 认证 ---------------- */

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await getClient().post('/api/auth/login', data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await getClient().post('/api/auth/register', data);
  return response.data;
}

export async function getCurrentUser(): Promise<NewsUser> {
  const response = await getClient().get('/api/auth/me');
  return response.data;
}

/* ---------------- 公开新闻 ---------------- */

export async function getCategories(): Promise<NewsCategory[]> {
  const response = await getClient().get('/api/news/categories');
  return response.data;
}

export async function getArticles(
  query?: ArticleListQuery,
): Promise<ArticleListResponse> {
  const response = await getClient().get('/api/news/articles', { params: query });
  return response.data;
}

export async function getArticle(id: string): Promise<NewsArticle> {
  const response = await getClient().get(`/api/news/articles/${id}`);
  return response.data;
}

export async function createArticle(
  data: CreateArticleRequest,
): Promise<NewsArticle> {
  const response = await getClient().post('/api/news/articles', data);
  return response.data;
}

/* ---------------- 注册审批 ---------------- */

export async function getPendingRegistrations(
  query?: UserListQuery,
): Promise<UserListResponse> {
  const response = await getClient().get('/api/admin/registrations/pending', {
    params: query,
  });
  return response.data;
}

export async function approveRegistration(userId: string): Promise<NewsUser> {
  const response = await getClient().post(
    `/api/admin/registrations/${userId}/approve`,
  );
  return response.data;
}

export async function rejectRegistration(
  userId: string,
  reason: string,
): Promise<NewsUser> {
  const response = await getClient().post(
    `/api/admin/registrations/${userId}/reject`,
    { reason },
  );
  return response.data;
}

/* ---------------- 用户管理 ---------------- */

export async function getUsers(query?: UserListQuery): Promise<UserListResponse> {
  const response = await getClient().get('/api/admin/users', { params: query });
  return response.data;
}

export async function banUser(userId: string, reason: string): Promise<NewsUser> {
  const response = await getClient().post(`/api/admin/users/${userId}/ban`, {
    reason,
  });
  return response.data;
}

export async function unbanUser(userId: string): Promise<NewsUser> {
  const response = await getClient().post(`/api/admin/users/${userId}/unban`);
  return response.data;
}

export async function renameUser(
  userId: string,
  displayName: string,
): Promise<NewsUser> {
  const response = await getClient().post(
    `/api/admin/users/${userId}/rename`,
    { displayName },
  );
  return response.data;
}

export async function deleteUser(userId: string): Promise<void> {
  await getClient().delete(`/api/admin/users/${userId}`);
}

/* ---------------- 新闻管理 ---------------- */

export async function getAllArticles(
  query?: ArticleListQuery,
): Promise<ArticleListResponse> {
  const response = await getClient().get('/api/admin/articles', {
    params: query,
  });
  return response.data;
}

export async function getPendingApprovalArticles(
  query?: ArticleListQuery,
): Promise<ArticleListResponse> {
  const response = await getClient().get(
    '/api/admin/articles/pending-approval',
    { params: query },
  );
  return response.data;
}

export async function approveArticle(articleId: string): Promise<NewsArticle> {
  const response = await getClient().post(
    `/api/admin/articles/${articleId}/approve`,
  );
  return response.data;
}

export async function rejectArticle(articleId: string): Promise<NewsArticle> {
  const response = await getClient().post(
    `/api/admin/articles/${articleId}/reject`,
  );
  return response.data;
}

export async function offlineArticle(articleId: string): Promise<NewsArticle> {
  const response = await getClient().post(
    `/api/admin/articles/${articleId}/offline`,
  );
  return response.data;
}

export async function deleteArticle(articleId: string): Promise<void> {
  await getClient().delete(`/api/admin/articles/${articleId}`);
}

/* 页面沿用的方法名别名 */
export const getPublishedArticles = getArticles;
export const getAdminArticles = getAllArticles;
