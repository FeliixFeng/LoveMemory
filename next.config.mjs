/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // 针对 2核2G 部署机限制并发与 Webpack 峰值内存，防止编译阶段写爆 Swap
    cpus: 1,
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
  },
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
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      }] : []),
    ];
  },
};

export default nextConfig;
