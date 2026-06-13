import { Document, Image, Link, Page, Text, View } from "@react-pdf/renderer";

import type { PlanBody } from "@/lib/types";
import { registerPdfFonts } from "@/components/pdf/fonts";
import { MealTable } from "@/components/pdf/MealTable";
import { Watermark } from "@/components/pdf/Watermark";

registerPdfFonts();

function clientLine(client: PlanBody["client"]): string {
  const bits = [
    client.age && `Age – ${client.age}`,
    client.weight && `Weight – ${client.weight}`,
    client.height && `Height – ${client.height}`,
  ].filter(Boolean);
  return bits.join("   ·   ");
}

function NoteBlock({
  title,
  notes,
  primary,
  ink,
}: {
  title: string;
  notes: string[];
  primary: string;
  ink: string;
}) {
  if (notes.length === 0) return null;
  return (
    <View style={{ marginTop: 12 }} wrap={false}>
      <Text style={{ fontFamily: "Lora", fontWeight: 600, fontSize: 11, color: primary, marginBottom: 3 }}>
        {title}
      </Text>
      {notes.map((n, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 1.5 }}>
          <Text style={{ color: primary, marginRight: 4 }}>•</Text>
          <Text style={{ color: ink, flex: 1, lineHeight: 1.3 }}>{n}</Text>
        </View>
      ))}
    </View>
  );
}

export function PlanDocument({ body }: { body: PlanBody }) {
  const { brand, client, schedule, importantNotes, careNotes, recipes } = body;
  const t = brand.theme;
  const details = clientLine(client);

  return (
    <Document title={`Diet Plan — ${client.name}`} author={brand.name}>
      <Page
        size="A4"
        style={{
          fontFamily: "Inter",
          fontSize: 9,
          color: t.ink,
          backgroundColor: t.surface,
          paddingTop: 30,
          paddingBottom: 36,
          paddingHorizontal: 30,
        }}
      >
        <Watermark text={brand.watermarkText} color={t.primary} />

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `2px solid ${t.primary}`,
            paddingBottom: 6,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {brand.logoUrl ? <Image src={brand.logoUrl} style={{ width: 28, height: 28, objectFit: "contain" }} /> : null}
            <Text style={{ fontFamily: "Lora", fontWeight: 600, fontSize: 20, color: t.primary }}>Diet Plan</Text>
          </View>
          <Text style={{ color: t.muted, fontSize: 9 }}>{brand.email}</Text>
        </View>

        {/* Client */}
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontFamily: "Lora", fontWeight: 600, fontSize: 13, color: t.ink }}>{client.name}</Text>
          {details ? <Text style={{ color: t.muted, marginTop: 2 }}>{details}</Text> : null}
          {client.extra ? <Text style={{ color: t.ink, marginTop: 2 }}>{client.extra}</Text> : null}
        </View>

        {/* Meal schedule */}
        <MealTable rows={schedule.rows} theme={t} />

        {/* Notes */}
        <NoteBlock title="Important" notes={importantNotes} primary={t.primary} ink={t.ink} />
        <NoteBlock title="Please take care of below" notes={careNotes} primary={t.primary} ink={t.ink} />

        {/* Recipes */}
        {recipes.length > 0 && (
          <View style={{ marginTop: 12 }} wrap={false}>
            <Text style={{ fontFamily: "Lora", fontWeight: 600, fontSize: 11, color: t.primary, marginBottom: 3 }}>
              Recipes
            </Text>
            {recipes.map((r, i) => (
              <View key={r.url} style={{ flexDirection: "row", marginBottom: 1.5 }}>
                <Text style={{ color: t.muted, width: 14 }}>{i + 1}.</Text>
                <Text style={{ color: t.ink, flex: 1 }}>
                  {r.title}{" "}
                  <Link src={r.url} style={{ color: t.primary }}>
                    {r.url}
                  </Link>
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
