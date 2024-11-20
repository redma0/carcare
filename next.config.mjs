// next.config.mjs (in project root, same level as package.json)
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("pg", "bcryptjs", "jsonwebtoken");
    }
    return config;
  },
};

export default nextConfig;
