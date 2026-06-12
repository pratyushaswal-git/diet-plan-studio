/**
 * Knowledge-base extraction: reads every PDF in plans/ and produces a
 * normalized, deduplicated seed (scripts/.out/seed.json) for brands,
 * meal_slots, food_items, recipes, notes — per the rules in CLAUDE.md.
 *
 * Also writes scripts/.out/extracted.json (raw per-plan parse) for review.
 *
 * Run: npm run parse-plans
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
// pdf.js build bundled with pdf-parse — gives us positioned text items.
const pdfjs = require("pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js");

const PLANS_DIR = path.join(process.cwd(), "plans");
const OUT_DIR = path.join(process.cwd(), "scripts", ".out");

// ---------- geometry types ----------
type Item = { str: string; x: number; y: number; w: number };
type Line = { y: number; items: Item[]; text: string; x0: number };
type PageData = { lines: Line[]; items: Item[] };

// ---------- parse output types ----------
type ParsedCell = { day: number; text: string; hasRecipeMarker: boolean };
type ParsedRow = {
  label: string;
  time: string | null;
  cells: ParsedCell[]; // per-day resolved text
};
type ParsedRecipe = { title: string; url: string };
type ParsedPlan = {
  file: string;
  email: string | null;
  brandKey: string | null;
  clientName: string | null;
  detailsLine: string | null;
  rows: ParsedRow[];
  importantNotes: string[];
  careNotes: string[];
  recipes: ParsedRecipe[];
  warnings: string[];
};

// ---------- helpers ----------
const norm = (s: string) =>
  s
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normKey = (s: string) =>
  norm(s)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*([,;:/()+-])\s*/g, "$1") // ignore spacing around punctuation
    .replace(/\.$/, "");

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Recipe-marker variants seen in plans: "[see the recipe below]" etc.
const RECIPE_MARKER_RE = /\[\s*see\s+the\s+recipes?\s+below\s*\]/gi;

function brandKeyFromEmail(email: string): string | null {
  const e = email.toLowerCase();
  if (e.includes("shecares")) return "shecares";
  if (e.includes("sadhanatribe") || e.includes("sadhana")) return "sadhana_tribe";
  if (e.includes("nuvira")) return "nuvira";
  return null;
}

/**
 * Group positioned items into visual lines (y-clustered), x-sorted,
 * concatenated verbatim — inserting a space when there is a visual gap
 * between fragments that don't already provide one ("Lunch" + "at").
 */
function toLines(items: Item[]): Line[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) <= 4) {
      last.items.push(it);
    } else {
      lines.push({ y: it.y, items: [it], text: "", x0: 0 });
    }
  }
  for (const l of lines) {
    l.items.sort((a, b) => a.x - b.x);
    let text = "";
    let prevEnd: number | null = null;
    for (const i of l.items) {
      if (prevEnd !== null && i.x - prevEnd > 1.5 && !text.endsWith(" ") && !i.str.startsWith(" "))
        text += " ";
      text += i.str;
      prevEnd = i.x + i.w;
    }
    l.text = text;
    l.x0 = l.items.find((i) => i.str.trim())?.x ?? l.items[0].x;
  }
  return lines;
}

/**
 * Join wrapped lines into running text. Each pdf.js fragment carries its own
 * trailing spaces, so straight concatenation is correct: a line that ends
 * without a space is a mid-word break ("pomegranat" + "e, 1 ...").
 * Pass sep=" " for short label text where mid-word breaks don't occur.
 */
function joinLines(lines: { text: string }[], sep = ""): string {
  return norm(lines.map((l) => l.text).join(sep));
}

async function loadPdf(filePath: string): Promise<PageData[]> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: PageData[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items: Item[] = tc.items
      .map((i: any) => ({
        str: i.str as string,
        x: i.transform[4] as number,
        y: i.transform[5] as number,
        w: (i.width as number) || 0,
      }))
      .filter((i: Item) => i.str.length > 0);
    // keep pure-space items: they carry word separation at line ends
    pages.push({ items, lines: toLines(items).filter((l) => l.text.trim().length > 0) });
  }
  return pages;
}

