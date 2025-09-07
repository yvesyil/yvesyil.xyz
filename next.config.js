/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async rewrites() {
    return [
      {
        source: '/fonts/:path*',
        destination: '/public/fonts/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
