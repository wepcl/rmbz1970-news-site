/** 十六进制与字节数组转换、恒定时间比较（无第三方依赖，Workers 可用）。 */

const HEX = '0123456789abcdef';

export function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out += HEX[b >> 4] + HEX[b & 0x0f];
  }
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  const len = hex.length >> 1;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

/** 恒定时间字符串比较，避免计时侧信道。 */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) {
    // 仍完成一次比较流程，避免提前返回泄露长度
    let diff = 1;
    const max = Math.max(ab.length, bb.length);
    for (let i = 0; i < max; i++) {
      diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
    }
    return diff === 0;
  }
  let diff = 0;
  for (let i = 0; i < ab.length; i++) {
    diff |= ab[i] ^ bb[i];
  }
  return diff === 0;
}
