import { Font } from "@react-pdf/renderer";

// Bundled Unicode-safe TTFs (cover ₹, curly quotes, °, ½ ¼, en/em dashes).
// One registration, two consumers: the browser <PDFViewer> preview fetches the
// files by same-origin URL; the Node download route reads them off disk.
//   Cormorant Garamond — serif headings (matches the locked design)
//   Mulish             — sans body / table / chips
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
    family: "Cormorant",
    fonts: [
      { src: fontSrc("Cormorant-Regular.ttf"), fontWeight: 400 },
      { src: fontSrc("Cormorant-Medium.ttf"), fontWeight: 500 },
      { src: fontSrc("Cormorant-SemiBold.ttf"), fontWeight: 600 },
      { src: fontSrc("Cormorant-Bold.ttf"), fontWeight: 700 },
      { src: fontSrc("Cormorant-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
      { src: fontSrc("Cormorant-MediumItalic.ttf"), fontWeight: 500, fontStyle: "italic" },
      { src: fontSrc("Cormorant-SemiBoldItalic.ttf"), fontWeight: 600, fontStyle: "italic" },
    ],
  });
  Font.register({
    family: "Mulish",
    fonts: [
      { src: fontSrc("Mulish-Light.ttf"), fontWeight: 300 },
      { src: fontSrc("Mulish-Regular.ttf"), fontWeight: 400 },
      { src: fontSrc("Mulish-Medium.ttf"), fontWeight: 500 },
      { src: fontSrc("Mulish-SemiBold.ttf"), fontWeight: 600 },
      { src: fontSrc("Mulish-Bold.ttf"), fontWeight: 700 },
      { src: fontSrc("Mulish-ExtraBold.ttf"), fontWeight: 800 },
    ],
  });

  // Don't break long single words (URLs, composed item names) across hyphens.
  Font.registerHyphenationCallback((word) => [word]);
}
