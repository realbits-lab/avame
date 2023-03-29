const withProgressBar = require("next-progressbar");
const WebpackBar = require("webpackbar");

const nextConfig = withProgressBar({
  reactStrictMode: false,
  // transpilePackages: ["kalidokit", "rent-market", "v3d-core-realbits"],
  // transpilePackages: ["kalidokit", "rent-market"],
  transpilePackages: ["kalidokit"],
  webpack: (config) => {
    config.plugins.push(
      new WebpackBar({
        fancy: true,
        profile: true,
        basic: false,
      })
    );

    return config;
  },
});

module.exports = nextConfig;
