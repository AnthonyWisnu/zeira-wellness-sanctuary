---
name: Sanctuary Tactile Atelier
colors:
  surface: '#fcf9f3'
  surface-dim: '#dcdad4'
  surface-bright: '#fcf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ed'
  surface-container: '#f0eee8'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e5e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#424843'
  inverse-surface: '#31312d'
  inverse-on-surface: '#f3f0ea'
  outline: '#727973'
  outline-variant: '#c2c8c1'
  surface-tint: '#486552'
  primary: '#0a2718'
  on-primary: '#ffffff'
  primary-container: '#213d2c'
  on-primary-container: '#89a892'
  inverse-primary: '#aeceb7'
  secondary: '#7a581c'
  on-secondary: '#ffffff'
  secondary-container: '#fed088'
  on-secondary-container: '#79571b'
  tertiary: '#042815'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c3e29'
  on-tertiary-container: '#85a98e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#caebd2'
  primary-fixed-dim: '#aeceb7'
  on-primary-fixed: '#042012'
  on-primary-fixed-variant: '#304d3b'
  secondary-fixed: '#ffdead'
  secondary-fixed-dim: '#ecbf79'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#5f4104'
  tertiary-fixed: '#c5ecce'
  tertiary-fixed-dim: '#aad0b3'
  on-tertiary-fixed: '#00210f'
  on-tertiary-fixed-variant: '#2c4e38'
  background: '#fcf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e5e2dc'
typography:
  headline-xl:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Syne
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Syne
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-lg: 2rem
  margin: 1.25rem
  margin-md: 2rem
  margin-lg: 3.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a neo-classical skeuomorphic aesthetic built for high-DPI modern displays. It marries the tactile, handcrafted material reality of heritage Apple interface craft (iOS 6 / OS X Mavericks precision) with contemporary layout clarity, sub-pixel rendering, and organic wellness luxury.

The emotional signature is grounding, serene, opulent, and physically reassuring. It delivers immediate tactile feedback through optical depth cues: crisp specular bevels, dual-source lighting (an overhead key light casting soft ambient drops and subtle top-edge rim catchlights), debossed troughs, and sculpted physical toggles. The digital interface behaves like physical instruments of polished brass, debossed unbleached Japanese cotton paper, brushed alabaster stone, and deep botanical moss-dyed leather.

## Colors

The color palette is calibrated around organic mineral tones and warm natural substrates, avoiding clinical artificial white or cold monochromatic slate.

- **Canvas & Backing Neutral (`#F2EFE9`):** A warm, fine-linen alabaster neutral that acts as the physical surface onto which cards and controls are mounted or debossed.
- **Surface Plate (`#FAF8F5`):** Raised container surface with ultra-high reflectance to create convex dimension against the canvas.
- **Primary Accent (`#213D2C`):** Lustrous Forest Moss. Used for primary elevated buttons, active badge seals, and dominant interactive anchors.
- **Secondary Accent (`#C49B58`):** Brushed Champagne Brass. Employed for specular trims, metallic hardware details, luxury foil accents, and active focus rings.
- **Tertiary Accent (`#3A5C45`):** Alpine Verdant. Supports state highlights, secondary indicators, and soft botanical gradients.
- **Text & Contrast (`#181C19`):** Obsidian Charcoal. Provides legibility while avoiding digital harshness. Accompanied by sub-pixel light embossing (`text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7)` on light elements, and `text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.45)` on deep verdant elements).

## Typography

The type system blends the sculpted, organic display character of Syne with the humanist clarity and optical balance of Plus Jakarta Sans. 

- **Display & Headlines:** Rendered in Syne to deliver an architectural, bespoke aesthetic. Headlines on light paper cards leverage a subtle upward reflection (`0 1px 0 rgba(255, 255, 255, 0.8)`) to mimic debossed letterpress printing.
- **Body & Controls:** Plus Jakarta Sans provides crisp legibility at compact sizes across varying physical device densities. 
- **Labels & Micro-copy:** Uppercase metadata and badge indices utilize heightened tracking (`0.04em` to `0.06em`) with semi-bold weights, simulating metallic stamp engraving or cast brass typography.

## Layout & Spacing

The layout is governed by a fluid responsive 12-column grid anchored by tactile frame enclosures. Content blocks simulate physical tablets, panels, and cards floating above or mounted into the master canvas.

- **Breakpoints:**
  - **Compact (Mobile: &lt; 768px):** 4-column layout, `margin` of `1.25rem`, `gutter` of `1.25rem`. Elements pack into unified vertical cards mimicking physical handheld passbooks.
  - **Medium (Tablet: 768px – 1024px):** 8-column layout, `margin-md` of `2rem`, `gutter` of `1.5rem`.
  - **Expanded (Desktop: &gt; 1024px):** 12-column layout, max-width constrained to `1280px` with dynamic outer margins starting at `margin-lg` (`3.5rem`) and `gutter-lg` (`2rem`).

- **Internal Rhythm:** Internal component structures utilize the `space-*` scale to preserve mechanical proportionality. Recessed control wells and card interiors must maintain uniform padding across vertical and horizontal planes (`space-md` or `space-lg`) to preserve the illusion of structural bevel walls.

## Elevation & Depth

Depth is tactile, physical, and optical, constructed through an invariant directional key light oriented at 90 degrees (top-down):

