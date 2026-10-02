/** 从请求中解析当前操作者并校验账号可用。 */
import type { EventContext } from '@cloudflare/workers-types';
import { HttpError } from './http';
import { verifyToken } from './crypto';
import { getUserRow, mapUser, type UserRow } from './data';
import type { NewsUser } from '@shared/api.interface';
import type { Env } from './env';

type Ctx = EventContext<Env, string, unknown>;

export interface Operator {
  raw: UserRow;
  user: NewsUser;
}

export async function getOperator(ctx: Ctx): Promise<Operator> {
  const header = ctx.request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, '未登录');
  }
  const token = header.slice(7);
  const userId = await verifyToken(token);
  if (!userId) {
    throw new HttpError(401, '登录已过期');
  }
  const raw = await getUserRow(ctx.env.DB, userId);
  if (!raw) {
    throw new HttpError(401, '用户不存在');
  }
  if (raw.status !== 'approved') {
    throw new HttpError(401, '账号不可用');
  }
  return { raw, user: mapUser(raw) };
}

export function ensureAdmin(role: string): void {
  if (role !== 'creator' && role !== 'admin') {
    throw new HttpError(403, '无管理权限');
  }
}

export function ensureCreator(role: string): void {
  if (role !== 'creator') {
    throw new HttpError(403, '仅创建者可执行此操作');
  }
}
