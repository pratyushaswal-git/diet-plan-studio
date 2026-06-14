// Resolve a stored brand-logo reference to a renderable URL.
// `brands.logo_url` holds a storage path in the `brand-assets` bucket (which is
// public — see supabase/schema.sql). The public object URL is deterministic, so
// we build it synchronously: works in the client (BrandSelector), the server
// pages, the headless-Chrome PDF, and is stable when frozen into a plan snapshot.
export function brandLogoUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path; // already a full URL (back-compat)
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/brand-assets/${path}`;
}
