/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // Find the existing rule that handles SVG files
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Re-add the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other .svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    // Modify the original rule to exclude SVGs that are not marked with ?url
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

export default nextConfig;