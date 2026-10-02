import { defineHandler, json, HttpError } from '../../../_lib/http';
import { getArticleRow, mapArticle } from '../../../_lib/data';

/** 文章详情，读取时浏览量 +1。 */
export const onRequestGet = defineHandler(async (ctx) => {
  const id = ctx.params.id as string;
  const row = await getArticleRow(ctx.env.DB, id);
  if (!row) throw new HttpError(404, '文章不存在');

  await ctx.env.DB.prepare(
    `UPDATE news_article SET view_count = view_count + 1 WHERE id = ?`,
  )
    .bind(id)
    .run();

  row.view_count += 1;
  return json(mapArticle(row));
});
