---
name: Kinetic Editorial
colors:
  surface: '#11131b'
  surface-dim: '#11131b'
  surface-bright: '#373942'
  surface-container-lowest: '#0c0e16'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#282a32'
  surface-container-highest: '#32343d'
  on-surface: '#e1e2ed'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#e1e2ed'
  inverse-on-surface: '#2e3039'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#d2bbff'
  on-tertiary: '#3f008e'
  tertiary-container: '#8343f4'
  on-tertiary-container: '#f7edff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#11131b'
  on-background: '#e1e2ed'
  surface-variant: '#32343d'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-md:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  mono-tag:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  section: 96px
---

## Brand & Style
The design system is engineered for a high-fidelity, premium digital magazine experience that bridges the gap between traditional editorial authority and futuristic technology. The brand personality is sophisticated, visionary, and high-energy.

The visual language utilizes a "Cyber-Editorial" aesthetic—combining the structured, grid-based discipline of modern publishing with the immersive depth of **Glassmorphism** and **High-Contrast Neon** accents. The UI should evoke a sense of deep focus and premium craftsmanship, utilizing translucent layers and vibrant light-leaks to guide the reader's eye through long-form content.

## Colors
The palette is rooted in a "Deep Space" black foundation to maximize the luminosity of the accent colors. 

- **Primary Electric Blue** is used for critical calls to action and navigational states.
- **Secondary Neon Cyan** functions as a high-frequency accent for interactive cues and progress indicators.
- **Tertiary Highlight Purple** is reserved for premium "Member Only" content markers and editorial highlights.
- **Surface & Borders** use low-chroma navy-greys to maintain depth without distracting from the content.

Glow effects should be applied sparingly to maintain a premium feel; they are most effective when paired with hover states or as subtle backdrops for high-priority feature cards.

## Typography
The system uses **Space Grotesk** for all display and heading roles to inject a technical, futuristic edge into the editorial layout. Its geometric quirks provide the "magazine" personality. 

**Inter** serves as the workhorse for body copy and metadata, ensuring maximum legibility during long-form reading sessions. 

- **Display sizes** should use tight tracking to emphasize their impact. 
- **Label-caps** are utilized for category tags and sub-headers to create a clear visual hierarchy. 
- All body text should maintain a generous line height (1.6) to prevent fatigue against the dark background.

## Layout & Spacing
The layout follows a **12-column fixed grid** on desktop (max-width 1320px) with 24px gutters. For editorial immersion, "Breakout" sections are permitted to span the full viewport width.

**Staggered Animation Logic:**
When page elements load, they must follow a top-to-bottom, left-to-right sequence.
- Primary headline reveals first (0ms delay).
- Sub-text reveals second (100ms delay).
- Main image/hero background fades in (200ms delay).
- Grid items (cards) animate in with a +50ms cumulative delay per item.

Use `entry_reveal` for large surface transitions to create a "fluid" feel that mimics high-end motion graphics.

## Elevation & Depth
Depth is achieved through **Glassmorphism** rather than traditional shadows. Surfaces use a layered approach:
1. **Base Layer:** Background (#0A0A0F).
2. **Surface Layer:** Dark tint (#12121A) with 1px border (#1E1E2E).
3. **Floating Layer:** Semi-transparent fill (80% opacity) with a 12px-24px `backdrop-filter: blur()`.

To differentiate active elements, apply a 1px inner-glow or a subtle gradient stroke. High-priority cards should feature a soft "back-glow" using the primary or tertiary colors at 10% opacity to simulate light reflecting off a dark surface.

## Shapes
This design system utilizes **Soft (0.25rem)** roundedness to maintain a professional and structured editorial feel. 

- **Small elements (Tags, Chips):** 0.25rem (4px).
- **Cards & Containers:** 0.5rem (8px).
- **Feature Hero Images:** 0.75rem (12px).
- **Interactive Buttons:** 4px (Soft) to keep a sharp, tech-oriented silhouette.

Avoid pill-shapes or high-radius curves, as they detract from the "premium magazine" authority.

## Components
### Cards
Editorial cards use a "Glass-Inset" style. The image should have a slight zoom-on-hover effect (1.05x). Content overlays must use a gradient scrim (bottom-to-top) to ensure text legibility over diverse imagery.

### Buttons
- **Primary:** Gradient fill (Electric Flow) with white text. On hover, apply `blue_neon` glow.
- **Secondary:** Ghost style with 1px Cyan border. On hover, fill with 10% Cyan opacity.

### Input Fields
Dark backgrounds with #1E1E2E borders. On focus, the border transitions to Neon Cyan with a subtle pulse effect.

### Progress Indicators
Used for "Reading Progress" at the top of articles. Use a thin 2px line with the `electric_flow` gradient.

### Lists & Metadata
Use the `mono-tag` typography for dates, author names, and read-times. Separate items with a 1px vertical divider in #1E1E2E.