# README artwork — visual specification and provenance

These assets are not decoration. Every colour, stroke, radius and label in them is
derived from code that ships in this repository, and the first two compositions use
screenshots captured from the running Android app. The documentation and the product
therefore share one visual system rather than merely a mood.

If you change the app's design tokens or the payment stages, update these files too.

## Where the design system comes from

| Element | Source of truth |
|---|---|
| Colour | [`src/theme/tokens.ts`](../../src/theme/tokens.ts) |
| Stroke grid, line caps, icon shapes | [`src/components/ui/Icon.tsx`](../../src/components/ui/Icon.tsx) |
| Ascent motif (chevrons + progress arc) | [`src/components/AscentIndicator.tsx`](../../src/components/AscentIndicator.tsx) |
| Payment stage labels | [`src/screens/PaymentStatusScreen.tsx`](../../src/screens/PaymentStatusScreen.tsx) |
| Signing boundary | [`src/services/solana.ts`](../../src/services/solana.ts) (`buildSigner`) |
| Fee payer / cluster resolution | [`src/services/gasstationAdapter.ts`](../../src/services/gasstationAdapter.ts) |

## Palette

Copied verbatim from `tokens.ts`. The contrast ratios are the ones measured in that
file against the `#071922` canvas. Do not introduce a colour that is not in this table.

| Token | Hex | Contrast | Use in artwork |
|---|---|---|---|
| `canvas` | `#071922` | — | Every panel background |
| `surface` | `#0E262F` | 1.14:1 | Cards, phone bodies, diagram nodes |
| `surfaceElevated` | `#132E38` | 1.26:1 | Second-level plates |
| `surfaceHigh` | `#1B3A45` | 1.48:1 | Callouts only |
| `borderHairline` | `#17323C` | 1.33:1 | Contours, grid, dividers |
| `borderStrong` | `#24454F` | 1.74:1 | Node outlines, panel edge |
| `textPrimary` | `#F2EFE9` | 15.62:1 | The ascent line, headlines |
| `textSecondary` | `#9BB0BA` | 7.95:1 | Supporting labels |
| `textMuted` | `#8FA3AD` | 6.84:1 | Metadata, eyebrows |
| `brand` | `#3DBFF2` | 8.48:1 | Waypoints, active emphasis |
| `brandSurface` | `#048ABF` | 4.60:1 | One filled accent per asset |
| `success` | `#87CA9D` | 9.36:1 | Confirmation only |
| `warning` | `#E8B96B` | 9.89:1 | The friction column only |

Rules applied: one cyan focal point per asset; `success` appears only at a genuine
confirmation; `warning` appears only in the "typical crypto payment" column.

## Geometry

- **Stroke ladder** — `1.5` hairline grid and panel edge, `2` node/frame outlines,
  `1.75` iconography (matches the `Icon` default), `3`–`3.5` chevrons and waypoints,
  `3.5` diagram flow lines, `5` the hero ascent line (emphasis rung).
  Weights are set for GitHub's render scale: a README image displays at roughly 55% of
  its `viewBox` width, so anything below `1.5` visually disappears.
- **Line style** — `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"`
  for all line work, inherited from `Icon.tsx`.
- **Radii** — from the token scale only: `10 / 16 / 24 / 28`, pill `999`.
  Panels are `24`, phone frames `28`, nodes `16`.
- **Spacing** — 8px grid. Padding drawn from `16 / 20 / 24 / 32 / 40 / 56`.
- **Panel treatment** — every asset is a single `rx=24` rect filled `#071922` with a
  1px `#24454F` inset border, so it reads as an intentional panel on both light and
  dark GitHub themes without needing theme-swapped duplicates.

## Typography constraint

`src/theme/typography.ts` sets `fontFamily.sans = undefined`; **Manrope and DM Mono are
not present in this repository**. GitHub also renders SVG inside `<img>`, which blocks
`@font-face`, `@import` and every external resource.

Therefore these files **must not name Manrope or DM Mono**. They use generic stacks:

```
ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
```

Text boxes are sized with slack so a substituted face cannot clip. **Every word inside
an image also appears in the README prose** — no image carries load-bearing copy.

## GitHub safety rules

The technical flow remains a static, self-contained SVG:

- no `<script>`, no event handlers, no `<animate>`, no CSS animation
- no external `href`/`xlink:href`, no `@import`, no embedded raster, no tracking
- no `width`/`height` attributes — `viewBox` only, so images scale responsively

Verify with:

```bash
grep -nEi "<script|onload=|onclick=|xlink:href=\"http|href=\"http|<foreignObject|@import|<animate" docs/images/*.svg
```

Zero matches is the passing result.

The root `<svg>` element must also carry a `viewBox` and no `width`/`height`
(child elements such as `<rect>` legitimately use `width`/`height`):

```bash
grep -nE "^<svg[^>]*(width|height)=" docs/images/*.svg
```

Zero matches is the passing result.

## Assets

| File | Role | Aspect |
|---|---|---|
| `hero-product.png` | Thesis. Altude Pay is a consumer-grade showcase of the Altude platform. | 16:9 |
| `consumer-payment-experience.png` | Product story. Familiar payment UX, local signing, and sponsored fees. | 16:9 |
| `payment-flow.svg` | Mechanism. Four lanes and the custody boundary. | 16:10 |

The two marketing compositions are rendered PNGs because GitHub sanitizes
file-linked raster images inside SVGs. Their source captures,
`altude-pay-home.png` and `altude-pay-send.png`, come from the standard Android
34 emulator in mock mode so the artwork shows the real app UI without exposing
credentials or making live network calls.

## Claims discipline

The app stores its demo wallet as **plaintext JSON in AsyncStorage**
([`saveWallet`](../../src/services/storage.ts)). Nothing in these assets may say
"secure", "encrypted", "hardware-backed", or "Keystore". Supportable statements are
limited to: signing happens on the device, the private key is not transmitted to
Altude, and Altude sponsors the network fee.

No uptime, latency, throughput or cost figures appear in any asset, because none are
measured in this repository.
