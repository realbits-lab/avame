const nextConfig = {
  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/home",
  //       permanent: false,
  //     },
  //   ];
  // },
  reactStrictMode: false,
  transpilePackages: ["kalidokit", "rent-market"],
};

module.exports = nextConfig;
