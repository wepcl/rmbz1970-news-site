/**
 * 本地日志封装，替代平台 logger。
 * 生产环境下 debug 不输出。
 */
const isDev = import.meta.env.DEV;

export const logger = {
  debug(...args: unknown[]): void {
    if (isDev) console.debug('[debug]', ...args);
  },
  info(...args: unknown[]): void {
    console.info('[info]', ...args);
  },
  warn(...args: unknown[]): void {
    console.warn('[warn]', ...args);
  },
  error(...args: unknown[]): void {
    console.error('[error]', ...args);
  },
};

export type Logger = typeof logger;
