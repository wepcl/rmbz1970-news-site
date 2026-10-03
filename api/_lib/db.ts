/**
 * Turso (libSQL) 兼容 D1 风格的 prepare/bind/all/first/run API。
 * 使 functions/_lib/* 的代码无需改动即可在 Vercel 上运行。
 */
import { createClient, type Client, type InValue } from '@libsql/client';

export class TursoD1 {
  private client: Client;

  constructor(url: string, authToken?: string) {
    this.client = createClient({ url, authToken });
  }

  prepare(sql: string): TursoStatement {
    return new TursoStatement(this.client, sql);
  }
}

class TursoStatement {
  private args: InValue[] = [];

  constructor(
    private client: Client,
    private sql: string,
  ) {}

  bind(...values: unknown[]): this {
    this.args = values.map((v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v as InValue;
    });
    return this;
  }

  /** 返回所有行（对象数组）。 */
  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const res = await this.client.execute({ sql: this.sql, args: this.args });
    const results = (res.rows ?? []).map((r) => {
      const obj: Record<string, unknown> = {};
      for (const key of Object.keys(r)) {
        const v = r[key];
        // libSQL 对整数可能返回 bigint，统一转 number 避免 JSON 序列化报错
        obj[key] = typeof v === 'bigint' ? Number(v) : v;
      }
      return obj as unknown as T;
    });
    return { results };
  }

  /** 返回第一行或 null。 */
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const { results } = await this.all<T>();
    return results.length > 0 ? results[0] : null;
  }

  /** 执行写入，返回变更行数。 */
  async run(): Promise<{ meta: { changes: number } }> {
    const res = await this.client.execute({ sql: this.sql, args: this.args });
    return { meta: { changes: Number(res.rowsAffected ?? 0) } };
  }
}
