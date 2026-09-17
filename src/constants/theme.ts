export const colors = {
  bg: "#0B0B0C",
  surface: "#151517",
  elevated: "#1D1D20",
  line: "#2A2A2E",
  text: "#F4F1EA",
  muted: "#9A968C",
  faint: "#5E5B55",
  gold: "#C8A15A",
  goldLight: "#E6CB8F",
  goldDeep: "#8C6B32",
  onGold: "#140F06",
  danger: "#E0706A",
  success: "#7CC49A",
  warning: "#E3B55B",
} as const;

export const fonts = {
  display: "CormorantGaramond_600SemiBold",
  displayBold: "CormorantGaramond_700Bold",
  displayItalic: "CormorantGaramond_500Medium_Italic",
  body: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 } as const;

export const tierStyle = {
  SILVER: { label: "Silver", colors: ["#3A3A3F", "#1B1B1E"] as const, accent: "#C9CCD1" },
  GOLD: { label: "Gold", colors: ["#5B4521", "#1E170C"] as const, accent: "#E6CB8F" },
  BLACK: { label: "Black", colors: ["#26262A", "#050505"] as const, accent: "#C8A15A" },
} as const;
