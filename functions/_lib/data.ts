/** D1 行 → 接口类型的映射，以及通用查询。 */
import type {
  NewsUser,
  NewsArticle,
  ArticleListResponse,
  UserRole,
  UserStatus,
  ArticleStatus,
} from '@shared/api.interface';

export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  ban_reason: string | null;
  approved_by: string | null;
  approved_at: number | null;
  created_at: number;
}

export interface ArticleRow {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  cover_url: string | null;
  category_id: string;
  category_name: string | null;
  author_id: string;
  author_name: string | null;
  status: ArticleStatus;
  view_count: number;
  approved_by: string | null;
  approved_at: number | null;
  published_at: number | null;
  created_at: number;
}

export function mapUser(row: UserRow): NewsUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    banReason: row.ban_reason ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function mapArticle(row: ArticleRow): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? undefined,
    content: row.content,
    coverUrl: row.cover_url ?? undefined,
    categoryId: row.category_id,
    categoryName: row.category_name ?? undefined,
    authorId: row.author_id,
    authorName: row.author_name ?? undefined,
    status: row.status,
    viewCount: row.view_count,
    publishedAt: row.published_at
      ? new Date(row.published_at).toISOString()
      : undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const ARTIC_SELECT = `
  SELECT a.id, a.title, a.summary, a.content, a.cover_url AS cover_url,
         a.category_id AS category_id, c.name AS category_name,
         a.author_id AS author_id, u.display_name AS author_name,
         a.status AS status, a.view_count AS view_count,
         a.approved_by AS approved_by, a.approved_at AS approved_at,
         a.published_at AS published_at, a.created_at AS created_at
  FROM news_article a
  LEFT JOIN news_category c ON a.category_id = c.id
  LEFT JOIN news_user u ON a.author_id = u.id
`;

export interface ArticleQuery {
  whereSql: string;
  bindings: unknown[];
  page: number;
  pageSize: number;
}

/** 通用文章分页查询（含分类名、作者名）。 */
export async function queryArticles(
  db: D1Database,
  q: ArticleQuery,
): Promise<ArticleListResponse> {
  const offset = (q.page - 1) * q.pageSize;

  const countStmt = db
    .prepare(`SELECT COUNT(*) AS n FROM news_article a ${q.whereSql}`)
    .bind(...q.bindings);
  const countRow = await countStmt.first<{ n: number }>();
  const total = Number(countRow?.n ?? 0);

  const listStmt = db
    .prepare(
      `${ARTIC_SELECT} ${q.whereSql} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    )
    .bind(...q.bindings, q.pageSize, offset);
  const { results } = await listStmt.all<ArticleRow>();

  return {
    items: (results ?? []).map(mapArticle),
    total,
    page: q.page,
    pageSize: q.pageSize,
  };
}

/** 按主键取一篇文章（含 join）。 */
export async function getArticleRow(
  db: D1Database,
  id: string,
): Promise<ArticleRow | null> {
  const stmt = db.prepare(`${ARTIC_SELECT} WHERE a.id = ? LIMIT 1`).bind(id);
  return stmt.first<ArticleRow>();
}

/** 按主键取用户原始行。 */
export async function getUserRow(
  db: D1Database,
  id: string,
): Promise<UserRow | null> {
  const stmt = db.prepare(`SELECT * FROM news_user WHERE id = ? LIMIT 1`).bind(id);
  return stmt.first<UserRow>();
}

/** 按用户名取用户原始行。 */
export async function getUserByUsername(
  db: D1Database,
  username: string,
): Promise<UserRow | null> {
  const stmt = db
    .prepare(`SELECT * FROM news_user WHERE username = ? LIMIT 1`)
    .bind(username);
  return stmt.first<UserRow>();
}
