/**
 * 使用 Web Crypto 复刻原平台的口令哈希与令牌签名算法：
 * - 口令：PBKDF2(SHA-512, 10000 次, 64 字节) → hex，库存格式 salt.hash
 * - 令牌：base64(JSON{userId,ts}) + '.' + HMAC-SHA256(secret) 的 hex
 */
import { bytesToHex, hexToBytes, timingSafeEqual } from './hex';

const PBKDF2_ITERATIONS = 10000;
const HASH_BYTES = 64;
const TOKEN_SECRET = 'news-site-secret-key';

const encoder = new TextEncoder();

async function pbkdf2Hex(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-512',
    },
    keyMaterial,
    HASH_BYTES * 8,
  );
  return bytesToHex(new Uint8Array(derived));
}

/** 生成可存储的口令哈希：saltHex.hashHex */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(salt);
  const hashHex = await pbkdf2Hex(password, saltHex);
  return `${saltHex}.${hashHex}`;
}

/** 校验口令是否匹配存储值。 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const dot = stored.indexOf('.');
  if (dot < 0) return false;
  const saltHex = stored.slice(0, dot);
  const hashHex = stored.slice(dot + 1);
  if (!saltHex || !hashHex) return false;
  const computed = await pbkdf2Hex(password, saltHex);
  return timingSafeEqual(computed, hashHex);
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message),
  );
  return bytesToHex(new Uint8Array(signature));
}

/** 为用户签发登录令牌。 */
export async function signToken(userId: string): Promise<string> {
  const payload = btoa(JSON.stringify({ userId, ts: Date.now() }));
  const signature = await hmacHex(payload);
  return `${payload}.${signature}`;
}

/** 校验令牌，返回 userId；无效返回 null。 */
export async function verifyToken(token: string): Promise<string | null> {
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!payload || !signature) return null;
  const expected = await hmacHex(payload);
  if (!timingSafeEqual(expected, signature)) return null;
  try {
    const data = JSON.parse(atob(payload)) as { userId?: string };
    return data.userId ?? null;
  } catch {
    return null;
  }
}
