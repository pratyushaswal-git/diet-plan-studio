/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Headless-Chrome deps must stay external Node modules (native binary /
    // runtime extraction); never bundle them into the server build.
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
    // The PDF route reads the bundled TTFs off disk → include them in its trace.
    outputFileTracingIncludes: {
      "/api/plans/[id]/pdf": ["./public/fonts/**"],
    },
  },
  images: {
    remotePatterns: [
      // Supabase Storage public/signed object URLs (brand logos).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
