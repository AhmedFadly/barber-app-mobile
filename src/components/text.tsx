import { Text as RNText, type TextProps, type TextStyle } from "react-native";

import { colors, fonts } from "@/constants/theme";

const variants = {
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.text, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.text },
  heading: { fontFamily: fonts.display, fontSize: 23, lineHeight: 27, color: colors.text },
  subheading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  muted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  small: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17, color: colors.muted },
  label: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: colors.gold, letterSpacing: 1.8, textTransform: "uppercase" },
  price: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.goldLight },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof variants;

export function Text({ variant = "body", style, ...rest }: TextProps & { variant?: TextVariant }) {
  return <RNText {...rest} style={[variants[variant], style]} />;
}
