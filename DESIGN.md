---
name: Quick Search
description: A quiet, keyboard-first command surface for Chrome.
colors:
  accent-blue: "#2563eb"
  accent-blue-dark: "#7c8cff"
  canvas: "#ffffff"
  surface: "#f6f7f9"
  ink: "#16181d"
  muted-ink: "#6b7280"
  divider: "#e4e7ec"
  canvas-dark: "#17181c"
  surface-dark: "#1f2126"
  ink-dark: "#f3f4f6"
  muted-ink-dark: "#9aa1ad"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Ubuntu, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  search-field:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    padding: "14px 16px"
  result-selected:
    backgroundColor: "#eef2ff"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 10px"
---

# Design System: Quick Search

## 1. Overview

**Creative North Star: "Quiet Command Deck"**

Quick Search is a compact control surface that appears while the user is already doing something else. Its design must feel immediate, stable, and familiar: the query and current selection lead; context, hints, and configuration recede. The system uses restrained blue accents, cool neutral layers, and native-feeling controls so attention stays on search.

This is a product interface, never a decorative SaaS dashboard or marketing page. Density is purposeful, surfaces remain flat unless temporary elevation communicates state, and motion exists only to confirm a change.

**Key Characteristics:**

- Keyboard-first, with unmistakable focus and selection states.
- Compact but not cramped, including at side-panel widths.
- Restrained color used for action and state rather than decoration.
- Familiar system typography and browser-native interaction patterns.

## 2. Colors

The palette is a cool neutral field with one clear blue voice for action, focus, and selection.

### Primary

- **Command Blue:** The sole action accent. Use it for selected engines, active controls, focus rings, and the selected result boundary.
- **Night Command Blue:** The brighter dark-theme counterpart; it preserves contrast without introducing a second accent hue.

### Neutral

- **Clear Canvas:** The light-theme application background and control fill.
- **Quiet Surface:** A secondary layer for cards, footers, hints, and passive regions.
- **Primary Ink:** Headings, labels, queries, and result titles.
- **Muted Ink:** Supporting copy, shortcuts, metadata, and inactive controls.
- **Soft Divider:** Separates functional regions without creating boxes around everything.
- **Night Canvas / Night Surface / Night Ink:** Dark-theme equivalents that preserve the same hierarchy.

**The One Voice Rule.** Blue communicates action, focus, or selection. It is never decorative and should occupy less than ten percent of a screen.

## 3. Typography

**Display Font:** System UI sans-serif
**Body Font:** System UI sans-serif
**Label/Mono Font:** Inherited system UI for controls; native monospace rendering is reserved for keyboard glyphs where the browser supplies it.

**Character:** One familiar sans-serif family keeps the extension native to the operating system and eliminates ornamental hierarchy. Weight, spacing, and tone create structure.

### Hierarchy

- **Headline** (700, 22px, 1.25): Page titles only.
- **Title** (600, 14px, 1.45): Setting labels, result titles, and primary row copy.
- **Body** (400, 14px, 1.45): Explanatory copy with a maximum readable measure of 70ch.
- **Label** (600, 11–12px, 1.4): Section and status labels; uppercase is permitted only for short navigational group labels.

**The Query Leads Rule.** No heading, badge, or helper label may compete with the launcher input or the selected result.

## 4. Elevation

The system is flat by default. Tonal surface changes and one-pixel dividers establish structure. Shadows belong only to the floating launcher container or browser overlay, where they explain separation from the underlying page.

### Shadow Vocabulary

- **Floating Launcher** (`0 24px 64px rgb(0 0 0 / 0.35)`): The overlay frame above page content.
- **Popup Ambient** (`0 30px 70px rgba(0, 0, 0, 0.55)`): Preview and presentation framing, not internal components.

**The Flat-By-Default Rule.** Internal cards, rows, and controls use borders or tonal contrast; never add shadows to make ordinary settings look important.

## 5. Components

### Buttons

- **Shape:** Compact gently rounded rectangle (6–7px radius).
- **Primary:** Command Blue with Clear Canvas text and compact 6px by 10px padding.
- **Hover / Focus:** Increase contrast on hover; use a visible two-pixel accent outline with a two-pixel offset for keyboard focus.
- **Secondary:** Clear Canvas fill, strong neutral border, and Primary Ink text.

### Chips

- **Style:** Engine and shortcut chips use a quiet surface or transparent background with compact horizontal padding.
- **State:** The active engine uses Command Blue; inactive engines remain neutral and gain contrast on hover.

### Cards / Containers

- **Corner Style:** Gently rounded (10px radius).
- **Background:** Quiet Surface on Clear Canvas; invert to the paired dark surfaces in dark mode.
- **Shadow Strategy:** None inside pages.
- **Border:** One-pixel Soft Divider.
- **Internal Padding:** 14–16px, with dividers only between distinct setting rows.

### Inputs / Fields

- **Style:** Borderless launcher query on the canvas; native selects and radios in settings.
- **Focus:** Two-pixel Command Blue focus ring. Never remove focus without replacing it.
- **Error / Disabled:** Preserve readable text and communicate state in words, not color alone.

### Navigation

The launcher footer is compact, persistent navigation between engines. The active engine is unmistakable, inactive choices stay quiet, and horizontal overflow must not crowd the keyboard legend.

### Result Row

Rows are flat at rest, with an 8px radius and 9px by 10px padding. The selected row uses a soft blue surface plus a one-pixel inset Command Blue boundary so selection remains visible in both themes.

## 6. Do's and Don'ts

### Do:

- **Do** keep the query, selection, and current mode visible without scrolling.
- **Do** retain 4.5:1 text contrast and visible keyboard focus at every supported theme and width.
- **Do** use the 4px / 8px / 12px / 16px / 24px spacing rhythm consistently.
- **Do** make first-run guidance short, actionable, and dismissible.
- **Do** test every page at narrow side-panel width and 200% browser zoom.

### Don't:

- **Don't** make Quick Search look like a decorative SaaS dashboard, a marketing page, or a collection of nested cards.
- **Don't** use novelty controls, ornamental gradients, glassmorphism, or excessive motion.
- **Don't** use color decoratively or rely on color alone for state.
- **Don't** let helper copy compete with results or allow text to overflow its container.
- **Don't** reinvent standard radio, select, button, or focus behavior for personality.
