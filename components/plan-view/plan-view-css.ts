// The locked "Day Cards" design CSS, ported from the Claude Design handoff
// (styles.css). Kept as a string (not a .css file) so it can be both injected
// into the live preview (<style>) and embedded in the standalone export HTML —
// no global-CSS-import restriction, no runtime fs read. Scoped under .plan-view
// so it never leaks into the app shell. Brand colours arrive as CSS custom
// properties on the .plan-view root (see themeToPlanVars). @font-face here is the
// browser-preview path (url /fonts/*); the export route prepends base64 faces.
export const PLAN_VIEW_CSS = String.raw`
/* Only the weights the design actually uses (trimmed from 13 → 7 to shrink the
   inlined payload / parse cost / memory). Cormorant 500/600 + italic-500; Mulish
   400/600/700/800. */
@font-face { font-family: "Cormorant"; font-weight: 500; font-style: normal; src: url("/fonts/Cormorant-Medium.ttf") format("truetype"); }
@font-face { font-family: "Cormorant"; font-weight: 600; font-style: normal; src: url("/fonts/Cormorant-SemiBold.ttf") format("truetype"); }
@font-face { font-family: "Cormorant"; font-weight: 500; font-style: italic; src: url("/fonts/Cormorant-MediumItalic.ttf") format("truetype"); }
@font-face { font-family: "Mulish"; font-weight: 400; src: url("/fonts/Mulish-Regular.ttf") format("truetype"); }
@font-face { font-family: "Mulish"; font-weight: 600; src: url("/fonts/Mulish-SemiBold.ttf") format("truetype"); }
@font-face { font-family: "Mulish"; font-weight: 700; src: url("/fonts/Mulish-Bold.ttf") format("truetype"); }
@font-face { font-family: "Mulish"; font-weight: 800; src: url("/fonts/Mulish-ExtraBold.ttf") format("truetype"); }

.plan-view {
  --serif: "Cormorant", Georgia, serif;
  --sans: "Mulish", "Segoe UI", system-ui, sans-serif;
  --radius: 18px;
  --radius-s: 12px;
  --shadow: 0 18px 50px -28px rgba(40, 20, 45, 0.45);
  --shadow-s: 0 8px 24px -16px rgba(40, 20, 45, 0.40);

  width: 980px;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.plan-view * { box-sizing: border-box; }

.plan-view .page { width: 100%; background: var(--paper); overflow: hidden; position: relative; }
.plan-view .section { padding: 0 56px; }
.plan-view .section + .section { margin-top: 40px; }

/* HEADER */
.plan-view .head {
  position: relative; padding: 44px 56px 34px;
  background:
    radial-gradient(140% 120% at 100% 0%, var(--primary-tint-2) 0%, transparent 60%),
    linear-gradient(180deg, var(--paper-2) 0%, var(--paper) 100%);
  border-bottom: 1px solid var(--hair);
}
.plan-view .head__top { display: flex; align-items: center; gap: 22px; }
.plan-view .brandmark { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; box-shadow: 0 10px 26px -10px rgba(40,20,45,.55); border: 3px solid #fff; flex: none; }
.plan-view .brandwho { display: flex; flex-direction: column; gap: 2px; }
.plan-view .brandwho .name { font-family: var(--serif); font-weight: 600; font-size: 30px; line-height: 1; letter-spacing: .01em; color: var(--primary-deep); }
.plan-view .brandwho .tag { font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
.plan-view .contacts { margin-left: auto; display: flex; flex-wrap: wrap; gap: 7px 8px; justify-content: flex-end; max-width: 320px; }
.plan-view .chip { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: var(--ink-soft); text-decoration: none; background: var(--paper); border: 1px solid var(--hair); padding: 5px 11px 5px 8px; border-radius: 999px; white-space: nowrap; }
.plan-view .chip svg { width: 13px; height: 13px; flex: none; color: var(--accent); }
.plan-view .head__title { margin-top: 30px; }
.plan-view .head__title .eyebrow { font-size: 12px; letter-spacing: .34em; text-transform: uppercase; color: var(--ink-faint); font-weight: 700; margin-bottom: 6px; }
.plan-view .head__title h1 { font-family: var(--serif); font-weight: 500; font-size: 58px; line-height: .98; margin: 0; color: var(--ink); letter-spacing: -.01em; }
.plan-view .head__title h1 em { font-style: italic; color: var(--primary); }

/* CLIENT */
.plan-view .client { display: flex; align-items: center; gap: 14px 28px; flex-wrap: wrap; background: linear-gradient(110deg, var(--primary-deep), var(--primary)); color: #fff; border-radius: var(--radius); padding: 20px 26px; box-shadow: var(--shadow-s); }
.plan-view .client__greet { display: flex; flex-direction: column; gap: 2px; }
.plan-view .client__greet .hi { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.7); font-weight: 700; }
.plan-view .client__greet .nm { font-family: var(--serif); font-weight: 600; font-size: 32px; line-height: 1; }
.plan-view .client__greet .extra { font-size: 12.5px; color: rgba(255,255,255,.82); margin-top: 4px; }
.plan-view .client__stats { margin-left: auto; display: flex; gap: 12px; flex-wrap: wrap; }
.plan-view .stat { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); border-radius: 12px; padding: 9px 16px; text-align: center; min-width: 82px; }
.plan-view .stat .v { font-family: var(--serif); font-size: 21px; font-weight: 600; line-height: 1; white-space: nowrap; }
.plan-view .stat .l { font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.72); margin-top: 4px; font-weight: 700; }

/* SECTION HEAD */
.plan-view .sec-head { display: flex; align-items: baseline; gap: 14px; margin: 0 0 18px; }
.plan-view .sec-head h2 { font-family: var(--serif); font-weight: 600; font-size: 30px; margin: 0; color: var(--ink); letter-spacing: .005em; white-space: nowrap; flex: none; }
.plan-view .sec-head .rule { flex: 1; height: 1px; background: var(--hair); align-self: center; }
.plan-view .sec-head .mini { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-faint); font-weight: 700; }

/* DAY CARDS */
.plan-view .daycards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
.plan-view .daycard { background: var(--paper); border: 1px solid var(--hair); border-radius: var(--radius); box-shadow: var(--shadow-s); overflow: hidden; display: flex; flex-direction: column; break-inside: avoid; }
.plan-view .daycard__h { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(110deg, var(--primary-deep), var(--primary)); color: #fff; padding: 12px 18px; }
.plan-view .daycard__h .d { font-family: var(--serif); font-size: 22px; font-weight: 600; line-height: 1; }
.plan-view .daycard__h .n { font-size: 11px; font-weight: 800; letter-spacing: .14em; opacity: .7; }
.plan-view .daycard__body { padding: 6px 18px 14px; }
.plan-view .mealrow { display: grid; grid-template-columns: 92px 1fr; gap: 12px; padding: 11px 0; border-bottom: 1px dashed var(--hair); }
.plan-view .mealrow:last-child { border-bottom: none; }
.plan-view .mealrow .mtime .t { font-family: var(--serif); font-size: 16px; font-weight: 600; color: var(--primary-deep); line-height: 1.1; }
.plan-view .mealrow .mtime .c { font-size: 10.5px; font-weight: 700; color: var(--accent); }
.plan-view .mealrow .mtxt { font-size: 13px; line-height: 1.45; color: var(--ink); align-self: center; }
.plan-view .mealrow.is-const .mtxt { color: var(--ink-soft); }
.plan-view .recipe-pill { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 10.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: var(--primary); background: var(--primary-tint); border: 1px solid var(--primary-tint-2); padding: 2px 8px; border-radius: 999px; text-decoration: none; width: max-content; }
.plan-view .recipe-pill svg { width: 9px; height: 9px; }

/* NOTES */
.plan-view .note-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 22px; align-items: start; }
.plan-view .note-grid.single { grid-template-columns: 1fr; }
.plan-view .important { background: linear-gradient(135deg, var(--accent-soft), var(--blush)); border: 1px solid var(--hair); border-left: 4px solid var(--accent); border-radius: var(--radius); padding: 22px 24px; }
.plan-view .important .lbl { display: flex; align-items: center; gap: 9px; font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--primary-deep); margin-bottom: 8px; }
.plan-view .important .lbl svg { color: var(--accent); width: 20px; height: 20px; }
.plan-view .important p { margin: 0 0 6px; font-size: 14.5px; line-height: 1.55; color: var(--ink); }
.plan-view .important p:last-child { margin-bottom: 0; }
.plan-view .care { background: var(--paper); border: 1px solid var(--hair); border-radius: var(--radius); padding: 22px 24px; box-shadow: var(--shadow-s); }
.plan-view .care h3 { font-family: var(--serif); font-size: 22px; font-weight: 600; margin: 0 0 12px; color: var(--ink); }
.plan-view .care ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.plan-view .care li { display: flex; gap: 11px; font-size: 13.5px; line-height: 1.45; color: var(--ink); }
.plan-view .care li .dot { flex: none; width: 18px; height: 18px; border-radius: 50%; background: var(--primary-tint); color: var(--primary); display: grid; place-items: center; margin-top: 1px; }
.plan-view .care li .dot svg { width: 10px; height: 10px; }

/* RECIPES */
.plan-view .recipes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.plan-view .rcard { display: flex; flex-direction: column; background: var(--paper); border: 1px solid var(--hair); border-radius: var(--radius-s); overflow: hidden; text-decoration: none; color: var(--ink); box-shadow: var(--shadow-s); break-inside: avoid; }
.plan-view .rcard__thumb { position: relative; aspect-ratio: 16 / 10; background: var(--primary-tint-2); overflow: hidden; }
.plan-view .rcard__play { position: absolute; inset: 0; display: grid; place-items: center; z-index: 2; }
.plan-view .rcard__play span { width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,.92); color: var(--primary); display: grid; place-items: center; box-shadow: 0 6px 16px -6px rgba(0,0,0,.5); }
.plan-view .rcard__play svg { width: 16px; height: 16px; margin-left: 2px; }
.plan-view .rcard__tag { position: absolute; top: 9px; left: 9px; z-index: 2; font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; background: rgba(255,255,255,.92); color: var(--primary-deep); padding: 3px 8px; border-radius: 999px; }
.plan-view .rcard__b { padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.plan-view .rcard__b .ti { font-family: var(--serif); font-size: 17px; font-weight: 600; line-height: 1.1; color: var(--ink); }
.plan-view .rcard__b .watch { font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); display: inline-flex; align-items: center; gap: 4px; flex: none; }
.plan-view .rcard__b .watch svg { width: 10px; height: 10px; }

/* FOOTER */
.plan-view .foot { margin-top: 46px; padding: 26px 56px 38px; border-top: 1px solid var(--hair); background: var(--paper-2); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.plan-view .foot .fb { display: flex; align-items: center; gap: 12px; }
.plan-view .foot .fb img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; }
.plan-view .foot .fb .nm { font-family: var(--serif); font-size: 20px; font-weight: 600; color: var(--primary-deep); line-height: 1; }
.plan-view .foot .fb .tg { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
.plan-view .foot .fnote { font-size: 12px; color: var(--ink-faint); text-align: right; max-width: 360px; line-height: 1.5; }
`;
