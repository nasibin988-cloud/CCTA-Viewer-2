// next.config.ts
import type { NextConfig } from "next";
import type { RuleSetRule } from "webpack";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // Find the existing rule for SVG files
    const fileLoaderRule = config.module.rules.find((rule): rule is RuleSetRule =>
      typeof rule === 'object' && rule !== null && 'test' in rule && rule.test instanceof RegExp && rule.test.test(".svg")
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other .svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule?.issuer,
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    // Modify the original rule to exclude SVGs that are not marked with ?url
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

export default nextConfig;