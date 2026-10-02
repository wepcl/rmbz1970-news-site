-- 古早新闻平台 D1 (SQLite) 初始化结构

CREATE TABLE IF NOT EXISTS news_user (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('creator', 'admin', 'reader')),
  status        TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'banned', 'rejected')),
  ban_reason    TEXT,
  approved_by   TEXT,
  approved_at   INTEGER,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_news_user_status ON news_user(status);
CREATE INDEX IF NOT EXISTS idx_news_user_role ON news_user(role);

CREATE TABLE IF NOT EXISTS news_category (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS news_article (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  summary       TEXT,
  content       TEXT NOT NULL,
  cover_url     TEXT,
  category_id   TEXT NOT NULL,
  author_id     TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'published', 'rejected', 'offline')),
  view_count    INTEGER NOT NULL DEFAULT 0,
  approved_by   TEXT,
  approved_at   INTEGER,
  published_at  INTEGER,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_news_article_status ON news_article(status);
CREATE INDEX IF NOT EXISTS idx_news_article_category ON news_article(category_id);
CREATE INDEX IF NOT EXISTS idx_news_article_author ON news_article(author_id);
