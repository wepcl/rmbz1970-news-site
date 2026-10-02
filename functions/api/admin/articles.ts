import { defineHandler, json } from '../../_lib/http';
import { getOperator, ensureAdmin } from '../../_lib/auth';
import { queryArticles } from '../../_lib/data';

/** 全部文章列表（可按状态、分类筛选）。 */
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

  let status = url.searchParams.get('status');
  const categoryId = url.searchParams.get('categoryId');

  if (status === 'draft' && op.raw.role === 'admin') {
    // 管理员的“草稿”= 本人已提交、待创建者批准的稿件
    status = 'pending_approval';
    clauses.push('a.author_id = ?');
    bindings.push(op.raw.id);
  }

  if (status) { clauses.push('a.status = ?'); bindings.push(status); }
  if (categoryId) { clauses.push('a.category_id = ?'); bindings.push(categoryId); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const result = await queryArticles(ctx.env.DB, {
    whereSql: where,
    bindings,
    page,
    pageSize,
  });
  return json(result);
});
