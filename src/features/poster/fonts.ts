// Shared next/font instances for poster text. The exported `style.fontFamily`
// strings are the *real* font-family names that next/font emits at build time
// (e.g. `__Playfair_Display_abc123`). Using those directly — instead of a
// CSS variable like `var(--font-poster-editorial)` — is critical for the
// SVG/foreignObject export path: the exported <img> renders in its own
// document where CSS variables defined on the page don't reach, so any
// `var(...)` fontFamily silently falls back to the browser default.
import {
  Bebas_Neue,
  Caveat,
  Permanent_Marker,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-poster-editorial",
  display: "swap",
});
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-poster-studio",
  display: "swap",
});
const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-poster-street",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poster-soft",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poster-body",
  display: "swap",
});

const CN_FALLBACK = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei'";

export const posterFontFamilies = {
  editorial: `${playfairDisplay.style.fontFamily}, Fraunces, Georgia, ${CN_FALLBACK}, serif`,
  studio: `${bebasNeue.style.fontFamily}, Impact, 'Arial Narrow', ${CN_FALLBACK}, sans-serif`,
  street: `${permanentMarker.style.fontFamily}, Caveat, ${CN_FALLBACK}, cursive`,
  soft: `${caveat.style.fontFamily}, Fraunces, ${CN_FALLBACK}, cursive`,
  body: `${spaceGrotesk.style.fontFamily}, Inter, ${CN_FALLBACK}, system-ui, sans-serif`,
} as const;

// className that activates all five fonts (still useful for the editor preview
// scope so the CSS variables resolve too — keeps the rest of the page intact).
export const posterFontClassName = [
  playfairDisplay.variable,
  bebasNeue.variable,
  permanentMarker.variable,
  caveat.variable,
  spaceGrotesk.variable,
].join(" ");
