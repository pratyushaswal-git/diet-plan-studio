import { Link, Text, View } from "@react-pdf/renderer";

import { WEEKDAYS } from "@/lib/types";
import type { CellItem, ScheduleRow } from "@/lib/types";
import type { PdfPalette } from "@/lib/pdf-palette";
import { PlayIcon } from "@/components/pdf/icons";

const DAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function RecipePill({ url, p }: { url: string; p: PdfPalette }) {
  return (
    <Link
      src={url}
      style={{
        marginTop: 3,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        alignSelf: "flex-start",
        backgroundColor: p.primaryTint,
        borderRadius: 999,
        paddingVertical: 1.5,
        paddingHorizontal: 5,
        textDecoration: "none",
      }}
    >
      <PlayIcon size={6} color={p.primary} />
      <Text style={{ fontFamily: "Mulish", fontWeight: 800, fontSize: 6, letterSpacing: 0.4, color: p.primary, textTransform: "uppercase" }}>
        recipe
      </Text>
    </Link>
  );
}

function MealText({ items, isConst, p }: { items: CellItem[]; isConst: boolean; p: PdfPalette }) {
  if (items.length === 0) return <Text style={{ color: p.inkFaint }}>—</Text>;
  return (
    <View>
      {items.map((it, i) => (
        <View key={i}>
          <Text style={{ color: isConst ? p.inkSoft : p.ink, lineHeight: 1.3 }}>{it.text}</Text>
          {it.recipe ? <RecipePill url={it.recipe.url} p={p} /> : null}
        </View>
      ))}
    </View>
  );
}

function cellsFor(row: ScheduleRow, dayIndex: number): CellItem[] {
  if (row.uniform) return row.uniformCell ?? [];
  return row.cells?.[WEEKDAYS[dayIndex]] ?? [];
}

export function DayCards({ rows, p }: { rows: ScheduleRow[]; p: PdfPalette }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
      {WEEKDAYS.map((_, i) => (
        <View
          key={i}
          wrap={false}
          style={{
            width: "48.6%",
            marginBottom: 12,
            backgroundColor: p.surface,
            borderRadius: 9,
            border: `1px solid ${p.hair}`,
            overflow: "hidden",
          }}
        >
          {/* header */}
          <View
            style={{
              backgroundColor: p.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 5,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 13, color: "#FFFFFF" }}>
              {DAYS_LONG[i]}
            </Text>
            <Text style={{ fontFamily: "Mulish", fontWeight: 800, fontSize: 7, letterSpacing: 1, color: "#FFFFFF", opacity: 0.7 }}>
              0{i + 1}
            </Text>
          </View>

          {/* meal rows */}
          <View style={{ paddingHorizontal: 10, paddingTop: 2, paddingBottom: 5 }}>
            {rows.map((row, ri) => (
              <View
                key={ri}
                style={{
                  flexDirection: "row",
                  gap: 8,
                  paddingVertical: 4.5,
                  borderBottom: ri === rows.length - 1 ? undefined : `0.7px dashed ${p.hair}`,
                }}
              >
                <View style={{ width: 62 }}>
                  <Text style={{ fontFamily: "Cormorant", fontWeight: 600, fontSize: 9.5, color: p.primaryDeep, lineHeight: 1.1 }}>
                    {row.label}
                  </Text>
                  {row.time ? (
                    <Text style={{ fontFamily: "Mulish", fontWeight: 700, fontSize: 6, color: p.accent }}>{row.time}</Text>
                  ) : null}
                </View>
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <MealText items={cellsFor(row, i)} isConst={row.uniform} p={p} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
