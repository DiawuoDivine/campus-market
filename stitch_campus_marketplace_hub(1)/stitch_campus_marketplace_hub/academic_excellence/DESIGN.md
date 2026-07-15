---
name: Academic Excellence
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5a413d'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8e706c'
  outline-variant: '#e2bfb9'
  surface-tint: '#b22b1d'
  primary: '#570000'
  on-primary: '#ffffff'
  primary-container: '#800000'
  on-primary-container: '#ff8371'
  inverse-primary: '#ffb4a8'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#002f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#004800'
  on-tertiary-container: '#53be42'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#8f0f07'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#8dfb77'
  tertiary-fixed-dim: '#72de5e'
  on-tertiary-fixed: '#002200'
  on-tertiary-fixed-variant: '#005300'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Source Sans 3
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
---

## Brand & Style

The design system is engineered for academic prestige, research integrity, and institutional longevity. It targets a scholarly audience including researchers, faculty, and high-achieving students who require a focused environment for deep work and administrative precision.

The aesthetic follows a **Corporate / Modern** approach with a heavy emphasis on **Traditional Institutional** cues. It balances the weight of heritage with the clarity of modern digital interfaces. The visual language evokes an emotional response of authority, stability, and intellectual rigor. High whitespace is used not for minimalism, but for clarity and "breathing room" within dense information environments.

## Colors

The palette is rooted in a traditional collegiate identity. 
- **Maroon (#800000)**: Used as the primary brand anchor for headers, primary actions, and institutional branding. It signifies authority and history.
- **Gold (#FFD700)**: Utilized sparingly as a decorative accent and to highlight excellence (e.g., honors, featured status). It must always be paired with dark text or maroon backgrounds to ensure AA accessibility.
- **Green (#008000)**: Reserved strictly for success states, verified credentials, and positive feedback loops.
- **Grayscale**: A range of cool grays provides structural containment. Pure white (#FFFFFF) is the primary workspace background to maintain a "paper-like" clarity.

Contrast ratios must strictly adhere to WCAG 2.1 Level AA standards, particularly when layering Maroon or Gold against light surfaces.

## Typography

This design system employs a sophisticated serif-sans pairing to bridge the gap between traditional publishing and modern software.

- **Source Serif 4** is the editorial voice. It is used for headlines and display text to provide an authoritative, book-like quality that is highly readable and professional.
- **Source Sans 3** serves as the workhorse for interface elements, body text, and data entry. Its neutral, utilitarian character ensures that the interface stays out of the way of the content.

Maintain generous line heights (1.5x - 1.6x for body text) to assist with long-form reading and academic comprehension.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for desktop to ensure content density remains readable and consistent across varying monitor sizes. 

- **Grid**: A 12-column grid system is used for desktop (1280px max-width).
- **Rhythm**: An 8px linear scale governs all spacing.
- **Adaptive Rules**: 
    - **Desktop**: Content is centered with 64px margins and 24px gutters.
    - **Tablet**: Transitions to a fluid 8-column grid with 32px margins.
    - **Mobile**: Transitions to a 4-column fluid grid with 16px margins. 

Vertical spacing should be intentional; use larger gaps (48px+) between distinct sections of a research paper or profile to signify a change in context.

## Elevation & Depth

This design system avoids heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. Depth is communicated through structural hierarchy rather than physical simulation.

- **Surface Tiers**: Use `#FFFFFF` for the primary content area and `#F5F5F5` for the background or sidebar. This creates a subtle "sheet" effect.
- **Borders**: Define containers with 1px solid borders in light gray (`#E0E0E0`).
- **Elevation Shadows**: If an element must float (like a dropdown menu or modal), use a single, highly diffused ambient shadow: `0px 4px 20px rgba(0, 0, 0, 0.08)`. Avoid multi-layered shadows to maintain a clean, professional look.

## Shapes

The design system uses **Soft** shapes to provide a subtle modern touch without appearing overly "app-like" or informal.

- **Standard Radius**: 0.25rem (4px) for buttons, input fields, and small components.
- **Large Radius**: 0.5rem (8px) for cards and containers.
- **Extra Large**: 0.75rem (12px) for large modal dialogs.

The sharp-yet-slightly-rounded corners reflect the precision of academic research while remaining approachable.

## Components

- **Buttons**: Primary buttons use a solid Maroon background with White text. Secondary buttons use a Maroon outline with a subtle Gray hover state. "Excellence" actions (e.g., "Submit Thesis") may use a Gold accent border or small icon, but the text must remain high-contrast.
- **Cards**: Cards should be flat with a 1px border. Do not use shadows unless the card is interactive or hovered. Use a 24px internal padding for a spacious, scholarly feel.
- **Input Fields**: Use a traditional "boxed" style with a 1px border. On focus, the border should thicken to 2px and change to Maroon.
- **Chips/Tags**: Use light gray backgrounds with dark gray text for general metadata. Use Maroon backgrounds with White text for "Required" or "Urgent" statuses.
- **Lists**: Lists in academic contexts are often data-heavy. Use subtle horizontal dividers (1px, #EEEEEE) and ensure 12px-16px of vertical padding between items to maintain legibility.
- **Data Tables**: Use Maroon for header backgrounds with White text. Alternate row striping is encouraged using #FAFAFA.