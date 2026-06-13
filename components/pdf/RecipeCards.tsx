import { Link, Text, View } from "@react-pdf/renderer";

import type { PlanBody } from "@/lib/types";
import type { PdfPalette } from "@/lib/pdf-palette";
import { ArrowIcon, PlayIcon } from "@/components/pdf/icons";

function isShort(url: string): boolean {
  return /youtube\.com\/shorts\//i.test(url);
}

export function RecipeCards({ recipes, p }: { recipes: PlanBody["recipes"]; p: PdfPalette }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" }}>
      {recipes.map((r, i) => (
        <Link
          key={r.url}
          src={r.url}
          wrap={false}
          style={{
            width: "23.5%",
            marginRight: (i + 1) % 4 === 0 ? 0 : "2%",
            marginBottom: 10,
            backgroundColor: p.surface,
            borderRadius: 8,
            border: `1px solid ${p.hair}`,
            overflow: "hidden",
            textDecoration: "none",
          }}
        >
          {/* thumb area (text/offline — tinted with a centered play badge) */}
          <View style={{ height: 44, backgroundColor: p.primaryTint2, position: "relative", alignItems: "center", justifyContent: "center" }}>
            <View
              style={{
                position: "absolute",
                top: 5,
                left: 5,
                backgroundColor: "#FFFFFF",
                borderRadius: 999,
                paddingVertical: 1,
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ fontFamily: "Mulish", fontWeight: 800, fontSize: 5.5, letterSpacing: 0.5, color: p.primaryDeep, textTransform: "uppercase" }}>
                {isShort(r.url) ? "Short" : "Video"}
              </Text>
            </View>
            <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
              <PlayIcon size={10} color={p.primary} />
            </View>
          </View>

          {/* title + watch */}
          <View style={{ paddingVertical: 6, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
            <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 10, color: p.ink, lineHeight: 1.1, flex: 1 }}>
              {r.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={{ fontFamily: "Mulish", fontWeight: 800, fontSize: 6, letterSpacing: 0.4, color: p.accent, textTransform: "uppercase" }}>
                Watch
              </Text>
              <ArrowIcon size={6} color={p.accent} />
            </View>
          </View>
        </Link>
      ))}
    </View>
  );
}
