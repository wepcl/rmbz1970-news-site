// 把 functions/** 中 '@shared/api.interface' 别名替换为相对路径，
// 保证 Vercel 函数构建（不解析 tsconfig paths）能解析。
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const funcDir = path.join(root, 'functions');

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.ts')) files.push(p);
  }
}
walk(funcDir);

let changed = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes('@shared/api.interface')) continue;
  // 计算从 file 到 root/shared/api.interface 的相对路径
  const rel = path.relative(path.dirname(file), path.join(root, 'shared', 'api.interface'));
  const relPosix = rel.split(path.sep).join('/').replace(/\.ts$/, '');
  const next = text.replace(/'@shared\/api\.interface'/g, `'${relPosix}'`);
  if (next !== text) {
    writeFileSync(file, next, 'utf8');
    changed++;
    console.log('fixed:', path.relative(root, file), '->', relPosix);
  }
}
console.log('changed files:', changed);
