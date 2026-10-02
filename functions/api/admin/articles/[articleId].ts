import { defineHandler, HttpError } from '../../../_lib/http';
import { getOperator, ensureCreator } from '../../../_lib/auth';
import { getArticleRow } from '../../../_lib/data';

/** 删除文章（仅创建者）。 */
export const onRequestDelete = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureCreator(op.raw.role);

  const articleId = ctx.params.articleId as string;
  const row = await getArticleRow(ctx.env.DB, articleId);
  if (!row) throw new HttpError(404, '文章不存在');

  await ctx.env.DB.prepare(`DELETE FROM news_article WHERE id = ?`)
    .bind(articleId)
    .run();

  return new Response(null, { status: 204 });
});