1. **Convex Raised Surfaces (Resting Cards, Extruded Buttons):**
   - Outer soft ambient shadow: `0 8px 24px -4px rgba(28, 48, 36, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)`.
   - Structural rim border: `1px solid rgba(255, 255, 255, 0.6)`.
   - Upper specular highlight: `box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)`.
   - Lower bevel shelf: `box-shadow: inset 0 -1px 1px 0 rgba(0, 0, 0, 0.06)`.

2. **Concave Recessed Surfaces (Input Fields, Wells, Pressed Elements):**
   - Top inner cast shadow: `box-shadow: inset 0 2px 4px 0 rgba(24, 28, 25, 0.12), inset 0 1px 2px 0 rgba(0, 0, 0, 0.08)`.
   - Bottom reflection rim: `box-shadow: inset 0 -1px 1px 0 rgba(255, 255, 255, 0.8)`.
   - Background shift: Subtle linear gradient tinted downward (`linear-gradient(180deg, #EBE7DF 0%, #F5F3ED 100%)`).

3. **Floating Overlays & Dialogs (Frosted Specular Glass):**
   - Translucent multi-surface backdrop: `backdrop-filter: blur(20px) saturate(180%)`.
   - Background tint: `rgba(250, 248, 245, 0.82)`.
   - Double outer drop shadow: `0 20px 40px -8px rgba(20, 32, 24, 0.18), 0 0 1px 1px rgba(255, 255, 255, 0.9)`.

## Shapes

The design system uses level `2` roundedness to invoke smooth, pebble-like ergonomics while retaining mechanical structure.

- **Base Radius (`rounded-md`, 0.5rem / 8px):** Applied to compact controls, switches, tags, and small utility badges.
- **Large Radius (`rounded-lg`, 1rem / 16px):** Applied to primary cards, modal dialogs, and tactile action sheets.
- **Extra Large Radius (`rounded-xl`, 1.5rem / 24px):** Applied to major sanctuary treatment containers, wellness passport vouchers, and heroic card envelopes.
- **Pill Architecture (`rounded-full`):** Reserved exclusively for segmented toggles, pill badges, and floating bottom action controllers.

## Components

### 1. Buttons
- **Primary Tactile Button:** Deep Forest Moss (`#213D2C`) background gradient (`linear-gradient(180deg, #2D523B 0%, #1B3324 100%)`). Top border highlighted with a 1px specular catch (`inset 0 1px 0 rgba(255, 255, 255, 0.3)`), bottom edge reinforced with structural compression shadow (`inset 0 -1px 0 rgba(0, 0, 0, 0.4)`). Exterior drop: `0 4px 10px rgba(27, 51, 36, 0.3)`. Text: `#FAF8F5` with `0 -1px 0 rgba(0, 0, 0, 0.5)` letterpress shadow.
- **Pressed State:** Instantaneous reduction of drop shadow, gradient flip (`linear-gradient(180deg, #182C20 0%, #23422F 100%)`), and inset depth (`inset 0 2px 4px rgba(0, 0, 0, 0.4)`), translating the element down `1px`.
- **Secondary (Alabaster Ceramic):** `#FAF8F5` surface with `linear-gradient(180deg, #FFFFFF 0%, #F0EDE4 100%)`, 1px gold/brass border (`#C49B58` at 30% opacity), and inset white specular rim.

### 2. Tactile Switches & Toggles
- **Track (Trough):** Recessed inner trough with `inset 0 2px 4px rgba(0, 0, 0, 0.2)` and a soft bottom light rim `0 1px 0 rgba(255, 255, 255, 0.8)`. Muted cream stone when inactive, transitioning to deep moss green when active.
- **Thumb (Mechanical Knob):** Raised ivory sphere with an overhead directional specular gradient, wrapped in a faint brass outer bezel (`box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25), inset 0 1px 0 #FFFFFF`).

### 3. Cards & Panels
- **Sanctuary Treatment Card:** Grounded on `#FAF8F5` with fine 1px rim outline (`rgba(255, 255, 255, 0.8)` on top, `rgba(200, 195, 185, 0.4)` on sides/bottom). Outer soft ambient drop shadow.
- **Pass / Ticket Voucher:** Cards feature decorative semi-circular punch-hole perforations along dividing lines with subtle inset shading along cut edges, accompanied by an ultra-fine champagne metallic stamp accent (`#C49B58`).

### 4. Input Fields
- Recessed into the canvas. Background: `linear-gradient(180deg, #EBE8E1 0%, #F5F3ED 40%)`.
- Inner shadow: `inset 0 2px 3px rgba(0, 0, 0, 0.12), inset 0 0 1px rgba(0, 0, 0, 0.1)`. Bottom exterior shelf highlight: `0 1px 0 rgba(255, 255, 255, 0.9)`.
- Focus State: Replaces neutral border with a dual glow—an inset brass glow (`inset 0 0 0 1px #C49B58`) paired with an external champagne aura (`0 0 0 3px rgba(196, 155, 88, 0.2)`).

### 5. Checkboxes & Radio Controls
- **Radio Buttons:** Machined brass bezel ring holding an inset pearl center. When selected, an emerald-jeweled dot with a top gloss highlight fills the well.
- **Checkboxes:** Square with `rounded-sm` corners, concave debossed resting state, filling with Forest Moss upon selection with a crisp, embossed white check mark.

### 6. Chips & Badges
- **Physical Wax / Metal Seal Badge:** Circular or pill element with embossed Syne typography, bordered by a double hairline rim simulating stamped brass foil or pressed botanical wax.
- **Filter Chips:** Convex alabaster button when unselected; debossed concave linen state with moss-green typography when activated.