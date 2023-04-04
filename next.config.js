const nextConfig = {
  //* TODO: Handle eslint for next build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  transpilePackages: ["kalidokit", "rent-market"],
};

module.exports = nextConfig;
