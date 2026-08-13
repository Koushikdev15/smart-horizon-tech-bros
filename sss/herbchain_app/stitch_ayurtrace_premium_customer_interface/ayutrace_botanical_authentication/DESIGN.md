---
name: AyuTrace+ Botanical Authentication
colors:
  surface: '#fcf9ee'
  surface-dim: '#dddacf'
  surface-bright: '#fcf9ee'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f4e9'
  surface-container: '#f1eee3'
  surface-container-high: '#ebe8dd'
  surface-container-highest: '#e5e2d8'
  on-surface: '#1c1c15'
  on-surface-variant: '#414942'
  inverse-surface: '#31312a'
  inverse-on-surface: '#f4f1e6'
  outline: '#717971'
  outline-variant: '#c1c9bf'
  surface-tint: '#3b6849'
  primary: '#002410'
  on-primary: '#ffffff'
  primary-container: '#0b3b20'
  on-primary-container: '#77a683'
  inverse-primary: '#a1d2ac'
  secondary: '#2e6a41'
  on-secondary: '#ffffff'
  secondary-container: '#b1f2be'
  on-secondary-container: '#347047'
  tertiary: '#291c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#443000'
  on-tertiary-container: '#c29428'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bcefc7'
  primary-fixed-dim: '#a1d2ac'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#224f32'
  secondary-fixed: '#b1f2be'
  secondary-fixed-dim: '#96d5a3'
  on-secondary-fixed: '#00210d'
  on-secondary-fixed-variant: '#12512c'
  tertiary-fixed: '#ffdea2'
  tertiary-fixed-dim: '#f2bf50'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5c4200'
  background: '#fcf9ee'
  on-background: '#1c1c15'
  surface-variant: '#e5e2d8'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 34px
  headline-md:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system is rooted in the intersection of ancient herbal wisdom and modern traceability science. It targets high-end consumers who value transparency, purity, and the heritage of Ayurvedic medicine. The visual language is **Premium Minimalism** with a **Tactile** organic influence.

The emotional response should be one of immediate calm and absolute trust. By utilizing heavy whitespace, "breathable" layouts, and high-fidelity botanical imagery, the UI feels less like a technical utility and more like a high-end wellness experience. The style avoids harsh digital aesthetics in favor of soft, organic curves and sophisticated, low-contrast layering.

## Colors

The palette is inspired by a lush, sun-drenched botanical garden. 
- **Primary & Secondary:** Deep Forest and Botanical greens provide the "Scientific" anchor, representing the density of nature and the authority of the brand.
- **Backgrounds:** Warm Ivory and Cream replace stark whites to reduce eye strain and evoke the feel of premium textured paper or natural linen.
- **Accents:** Ayurvedic Gold is used sparingly for "Trust" indicators, seals of authenticity, and high-priority CTAs. Sage and Mint provide soft transitional backgrounds for success states or secondary information chips.
- **Text:** To maintain the premium feel, avoid pure black. Use Dark Green-Black for high-contrast headlines and Muted Sage for metadata and secondary labels.

## Typography

This design system utilizes a high-contrast typographic pairing to balance tradition and modern technology.
- **Headlines:** `EB Garamond` provides a literary, authoritative, and historical feel. It should be used for all primary product names, section headers, and "Trust" statements.
- **Body & UI:** `Hanken Grotesk` offers a clean, contemporary contrast. Its precise geometry reflects the "Traceability" and "Scientific" aspect of the brand.
- **Styling:** Use `label-caps` for small eyebrows above headlines to create a sophisticated, editorial hierarchy. Maintain generous line heights to ensure a "calm" reading experience.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with significant emphasis on "Negative Space" to prevent information density from overwhelming the user.

- **Rhythm:** All spacing is derived from an 8px base unit. 
- **Margins:** Use large 48px or 80px vertical margins between major sections to emphasize the premium nature of the content.
- **Grid:** On desktop, use a 12-column grid. On mobile, transition to a single column with 24px horizontal "Safe Area" margins.
- **Reflow:** For traceability data (e.g., batch numbers, harvest dates), use 2-column or 3-column "Data Grids" that stack vertically on mobile devices.

## Elevation & Depth

This design system uses **Tonal Layers** and **Ambient Shadows** rather than sharp borders to define hierarchy.

- **Surface Strategy:** The main background is Warm Ivory. Interactive cards use the slightly lighter Cream surface.
- **Shadows:** Use extremely soft, diffused shadows with a slight green tint (#0B3B20 at 4-6% opacity). This mimics natural light filtered through leaves. Shadows should have a large blur radius (20px+) and minimal offset to appear like they are "floating" gently on the page.
- **Glassmorphism:** For mobile navigation bars or sticky headers, use a "Frosted Cream" effect (Cream color at 80% opacity with a 15px backdrop-blur).
- **Interactive States:** When a user hovers over a card, the elevation should increase subtly, accompanied by a soft 1px "Ayurvedic Gold" inner stroke.

## Shapes

The shape language is defined by **Organic Curves**. 

- **Cards:** To achieve the premium look, cards must use a generous 24px corner radius.
- **Buttons:** Buttons use a softer 12px radius—avoiding hard corners to maintain the "Calm" vibe.
- **Visual Flourishes:** Use soft organic masks (squiggles or leaf-like shapes) for images. Fine-line leaf illustrations should be used as background watermarks or as dividers between sections.
- **Separators:** Instead of straight lines, consider using very subtle, slightly curved paths or "Soft Mint" faded gradients to separate content blocks.

## Components

### Buttons
- **Primary:** Deep Forest Green background, Cream text. 12px border radius.
- **Secondary/Trace:** Ghost style with 1.5px Deep Forest Green border and Gold text.
- **Iconography:** Use "Fine-line" 1.5pt stroke icons.

### Authenticity Cards
- **Traceability Card:** 24px radius, Cream background, soft ambient shadow. Features a "Verified" seal in Ayurvedic Gold in the top-right corner.
- **Botanical Detail Card:** Features high-fidelity photography of the leaf (Neem/Tulsi) with a text overlay in the bottom third using a "Frosted Cream" glassmorphism effect.

### Input Fields
- **Search/Verification Field:** 8px radius, Warm Ivory background with a 1px Muted Sage border. On focus, the border transitions to Deep Forest Green with a soft gold glow.

### Chips & Tags
- **Status Chips:** Fully pill-shaped (100px radius). Use Soft Mint for "Pure/Organic" and Sage Green for "Sustainably Sourced."

### Lists
- **Provenance Timeline:** A vertical line in Sage Green with Gold "Nodes" indicating the product's journey from farm to bottle. Each node should be accompanied by a small leaf-line illustration.

### Additional Elements
- **QR Verification Scan:** A prominent, centrally aligned component with a Gold "Scanning Frame" and helpful text in Muted Sage.