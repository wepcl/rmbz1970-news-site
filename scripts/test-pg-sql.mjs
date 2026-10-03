/**
 * 用 pglite（WASM PostgreSQL）验证 schema 与种子 SQL 的语法正确性，
 * 同时跑一轮关键查询，确认 PG 迁移没有语法问题。
 */
import { PGlite } from '@electric-sql/pglite';
import { SCHEMA_SQL, SEED_SQL } from '../api/_lib/schema.ts';

const db = new PGlite();

async function run(sql) {
  const r = await db.exec(sql);
  return r;
}

let failures = 0;
function assert(label, cond, detail) {
  if (!cond) {
    failures++;
    console.error('FAIL', label, detail ?? '');
  } else {
    console.log('OK  ', label);
  }
}

// 1. 建表
await run(SCHEMA_SQL);
console.log('schema executed');

// 2. 种子
await run(SEED_SQL);
console.log('seed executed');

// 3. 表存在且行数正确
let r = await db.query('SELECT COUNT(*)::int AS n FROM news_user');
assert('创建者存在', r.rows[0].n === 1, JSON.stringify(r.rows));
r = await db.query('SELECT COUNT(*)::int AS n FROM news_category');
assert('分类 5 个', r.rows[0].n === 5, JSON.stringify(r.rows));
r = await db.query('SELECT COUNT(*)::int AS n FROM news_article');
assert('文章 4 篇', r.rows[0].n === 4, JSON.stringify(r.rows));

// 4. 模拟 D1 SQL（? 占位符转 $N 后）查询
// 直接写转换后的语句验证（转换逻辑在 db.ts 中，pglite 只验证语法）
r = await db.query('SELECT * FROM news_user WHERE username = $1 LIMIT 1', ['creator']);
assert('按用户名查询', r.rows.length === 1 && r.rows[0].role === 'creator');

// 5. 分页 + 参数
r = await db.query(
  `SELECT a.id, a.title FROM news_article a WHERE a.status = $1 ORDER BY a.created_at DESC LIMIT $2 OFFSET $3`,
  ['published', 2, 0],
);
assert('分页查询', r.rows.length === 2);

// 6. 时间戳为 BIGINT，可存毫秒
await db.query(
  'INSERT INTO news_category (id, name, slug, sort_order, created_at) VALUES ($1,$2,$3,$4,$5)',
  ['99999999-9999-4999-8999-999999999999', '测试', 'test', 99, 1790812800000],
);
r = await db.query("SELECT created_at::text AS t FROM news_category WHERE slug='test'");
assert('毫秒时间戳可存', r.rows[0].t === '1790812800000', JSON.stringify(r.rows));

// 7. 幂等：重复种子不报错
try {
  await run(SEED_SQL);
  assert('种子幂等（ON CONFLICT）', true);
} catch (e) {
  assert('种子幂等（ON CONFLICT）', false, e.message);
}

console.log(failures === 0 ? '--- PG SQL ALL PASS ---' : `--- ${failures} FAILURES ---`);
process.exit(failures === 0 ? 0 : 1);
