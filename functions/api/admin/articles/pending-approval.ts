import { defineHandler, json } from '../../../_lib/http';
import { getOperator, ensureAdmin } from '../../../_lib/auth';
import { queryArticles } from '../../../_lib/data';

/**
 * 待审批 / 草稿箱：
 * - 创建者：看全部 pending_approval（各管理员提交、待创建者批准）
 * - 管理员：看本人 pending_approval（已提交、尚未被创建者批准，即其草稿箱）
 */
export const onRequestGet = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureAdmin(op.raw.role);

  const url = new URL(ctx.request.url);
  let page = parseInt(url.searchParams.get('page') || '1', 10);
  let pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;

  const clauses = ['a.status = ?'];
  const bindings: unknown[] = ['pending_approval'];
  if (op.raw.role !== 'creator') {
    clauses.push('a.author_id = ?');
    bindings.push(op.raw.id);
  }

  const categoryId = url.searchParams.get('categoryId');
  if (categoryId) { clauses.push('a.category_id = ?'); bindings.push(categoryId); }

  const result = await queryArticles(ctx.env.DB, {
    whereSql: `WHERE ${clauses.join(' AND ')}`,
    bindings,
    page,
    pageSize,
  });
  return json(result);
});
