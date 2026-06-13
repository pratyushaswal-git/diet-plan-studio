/**
 * One-off: rasterize assets/icon.svg → the PNG sizes a PWA needs.
 * Run: node scripts/gen-icons.mjs   (requires the dev-dependency `sharp`)
 * The generated PNGs are committed; sharp is only needed to regenerate them.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const svg = fs.readFileSync(path.join(root, "assets", "icon.svg"));
const iconsDir = path.join(root, "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

// A maskable icon needs its content inside the inner ~80% "safe zone"; our leaf
// already sits well within it, and the ground is full-bleed, so the same source
// works for both `any` and `maskable`.
const targets = [
  { file: path.join(iconsDir, "icon-192.png"), size: 192 },
  { file: path.join(iconsDir, "icon-512.png"), size: 512 },
  { file: path.join(iconsDir, "icon-maskable-512.png"), size: 512 },
  { file: path.join(root, "app", "icon.png"), size: 256 }, // favicon (Next file convention)
  { file: path.join(root, "app", "apple-icon.png"), size: 180 }, // iOS home-screen
];

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(file);
  console.log(`wrote ${path.relative(root, file)} (${size}px)`);
}
console.log("done.");
