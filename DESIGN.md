---
name: Don Quijote de las Finanzas
description: Editorial financial interface in navy, warm gold and off-white. Product-first, restrained, data-aware and recognisably QuijoteFinanzas rather than generic fintech/SaaS.
---

# Design System

## Design Direction
QuijoteFinanzas should feel like a modern financial publication with interactive tools: calm, precise and premium without looking luxurious for its own sake.

The homepage is editorial and product-led. Functional sections such as QuijoCuentas, QuijoLista, QuijoCartera and calculators may use cards, filters and data-dense UI when those components help the task. Do not force the homepage styling onto functional tools where it harms usability.

## Brand Anchors
- **Navy:** authority, readability and primary actions.
- **Warm gold:** restrained accent, emphasis and brand recognition.
- **White / very light neutral:** primary editorial canvas.
- **Playfair Display:** editorial display/headline voice.
- **DM Sans:** neutral, highly readable interface/body voice.
- **Round Don Quijote logo:** brand mark; use deliberately, not repeatedly as decoration.

The current Playfair Display + DM Sans pairing is intentional. Do not replace it merely because a detector classifies Google Fonts or popular typefaces as generic.

## Typography
### Display / headings
Use Playfair Display for major editorial headings and section titles.
- Hero H1: large, compact line-height, left aligned on desktop.
- Section H2: clear step down from hero; avoid making every section feel like another hero.
- Use sentence case for headings unless a small eyebrow intentionally uses uppercase.

### Body / UI
Use DM Sans for paragraphs, navigation, controls, labels and data UI.
- Body text should normally be 14-17px depending on context.
- Functional UI text must be at least 11px; prefer 12px or more whenever space allows.
- Body and explanatory text should normally be at least 12-14px; primary body copy remains 14-17px.
- Important explanatory text should normally be at least 12-13px.
- Do not use tiny text to make dense layouts fit; simplify or reflow instead.

### Microcopy
Eyebrows and metadata may use uppercase with tracking, but sparingly. Avoid stacking multiple all-caps badges/pills.

## Color
Use the existing site variables/tokens where possible rather than introducing one-off colours.

Core intent:
- primary navy: `#0f2035` family;
- gold accent: `#c9a84c` family;
- light canvas: white / subtle cool neutral;
- body copy: blue-gray with AA contrast;
- dark mode: deep navy surfaces, warm-gold focus/accent, light neutral text.

Gold is an accent, not a fill colour for large surfaces. Avoid gold-on-white for body-size text unless contrast is verified.

## Homepage Composition
### Hero
- Left aligned and asymmetric.
- The brand logo may appear near the hero identity at a meaningful size.
- Keep the claim `Menos ruido. Más criterio.` as a single distinctive brand statement.
- Avoid a generic category pill such as `FINANZAS PERSONALES` above the H1.
- Maximum two primary hero actions.
- Show the real product immediately using authentic screenshots from the live interface.

### Homepage Product Screenshots
Only use real captures/components derived from the current website data.
- QuijoCuentas: real entities, real current ranking/conditions and entity logos when available.
- QuijoCartera: use real composition such as individual equities with logos/names and weights.
- Never display absolute euro amounts in QuijoCartera screenshots.
- Do not fabricate returns, volatility, portfolio values or risk labels for visual appeal.
- Keep screenshots legible enough to communicate product reality, but they are supporting visuals rather than the only way information is conveyed.

### Entry paths
The `Compara / Calcula / Aprende` structure is intentionally editorial rather than a grid of decorative cards.
- Columns should have equal structural rhythm.
- Link rows and arrows align across columns.
- Avoid unequal row heights caused by copy when a simple grid alignment solves it.

### About / principles
Keep concise. The homepage should not duplicate the full `Sobre el proyecto` page.
Use proof through concrete practices: sources, visible assumptions, dates and referral disclosure.

### Newsletter + contact
Keep newsletter capture visible but not intrusive.
- Concrete copy: explain what subscribers will receive.
- No artificial urgency or vague promises.
- Contact and social links should be real and verified.
- X: `@QuijoteFinanzas` is a core network link.
- Do not add an unverified social URL merely to fill a layout.

## Cards and Containers
Cards are functional components, not the default layout primitive.

Good uses:
- a bank/product comparison card;
- calculator input/result panels;
- a modal or focused task surface;
- portfolio detail blocks.

Avoid:
- three/four identical marketing cards under every heading;
- cards nested inside cards without hierarchy;
- decorative rounded icon tiles above every title;
- large areas made only of bordered white rectangles.

Prefer editorial rules, whitespace, typography and aligned lists on the homepage.

## Pills, Badges and Chips
Use only when they encode real state or metadata: category, active filter, expiry/status, verified label, etc.
Do not use pills only to make a section look designed.

