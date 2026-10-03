/**
 * PostgreSQL 兼容 D1 风格的 prepare/bind/all/first/run API。
 * 使 functions/_lib/* 的代码无需改动即可在 Vercel + Neon (Postgres) 上运行。
 *
 * 特性：
 * - `?` 占位符自动转为 PostgreSQL 的 $1/$2...
 * - BIGINT (int8) 自动转 number（时间戳、浏览量）
 * - 首次连接自动执行建表 + 种子（幂等）
 */
import { Pool, types } from 'pg';
import { SCHEMA_SQL, SEED_SQL } from './schema';

// int8 → number（毫秒时间戳约 1.7e12 < Number.MAX_SAFE_INTEGER，安全）
types.setTypeParser(20, (v) => Number(v));

function convertPlaceholders(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

export class PgD1 {
  private pool: Pool;
  private initPromise: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }

  prepare(sql: string): PgStatement {
    return new PgStatement(this, sql);
  }

  /** 确保表结构与种子数据已初始化（幂等）。 */
  async ensureInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doInit().catch((e) => {
        this.initPromise = null;
        throw e;
      });
    }
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    const res = await this.pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'news_user'`,
    );
    if (res.rowCount && res.rowCount > 0) return;
    await this.pool.query(SCHEMA_SQL);
    await this.pool.query(SEED_SQL);
  }

  async query(text: string, values: unknown[] = []) {
    return this.pool.query({ text, values });
  }
}

class PgStatement {
  private args: unknown[] = [];

  constructor(
    private db: PgD1,
    private sql: string,
  ) {}

  bind(...values: unknown[]): this {
    this.args = values.map((v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'bigint') return Number(v);
      return v;
    });
    return this;
  }

  private async exec<T>(): Promise<{ rows: T[]; rowCount: number | null }> {
    await this.db.ensureInit();
    const text = convertPlaceholders(this.sql);
    const res = await this.db.query(text, this.args);
    return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const { rows } = await this.exec<T>();
    return { results: rows };
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const { rows } = await this.exec<T>();
    return rows.length > 0 ? rows[0] : null;
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const { rowCount } = await this.exec();
    return { meta: { changes: rowCount ?? 0 } };
  }
}
