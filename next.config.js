const nextConfig = {
  //* TODO: Handle eslint for next build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    //* Because of viem package build error.
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  transpilePackages: ["kalidokit", "v3d-web-realbits", "v3d-core-realbits"],
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;
  },
};

module.exports = nextConfig;
