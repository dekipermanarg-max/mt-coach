/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  ...(isGithubPages ? { basePath: '/mt-coach', assetPrefix: '/mt-coach/' } : {}),
};

module.exports = nextConfig;
