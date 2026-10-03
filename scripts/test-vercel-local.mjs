/**
 * 本地端到端测试：esbuild 打包后的 Vercel API 入口 + file: 本地数据库。
 * 用法：先 esbuild 打包到 .test-entry.mjs，再 node scripts/test-vercel-local.mjs
 */
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbFile = path.join(root, '.local-test.db');

// 清理旧库并重建
try { rmSync(dbFile); } catch {}
try { rmSync(dbFile + '-wal'); } catch {}
try { rmSync(dbFile + '-shm'); } catch {}
const client = createClient({ url: `file:${dbFile}` });
for (const file of ['0001_init.sql', '0002_seed.sql']) {
  const sql = readFileSync(path.join(root, 'migrations', file), 'utf8');
  await client.executeMultiple(sql);
}
client.close();
console.log('DB ready');

process.env.TURSO_DATABASE_URL = `file:${dbFile}`;
process.env.TURSO_AUTH_TOKEN = '';
const entryUrl = pathToFileURL(path.join(root, '.test-entry.mjs')).href;
const { default: handler } = await import(entryUrl);

function makeReq(method, urlPath, bodyObj, token) {
  const req = {
    method,
    url: urlPath,
    headers: {
      host: 'localhost',
      ...(bodyObj ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: bodyObj ? JSON.stringify(bodyObj) : undefined,
  };
  const res = {
    _status: 200, _headers: {}, _body: null,
    status(c) { this._status = c; return this; },
    setHeader(k, v) { this._headers[k] = v; return this; },
    json(o) { this._body = JSON.stringify(o); return this; },
    send(s) { this._body = s; return this; },
    getStatus() { return this._status; },
    getBody() { return this._body; },
  };
  return { req, res };
}

async function call(method, urlPath, bodyObj, token) {
  const { req, res } = makeReq(method, urlPath, bodyObj, token);
  await handler(req, res);
  return { status: res.getStatus(), body: res.getBody() };
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

// 1. 公开新闻列表
let r = await call('GET', '/api/news/articles?page=1&pageSize=5');
let data = JSON.parse(r.body);
assert('公开新闻列表', r.status === 200 && data.total >= 4, `status=${r.status} body=${r.body}`);

// 2. 分类
r = await call('GET', '/api/news/categories');
data = JSON.parse(r.body);
assert('分类列表', r.status === 200 && data.length === 5, `status=${r.status} body=${r.body}`);

// 3. 创建者登录
r = await call('POST', '/api/auth/login', { username: 'creator', password: 'admin123' });
data = JSON.parse(r.body);
assert('创建者登录', r.status === 200 && data.token, `status=${r.status} body=${r.body}`);
const creatorToken = data.token;

// 4. me
r = await call('GET', '/api/auth/me', null, creatorToken);
data = JSON.parse(r.body);
assert('me', r.status === 200 && data.role === 'creator', `status=${r.status} body=${r.body}`);

// 5. 读者注册（待审批）
r = await call('POST', '/api/auth/register', {
  username: 'reader_vc', password: 'reader123', displayName: '读者VC', role: 'reader',
});
data = JSON.parse(r.body);
assert('读者注册 pending', r.status === 200 && data.status === 'pending', `status=${r.status} body=${r.body}`);
const readerId = data.id;

// 6. 待审批读者登录被拒
r = await call('POST', '/api/auth/login', { username: 'reader_vc', password: 'reader123' });
assert('待审批登录被拒', r.status === 401 && r.body.includes('待审批'), `status=${r.status} body=${r.body}`);

// 7. 创建者批准
r = await call('POST', `/api/admin/registrations/${readerId}/approve`, null, creatorToken);
assert('创建者批准读者', r.status === 200 && JSON.parse(r.body).status === 'approved', `status=${r.status} body=${r.body}`);

// 8. 读者可登录
r = await call('POST', '/api/auth/login', { username: 'reader_vc', password: 'reader123' });
data = JSON.parse(r.body);
assert('读者登录成功', r.status === 200 && data.token, `status=${r.status} body=${r.body}`);
const readerToken = data.token;

// 9. 读者不能建新闻
r = await call('POST', '/api/news/articles', { title: 'x', content: 'y', categoryId: '11111111-1111-4111-8111-111111111101' }, readerToken);
assert('读者建新闻被拒', r.status === 401, `status=${r.status} body=${r.body}`);

// 10. 创建者直接发新闻 -> published
r = await call('POST', '/api/news/articles', {
  title: 'Vercel适配测试稿', summary: '测试', content: '正文内容',
  categoryId: '11111111-1111-4111-8111-111111111101',
}, creatorToken);
data = JSON.parse(r.body);
assert('创建者发稿直接发布', r.status === 200 && data.status === 'published', `status=${r.status} body=${r.body}`);
const artId = data.id;

// 11. 文章详情
r = await call('GET', `/api/news/articles/${artId}`);
data = JSON.parse(r.body);
assert('文章详情', r.status === 200 && data.title === 'Vercel适配测试稿', `status=${r.status} body=${r.body}`);

// 12. 封禁读者（自定义理由）
r = await call('POST', `/api/admin/users/${readerId}/ban`, { reason: '发布违规内容' }, creatorToken);
assert('创建者封禁读者', r.status === 200 && JSON.parse(r.body).status === 'banned', `status=${r.status} body=${r.body}`);

// 13. 被封登录显示理由
r = await call('POST', '/api/auth/login', { username: 'reader_vc', password: 'reader123' });
assert('被封登录显示理由', r.status === 401 && r.body.includes('发布违规内容'), `status=${r.status} body=${r.body}`);

// 14. 后台文章列表
r = await call('GET', '/api/admin/articles?page=1&pageSize=50', null, creatorToken);
data = JSON.parse(r.body);
assert('后台文章列表', r.status === 200 && data.total >= 5, `status=${r.status} body=${r.body}`);

// 15. 未登录访问后台被拒
r = await call('GET', '/api/admin/articles');
assert('未登录访问后台被拒', r.status === 401, `status=${r.status} body=${r.body}`);

// 16. 404 未知接口
r = await call('GET', '/api/unknown/xyz');
assert('未知接口 404', r.status === 404, `status=${r.status} body=${r.body}`);

console.log(failures === 0 ? '--- ALL PASS ---' : `--- ${failures} FAILURES ---`);
process.exit(failures === 0 ? 0 : 1);
