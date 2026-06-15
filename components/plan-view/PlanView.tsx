import type { CSSProperties } from "react";

import { WEEKDAYS } from "@/lib/types";
import type { CellItem, PlanBody, ScheduleRow } from "@/lib/types";
import { themeToPlanVars } from "@/lib/brand-palette";

const DAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ---- inline SVG icons (ported from the handoff render.js ICON map) ----
const Icon = {
  web: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </svg>
  ),
  insta: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6.6 10.8a13 13 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.24 1z" fill="currentColor" stroke="none" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  ),
};

type ChipKind = "web" | "insta" | "mail" | "phone";

function contactsOf(brand: PlanBody["brand"]): { kind: ChipKind; label: string; href: string }[] {
  const out: { kind: ChipKind; label: string; href: string }[] = [];
  if (brand.website) {
    const clean = brand.website.replace(/^https?:\/\//, "");
    out.push({ kind: "web", label: clean, href: `https://${clean}` });
  }
  if (brand.instagram) {
    const handle = brand.instagram.replace(/^@/, "");
    out.push({ kind: "insta", label: brand.instagram, href: `https://www.instagram.com/${handle}` });
  }
  if (brand.email) out.push({ kind: "mail", label: brand.email, href: `mailto:${brand.email}` });
  if (brand.phone) out.push({ kind: "phone", label: brand.phone, href: `tel:${brand.phone.replace(/[^+\d]/g, "")}` });
  return out;
}

function statsOf(client: PlanBody["client"]): { label: string; value: string }[] {
  return [
    client.age && { label: "Age", value: client.age },
    client.weight && { label: "Weight", value: client.weight },
    client.height && { label: "Height", value: client.height },
  ].filter(Boolean) as { label: string; value: string }[];
}

// Parse a YouTube video id (+ short flag) from a recipe URL.
function youtube(url: string): { id: string; short: boolean } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return { id: u.pathname.slice(1), short: false };
    if (host.endsWith("youtube.com")) {
      const shorts = u.pathname.match(/\/shorts\/([\w-]+)/);
      if (shorts) return { id: shorts[1], short: true };
      const v = u.searchParams.get("v");
      if (v) return { id: v, short: false };
      const embed = u.pathname.match(/\/embed\/([\w-]+)/);
      if (embed) return { id: embed[1], short: false };
    }
  } catch {
    /* not a URL */
  }
  return null;
}

function cellsFor(row: ScheduleRow, dayIndex: number): CellItem[] {
  if (row.uniform) return row.uniformCell ?? [];
  return row.cells?.[WEEKDAYS[dayIndex]] ?? [];
}

