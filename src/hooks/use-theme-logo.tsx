import { useThemeSkin } from "./use-theme-skin";

/**
 * Returns a CSS filter string that tints the brand logo to match the
 * active skin. The base logo asset stays the same so the typography is
 * always crisp - only the hue shifts.
 */
export function useThemeLogoFilter() {
  const { skin } = useThemeSkin();
  switch (skin) {
    case "aurora":
      // orange -> violet
      return "hue-rotate(225deg) saturate(1.15) brightness(1.05)";
    case "blood":
      // orange -> red
      return "hue-rotate(-22deg) saturate(1.5) brightness(0.95)";
    case "midnight":
      // orange -> blue
      return "hue-rotate(190deg) saturate(1.2) brightness(1.05)";
    default:
      return "none";
  }
}
