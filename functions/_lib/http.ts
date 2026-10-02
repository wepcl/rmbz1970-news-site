/** HTTP 响应与错误处理工具。 */
import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from './env';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

type Ctx = EventContext<Env, string, unknown>;
type Handler = (ctx: Ctx) => Promise<Response>;

/** 统一捕获异常并映射为 NestJS 风格的 JSON 错误体。 */
export function defineHandler(handler: Handler) {
  return async (ctx: Ctx): Promise<Response> => {
    try {
      return await handler(ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return json(
          { statusCode: e.status, message: e.message, error: errorName(e.status) },
          e.status,
        );
      }
      console.error('Unhandled error:', e);
      const message = e instanceof Error ? e.message : '服务器内部错误';
      return json({ statusCode: 500, message, error: 'Internal Server Error' }, 500);
    }
  };
}

function errorName(status: number): string {
  switch (status) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    default: return 'Error';
  }
}

/** 读取并解析 JSON 请求体，失败返回空对象。 */
export async function readBody<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}