// ---------- per-plan parser ----------
async function parsePlan(filePath: string): Promise<ParsedPlan> {
  const file = path.basename(filePath);
  const warnings: string[] = [];
  const pages = await loadPdf(filePath);

  // ----- header (page 1) -----
  const p1 = pages[0].lines;
  let email: string | null = null;
  let clientName: string | null = null;
  let detailsLine: string | null = null;

  const scheduleIdx = p1.findIndex((l) => /meal\s*schedule/i.test(l.text));
  const headerLines = p1.slice(0, scheduleIdx === -1 ? 8 : scheduleIdx);
  for (const l of headerLines) {
    const t = norm(l.text);
    if (!t || /^diet\s*plan$/i.test(t)) continue;
    if (!email && /@/.test(t)) {
      email = t.replace(/\s+/g, "");
      continue;
    }
    if (/age|weight|height|\byrs\b|\bkgs\b/i.test(t)) {
      detailsLine = t;
      continue;
    }
    if (!clientName) clientName = t;
  }
  if (!clientName) warnings.push("no client name found");
  if (scheduleIdx === -1) warnings.push("no 'Meal Schedule' heading");

  // ----- weekday column anchors -----
  let colX: number[] | null = null;
  for (const page of pages) {
    const hdr = page.lines.find(
      (l) => WEEKDAY_NAMES.filter((d) => l.text.includes(d)).length >= 5,
    );
    if (hdr) {
      const anchors: number[] = [];
      for (const d of WEEKDAY_NAMES) {
        const it = hdr.items.find((i) => i.str.trim().startsWith(d.slice(0, 4)));
        if (it) anchors.push(it.x);
      }
      if (anchors.length === 7) {
        colX = anchors;
        break;
      }
    }
  }
  if (!colX) {
    warnings.push("no weekday header found — skipping table");
    return { file, email, brandKey: email ? brandKeyFromEmail(email) : null, clientName, detailsLine, rows: [], importantNotes: [], careNotes: [], recipes: [], warnings };
  }
  const labelMaxX = colX[0] - 6;

  const colOf = (x: number): number => {
    let col = -1;
    for (let c = 0; c < colX!.length; c++) if (x >= colX![c] - 6) col = c;
    return col;
  };

  // ----- section markers + table regions -----
  type Marker = { page: number; y: number; kind: "important" | "care" | "recipes" };
  const markers: Marker[] = [];
  pages.forEach((page, pi) => {
    for (const l of page.lines) {
      // section headings sit at the left page margin — never inside table columns
      // (otherwise a wrapped cell fragment like "recipe" on its own visual line matches)
      if (l.x0 >= colX![0] - 6) continue;
      const t = norm(l.text);
      if (/^important\s*:?\s*$/i.test(t) || /^important\s*:/i.test(t)) markers.push({ page: pi, y: l.y, kind: "important" });
      else if (/^please\s+take\s+care/i.test(t)) markers.push({ page: pi, y: l.y, kind: "care" });
      else if (/^recipes?\s*:?\s*$/i.test(t)) markers.push({ page: pi, y: l.y, kind: "recipes" });
    }
  });
  const firstMarkerOn = (pi: number) => markers.filter((m) => m.page === pi).sort((a, b) => b.y - a.y)[0];
  // the meal table always precedes the first section marker — pages after it are never table
  const firstMarker = [...markers].sort((a, b) => a.page - b.page || b.y - a.y)[0];

  // ----- collect table rows across pages -----
  type RawRow = { labelLines: Line[]; cellItems: Item[] };
  const rawRows: RawRow[] = [];

  for (let pi = 0; pi < pages.length; pi++) {
    if (firstMarker && pi > firstMarker.page) break;
    const page = pages[pi];
    const hdrLine = page.lines.find(
      (l) => WEEKDAY_NAMES.filter((d) => l.text.includes(d)).length >= 5,
    );
    const schedLine = page.lines.find((l) => /meal\s*schedule/i.test(l.text));
    const topY = hdrLine ? hdrLine.y - 1 : schedLine ? schedLine.y - 1 : Infinity;
    const marker = firstMarkerOn(pi);
    const bottomY = marker ? marker.y + 6 : -Infinity;
    if (topY <= bottomY) continue; // no table region on this page

    // label column and day columns are separated by x — split at item level,
    // because visual lines span the whole table width.
    const regionItems = page.items.filter((i) => i.y < topY && i.y > bottomY);
    const labelLines = toLines(regionItems.filter((i) => i.x < labelMaxX)).filter(
      (l) => l.text.trim().length > 0,
    );
    // keep space items — they carry word separation at wrapped line ends
    const tableItems = regionItems.filter((i) => i.x >= labelMaxX);
    if (labelLines.length === 0 && tableItems.filter((i) => i.str.trim()).length === 0) continue;

    // cluster label lines into row-label groups (gap > 20pt = new row)
    const clusters: Line[][] = [];
    for (const l of labelLines.sort((a, b) => b.y - a.y)) {
      const last = clusters[clusters.length - 1];
      if (last && last[last.length - 1].y - l.y <= 20) last.push(l);
      else clusters.push([l]);
    }

    // A row's cell content can start above its label (labels may be vertically
    // centered). The true content-top is where several columns start lines at
    // the same y — a stray overflow line from the previous row aligns in only
    // one or two columns.
    const colLineTops: number[][] = [];
    for (let c = 0; c < 7; c++)
      colLineTops.push(
        toLines(tableItems.filter((i) => colOf(i.x) === c))
          .filter((l) => l.text.trim())
          .map((l) => l.y),
      );
    const rowTop = (labelTop: number): number => {
      const cands: { y: number; cols: Set<number> }[] = [];
      for (let c = 0; c < 7; c++)
        for (const y of colLineTops[c]) {
          if (y <= labelTop + 1 || y > labelTop + 20) continue;
          const hit = cands.find((k) => Math.abs(k.y - y) <= 4);
          if (hit) hit.cols.add(c);
          else cands.push({ y, cols: new Set([c]) });
        }
      const best = cands.filter((k) => k.cols.size >= 3).sort((a, b) => b.y - a.y)[0];
      return best ? best.y + 3 : labelTop + 11;
    };

    // keep y monotonic across pages so multi-page rows assemble in order
    const adjust = (items: Item[]) => items.map((i) => ({ ...i, y: i.y - pi * 2000 }));

    // items above the first label cluster continue the previous page's last row
    const firstTop = clusters.length ? rowTop(clusters[0][0].y) : -Infinity;
    const carryover = tableItems.filter((i) => i.y > firstTop);
    if (carryover.filter((i) => i.str.trim()).length) {
      if (rawRows.length) rawRows[rawRows.length - 1].cellItems.push(...adjust(carryover));
      else warnings.push(`page ${pi + 1}: orphan cell items above first row`);
    }

    clusters.forEach((cluster, ci) => {
      const top = ci === 0 ? firstTop : rowTop(cluster[0].y);
      const bottom = ci + 1 < clusters.length ? rowTop(clusters[ci + 1][0].y) : -Infinity;
      rawRows.push({
        labelLines: cluster,
        cellItems: adjust(tableItems.filter((i) => i.y <= top && i.y > bottom)),
      });
    });
  }

  // ----- resolve rows -----
  const rows: ParsedRow[] = rawRows.map((rr) => {
    const fullLabel = joinLines(rr.labelLines, " ");
    // split "Breakfast at 8:30 am" → label + time
    let label = fullLabel;
    let time: string | null = null;
    const m = fullLabel.match(/^(.*?)\s+at\s+(\d{1,2}[:.]\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))$/i);
    // don't split labels like "At 12 pm" (the whole label IS the time row)
    if (m && m[1].trim().length > 0) {
      label = norm(m[1]);
      time = norm(m[2]).replace(".", ":");
    }

    const cells: ParsedCell[] = [];
    for (let day = 0; day < 7; day++) {
      const items = rr.cellItems.filter((i) => colOf(i.x) === day);
      if (!items.filter((i) => i.str.trim()).length) continue;
      const text = joinLines(toLines(items));
      if (!text) continue;
      const hasRecipeMarker = RECIPE_MARKER_RE.test(text);
      RECIPE_MARKER_RE.lastIndex = 0;
      cells.push({ day, text: norm(text.replace(RECIPE_MARKER_RE, " ")), hasRecipeMarker });
    }
    return { label, time, cells };
  });

  // ----- notes + recipes blocks (linear, across pages, from markers on) -----
  const blockLines: { kind: Marker["kind"]; lines: Line[] }[] = [];
  {
    const ordered = [...markers].sort((a, b) => a.page - b.page || b.y - a.y);
    for (let mi = 0; mi < ordered.length; mi++) {
      const m = ordered[mi];
      const next = ordered[mi + 1];
      const collected: Line[] = [];
      for (let pi = m.page; pi < pages.length; pi++) {
        if (next && pi > next.page) break;
        for (const l of pages[pi].lines) {
          const afterStart = pi > m.page || l.y < m.y;
          const beforeEnd = !next || pi < next.page || l.y > next.y;
          if (afterStart && beforeEnd && norm(l.text)) collected.push(l);
        }
      }
      blockLines.push({ kind: m.kind, lines: collected });
    }
  }

  const importantNotes: string[] = [];
  const careNotes: string[] = [];
  const recipes: ParsedRecipe[] = [];

  for (const block of blockLines) {
    if (block.kind === "recipes") {
      // group numbered entries: "N. Title - URL" (may wrap)
      const groups: Line[][] = [];
      for (const l of block.lines) {
        if (/^\d{1,2}\s*\./.test(norm(l.text))) groups.push([l]);
        else if (groups.length) groups[groups.length - 1].push(l);
      }
      for (const g of groups) {
        const full = joinLines(g).replace(/^\d{1,2}\s*\.\s*/, "");
        const um = full.match(/(https?:\/\/[^\s\]\[）)]+)/);
        if (!um) {
          warnings.push(`recipe entry without URL (skipped): "${full.slice(0, 70)}"`);
          continue;
        }
        const url = um[1].replace(/\s+/g, "");
        let title = norm(full.slice(0, um.index!).replace(/[-–—:]\s*$/, ""));
        // trailing remark after the URL (e.g. "[Use 2% or skimmed milk]") → keep with the title
        const remark = norm(full.slice(um.index! + um[1].length).replace(/^[\]\)\s-]+|[\[\(\s]+$/g, ""));
        if (remark) title = `${title} (${remark.replace(/[\[\]]/g, "")})`;
        if (title) recipes.push({ title, url });
      }
    } else {
      // bullet/paragraph notes: bullets start with •; IMPORTANT may be plain paragraphs
      const target = block.kind === "important" ? importantNotes : careNotes;
      const groups: Line[][] = [];
      const minX = Math.min(...block.lines.map((l) => l.x0));
      for (const l of block.lines) {
        const isBulletStart = /^[•▪◦o]\s/.test(l.text.trimStart()) || /^[•▪◦]/.test(l.text.trimStart());
        const isParaStart = !groups.length || l.x0 <= minX + 2;
        if (isBulletStart || (block.kind === "important" && isParaStart && groups.length === 0)) groups.push([l]);
        else if (groups.length) groups[groups.length - 1].push(l);
        else groups.push([l]);
      }
      for (const g of groups) {
        const text = norm(joinLines(g).replace(/^[•▪◦]\s*/, ""));
        if (text) target.push(text);
      }
    }
  }

  // a free paragraph between the table and IMPORTANT (e.g. "(You can avoid
  // onion and garlic in the recipes)") parses as a sparse pseudo-row — it
  // starts in the label column and bleeds into at most one day column.
  for (let ri = rows.length - 1; ri >= 0; ri--) {
    const r = rows[ri];
    if (r.label.startsWith("(") && r.cells.length <= 1) {
      const text = norm([r.label, ...r.cells.map((c) => c.text)].join(" "));
      importantNotes.unshift(text);
      rows.splice(ri, 1);
    }
  }

  return {
    file,
    email,
    brandKey: email ? brandKeyFromEmail(email) : null,
    clientName,
    detailsLine,
    rows,
    importantNotes,
    careNotes,
    recipes,
    warnings,
  };
}

