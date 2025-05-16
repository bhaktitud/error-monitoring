/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Menghindari error webpack dengan package NestJS
    config.resolve.alias = {
      ...config.resolve.alias,
      '@nestjs/core': false,
      '@nestjs/microservices': false,
      '@nestjs/websockets': false,
      'cache-manager': false,
      'class-transformer': false,
    };

    return config;
  },
};

module.exports = nextConfig; 