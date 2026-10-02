import { defineHandler, json, HttpError, readBody } from '../../_lib/http';
import { hashPassword } from '../../_lib/crypto';
import { getUserByUsername } from '../../_lib/data';
import type { RegisterRequest } from '@shared/api.interface';

export const onRequestPost = defineHandler(async (ctx) => {
  const body = await readBody<RegisterRequest>(ctx.request);
  const username = (body.username || '').trim();
  const password = body.password || '';
  const displayName = (body.displayName || '').trim();
  const role = body.role === 'admin' ? 'admin' : 'reader';

  if (!username) throw new HttpError(400, '用户名不能为空');
  if (!password) throw new HttpError(400, '密码不能为空');
  if (!displayName) throw new HttpError(400, '昵称不能为空');

  const existing = await getUserByUsername(ctx.env.DB, username);
  if (existing) throw new HttpError(400, '用户名已存在');

  const id = crypto.randomUUID();
  const now = Date.now();
  const passwordHash = await hashPassword(password);

  await ctx.env.DB.prepare(
    `INSERT INTO news_user
       (id, username, display_name, password_hash, role, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, username, displayName, passwordHash, role, 'pending', now)
    .run();

  return json({ id, username, status: 'pending' });
});
