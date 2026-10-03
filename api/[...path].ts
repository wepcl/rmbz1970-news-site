/**
 * Vercel 函数入口：捕获全部 /api/* 请求，按路径与方法分发到
 * functions/api/** 中的 Cloudflare Pages Functions 处理器。
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PgD1 } from './_lib/db';

/** 从 Vercel 环境变量解析数据库连接串（Neon/Vercel Postgres 标准变量）。 */
function dbUrl(): string {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

// ---------- 导入全部处理器 ----------
import { onRequestPost as registerPost } from '../functions/api/auth/register';
import { onRequestPost as loginPost } from '../functions/api/auth/login';
import { onRequestGet as meGet } from '../functions/api/auth/me';
import { onRequestGet as categoriesGet } from '../functions/api/news/categories';
import {
  onRequestGet as articlesGet,
  onRequestPost as articlesPost,
} from '../functions/api/news/articles';
import { onRequestGet as articleGet } from '../functions/api/news/articles/[id]';
import { onRequestGet as pendingRegsGet } from '../functions/api/admin/registrations/pending';
import { onRequestPost as approveRegPost } from '../functions/api/admin/registrations/[userId]/approve';
import { onRequestPost as rejectRegPost } from '../functions/api/admin/registrations/[userId]/reject';
import { onRequestGet as usersGet } from '../functions/api/admin/users';
import { onRequestDelete as userDelete } from '../functions/api/admin/users/[userId]';
import { onRequestPost as banPost } from '../functions/api/admin/users/[userId]/ban';
import { onRequestPost as unbanPost } from '../functions/api/admin/users/[userId]/unban';
import { onRequestPost as renamePost } from '../functions/api/admin/users/[userId]/rename';
import { onRequestGet as adminArticlesGet } from '../functions/api/admin/articles';
import { onRequestGet as pendingApprovalGet } from '../functions/api/admin/articles/pending-approval';
import { onRequestDelete as articleDelete } from '../functions/api/admin/articles/[articleId]';
import { onRequestPost as approveArticlePost } from '../functions/api/admin/articles/[articleId]/approve';
import { onRequestPost as rejectArticlePost } from '../functions/api/admin/articles/[articleId]/reject';
import { onRequestPost as offlinePost } from '../functions/api/admin/articles/[articleId]/offline';

type PagesHandler = (ctx: {
  request: Request;
  env: { DB: TursoD1 };
  params: Record<string, string>;
}) => Promise<Response>;

interface Route {
  method: string;
  segments: string[]; // ':name' 表示动态段
  handler: PagesHandler;
}

const routes: Route[] = [
  { method: 'POST', segments: ['auth', 'register'], handler: registerPost },
  { method: 'POST', segments: ['auth', 'login'], handler: loginPost },
  { method: 'GET', segments: ['auth', 'me'], handler: meGet },
  { method: 'GET', segments: ['news', 'categories'], handler: categoriesGet },
  { method: 'GET', segments: ['news', 'articles'], handler: articlesGet },
  { method: 'POST', segments: ['news', 'articles'], handler: articlesPost },
  { method: 'GET', segments: ['news', 'articles', ':id'], handler: articleGet },
  {
    method: 'GET',
    segments: ['admin', 'registrations', 'pending'],
    handler: pendingRegsGet,
  },
  {
    method: 'POST',
    segments: ['admin', 'registrations', ':userId', 'approve'],
    handler: approveRegPost,
  },
  {
    method: 'POST',
    segments: ['admin', 'registrations', ':userId', 'reject'],
    handler: rejectRegPost,
  },
  { method: 'GET', segments: ['admin', 'users'], handler: usersGet },
  { method: 'DELETE', segments: ['admin', 'users', ':userId'], handler: userDelete },
  { method: 'POST', segments: ['admin', 'users', ':userId', 'ban'], handler: banPost },
  { method: 'POST', segments: ['admin', 'users', ':userId', 'unban'], handler: unbanPost },
  {
    method: 'POST',
    segments: ['admin', 'users', ':userId', 'rename'],
    handler: renamePost,
  },
  {
    method: 'GET',
    segments: ['admin', 'articles'],
    handler: adminArticlesGet,
  },
  {
    method: 'GET',
    segments: ['admin', 'articles', 'pending-approval'],
    handler: pendingApprovalGet,
  },
  {
    method: 'DELETE',
    segments: ['admin', 'articles', ':articleId'],
    handler: articleDelete,
  },
  {
    method: 'POST',
    segments: ['admin', 'articles', ':articleId', 'approve'],
    handler: approveArticlePost,
  },
  {
    method: 'POST',
    segments: ['admin', 'articles', ':articleId', 'reject'],
    handler: rejectArticlePost,
  },
  {
    method: 'POST',
    segments: ['admin', 'articles', ':articleId', 'offline'],
    handler: offlinePost,
  },
];

function matchRoute(
  method: string,
  pathSegs: string[],
): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    if (route.segments.length !== pathSegs.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    for (let i = 0; i < route.segments.length; i++) {
      const pat = route.segments[i];
      const val = pathSegs[i];
      if (pat.startsWith(':')) {
        params[pat.slice(1)] = decodeURIComponent(val);
      } else if (pat !== val) {
        ok = false;
        break;
      }
    }
    if (ok) return { route, params };
  }
  return null;
}

/** 构造标准 Request（JSON body 统一转字符串）。 */
function makeRequest(req: VercelRequest): Request {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const headers = new Headers(req.headers as Record<string, string>);
  let body: BodyInit | null | undefined;
  if (req.body !== undefined && req.body !== null) {
    body =
      typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);
  }
  return new Request(url.toString(), {
    method: req.method || 'GET',
    headers,
    body,
  });
}

async function sendResponse(
  res: VercelResponse,
  response: Response,
): Promise<void> {
  res.status(response.status);
  const ct = response.headers.get('content-type');
  if (ct) res.setHeader('content-type', ct);
  res.send(await response.text());
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathSegs = url.pathname.split('/').filter(Boolean).slice(1); // 去掉 'api'
    const method = (req.method || 'GET').toUpperCase();

    const matched = matchRoute(method, pathSegs);
    if (!matched) {
      res.status(404).json({ statusCode: 404, message: '接口不存在', error: 'Not Found' });
      return;
    }

    const ctx = {
      request: makeRequest(req),
      env: {
        DB: new PgD1(dbUrl()),
      },
      params: matched.params,
    };

    const response = await matched.route.handler(ctx);
    await sendResponse(res, response);
  } catch (e) {
    console.error('Vercel API error:', e);
    res.status(500).json({
      statusCode: 500,
      message: e instanceof Error ? e.message : '服务器内部错误',
      error: 'Internal Server Error',
    });
  }
}
