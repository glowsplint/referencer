/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      '@emotion/react': '@emotion/react',
      '@emotion/styled': '@emotion/styled',
      '@emotion/cache': '@emotion/cache',
    },
  },
};

module.exports = nextConfig;