// ---------- recipe linking (within one plan) ----------
const STOP = new Set(["recipe", "recipes", "the", "a", "of", "with", "and", "see", "below"]);
function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}
function matchScore(a: string, b: string): number {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.min(ta.size, tb.size);
}

// ---------- main: parse all, normalize, dedupe ----------
async function main() {
  const files = fs
    .readdirSync(PLANS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();
  if (!files.length) throw new Error(`no PDFs found in ${PLANS_DIR}`);

  const plans: ParsedPlan[] = [];
  for (const f of files) {
    process.stdout.write(`parsing ${f} ... `);
    try {
      const plan = await parsePlan(path.join(PLANS_DIR, f));
      plans.push(plan);
      console.log(
        `ok (${plan.rows.length} rows, ${plan.recipes.length} recipes, ` +
          `${plan.importantNotes.length} imp, ${plan.careNotes.length} care` +
          (plan.warnings.length ? `, WARN: ${plan.warnings.join("; ")}` : "") +
          `)`,
      );
    } catch (e: any) {
      console.log(`FAILED: ${e.message}`);
    }
  }

  const nPlans = plans.length;

  // ----- brands -----
  const emailsByBrand = new Map<string, Map<string, number>>();
  let noEmailCount = 0;
  for (const p of plans) {
    if (!p.email) {
      noEmailCount++;
      continue;
    }
    const key = p.brandKey ?? "unknown";
    const m = emailsByBrand.get(key) ?? new Map();
    m.set(p.email, (m.get(p.email) ?? 0) + 1);
    emailsByBrand.set(key, m);
  }

  // ----- meal slots -----
  type SlotAgg = { label: string; times: Map<string, number>; count: number; order: number[] };
  const slotAgg = new Map<string, SlotAgg>();
  for (const p of plans) {
    p.rows.forEach((r, idx) => {
      const k = normKey(r.label);
      if (!k) return;
      const agg: SlotAgg = slotAgg.get(k) ?? { label: r.label, times: new Map(), count: 0, order: [] };
      agg.count++;
      agg.order.push(idx);
      if (r.time) agg.times.set(r.time.toLowerCase(), (agg.times.get(r.time.toLowerCase()) ?? 0) + 1);
      slotAgg.set(k, agg);
    });
  }
  const mostCommon = <T,>(m: Map<T, number>): T | null =>
    [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const slotKind = (label: string, cellSamples: string[]): string => {
    const l = label.toLowerCase();
    if (/walk|exercise|yoga|stretch/.test(l)) return "activity";
    const samples = cellSamples.slice(0, 10).join(" ").toLowerCase();
    if (cellSamples.length && cellSamples.every((c) => /water|tea|coconut water|juice/i.test(c)) && /drink/.test(samples))
      return "hydration";
    return "meal";
  };

  // cell samples per slot for kind heuristic + food item aggregation
  const cellsBySlot = new Map<string, string[]>();
  for (const p of plans)
    for (const r of p.rows) {
      const k = normKey(r.label);
      const arr = cellsBySlot.get(k) ?? [];
      for (const c of r.cells) arr.push(c.text);
      cellsBySlot.set(k, arr);
    }

  const slots = [...slotAgg.entries()]
    .map(([k, agg]) => ({
      key: k,
      label: agg.label,
      default_time: mostCommon(agg.times),
      kind: slotKind(agg.label, cellsBySlot.get(k) ?? []),
      sort_order: agg.order.reduce((a, b) => a + b, 0) / agg.order.length,
      is_default: agg.count > nPlans / 2,
      plan_count: agg.count,
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s, i) => ({ ...s, sort_order: i }));

  // ----- recipes (dedupe by URL, prefer most common title) -----
  const recipeAgg = new Map<string, Map<string, number>>(); // url -> title counts
  for (const p of plans)
    for (const r of p.recipes) {
      const m = recipeAgg.get(r.url) ?? new Map();
      m.set(r.title, (m.get(r.title) ?? 0) + 1);
      recipeAgg.set(r.url, m);
    }
  const recipes = [...recipeAgg.entries()].map(([url, titles]) => ({
    title: mostCommon(titles)!,
    url,
  }));

  // ----- food items (dedupe by normalized text; link recipes) -----
  type FoodAgg = {
    name: string;
    planFiles: Set<string>;
    slotCounts: Map<string, number>;
    recipeUrl: string | null;
  };
  const foodAgg = new Map<string, FoodAgg>();
  for (const p of plans) {
    // track which items appeared in this plan (usage_count = distinct plans)
    for (const r of p.rows) {
      const slotKey = normKey(r.label);
      for (const c of r.cells) {
        const k = normKey(c.text);
        if (!k) continue;
        const agg =
          foodAgg.get(k) ??
          ({ name: c.text, planFiles: new Set(), slotCounts: new Map(), recipeUrl: null } as FoodAgg);
        agg.planFiles.add(p.file);
        agg.slotCounts.set(slotKey, (agg.slotCounts.get(slotKey) ?? 0) + 1);
        if (c.hasRecipeMarker && !agg.recipeUrl && p.recipes.length) {
          let best: ParsedRecipe | null = null;
          let bestScore = 0;
          for (const rec of p.recipes) {
            const s = matchScore(c.text, rec.title);
            if (s > bestScore) {
              bestScore = s;
              best = rec;
            }
          }
          if (best && bestScore >= 0.5) agg.recipeUrl = best.url;
        }
        foodAgg.set(k, agg);
      }
    }
  }
  const foodItems = [...foodAgg.values()]
    .map((a) => ({
      name: a.name,
      slot_key: mostCommon(a.slotCounts),
      recipe_url: a.recipeUrl,
      usage_count: a.planFiles.size,
    }))
    .sort((a, b) => b.usage_count - a.usage_count);

  // ----- notes -----
  type NoteAgg = { text: string; count: number; order: number[] };
  const noteAggFor = (kind: "important" | "care") => {
    const agg = new Map<string, NoteAgg>();
    for (const p of plans) {
      const list = kind === "important" ? p.importantNotes : p.careNotes;
      list.forEach((t, i) => {
        const k = normKey(t);
        const a = agg.get(k) ?? { text: t, count: 0, order: [] };
        a.count++;
        a.order.push(i);
        agg.set(k, a);
      });
    }
    return [...agg.values()]
      .map((a) => ({
        type: kind,
        text: a.text,
        sort_order: a.order.reduce((x, y) => x + y, 0) / a.order.length,
        is_default: a.count > nPlans / 2,
        plan_count: a.count,
      }))
      .sort((a, b) => b.plan_count - a.plan_count || a.sort_order - b.sort_order)
      .map((n, i) => ({ ...n, sort_order: i }));
  };
  const notes = [...noteAggFor("important"), ...noteAggFor("care")];

  // ----- write outputs -----
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "extracted.json"), JSON.stringify(plans, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, "seed.json"),
    JSON.stringify(
      {
        meta: { generatedAt: new Date().toISOString(), planCount: nPlans, noEmailCount },
        brandEmails: Object.fromEntries(
          [...emailsByBrand.entries()].map(([k, m]) => [k, Object.fromEntries(m)]),
        ),
        slots,
        recipes,
        foodItems,
        notes,
      },
      null,
      2,
    ),
  );

  // ----- report -----
  console.log("\n========== EXTRACTION REPORT ==========");
  console.log(`plans parsed:       ${nPlans}/${files.length}`);
  console.log(`plans without email: ${noEmailCount}`);
  console.log("brand emails seen:");
  for (const [k, m] of emailsByBrand) for (const [e, c] of m) console.log(`  ${k}: ${e} (${c} plans)`);
  console.log(`meal slots:         ${slots.length}`);
  for (const s of slots)
    console.log(
      `  [${s.kind}] "${s.label}"${s.default_time ? ` @ ${s.default_time}` : ""} — ${s.plan_count} plans${s.is_default ? " (default)" : ""}`,
    );
  console.log(`recipes:            ${recipes.length}`);
  console.log(`food items:         ${foodItems.length} (top 10 by usage below)`);
  for (const f of foodItems.slice(0, 10))
    console.log(`  ${String(f.usage_count).padStart(2)}× ${f.name.slice(0, 80)}${f.recipe_url ? "  [recipe]" : ""}`);
  const linked = foodItems.filter((f) => f.recipe_url).length;
  console.log(`food items w/ recipe link: ${linked}`);
  console.log(`notes:              ${notes.length} (${notes.filter((n) => n.type === "important").length} important, ${notes.filter((n) => n.type === "care").length} care)`);
  const allWarnings = plans.flatMap((p) => p.warnings.map((w) => `${p.file}: ${w}`));
  console.log(`warnings:           ${allWarnings.length}`);
  for (const w of allWarnings) console.log(`  ! ${w}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
