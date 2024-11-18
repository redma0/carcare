// next.config.mjs (in project root, same level as package.json)
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("child_process", "fs");
    }
    return config;
  },
};

export default nextConfig;
