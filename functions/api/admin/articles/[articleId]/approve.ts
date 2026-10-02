import { defineHandler, json, HttpError } from '../../../../_lib/http';
import { getOperator, ensureCreator } from '../../../../_lib/auth';
import { getArticleRow, mapArticle } from '../../../../_lib/data';

/** 批准新闻（仅创建者）：状态变为已发布。 */
export const onRequestPost = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureCreator(op.raw.role);

  const articleId = ctx.params.articleId as string;
  const row = await getArticleRow(ctx.env.DB, articleId);
  if (!row) throw new HttpError(404, '文章不存在');
  if (row.status !== 'pending_approval') {
    throw new HttpError(400, '该文章状态不是待审批');
  }

  const now = Date.now();
  await ctx.env.DB.prepare(
    `UPDATE news_article
       SET status = 'published', approved_by = ?, approved_at = ?,
           published_at = ?
     WHERE id = ?`,
  )
    .bind(op.raw.id, now, now, articleId)
    .run();

  const updated = await getArticleRow(ctx.env.DB, articleId);
  return json(mapArticle(updated as never));
});
