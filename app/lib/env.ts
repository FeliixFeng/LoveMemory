import path from 'node:path';

export function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');
}

export function getPin() {
  return process.env.APP_PIN || '';
}

let secretFallbackWarned = false;

export function getAppSecret(): string {
  const secret = process.env.APP_SECRET;
  if (secret) return secret;
  const pin = getPin();
  if (pin && !secretFallbackWarned && process.env.NODE_ENV !== 'test') {
    secretFallbackWarned = true;
    console.warn('[auth] APP_SECRET 未配置，正在回退使用 PIN 作为 token 签名密钥——请尽快配置 APP_SECRET（随机长字符串）');
  }
  return pin;
}
