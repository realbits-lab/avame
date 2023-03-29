const withProgressBar = require("next-progressbar");
const WebpackBar = require("webpackbar");

const nextConfig = withProgressBar({
	//* TODO: Handle eslint for next build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
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
