import OSS from 'ali-oss';

const region = process.env.OSS_REGION || '';
const accessKeyId = process.env.OSS_ACCESS_KEY_ID || '';
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET || '';
const bucket = process.env.OSS_BUCKET || '';
const endpoint = process.env.OSS_ENDPOINT || '';

let client: OSS | null = null;

export function getOssClient(): OSS | null {
  if (!region || !accessKeyId || !accessKeySecret || !bucket) {
    return null;
  }

  if (!client) {
    client = new OSS({
      region,
      accessKeyId,
      accessKeySecret,
      bucket,
      endpoint,
      secure: true
    });
  }

  return client;
}

export function getOssUrl(filename: string): string {
  return `https://${bucket}.${region}.aliyuncs.com/${filename}`;
}

export async function uploadToOss(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ossClient = getOssClient();
  if (!ossClient) {
    throw new Error('OSS not configured');
  }

  await ossClient.put(filename, buffer, {
    headers: { 'Content-Type': mimeType }
  });

  return getOssUrl(filename);
}

export async function deleteFromOss(filename: string): Promise<void> {
  const ossClient = getOssClient();
  if (!ossClient) {
    throw new Error('OSS not configured');
  }

  await ossClient.delete(filename);
}
