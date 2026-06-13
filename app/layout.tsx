import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { RouteProgress } from "@/components/nav/RouteProgress";
import { ConfirmProvider } from "@/components/ui/confirm";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diet Plan Studio",
  description: "A private, multi-brand diet-plan builder.",
  applicationName: "Diet Plan",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Diet Plan",
  },
  // Favicon + apple-touch-icon are auto-injected from app/icon.png and app/apple-icon.png.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F6F3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">
        <RouteProgress />
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster richColors position="top-center" />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
