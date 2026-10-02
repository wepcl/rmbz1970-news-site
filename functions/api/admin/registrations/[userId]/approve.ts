import { defineHandler, json, HttpError } from '../../../../_lib/http';
import { getOperator, ensureAdmin } from '../../../../_lib/auth';
import { getUserRow, mapUser } from '../../../../_lib/data';

/** 批准注册申请。 */
export const onRequestPost = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureAdmin(op.raw.role);

  const targetId = ctx.params.userId as string;
  const target = await getUserRow(ctx.env.DB, targetId);
  if (!target) throw new HttpError(404, '用户不存在');
  if (target.status !== 'pending')
    throw new HttpError(400, '该用户状态不是待审批');
  if (op.raw.role === 'admin' && target.role === 'admin') {
    throw new HttpError(403, '管理员不能批准其他管理员注册');
  }

  await ctx.env.DB.prepare(
    `UPDATE news_user SET status = 'approved', approved_by = ?, approved_at = ?
     WHERE id = ?`,
  )
    .bind(op.raw.id, Date.now(), targetId)
    .run();

  const updated = await getUserRow(ctx.env.DB, targetId);
  return json(mapUser(updated as never));
});
