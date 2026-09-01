/** @type {import('next').NextConfig} */

// The app is served from the custom domain at the domain root.
// Do not apply the repository /mt-coach basePath or assetPrefix.
const nextConfig = {
  output: 'export',
  trailingSlash: true,
};

module.exports = nextConfig;
