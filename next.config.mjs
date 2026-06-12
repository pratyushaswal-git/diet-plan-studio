/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer ships ESM that Next needs to transpile for the server route.
  transpilePackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [
      // Supabase Storage public/signed object URLs (brand logos).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
