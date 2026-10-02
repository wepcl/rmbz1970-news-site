import { defineHandler, json, HttpError, readBody } from '../../../../_lib/http';
import { getOperator, ensureCreator } from '../../../../_lib/auth';
import { getUserRow, mapUser } from '../../../../_lib/data';

/** 修改用户昵称（仅创建者）。 */
export const onRequestPost = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureCreator(op.raw.role);

  const targetId = ctx.params.userId as string;
  const target = await getUserRow(ctx.env.DB, targetId);
  if (!target) throw new HttpError(404, '用户不存在');

  const body = await readBody<{ displayName?: string }>(ctx.request);
  const displayName = (body.displayName || '').trim();
  if (!displayName) throw new HttpError(400, '昵称不能为空');

  await ctx.env.DB.prepare(`UPDATE news_user SET display_name = ? WHERE id = ?`)
    .bind(displayName, targetId)
    .run();

  const updated = await getUserRow(ctx.env.DB, targetId);
  return json(mapUser(updated as never));
});
