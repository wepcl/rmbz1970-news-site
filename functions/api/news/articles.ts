import { defineHandler, json, HttpError, readBody } from '../../_lib/http';
import { queryArticles, getArticleRow, mapArticle } from '../../_lib/data';
import { getOperator } from '../../_lib/auth';
import type { CreateArticleRequest } from '@shared/api.interface';

function paging(url: URL): { page: number; pageSize: number } {
  let page = parseInt(url.searchParams.get('page') || '1', 10);
  let pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 10;
  if (pageSize > 100) pageSize = 100;
  return { page, pageSize };
}

/** 已发布新闻列表（可按分类筛选）。 */
export const onRequestGet = defineHandler(async (ctx) => {
  const url = new URL(ctx.request.url);
  const { page, pageSize } = paging(url);
  const categoryId = url.searchParams.get('categoryId');

  const where = ['WHERE a.status = ?'];
  const bindings: unknown[] = ['published'];
  if (categoryId) {
    where.push('a.category_id = ?');
    bindings.push(categoryId);
  }

  const result = await queryArticles(ctx.env.DB, {
    whereSql: where.join(' AND '),
    bindings,
    page,
    pageSize,
  });
  return json(result);
});

/** 创建新闻：创建者直接发布；管理员进入待审批。 */
export const onRequestPost = defineHandler(async (ctx) => {
  const { raw } = await getOperator(ctx);
  if (raw.role !== 'creator' && raw.role !== 'admin') {
    throw new HttpError(401, '无权限创建新闻');
  }

  const body = await readBody<CreateArticleRequest>(ctx.request);
  const title = (body.title || '').trim();
  const content = body.content || '';
  const categoryId = body.categoryId || '';
  if (!title) throw new HttpError(400, '标题不能为空');
  if (!content) throw new HttpError(400, '内容不能为空');
  if (!categoryId) throw new HttpError(400, '请选择分类');

  const isCreator = raw.role === 'creator';
  const status = isCreator ? 'published' : 'pending_approval';
  const id = crypto.randomUUID();
  const now = Date.now();
  const publishedAt = isCreator ? now : null;

  await ctx.env.DB.prepare(
    `INSERT INTO news_article
       (id, title, summary, content, cover_url, category_id, author_id,
        status, view_count, published_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      title,
      body.summary ? body.summary.trim() : null,
      content,
      body.coverUrl || null,
      categoryId,
      raw.id,
      status,
      0,
      publishedAt,
      now,
    )
    .run();

  const row = await getArticleRow(ctx.env.DB, id);
  return json(mapArticle(row as never));
});
