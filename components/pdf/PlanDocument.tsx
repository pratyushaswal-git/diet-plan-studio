import { Document, Image, Link, Page, Text, View } from "@react-pdf/renderer";

import type { PlanBody } from "@/lib/types";
import { expandTheme } from "@/lib/pdf-palette";
import type { PdfPalette } from "@/lib/pdf-palette";
import { registerPdfFonts } from "@/components/pdf/fonts";
import { DayCards } from "@/components/pdf/DayCards";
import { RecipeCards } from "@/components/pdf/RecipeCards";
import { Watermark } from "@/components/pdf/Watermark";
import { CheckIcon, GlobeIcon, InstaIcon, MailIcon, PhoneIcon, SparkIcon } from "@/components/pdf/icons";

registerPdfFonts();

type ChipDef = { icon: "web" | "insta" | "mail" | "phone"; label: string; href: string };

function buildContacts(brand: PlanBody["brand"]): ChipDef[] {
  const out: ChipDef[] = [];
  if (brand.website) {
    const clean = brand.website.replace(/^https?:\/\//, "");
    out.push({ icon: "web", label: clean, href: `https://${clean}` });
  }
  if (brand.instagram) {
    const handle = brand.instagram.replace(/^@/, "");
    out.push({ icon: "insta", label: brand.instagram, href: `https://www.instagram.com/${handle}` });
  }
  if (brand.email) out.push({ icon: "mail", label: brand.email, href: `mailto:${brand.email}` });
  if (brand.phone) out.push({ icon: "phone", label: brand.phone, href: `tel:${brand.phone.replace(/[^+\d]/g, "")}` });
  return out;
}

function ChipIcon({ kind, color }: { kind: ChipDef["icon"]; color: string }) {
  if (kind === "web") return <GlobeIcon color={color} />;
  if (kind === "insta") return <InstaIcon color={color} />;
  if (kind === "mail") return <MailIcon color={color} />;
  return <PhoneIcon color={color} />;
}

function SectionHead({ title, mini, p }: { title: string; mini: string; p: PdfPalette }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 17, color: p.ink }}>{title}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: p.hair }} />
      <Text style={{ fontFamily: "Mulish", fontWeight: 700, fontSize: 6.5, letterSpacing: 1, color: p.inkFaint, textTransform: "uppercase" }}>
        {mini}
      </Text>
    </View>
  );
}

