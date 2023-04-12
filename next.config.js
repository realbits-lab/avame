const nextConfig = {
  //* TODO: Handle eslint for next build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  transpilePackages: ["kalidokit", "rent-market"],
  headers: () => [
    {
      source: "/",
      headers: [
        {
          key: "Cache-Control",
          value: "no-store",
        },
      ],
    },
  ],
};

module.exports = nextConfig;
