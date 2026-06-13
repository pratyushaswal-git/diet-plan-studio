import { Text, View } from "@react-pdf/renderer";

// Faint diagonal repeating watermark, `fixed` so it tiles on every page.
export function Watermark({ text, color }: { text: string; color: string }) {
  const rows = 7;
  const cols = 3;
  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "column",
        justifyContent: "space-around",
      }}
    >
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flexDirection: "row", justifyContent: "space-around" }}>
          {Array.from({ length: cols }).map((__, c) => (
            <Text
              key={c}
              style={{
                fontFamily: "Mulish",
                fontSize: 16,
                color,
                opacity: 0.05,
                transform: "rotate(-45deg)",
              }}
            >
              {text}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
