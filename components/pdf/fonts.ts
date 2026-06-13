import { Font } from "@react-pdf/renderer";

// Bundled Unicode-safe TTFs (cover ₹, curly quotes, °, ½ ¼, en/em dashes).
// One registration, two consumers: the browser <PDFViewer> preview fetches the
// files by same-origin URL; the Node download route reads them off disk.
let registered = false;

function fontSrc(file: string): string {
  if (typeof window === "undefined") {
    // server (PDF route) — absolute filesystem path; forward slashes are fine on Windows.
    return `${process.cwd()}/public/fonts/${file}`;
  }
  return `/fonts/${file}`;
}

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Inter",
    fonts: [
      { src: fontSrc("Inter-Regular.ttf"), fontWeight: 400 },
      { src: fontSrc("Inter-Medium.ttf"), fontWeight: 500 },
      { src: fontSrc("Inter-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Lora",
    fonts: [
      { src: fontSrc("Lora-Regular.ttf"), fontWeight: 400 },
      { src: fontSrc("Lora-SemiBold.ttf"), fontWeight: 600 },
    ],
  });

  // Don't break long single words (URLs, composed item names) across hyphens.
  Font.registerHyphenationCallback((word) => [word]);
}
