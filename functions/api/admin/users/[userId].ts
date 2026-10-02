import { defineHandler, HttpError } from '../../../_lib/http';
import { getOperator, ensureCreator } from '../../../_lib/auth';
import { getUserRow } from '../../../_lib/data';

/** 删除用户（仅创建者）；其名下文章转交创建者。 */
export const onRequestDelete = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureCreator(op.raw.role);

  const targetId = ctx.params.userId as string;
  const target = await getUserRow(ctx.env.DB, targetId);
  if (!target) throw new HttpError(404, '用户不存在');
  if (target.role === 'creator') {
    throw new HttpError(400, '不能删除创建者');
  }

  const creator = await ctx.env.DB.prepare(
    `SELECT id FROM news_user WHERE role = 'creator' LIMIT 1`,
  ).first<{ id: string }>();

  await ctx.env.DB.prepare(
    `UPDATE news_article SET author_id = ? WHERE author_id = ?`,
  )
    .bind(creator?.id ?? op.raw.id, targetId)
    .run();

  await ctx.env.DB.prepare(`DELETE FROM news_user WHERE id = ?`)
    .bind(targetId)
    .run();

  return new Response(null, { status: 204 });
});
