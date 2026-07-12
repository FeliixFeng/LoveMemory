/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lovememory.oss-cn-wuhan-lr.aliyuncs.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      // dev 模式下禁用浏览器缓存
      ...(process.env.NODE_ENV !== 'production' ? [{
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      }] : []),
    ];
  },
};

export default nextConfig;
