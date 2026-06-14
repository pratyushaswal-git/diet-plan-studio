import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Browser } from "puppeteer-core";

// Headless-Chrome HTML → content-sized PDF. Renders the real plan-view HTML so
// the export is pixel-identical to the design (gradients, radial wash, recipe
// thumbnails). Vercel: puppeteer-core + @sparticuz/chromium. Local dev: the
// `puppeteer` devDep's bundled Chromium, else an installed Chrome.

type FaceDef = { file: string; family: "Cormorant" | "Mulish"; weight: number; style: "normal" | "italic" };

const FACES: FaceDef[] = [
  { file: "Cormorant-Regular.ttf", family: "Cormorant", weight: 400, style: "normal" },
  { file: "Cormorant-Medium.ttf", family: "Cormorant", weight: 500, style: "normal" },
  { file: "Cormorant-SemiBold.ttf", family: "Cormorant", weight: 600, style: "normal" },
  { file: "Cormorant-Bold.ttf", family: "Cormorant", weight: 700, style: "normal" },
  { file: "Cormorant-Italic.ttf", family: "Cormorant", weight: 400, style: "italic" },
  { file: "Cormorant-MediumItalic.ttf", family: "Cormorant", weight: 500, style: "italic" },
  { file: "Cormorant-SemiBoldItalic.ttf", family: "Cormorant", weight: 600, style: "italic" },
  { file: "Mulish-Light.ttf", family: "Mulish", weight: 300, style: "normal" },
  { file: "Mulish-Regular.ttf", family: "Mulish", weight: 400, style: "normal" },
  { file: "Mulish-Medium.ttf", family: "Mulish", weight: 500, style: "normal" },
  { file: "Mulish-SemiBold.ttf", family: "Mulish", weight: 600, style: "normal" },
  { file: "Mulish-Bold.ttf", family: "Mulish", weight: 700, style: "normal" },
  { file: "Mulish-ExtraBold.ttf", family: "Mulish", weight: 800, style: "normal" },
];

let fontFaceCache: string | null = null;

// Self-contained base64 @font-face block — the export HTML has no origin, so the
// url(/fonts/*) faces in PLAN_VIEW_CSS can't resolve; these provide the fonts.
export async function fontFaceBase64(): Promise<string> {
  if (fontFaceCache) return fontFaceCache;
  const dir = path.join(process.cwd(), "public", "fonts");
  const faces = await Promise.all(
    FACES.map(async (f) => {
      const b64 = (await readFile(path.join(dir, f.file))).toString("base64");
      return `@font-face{font-family:"${f.family}";font-weight:${f.weight};font-style:${f.style};src:url(data:font/ttf;base64,${b64}) format("truetype");}`;
    }),
  );
  fontFaceCache = faces.join("\n");
  return fontFaceCache;
}

async function getBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");
  const isServerless =
    !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.AWS_EXECUTION_ENV;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: { width: 980, height: 1400 },
    });
  }

  // local dev — prefer the puppeteer devDep's bundled Chromium, else system Chrome.
  let executablePath: string | undefined;
  try {
    const local = await import("puppeteer");
    executablePath = await local.executablePath();
  } catch {
    /* puppeteer not present */
  }
  return puppeteer.launch({
    channel: executablePath ? undefined : "chrome",
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 980, height: 1400 },
  });
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 980, height: 1400 });
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });

    // Wait for webfonts + images (recipe thumbnails), but cap it so a slow/blocked
    // thumbnail can't hang the render — the placeholder still shows.
    await Promise.race([
      page.evaluate(async () => {
        const d = document as Document & { fonts?: { ready: Promise<unknown> } };
        if (d.fonts?.ready) await d.fonts.ready;
        await Promise.all(
          Array.from(document.images).map((img) =>
            img.complete
              ? null
              : new Promise((res) => {
                  img.addEventListener("load", res);
                  img.addEventListener("error", res);
                }),
          ),
        );
      }),
      new Promise((res) => setTimeout(res, 8000)),
    ]);

    const height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
    const pdf = await page.pdf({
      width: "980px",
      height: `${height}px`,
      printBackground: true,
      pageRanges: "1",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