## Icons and Emoji
Use simple line/glyph icons or real product/entity logos when helpful.
Avoid emoji as decorative feature icons in primary navigation, hero content or major homepage headings.
Emoji may remain inside content when it carries editorial meaning and is not the visual system.

## Imagery
Prefer:
1. real screenshots of QuijoteFinanzas tools;
2. real financial/product visuals with a clear purpose;
3. diagrams/charts generated from verified data.

Avoid generic stock finance photography and AI-generated fake dashboards.

## Interaction
- Hover states should be subtle: small translation, border/contrast change, modest shadow.
- All controls must have an explicit `:focus-visible` state.
- Do not remove outlines without supplying an equivalent accessible focus treatment.
- Respect `prefers-reduced-motion` globally.
- Avoid scroll-jacking, parallax, excessive entrance animations and decorative motion.

## Spacing and Rhythm
Prefer generous editorial whitespace over decorative separators.
Use a consistent vertical rhythm and align related components to common baselines.

Desktop:
- maximum content width around 1180px for the homepage editorial canvas;
- two-column hero may use an intentionally asymmetric ratio;
- three-column path sections must align rows consistently.

Mobile:
- stack content naturally;
- do not preserve desktop overlap if it makes screenshots unreadable;
- forms become single-column;
- maintain comfortable edge padding (roughly 18-20px);
- keep primary actions easy to tap.

## Borders, Radius and Shadow
- Borders: light, low-contrast structural separators.
- Radius: moderate (roughly 6-14px depending on component), not pill-shaped by default.
- Shadows: reserved for floating/overlapping product captures and overlays; avoid shadow on every card.

## Copy Style in UI
Use concrete, factual Spanish.

Prefer:
- `Te escribiré cuando publique una herramienta nueva...`
- `TAE, límites, plazo y condiciones`
- `Composición publicada únicamente en porcentajes`

Avoid repeated pseudo-profound rhythms:
- `Sin ruido. Sin spam. Sin vueltas.`
- `No es X. Es Y.` repeated across sections.

Necessary financial disclaimers are not decorative copy and should remain where useful. Keep them concise and precise.

## Data UI
- Align numbers consistently.
- Percentages must correspond to current source data.
- Do not use colour as the only indicator of positive/negative/status.
- Make important conditions more prominent than decorative metadata.
- Dates of review/expiry should be visible when freshness matters.

## QuijoCartera Visual Rules
- Public data shown in percentages unless explicitly approved otherwise.
- Never show portfolio absolute euro values publicly.
- Do not label the user with an invented portfolio risk profile.
- Homepage capture: names/logos + weights is the preferred format.
- Charts should be simple, clean and exact; avoid unnecessary labels and ornament.

## Dark Theme
Dark mode is supported and should retain the same hierarchy rather than becoming a neon fintech theme.
- deep navy, not pure black;
- gold remains restrained;
- avoid glowing effects;
- verify muted text contrast.

## Accessibility
- WCAG 2.1 AA target.
- Body-size text on light surfaces must reach at least 4.5:1 contrast; use darker gold/blue-gray text variants while keeping brand gold for borders, fills and decoration.
- Visible keyboard focus on every interactive control.
- Semantic buttons for actions and anchors for navigation where practical.
- Images have useful alt text when informative; decorative images use empty alt.
- Forms have accessible labels/names and live feedback where required.
- Reduced-motion preference is respected.

## Performance
- Homepage screenshots should be compressed WebP/AVIF and dimensioned explicitly.
- Avoid adding frontend frameworks or large UI dependencies for a static interaction that can be implemented in existing HTML/CSS/JS.
- Keep the static GitHub Pages architecture unless there is a clear product reason to change it.

## Anti-patterns for QuijoteFinanzas
Do not introduce:
- generic SaaS gradient/glass heroes;
- decorative category pill above the hero H1;
- testimonial cards without verifiable attribution/context;
- unfinished `Próximamente` items in prominent homepage grids;
- fake dashboard screenshots or placeholder metrics;
- absolute portfolio euro amounts;
- affiliate prominence that changes editorial ranking;
- repeated emoji feature tiles;
- unnecessary carousel/slider behaviour;
- new design systems that fight the current navy/gold/editorial language.

## Review Checklist
Before shipping a visual change:
1. Does it help the user understand or act?
2. Is it real/current, or merely decorative?
3. Does it preserve the editorial hierarchy?
4. Is text readable at mobile sizes?
5. Are keyboard focus and reduced motion handled?
6. Does the component work in light and dark themes?
7. Does it add another card/pill when typography or whitespace would be enough?
8. Are financial data, dates and assumptions accurate?
9. Does QuijoCartera remain percentage-only publicly?
10. Would this still look intentional if the Impeccable/anti-slop score did not exist?
