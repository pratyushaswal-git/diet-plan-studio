import { Circle, Path, Rect, Svg } from "@react-pdf/renderer";

// Small inline icons for the PDF, ported from the locked design's ICON map.
// `stroke` icons take a color; filled icons (play/spark/arrow/check) too.
type IconProps = { size?: number; color: string };

export function GlobeIcon({ size = 9, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} fill="none" />
      <Path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

export function InstaIcon({ size = 9, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Rect x="3" y="3" width="18" height="18" rx="5" stroke={color} strokeWidth={2} fill="none" />
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={2} fill="none" />
      <Circle cx="17.5" cy="6.5" r="1.4" fill={color} />
    </Svg>
  );
}

export function MailIcon({ size = 9, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Rect x="3" y="5" width="18" height="14" rx="2.5" stroke={color} strokeWidth={2} fill="none" />
      <Path d="M4 7l8 6 8-6" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

export function PhoneIcon({ size = 9, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path
        d="M6.6 10.8a13 13 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.24 1z"
        fill={color}
      />
    </Svg>
  );
}

export function PlayIcon({ size = 9, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path d="M8 5v14l11-7z" fill={color} />
    </Svg>
  );
}

export function ArrowIcon({ size = 9, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={2.5} fill="none" />
    </Svg>
  );
}

export function SparkIcon({ size = 12, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" fill={color} />
    </Svg>
  );
}

export function CheckIcon({ size = 8, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path d="M5 12l5 5 9-10" stroke={color} strokeWidth={3} fill="none" />
    </Svg>
  );
}
