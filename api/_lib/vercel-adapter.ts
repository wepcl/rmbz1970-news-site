/**
 * 将 Cloudflare Pages Functions 风格的路由处理函数
 * 适配为 Vercel 的 (req, res) 默认导出。
 *
 * 用法：
 *   export default adapt(async (ctx) => {
 *     return json({ ok: true });
 *   });
 *
 * ctx 提供与 Pages Functions 一致的字段：
 *   - request: 标准 Request
 *   - env.DB:  Turso 兼容 D1 接口
 *   - params:  动态路径参数（来自 Vercel req.query）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PgD1 } from './db';

export type HandlerCtx = {
  request: Request;
  env: { DB: PgD1 };
  params: Record<string, string>;
};

export type Handler = (ctx: HandlerCtx) => Promise<Response>;

/** 从 Vercel 环境变量解析数据库连接串（Neon/Vercel Postgres 标准变量）。 */
function dbUrl(): string {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

function makeRequest(req: VercelRequest): Request {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const headers = new Headers(req.headers as Record<string, string>);
  let body: BodyInit | null | undefined;
  if (typeof req.body === 'string' && req.body.length > 0) {
    body = req.body;
  }
  return new Request(url.toString(), {
    method: req.method || 'GET',
    headers,
    body: body as BodyInit | null | undefined,
  });
}

export function adapt(handler: Handler) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      const ctx: HandlerCtx = await makeCtx(req);
      const response = await handler(ctx);
      res.status(response.status);
      const contentType = response.headers.get('content-type');
      if (contentType) res.setHeader('content-type', contentType);
      res.send(await response.text());
    } catch (e) {
      console.error('Vercel adapter error:', e);
      res.status(500).json({
        statusCode: 500,
        message: e instanceof Error ? e.message : '服务器内部错误',
        error: 'Internal Server Error',
      });
    }
  };
}

async function makeCtx(req: VercelRequest): Promise<HandlerCtx> {
  const ctx: HandlerCtx = {
    request: makeRequest(req),
    env: {
      DB: new PgD1(dbUrl()),
    },
    params: (req.query as Record<string, string | string[]>) || {},
  };
  // 简化：把数组形式的 query 参数转成字符串
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(ctx.params)) {
    params[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
  }
  ctx.params = params;
  return ctx;
}

/** 按请求方法分发到对应的 Pages Functions 处理器。 */
export function adaptMethod(handlers: Partial<Record<string, Handler>>) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    const method = (req.method || 'GET').toUpperCase();
    const handler = handlers[method];
    if (!handler) {
      res.status(405).json({ statusCode: 405, message: 'Method Not Allowed', error: 'Method Not Allowed' });
      return;
    }
    try {
      const ctx = await makeCtx(req);
      const response = await handler(ctx);
      res.status(response.status);
      const contentType = response.headers.get('content-type');
      if (contentType) res.setHeader('content-type', contentType);
      res.send(await response.text());
    } catch (e) {
      console.error('Vercel adapter error:', e);
      res.status(500).json({
        statusCode: 500,
        message: e instanceof Error ? e.message : '服务器内部错误',
        error: 'Internal Server Error',
      });
    }
  };
}
