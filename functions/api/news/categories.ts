import { defineHandler, json } from '../../_lib/http';

export const onRequestGet = defineHandler(async (ctx) => {
  const { results } = await ctx.env.DB.prepare(
    `SELECT id, name, slug FROM news_category
     ORDER BY sort_order ASC, created_at ASC`,
  ).all();
  return json(results);
});
