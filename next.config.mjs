/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer must stay an external Node module on the server, or its
  // react-reconciler gets the RSC React subset and throws "Component is not a
  // constructor". The client preview imports it dynamically (ssr:false).
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
  images: {
    remotePatterns: [
      // Supabase Storage public/signed object URLs (brand logos).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
