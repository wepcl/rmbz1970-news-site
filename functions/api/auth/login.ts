import { defineHandler, json, HttpError, readBody } from '../../_lib/http';
import { verifyPassword, signToken } from '../../_lib/crypto';
import { getUserByUsername, mapUser } from '../../_lib/data';
import type { LoginRequest } from '@shared/api.interface';

export const onRequestPost = defineHandler(async (ctx) => {
  const body = await readBody<LoginRequest>(ctx.request);
  const username = (body.username || '').trim();
  const password = body.password || '';

  const row = await getUserByUsername(ctx.env.DB, username);
  if (!row) throw new HttpError(401, '用户名或密码错误');

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) throw new HttpError(401, '用户名或密码错误');

  if (row.status === 'pending') {
    throw new HttpError(401, '账号待审批，请等待管理员批准');
  }
  if (row.status === 'banned') {
    throw new HttpError(
      401,
      `账号已被封禁：${row.ban_reason || '违反网站规定'}`,
    );
  }
  if (row.status === 'rejected') {
    throw new HttpError(401, '注册申请已被拒绝');
  }

  const token = await signToken(row.id);
  return json({ user: mapUser(row), token });
});
