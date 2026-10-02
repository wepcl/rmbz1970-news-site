import { defineHandler, json, HttpError, readBody } from '../../../../_lib/http';
import { getOperator } from '../../../../_lib/auth';
import { getUserRow, mapUser } from '../../../../_lib/data';

/** 封禁用户（可自定义理由）。创建者可封管理员/读者；管理员只能封读者。 */
export const onRequestPost = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  const targetId = ctx.params.userId as string;
  const target = await getUserRow(ctx.env.DB, targetId);
  if (!target) throw new HttpError(404, '用户不存在');

  if (target.role === 'creator') {
    throw new HttpError(403, '不能封禁创建者');
  }
  if (op.raw.role === 'admin') {
    if (target.role === 'admin') {
      throw new HttpError(403, '管理员不能封禁其他管理员');
    }
  } else if (op.raw.role !== 'creator') {
    throw new HttpError(403, '无封禁权限');
  }

  const body = await readBody<{ reason?: string }>(ctx.request);
  const reason = (body.reason || '').trim() || '违反网站规定';

  await ctx.env.DB.prepare(
    `UPDATE news_user SET status = 'banned', ban_reason = ? WHERE id = ?`,
  )
    .bind(reason, targetId)
    .run();

  const updated = await getUserRow(ctx.env.DB, targetId);
  return json(mapUser(updated as never));
});
