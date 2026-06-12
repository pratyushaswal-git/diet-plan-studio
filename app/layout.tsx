import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