function MealText({ items }: { items: CellItem[] }) {
  if (items.length === 0) return <span className="mtxt">—</span>;
  return (
    <div className="mtxt">
      {items.map((it, i) => (
        <div key={i}>
          <span>{it.text}</span>
          {it.recipe ? (
            <a className="recipe-pill" href={it.recipe.url} target="_blank" rel="noopener noreferrer">
              {Icon.play}recipe
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function PlanView({ body }: { body: PlanBody }) {
  const { brand, client, schedule, importantNotes, careNotes, recipes } = body;
  const contacts = contactsOf(brand);
  const stats = statsOf(client);
  const hasNotes = importantNotes.length > 0 || careNotes.length > 0;
  const singleNote = importantNotes.length === 0 || careNotes.length === 0;

  return (
    <div className="plan-view" style={themeToPlanVars(brand.theme) as CSSProperties}>
      <div className="page">
        {/* ---------- HEADER ---------- */}
        <header className="head">
          <div className="head__top">
            {brand.logoUrl ? <img className="brandmark" src={brand.logoUrl} alt={`${brand.name} logo`} /> : null}
            <div className="brandwho">
              <span className="name">{brand.name}</span>
              {brand.tagline ? <span className="tag">{brand.tagline}</span> : null}
            </div>
            {contacts.length > 0 ? (
              <nav className="contacts">
                {contacts.map((c) => (
                  <a key={c.href} className="chip" href={c.href} target="_blank" rel="noopener noreferrer">
                    {Icon[c.kind]}
                    {c.label}
                  </a>
                ))}
              </nav>
            ) : null}
          </div>
          <div className="head__title">
            <div className="eyebrow">Customized Nutrition</div>
            <h1>
              Your Weekly <em>Diet Plan</em>
            </h1>
          </div>
        </header>

        {/* ---------- CLIENT CARD ---------- */}
        <section className="section" style={{ marginTop: 30 }}>
          <div className="client">
            <div className="client__greet">
              <span className="hi">Prepared for</span>
              <span className="nm">{client.name || "—"}</span>
              {client.extra ? <span className="extra">{client.extra}</span> : null}
            </div>
            {stats.length > 0 ? (
              <div className="client__stats">
                {stats.map((s) => (
                  <div className="stat" key={s.label}>
                    <div className="v">{s.value}</div>
                    <div className="l">{s.label}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* ---------- MEAL SCHEDULE (day cards) ---------- */}
        <section className="section" style={{ marginTop: 40 }}>
          <div className="sec-head">
            <h2>Meal Schedule</h2>
            <span className="rule" />
            <span className="mini">Day by Day</span>
          </div>
          <div className="daycards">
            {WEEKDAYS.map((_, i) => (
              <article className="daycard" key={i}>
                <div className="daycard__h">
                  <span className="d">{DAYS_LONG[i]}</span>
                  <span className="n">0{i + 1}</span>
                </div>
                <div className="daycard__body">
                  {schedule.rows.map((row, ri) => (
                    <div className={`mealrow${row.uniform ? " is-const" : ""}`} key={ri}>
                      <div className="mtime">
                        <span className="t">{row.label}</span>
                        {row.time ? (
                          <>
                            <br />
                            <span className="c">{row.time}</span>
                          </>
                        ) : null}
                      </div>
                      <MealText items={cellsFor(row, i)} />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- NOTES ---------- */}
        {hasNotes ? (
          <section className="section" style={{ marginTop: 40 }}>
            <div className={`note-grid${singleNote ? " single" : ""}`}>
              {importantNotes.length > 0 ? (
                <div className="important">
                  <div className="lbl">
                    {Icon.spark} A gentle reminder
                  </div>
                  {importantNotes.map((n, i) => (
                    <p key={i}>{n}</p>
                  ))}
                </div>
              ) : null}
              {careNotes.length > 0 ? (
                <div className="care">
                  <h3>Please take care of</h3>
                  <ul>
                    {careNotes.map((t, i) => (
                      <li key={i}>
                        <span className="dot">{Icon.check}</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ---------- RECIPES ---------- */}
        {recipes.length > 0 ? (
          <section className="section" style={{ marginTop: 40 }}>
            <div className="sec-head">
              <h2>Recipes</h2>
              <span className="rule" />
              <span className="mini">Tap to watch</span>
            </div>
            <div className="recipes">
              {recipes.map((r) => {
                const yt = youtube(r.url);
                return (
                  <a className="rcard" key={r.url} href={r.url} target="_blank" rel="noopener noreferrer">
                    {/* Text/offline card: no fetched thumbnail (saves render cost/memory) —
                        a tinted band with a play badge + Short/Video tag. */}
                    <div className="rcard__thumb">
                      <span className="rcard__tag">{yt?.short ? "Short" : "Video"}</span>
                      <span className="rcard__play">
                        <span>{Icon.play}</span>
                      </span>
                    </div>
                    <div className="rcard__b">
                      <span className="ti">{r.title}</span>
                      <span className="watch">Watch {Icon.arrow}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ---------- FOOTER ---------- */}
        <footer className="foot">
          <div className="fb">
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" /> : null}
            <div>
              <div className="nm">{brand.name}</div>
              {brand.tagline ? <div className="tg">{brand.tagline}</div> : null}
            </div>
          </div>
          <div className="fnote">
            Listen to your body, stay consistent, and reach out anytime.
            <br />
            This plan is personalised — please don&apos;t share it forward.
          </div>
        </footer>
      </div>
    </div>
  );
}
