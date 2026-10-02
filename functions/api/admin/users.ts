import { defineHandler, json } from '../../_lib/http';
import { getOperator, ensureAdmin } from '../../_lib/auth';
import { mapUser, type UserRow } from '../../_lib/data';

/** 用户列表（可按状态、角色筛选）。 */
export const onRequestGet = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureAdmin(op.raw.role);

  const url = new URL(ctx.request.url);
  let page = parseInt(url.searchParams.get('page') || '1', 10);
  let pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;

  const clauses: string[] = [];
  const bindings: unknown[] = [];
  const status = url.searchParams.get('status');
  const role = url.searchParams.get('role');
  if (status) { clauses.push('status = ?'); bindings.push(status); }
  if (role) { clauses.push('role = ?'); bindings.push(role); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const countRow = await ctx.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM news_user ${where}`,
  )
    .bind(...bindings)
    .first<{ n: number }>();
  const total = Number(countRow?.n ?? 0);

  const { results } = await ctx.env.DB.prepare(
    `SELECT * FROM news_user ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(...bindings, pageSize, (page - 1) * pageSize)
    .all<UserRow>();

  return json({
    items: (results ?? []).map(mapUser),
    total,
    page,
    pageSize,
  });
});
