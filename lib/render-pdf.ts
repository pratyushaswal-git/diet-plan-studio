import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Browser } from "puppeteer-core";

// Headless-Chrome HTML → content-sized PDF. Renders the real plan-view HTML so
// the export is pixel-identical to the design (gradients, radial wash, recipe
// thumbnails). Vercel: puppeteer-core + @sparticuz/chromium. Local dev: the
// `puppeteer` devDep's bundled Chromium, else an installed Chrome.

type FaceDef = { file: string; family: "Cormorant" | "Mulish"; weight: number; style: "normal" | "italic" };

// Only the weights the design actually uses (trimmed 13 → 7) — smaller inlined
// HTML, faster font parsing, less memory. Cormorant 500/600 + italic-500; Mulish
// 400/600/700/800. Keep in sync with the @font-face block in plan-view-css.ts.
const FACES: FaceDef[] = [
  { file: "Cormorant-Medium.ttf", family: "Cormorant", weight: 500, style: "normal" },
  { file: "Cormorant-SemiBold.ttf", family: "Cormorant", weight: 600, style: "normal" },
  { file: "Cormorant-MediumItalic.ttf", family: "Cormorant", weight: 500, style: "italic" },
  { file: "Mulish-Regular.ttf", family: "Mulish", weight: 400, style: "normal" },
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

async function launchBrowser(): Promise<Browser> {
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

// Reuse the browser across warm invocations — launching Chromium is the most
// expensive step, so we keep one instance and only relaunch if it died.
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      if (b.connected) return b;
    } catch {
      /* previous launch failed — fall through and relaunch */
    }
  }
  browserPromise = launchBrowser();
  return browserPromise;
}

async function destroyBrowser(): Promise<void> {
  const p = browserPromise;
  browserPromise = null;
  if (p) {
    try {
      await (await p).close();
    } catch {
      /* ignore */
    }
  }
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Awaited<ReturnType<Browser["newPage"]>> | undefined;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 980, height: 1400 });
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });

    // Wait for webfonts + the brand logo image, capped so a slow asset can't hang
    // the render. (Recipe thumbnails were dropped, so this is just fonts + logo.)
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
      new Promise((res) => setTimeout(res, 6000)),
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
  } catch (err) {
    // A wedged/thawed browser can break mid-render — drop it so the next call
    // relaunches clean instead of reusing a dead instance.
    await destroyBrowser();
    throw err;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}
