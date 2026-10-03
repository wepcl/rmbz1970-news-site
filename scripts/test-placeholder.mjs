/**
 * 验证 db.ts 的 `?` → `$N` 占位符转换逻辑。
 */
const src = `
function convertPlaceholders(sql) {
  let n = 0;
  return sql.replace(/\\?/g, () => \`$\${++n}\`);
}
`;
const fn = new Function(src + '\nreturn convertPlaceholders;')();

let failures = 0;
function eq(label, actual, expected) {
  if (actual !== expected) {
    failures++;
    console.error('FAIL', label, '\n  actual:  ', JSON.stringify(actual), '\n  expected:', JSON.stringify(expected));
  } else {
    console.log('OK  ', label);
  }
}

eq('单个占位符', fn('SELECT * FROM t WHERE id = ? LIMIT 1'), 'SELECT * FROM t WHERE id = $1 LIMIT 1');
eq('多个占位符', fn('VALUES (?, ?, ?)'), 'VALUES ($1, $2, $3)');
eq('重复使用', fn('WHERE a = ? AND b = ? ORDER BY c LIMIT ? OFFSET ?'), 'WHERE a = $1 AND b = $2 ORDER BY c LIMIT $3 OFFSET $4');
eq('无占位符', fn('SELECT 1'), 'SELECT 1');

// 真实 SQL 片段抽查（来自 data.ts）
eq(
  'articles 分页 SQL',
  fn('SELECT a.*, c.name AS category_name, u.display_name AS author_name FROM news_article a JOIN news_category c ON a.category_id = c.id JOIN news_user u ON a.author_id = u.id WHERE a.status = ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?'),
  'SELECT a.*, c.name AS category_name, u.display_name AS author_name FROM news_article a JOIN news_category c ON a.category_id = c.id JOIN news_user u ON a.author_id = u.id WHERE a.status = $1 ORDER BY a.created_at DESC LIMIT $2 OFFSET $3',
);
eq(
  '按 id 查询',
  fn('SELECT * FROM news_user WHERE id = ? LIMIT 1'),
  'SELECT * FROM news_user WHERE id = $1 LIMIT 1',
);

console.log(failures === 0 ? '--- PLACEHOLDER ALL PASS ---' : `--- ${failures} FAILURES ---`);
process.exit(failures === 0 ? 0 : 1);
