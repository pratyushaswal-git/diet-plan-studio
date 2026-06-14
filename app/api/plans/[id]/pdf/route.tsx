import { format } from "date-fns";

import { getPlan } from "@/lib/db";
import { PlanView } from "@/components/plan-view/PlanView";
import { PLAN_VIEW_CSS } from "@/components/plan-view/plan-view-css";
import { fontFaceBase64, htmlToPdf } from "@/lib/render-pdf";
import type { PlanBody } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // RLS-gated fetch (session cookies). Returns null if not found / not allowed.
  const plan = await getPlan(id);
  if (!plan) return new Response("Not found", { status: 404 });

  const body = plan.body as PlanBody;

  try {
    // Render the real plan-view HTML, then let headless Chrome paint it to a
    // single content-sized PDF page (fonts inlined base64 → offline-safe).
    const { renderToStaticMarkup } = await import("react-dom/server");
    const markup = renderToStaticMarkup(<PlanView body={body} />);
    const fonts = await fontFaceBase64();
    const paper = body.brand?.theme?.bg ?? "#ffffff";
    const html =
      `<!doctype html><html><head><meta charset="utf-8">` +
      `<style>${fonts}\n${PLAN_VIEW_CSS}</style></head>` +
      `<body style="margin:0;background:${paper}">${markup}</body></html>`;

    const pdf = await htmlToPdf(html);
    const bytes = new Uint8Array(pdf);

    const safeName = (plan.client_name || "plan").replace(/[^\w\s-]/g, "").trim() || "plan";
    const filename = `${safeName} - ${format(new Date(plan.created_at), "d MMM yyyy")}.pdf`;

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // Surface the real cause (admin-only route) so headless-Chrome failures on
    // the host are diagnosable instead of an opaque 500.
    console.error("[pdf] render failed:", err);
    const detail = err instanceof Error ? `${err.message}\n\n${err.stack ?? ""}` : String(err);
    return new Response(`PDF render failed:\n\n${detail}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
