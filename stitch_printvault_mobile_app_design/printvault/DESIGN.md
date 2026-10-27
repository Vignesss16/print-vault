---
name: PrintVault
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#454556'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#767588'
  outline-variant: '#c6c4d9'
  surface-tint: '#403ff6'
  primary: '#1e0cde'
  on-primary: '#ffffff'
  primary-container: '#3d3bf3'
  on-primary-container: '#d1d0ff'
  inverse-primary: '#c0c1ff'
  secondary: '#5e5d66'
  on-secondary: '#ffffff'
  secondary-container: '#e1dee8'
  on-secondary-container: '#63626a'
  tertiary: '#434256'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b596e'
  on-tertiary-container: '#d5d1ea'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2215e0'
  secondary-fixed: '#e4e1eb'
  secondary-fixed-dim: '#c8c5cf'
  on-secondary-fixed: '#1b1b22'
  on-secondary-fixed-variant: '#47464e'
  tertiary-fixed: '#e3e0f9'
  tertiary-fixed-dim: '#c7c4dd'
  on-tertiary-fixed: '#1b1a2c'
  on-tertiary-fixed-variant: '#464559'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0.08em
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
---

## Brand & Style

This design system defines an understated, high-trust consumer utility for secure, ephemeral document rendering. The aesthetic departs sharply from clichéd "cybersecurity" motifs—abandoning dark terminals, glowing greens, and aggressive warnings—in favor of a warm, tactile, high-craft editorial sensibility influenced by Apple Wallet, Cash App, and Notion Calendar.

The core design personality is calm, reassuring, and deliberate. Interfaces feel like handled archival paper meeting contemporary high-end industrial software. Every interaction reinforces safety and finality without panic: users feel confident handing over sensitive physical artifacts because the system projects quiet authority, clarity, and precision.

## Colors

The palette operates in strict light mode. Surfaces rely on a warm natural paper base (`#FAF8F4`) layered over with pure white (`#FFFFFF`) card containers, preventing the sterile glare of clinical interfaces. 

### Core Palette
- **Canvas Base:** `#FAF8F4` (warm archival ground).
- **Surface Cards:** `#FFFFFF` (crisp white containers).
- **Surface Border:** `#ECE8E1` (fine 1px hair-line outline).
- **Text Ink:** `#16161D` (softened near-black ink for primary content).
- **Text Secondary:** `#6B6760` (warm charcoal for metadata, subtitles, and labels).
- **Primary Brand Accent:** `#3D3BF3` (electric ultramarine blue; used selectively for primary actions, secure links, and active authorizations).

### Semantic Soft Pastel Spectrum
Pastels are applied as solid low-saturation pills, indicator tags, and card headers, paired directly with darkened contextual typography:
- **Active / Processing:** `#E9E5FF` (lavender) with `#2E2A72` text.
- **Completed / Safe:** `#DDF5E6` (mint) with `#174E2B` text.
- **Waiting / Expiring:** `#FFE6D6` (soft peach) with `#6E2E0A` text.
- **Notice / Guidance:** `#FFF3C4` (butter yellow) with `#594600` text.
- **Critical Action:** `#F0445B` (coral red; strictly limited to destructive flows such as revoking immediate printing permissions or instant shredding).

## Typography

Typography establishes an intentional contrast between human warmth and cryptographic rigor:
- **Headings (Plus Jakarta Sans):** Geometric, tightly tracked, friendly yet authoritative. Used for page titles, authorization states, and step highlights.
- **Body & Controls (Inter):** Highly legible, neutral workhorse. Applied to legal descriptions, step-by-step instructions, card metadata, and navigation elements.
- **Job Identifiers & Numeric Codes (JetBrains Mono):** Monospaced type is strictly reserved for verification PINs, time-remaining counters, printer hardware serials, and one-time authorization tokens. It must never be used for narrative body text.

## Layout & Spacing

The layout is built for focused, high-clarity single-column and dual-column mobile flows with generous breathing room. 

