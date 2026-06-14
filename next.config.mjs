/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Headless-Chrome deps must stay external Node modules (native binary /
    // runtime extraction); never bundle them into the server build.
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
    // The PDF route reads files off disk that Next's tracer can't follow:
    //  - the bundled TTFs (fs.readFile), and
    //  - @sparticuz/chromium's bin/ (the compressed Chromium it extracts at runtime;
    //    accessed by path, not import, so it must be force-included or the lambda
    //    is missing it → "input directory .../@sparticuz/chromium/bin does not exist").
    outputFileTracingIncludes: {
      "/api/plans/[id]/pdf": ["./public/fonts/**", "./node_modules/@sparticuz/chromium/bin/**"],
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
