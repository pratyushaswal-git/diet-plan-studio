import { renderToBuffer } from "@react-pdf/renderer";
import { format } from "date-fns";

import { getPlan } from "@/lib/db";
import { PlanDocument } from "@/components/pdf/PlanDocument";
import type { PlanBody } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // RLS-gated fetch (session cookies). Returns null if not found / not allowed.
  const plan = await getPlan(id);
  if (!plan) return new Response("Not found", { status: 404 });

  const body = plan.body as PlanBody;
  const buffer = await renderToBuffer(<PlanDocument body={body} />);
  // Buffer → Uint8Array for the web Response BodyInit type.
  const bytes = new Uint8Array(buffer);

  const safeName = (plan.client_name || "plan").replace(/[^\w\s-]/g, "").trim() || "plan";
  const filename = `${safeName} - ${format(new Date(plan.created_at), "d MMM yyyy")}.pdf`;

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
