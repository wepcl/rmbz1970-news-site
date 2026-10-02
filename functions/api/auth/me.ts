import { defineHandler, json } from '../../_lib/http';
import { getOperator } from '../../_lib/auth';

export const onRequestGet = defineHandler(async (ctx) => {
  const { user } = await getOperator(ctx);
  return json(user);
});
