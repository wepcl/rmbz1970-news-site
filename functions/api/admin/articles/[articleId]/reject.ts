import { defineHandler, json, HttpError } from '../../../../_lib/http';
import { getOperator, ensureCreator } from '../../../../_lib/auth';
import { getArticleRow, mapArticle } from '../../../../_lib/data';

/** 驳回新闻（仅创建者）：状态变为 rejected，留在管理员草稿箱视角之外。 */
export const onRequestPost = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureCreator(op.raw.role);

  const articleId = ctx.params.articleId as string;
  const row = await getArticleRow(ctx.env.DB, articleId);
  if (!row) throw new HttpError(404, '文章不存在');

  await ctx.env.DB.prepare(
    `UPDATE news_article SET status = 'rejected' WHERE id = ?`,
  )
    .bind(articleId)
    .run();

  const updated = await getArticleRow(ctx.env.DB, articleId);
  return json(mapArticle(updated as never));
});