- **Outer Margins:** Fixed at 24px (`1.5rem`) on mobile viewports to isolate interactive modules from edge friction and device bezels.
- **Card Padding:** Internal card padding is consistently 20px (`1.25rem`), collapsing to 16px (`1rem`) on nested segments.
- **Vertical Rhythm:** Stacked cards and status tiles separate using 16px (`1rem`) gaps. Major procedural sections space out by 24px (`1.5rem`).
- **Responsive Adaptations:** On tablet or wider web inspection modes, content is constrained to a centered 480px maximum content column to preserve the tactile feel of a physical handheld credential.

## Elevation & Depth

Visual hierarchy uses flat, tactile surface stacking rather than pronounced multi-tier shadows. 

- **Base Elevation (Level 0):** Unraised background canvas in `#FAF8F4`.
- **Card Surface (Level 1):** Solid `#FFFFFF` enclosed in an exact `1px solid #ECE8E1` border paired with an ambient soft drop shadow: `0 4px 20px -2px rgba(22, 22, 29, 0.04)`.
- **Floating Controls & Modals (Level 2):** Sheet modals and sticky bottom bars use `#FFFFFF` with an elevated ambient shadow: `0 12px 32px -4px rgba(22, 22, 29, 0.08)` and a subtle `1px solid #ECE8E1` edge. Blur overlays behind bottom sheets apply a light frosted wash (`backdrop-filter: blur(12px); background-color: rgba(250, 248, 244, 0.8)`).

## Shapes

The interface balances soft pill geometry with generous card radiuses to deliver an approachable, gadget-like feel:
- **Cards & Enclosures:** Uniformly `24px` radius, giving documents and authorization modules an organic, pocketable form factor.
- **Buttons & Tags:** Full-pill shaped (`9999px`) across all sizes, communicating frictionless touchpoints.
- **Nested Status Blocks & Input Fields:** `16px` radius for structured internal controls to fit cleanly within 24px parent cards.

## Components

### Buttons
- **Primary Action:** Full pill, `#3D3BF3` background, `#FFFFFF` text, `52px` height, centered `body-lg` (weight 600). Pressed state transitions smoothly to `#2E2CD4`.
- **Secondary Action:** Full pill, `#FFFFFF` background, `1px solid #ECE8E1` border, `#16161D` text. Pressed state shifts background to `#FAF8F4`.
- **Destructive Action:** Full pill, `#F0445B` background with `#FFFFFF` text, or transparent background with `#F0445B` text and hairline border. Reserved strictly for "Revoke Authorization" and "Shred Now".

### Chips & Status Badges
- **Format:** Pill-shaped status indicators with `6px` vertical and `12px` horizontal padding.
- **Variants:** Lavender (`#E9E5FF`), Mint (`#DDF5E6`), Peach (`#FFE6D6`), and Butter Yellow (`#FFF3C4`). Typography uses `label-code-sm` or compact `body-sm` (weight 600) tinted in the matching dark chromatic shade.

### Input Fields
- **Container:** `52px` height, `16px` border-radius, pure white background, `1px solid #ECE8E1`.
- **Focus State:** `1px solid #3D3BF3` with an outer focus halo `0 0 0 3px rgba(61, 59, 243, 0.12)`.
- **Monospace Code Inputs:** Segmented box inputs (`56px x 64px` per digit) featuring large `label-code-lg` text, designed for fast one-time entry of print verification tokens.

### Cards
- **Structure:** Surface white `#FFFFFF`, `24px` corner radius, `1px solid #ECE8E1`, and `20px` internal padding.
- **Secure File Card:** Features a top pastel category bar (e.g., lavender for "Queued for Print"), an embedded PDF metadata row, a high-contrast one-time job code, and a live countdown timer.

### Checkboxes & Radios
- **Checkboxes:** `20px` square with `6px` rounded corners. Unchecked has a `1.5px solid #ECE8E1` border; checked fills with `#3D3BF3` displaying a crisp white 2px stroke checkmark.
- **Radio Buttons:** `20px` circular bounds with an inner `#3D3BF3` solid center dot when selected.

### Iconography
- Consistent `2px` stroke weight using linear geometric iconography (Lucide / Phosphor aesthetic). Icons maintain optical alignment alongside text labels and are drawn using `#16161D` or `#6B6760`.