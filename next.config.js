const nextConfig = {
  //* TODO: Handle eslint for next build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  transpilePackages: [
    "kalidokit",
    "rent-market",
    "v3d-web-realbits",
    "v3d-core-realbits",
    "@babylonjs/core",
    "babylon-mtoon-material",
  ],
};

module.exports = nextConfig;
