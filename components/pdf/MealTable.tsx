import { Text, View } from "@react-pdf/renderer";

import { WEEKDAYS } from "@/lib/types";
import type { BrandTheme, CellItem, ScheduleRow } from "@/lib/types";

const LABEL_WIDTH = 84;

function CellContent({ items, ink }: { items: CellItem[]; ink: string }) {
  if (items.length === 0) return <Text style={{ color: ink, opacity: 0.3 }}>—</Text>;
  return (
    <View style={{ gap: 2 }}>
      {items.map((it, i) => (
        <Text key={i} style={{ color: ink, lineHeight: 1.25 }}>
          {it.text}
        </Text>
      ))}
    </View>
  );
}

export function MealTable({ rows, theme }: { rows: ScheduleRow[]; theme: BrandTheme }) {
  const border = `1px solid ${theme.accent}`;
  const cellPad = { paddingVertical: 4, paddingHorizontal: 5 };

  return (
    <View style={{ marginTop: 10, borderTop: `1px solid ${theme.primary}`, borderLeft: border }}>
      {/* Header row — repeats on every page */}
      <View fixed style={{ flexDirection: "row" }}>
        <View style={{ width: LABEL_WIDTH, backgroundColor: theme.primary, borderRight: border, ...cellPad }}>
          <Text style={{ color: theme.surface, fontWeight: 700, fontSize: 8 }}>Meal</Text>
        </View>
        {WEEKDAYS.map((d) => (
          <View key={d} style={{ flex: 1, backgroundColor: theme.primary, borderRight: border, ...cellPad }}>
            <Text style={{ color: theme.surface, fontWeight: 700, fontSize: 8, textAlign: "center" }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Body rows — never split a row across a page break */}
      {rows.map((row, idx) => {
        const zebra = idx % 2 === 0 ? theme.surface : theme.bg;
        return (
          <View key={idx} wrap={false} style={{ flexDirection: "row", borderBottom: border }}>
            <View style={{ width: LABEL_WIDTH, backgroundColor: theme.bg, borderRight: border, ...cellPad }}>
              <Text style={{ color: theme.ink, fontWeight: 500 }}>{row.label}</Text>
              {row.time ? <Text style={{ color: theme.muted, fontSize: 7, marginTop: 1 }}>{row.time}</Text> : null}
            </View>

            {row.uniform ? (
              <View
                style={{
                  flex: 7,
                  backgroundColor: zebra,
                  borderRight: border,
                  justifyContent: "center",
                  ...cellPad,
                }}
              >
                <CellContent items={row.uniformCell ?? []} ink={theme.ink} />
              </View>
            ) : (
              WEEKDAYS.map((d) => (
                <View key={d} style={{ flex: 1, backgroundColor: zebra, borderRight: border, ...cellPad }}>
                  <CellContent items={row.cells?.[d] ?? []} ink={theme.ink} />
                </View>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}
