/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    disableStaticImages: true,
  },
  env: {
    REACT_APP_API_URL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
    REACT_APP_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || process.env.REACT_APP_RPC_URL,
    REACT_APP_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || process.env.REACT_APP_CHAIN_ID,
    REACT_APP_CHAIN_HEX: process.env.NEXT_PUBLIC_CHAIN_HEX || process.env.REACT_APP_CHAIN_HEX,
    REACT_APP_CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME || process.env.REACT_APP_CHAIN_NAME,
    REACT_APP_MRT_TOKEN_ADDRESS:
      process.env.NEXT_PUBLIC_MRT_TOKEN_ADDRESS || process.env.REACT_APP_MRT_TOKEN_ADDRESS,
    REACT_APP_REWARD_POOL_ADDRESS:
      process.env.NEXT_PUBLIC_REWARD_POOL_ADDRESS || process.env.REACT_APP_REWARD_POOL_ADDRESS,
    REACT_APP_STAKING_ADDRESS:
      process.env.NEXT_PUBLIC_STAKING_ADDRESS || process.env.REACT_APP_STAKING_ADDRESS,
    REACT_APP_REWARD_WALLET_ADDRESS:
      process.env.NEXT_PUBLIC_REWARD_WALLET_ADDRESS || process.env.REACT_APP_REWARD_WALLET_ADDRESS,
    REACT_APP_GAME_SECRET: process.env.NEXT_PUBLIC_GAME_SECRET || process.env.REACT_APP_GAME_SECRET,
    REACT_APP_SKIP_VERIFY: process.env.NEXT_PUBLIC_SKIP_VERIFY || process.env.REACT_APP_SKIP_VERIFY,
    REACT_APP_UNLIMITED_GAMEPLAY:
      process.env.NEXT_PUBLIC_UNLIMITED_GAMEPLAY || process.env.REACT_APP_UNLIMITED_GAMEPLAY,
  },
  async rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ||
      process.env.API_ORIGIN ||
      "http://localhost:4000";

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp|avif|svg|mp4|webm|ogg|glb)$/i,
      type: "asset/resource",
    });
    return config;
  },
  turbopack: {
    rules: {
      "*.png": { type: "asset" },
      "*.jpg": { type: "asset" },
      "*.jpeg": { type: "asset" },
      "*.gif": { type: "asset" },
      "*.webp": { type: "asset" },
      "*.avif": { type: "asset" },
      "*.svg": { type: "asset" },
      "*.mp4": { type: "asset" },
      "*.webm": { type: "asset" },
      "*.ogg": { type: "asset" },
      "*.glb": { type: "asset" },
    },
  },
};

module.exports = nextConfig;
