import { defineHandler, json, HttpError, readBody } from '../../../../_lib/http';
import { getOperator, ensureAdmin } from '../../../../_lib/auth';
import { getUserRow, mapUser } from '../../../../_lib/data';

/** 拒绝注册申请（可自定义理由）。 */
export const onRequestPost = defineHandler(async (ctx) => {
  const op = await getOperator(ctx);
  ensureAdmin(op.raw.role);

  const targetId = ctx.params.userId as string;
  const target = await getUserRow(ctx.env.DB, targetId);
  if (!target) throw new HttpError(404, '用户不存在');
  if (target.status !== 'pending')
    throw new HttpError(400, '该用户状态不是待审批');
  if (op.raw.role === 'admin' && target.role === 'admin') {
    throw new HttpError(403, '管理员不能拒绝其他管理员注册');
  }

  const body = await readBody<{ reason?: string }>(ctx.request);
  const reason = (body.reason || '').trim() || '注册申请未通过';

  await ctx.env.DB.prepare(
    `UPDATE news_user SET status = 'rejected', ban_reason = ? WHERE id = ?`,
  )
    .bind(reason, targetId)
    .run();

  const updated = await getUserRow(ctx.env.DB, targetId);
  return json(mapUser(updated as never));
});
