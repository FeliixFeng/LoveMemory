/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'https://lovexin.felixfeng.online/uploads/:path*'
      }
    ];
  }
};

export default nextConfig;
