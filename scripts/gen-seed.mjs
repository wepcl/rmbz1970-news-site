/**
 * 生成 D1 种子数据 SQL（migrations/0002_seed.sql）：
 *  - 创建者账号 creator / admin123
 *  - 五个新闻分类
 *  - 四条已发布示例新闻
 * 用法：node scripts/gen-seed.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'migrations', '0002_seed.sql');

const { subtle } = globalThis.crypto;

function bytesToHex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(Buffer.alloc(16));
  const saltHex = bytesToHex(salt);
  const key = await subtle.importKey(
    'raw',
    Buffer.from(password, 'utf8'),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 10000, hash: 'SHA-512' },
    key,
    512,
  );
  return `${saltHex}.${bytesToHex(Buffer.from(bits))}`;
}

const CREATOR_ID = '00000000-0000-4000-8000-000000000001';
const CATS = [
  { id: '11111111-1111-4111-8111-111111111101', name: '头条新闻', slug: 'toutiao', sort: 1 },
  { id: '11111111-1111-4111-8111-111111111102', name: '国内新闻', slug: 'guonei', sort: 2 },
  { id: '11111111-1111-4111-8111-111111111103', name: '国际新闻', slug: 'guoji', sort: 3 },
  { id: '11111111-1111-4111-8111-111111111104', name: '校园新闻', slug: 'xiaoyuan', sort: 4 },
  { id: '11111111-1111-4111-8111-111111111105', name: '文化体育', slug: 'wenhua', sort: 5 },
];

const base = new Date('2026-10-01T08:00:00+08:00').getTime();

const ARTICLES = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    title: '复古新闻平台正式上线 重温古早互联网记忆',
    summary: '一个以蓝色高光按钮、报头大字与纸质排版为特色的新闻网站今日与读者见面。',
    category: CATS[0].id,
    offset: 0,
    content: `本报讯 今天，一座主打"古早互联网"风格的新闻平台正式上线。\n\n平台在视觉上还原了世纪之交网页的标志性元素：蓝色渐变高光按钮、立体描边边框、左上角的校徽报头，以及红色书法字体的大字报名，让老网民一眼梦回拨号上网的年代。\n\n在功能上，平台设有创建者、管理员与读者三类身份。读者注册需经管理员审批，管理员撰写的新闻则需创建者批准后方可发布。创建者拥有用户封禁、改名、删除以及新闻上下线的完整权限。\n\n平台采用 Cloudflare Pages 全球边缘网络托管，无需本地服务器即可 7×24 小时访问。`,
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    title: '校园秋季运动会圆满落幕 师生共展青春风采',
    summary: '为期两天的校秋季运动会顺利结束，多个项目刷新校纪录。',
    category: CATS[3].id,
    offset: 3600_000,
    content: `本报讯 为期两天的校园秋季运动会近日圆满落下帷幕。\n\n赛场上，运动员们奋勇争先，在短跑、跳远、接力等项目中激烈角逐，多个项目的校纪录被刷新。看台上，各班啦啦队的加油声此起彼伏，气氛热烈。\n\n主办方表示，本届运动会不仅锻炼了同学们的体魄，更增强了班级凝聚力，充分展现了新时代学子昂扬向上的精神风貌。`,
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    title: '数字阅读持续升温 纸质书与电子书各拥读者',
    summary: '最新调查显示，越来越多读者选择"纸电结合"的阅读方式。',
    category: CATS[4].id,
    offset: 7200_000,
    content: `本报讯 随着移动设备的普及，数字阅读近年来持续升温。\n\n一项面向读者的调查显示，超过六成受访者表示会同时阅读纸质书与电子书：通勤路上用手机或阅读器看书，回到家中则捧起纸质书细细品读。\n\n业内人士认为，纸质书与电子书并非替代关系，而是各有优势、互为补充，共同丰富着人们的精神文化生活。`,
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    title: '国际合作再添新成果 多国民众共享发展机遇',
    summary: '新一轮多边合作项目启动，覆盖教育、文化与科技等多个领域。',
    category: CATS[2].id,
    offset: 10800_000,
    content: `本报讯 近日，新一轮多边合作项目正式启动，来自多个国家的代表共同出席了启动仪式。\n\n据介绍，本轮合作涵盖教育交流、文化互鉴与科技创新等多个领域，将通过联合办学、展览互访、共建实验室等形式，让各国民众共享发展机遇。\n\n与会代表纷纷表示，将以此次合作为契机，进一步增进理解、深化友谊，推动构建更加紧密的合作关系。`,
  },
];

function sqlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

const lines = [];
lines.push('-- 种子数据（由 scripts/gen-seed.mjs 生成）');
lines.push('');

const creatorHash = await hashPassword('admin123');
lines.push('-- 创建者：creator / admin123');
lines.push(
  `INSERT INTO news_user (id, username, display_name, password_hash, role, status, created_at)
   VALUES (${sqlStr(CREATOR_ID)}, 'creator', '创建者', ${sqlStr(creatorHash)}, 'creator', 'approved', ${base});`,
);
lines.push('');

lines.push('-- 分类');
for (const c of CATS) {
  lines.push(
    `INSERT INTO news_category (id, name, slug, sort_order, created_at)
     VALUES (${sqlStr(c.id)}, ${sqlStr(c.name)}, ${sqlStr(c.slug)}, ${c.sort}, ${base});`,
  );
}
lines.push('');

lines.push('-- 示例新闻（均为已发布）');
for (const a of ARTICLES) {
  const ts = base + a.offset;
  lines.push(
    `INSERT INTO news_article
       (id, title, summary, content, cover_url, category_id, author_id,
        status, view_count, published_at, created_at)
     VALUES (${sqlStr(a.id)}, ${sqlStr(a.title)}, ${sqlStr(a.summary)},
       ${sqlStr(a.content)}, NULL, ${sqlStr(a.category)}, ${sqlStr(CREATOR_ID)},
       'published', 0, ${ts}, ${ts});`,
  );
}

writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('seed SQL written to:', outPath);