export function PlanDocument({ body }: { body: PlanBody }) {
  const { brand, client, schedule, importantNotes, careNotes, recipes } = body;
  const p = expandTheme(brand.theme);
  const contacts = buildContacts(brand);

  const stats = [
    client.age && { label: "Age", value: client.age },
    client.weight && { label: "Weight", value: client.weight },
    client.height && { label: "Height", value: client.height },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Document title={`Diet Plan — ${client.name}`} author={brand.name}>
      <Page
        size="A4"
        style={{
          fontFamily: "Mulish",
          fontSize: 8.5,
          color: p.ink,
          backgroundColor: p.paper,
          paddingTop: 0,
          paddingBottom: 28,
        }}
      >
        <Watermark text={brand.watermarkText} color={p.primary} />

        {/* ---------- HEADER ---------- */}
        <View style={{ backgroundColor: p.paper2, borderBottom: `1px solid ${p.hair}`, paddingHorizontal: 28, paddingTop: 22, paddingBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {brand.logoUrl ? (
              <Image src={brand.logoUrl} style={{ width: 34, height: 34, borderRadius: 999, objectFit: "cover", border: "1.5px solid #FFFFFF" }} />
            ) : null}
            <View>
              <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 18, color: p.primaryDeep, lineHeight: 1 }}>{brand.name}</Text>
              {brand.tagline ? (
                <Text style={{ fontFamily: "Mulish", fontWeight: 700, fontSize: 6, letterSpacing: 1.5, color: p.accent, textTransform: "uppercase", marginTop: 2 }}>
                  {brand.tagline}
                </Text>
              ) : null}
            </View>
            <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 4 }}>
              {contacts.map((c) => (
                <Link
                  key={c.href}
                  src={c.href}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    backgroundColor: p.surface,
                    border: `1px solid ${p.hair}`,
                    borderRadius: 999,
                    paddingVertical: 2.5,
                    paddingHorizontal: 6,
                    textDecoration: "none",
                  }}
                >
                  <ChipIcon kind={c.icon} color={p.accent} />
                  <Text style={{ fontFamily: "Mulish", fontWeight: 600, fontSize: 6.5, color: p.inkSoft }}>{c.label}</Text>
                </Link>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: "Mulish", fontWeight: 700, fontSize: 7, letterSpacing: 2, color: p.inkFaint, textTransform: "uppercase", marginBottom: 3 }}>
              Customized Nutrition
            </Text>
            <Text style={{ fontFamily: "Cormorant", fontWeight: 500, fontSize: 32, color: p.ink, lineHeight: 1 }}>
              Your Weekly <Text style={{ fontStyle: "italic", color: p.primary }}>Diet Plan</Text>
            </Text>
          </View>
        </View>

        {/* ---------- CLIENT CARD ---------- */}
        <View style={{ paddingHorizontal: 28, marginTop: 16 }}>
          <View
            style={{ backgroundColor: p.primary, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 11, paddingVertical: 12, paddingHorizontal: 16 }}
          >
            <View>
              <Text style={{ fontFamily: "Mulish", fontWeight: 700, fontSize: 6.5, letterSpacing: 1.5, color: "rgba(255,255,255,0.72)", textTransform: "uppercase" }}>
                Prepared for
              </Text>
              <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 20, color: "#FFFFFF", lineHeight: 1, marginTop: 2 }}>
                {client.name || "—"}
              </Text>
              {client.extra ? (
                <Text style={{ fontSize: 7.5, color: "rgba(255,255,255,0.8)", marginTop: 3 }}>{client.extra}</Text>
              ) : null}
            </View>
            <View style={{ flexDirection: "row", gap: 7 }}>
              {stats.map((s) => (
                <View
                  key={s.label}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.13)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    alignItems: "center",
                    minWidth: 48,
                  }}
                >
                  <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 13, color: "#FFFFFF", lineHeight: 1 }}>{s.value}</Text>
                  <Text style={{ fontFamily: "Mulish", fontWeight: 700, fontSize: 5.5, letterSpacing: 1, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", marginTop: 3 }}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---------- MEAL SCHEDULE (day cards) ---------- */}
        <View style={{ paddingHorizontal: 28, marginTop: 18 }}>
          <SectionHead title="Meal Schedule" mini="Day by Day" p={p} />
          <DayCards rows={schedule.rows} p={p} />
        </View>

        {/* ---------- NOTES ---------- */}
        {(importantNotes.length > 0 || careNotes.length > 0) && (
          <View style={{ paddingHorizontal: 28, marginTop: 6, flexDirection: "row", gap: 12 }} wrap={false}>
            {importantNotes.length > 0 && (
              <View style={{ flex: 1, backgroundColor: p.accentSoft, borderRadius: 11, borderLeft: `3px solid ${p.accent}`, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <SparkIcon size={11} color={p.accent} />
                  <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 14, color: p.primaryDeep }}>A gentle reminder</Text>
                </View>
                {importantNotes.map((n, i) => (
                  <Text key={i} style={{ color: p.ink, lineHeight: 1.4, marginBottom: 2 }}>{n}</Text>
                ))}
              </View>
            )}
            {careNotes.length > 0 && (
              <View style={{ flex: 1, backgroundColor: p.surface, borderRadius: 11, border: `1px solid ${p.hair}`, padding: 14 }}>
                <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 14, color: p.ink, marginBottom: 7 }}>Please take care of</Text>
                {careNotes.map((t, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 5, alignItems: "flex-start" }}>
                    <View style={{ width: 11, height: 11, borderRadius: 999, backgroundColor: p.primaryTint, alignItems: "center", justifyContent: "center", marginTop: 0.5 }}>
                      <CheckIcon size={7} color={p.primary} />
                    </View>
                    <Text style={{ color: p.ink, lineHeight: 1.35, flex: 1 }}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ---------- RECIPES ---------- */}
        {recipes.length > 0 && (
          <View style={{ paddingHorizontal: 28, marginTop: 18 }}>
            <SectionHead title="Recipes" mini="Tap to watch" p={p} />
            <RecipeCards recipes={recipes} p={p} />
          </View>
        )}

        {/* ---------- FOOTER ---------- */}
        <View
          style={{
            marginTop: 20,
            paddingHorizontal: 28,
            paddingTop: 14,
            paddingBottom: 4,
            borderTop: `1px solid ${p.hair}`,
            backgroundColor: p.paper2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {brand.logoUrl ? (
              <Image src={brand.logoUrl} style={{ width: 22, height: 22, borderRadius: 999, objectFit: "cover", border: "1px solid #FFFFFF" }} />
            ) : null}
            <View>
              <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 12, color: p.primaryDeep, lineHeight: 1 }}>{brand.name}</Text>
              {brand.tagline ? (
                <Text style={{ fontFamily: "Mulish", fontWeight: 700, fontSize: 5.5, letterSpacing: 1.2, color: p.accent, textTransform: "uppercase", marginTop: 2 }}>
                  {brand.tagline}
                </Text>
              ) : null}
            </View>
          </View>
          <Text style={{ fontSize: 6.5, color: p.inkFaint, textAlign: "right", maxWidth: 220, lineHeight: 1.4 }}>
            Listen to your body, stay consistent, and reach out anytime. This plan is personalised — please don&apos;t share it forward.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
