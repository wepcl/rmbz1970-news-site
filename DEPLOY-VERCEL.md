# rmbz1970 复古新闻平台 — Vercel 部署

一个「古早互联网」风格的新闻网站（客户端 + 管理后台），部署在 **Vercel**（免费托管 + 无服务器函数），数据库用 **Vercel 内置 Postgres / Neon**（免费）。

## 技术栈

- 前端：React + Vite + Tailwind（已构建到 `dist/`）
- 后端：Vercel Functions（`api/[...path].ts` 统一入口，复用 `functions/**` 全部路由逻辑）
- 数据库：PostgreSQL（Vercel Postgres 集成 / Neon），首次请求自动建表 + 种子数据

## 一键部署

1. 登录 [vercel.com](https://vercel.com)（可用 GitHub 账号登录）
2. **Import Project → GitHub** → 选择仓库 `wepcl/rmbz1970-news-site`
3. Framework Preset 选择 **Vite**（`build command: npm run build`，`output: dist`）
4. **Storage → Create Database → Vercel Postgres**（免费，自动注入 `POSTGRES_URL` 环境变量）
5. Deploy

部署完成后无需任何迁移操作：数据库第一次被请求时会自动创建表结构和种子数据（创建者账号 `creator` / 密码 `admin123`）。

## 本地开发

```bash
npm install
npm run dev        # 前端开发服务器
npm run build      # 构建前端
```

## 本地验证（无需真实数据库）

```bash
# 1. PG SQL 语法验证（pglite WASM）
npm run test:pg-sql

# 2. 占位符转换验证
npm run test:placeholder
```

## 域名绑定（rmbz1970.en.cc）

在 Vercel 项目 **Settings → Domains** 中添加 `rmbz1970.en.cc`，按提示在域名注册商处添加 CNAME 记录：
`rmbz1970.en.cc` → `cname.vercel-dns.com`

## 角色说明

| 角色 | 权限 |
|---|---|
| 创建者 | 批准注册、封禁/改名/删除用户与管理员、批准/驳回/下线新闻、直接发布新闻 |
| 管理员 | 批准读者注册、撰写新闻（需创建者批准，待批稿件在草稿箱） |
| 读者 | 浏览新闻，注册后经批准可登录 |

默认创建者：用户名 `creator`，密码 `admin123`（部署后请立即在后台修改）。
