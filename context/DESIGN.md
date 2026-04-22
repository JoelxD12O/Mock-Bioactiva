```markdown
# Design System Document: The Bio-Innovation Framework

## 1. Overview & Creative North Star: "The Living Laboratory"

This design system is built to bridge the gap between rigorous scientific professionalism and the vibrant energy of biological growth. We move beyond the "corporate brochure" aesthetic to embrace **The Living Laboratory**—a creative North Star that prioritizes clarity, breathability, and organic depth.

Unlike standard frameworks that rely on rigid grids and heavy borders, this system utilizes **Tonal Layering** and **Intentional Asymmetry**. We treat the digital canvas as a series of microscopic slides: clean, high-contrast, and layered with precision. The aesthetic is "High-End Editorial meets Biotech Innovation," using massive typography scales to anchor the eye while allowing secondary elements to float in a sea of whitespace.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

The palette is rooted in deep botanical greens and sterile, professional neutrals. To maintain a premium feel, we strictly adhere to a **No-Line Policy**.

### The "No-Line" Rule
Prohibit the use of 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background provides a sophisticated transition that feels architectural rather than "templated."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Depth is achieved by "stacking" container tiers:
- **Level 0 (Base):** `surface` (#fbf9f9) — The primary canvas.
- **Level 1 (Subtle Inset):** `surface-container-low` (#f5f3f3) — Used for secondary content blocks.
- **Level 2 (Active Cards):** `surface-container-lowest` (#ffffff) — Reserved for primary interactive cards to provide a "pop" against the off-white background.

### The "Glass & Gradient" Rule
To inject "soul" into the innovation aesthetic:
- **CTAs & Heroes:** Use subtle linear gradients transitioning from `primary` (#09612a) to `primary_container` (#2c7a40) at a 135-degree angle.
- **Floating Elements:** Use Glassmorphism for overlays. Apply `surface_container_lowest` at 70% opacity with a `backdrop-filter: blur(12px)`. This integrates the element into the environment rather than isolating it.

---

## 3. Typography: Editorial Authority

We use a high-contrast pairing of **Lexend** and **Inter** (representing the Helvetica Neue heritage with improved digital performance) to convey precision and accessibility.

*   **Display & Headlines (Lexend):** These are your "Statement" pieces. Lexend’s geometric clarity should be used at large scales (`display-lg` at 3.5rem) with tighter letter-spacing (-0.02em) to create an authoritative, editorial feel.
*   **Body & Titles (Inter/Helvetica-Style):** Inter provides the "Scientific Record." It is neutral, legible, and balanced.
*   **Hierarchy Strategy:** Use `display-md` for hero sections and `headline-sm` for section headers. Always ensure a minimum 2x size difference between headlines and body text to maintain the "Editorial" impact.

---

## 4. Elevation & Depth: The Layering Principle

Forget traditional shadows. Elevation in this system is a result of **Tonal Contrast**.

*   **Tonal Stacking:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container` (#efeded) background. The change in lightness creates a natural lift.
*   **Ambient Shadows:** If a "floating" state is required (e.g., a modal), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 33, 9, 0.06)`. The shadow color is a tinted version of `on_primary_fixed`, not a generic grey.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons: The Signature Action
*   **Primary:** Gradient of `primary` to `primary_container`. Border-radius: `full` (9999px) for a modern, biotech-capsule feel. Padding: `1rem 2.5rem`.
*   **Secondary:** `surface_container_high` background with `primary` text. No border.
*   **Hover State:** Increase the gradient saturation and apply a 4px "soft glow" ambient shadow.

### Cards & Lists: The No-Divider Standard
*   **Cards:** Use `rounded-lg` (1rem). Forbid divider lines. Use `body-sm` in `on_surface_variant` (#40493f) to create metadata separation.
*   **Lists:** Instead of borders, use a 12px vertical spacing shift or a subtle hover-state background change to `surface_container_low`.

### Input Fields: Clean Room Aesthetic
*   **Default:** Background `surface_container_highest` (#e3e2e2) with a bottom-only "Ghost Border" (2px).
*   **Focus:** Transition the bottom border to `primary` (#09612a) and lift the label using `label-md`.

### Specialized Component: The "Innovation Chip"
*   Used for status or categories. Use `secondary_container` background with `on_secondary_container` text. The roundedness should be `md` (0.75rem) to differentiate from the `full` roundedness of primary buttons.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. A hero image can bleed off the right edge while text is pinned to the left grid.
*   **Do** use `primary_fixed` (#a4f5ae) as a background for high-importance callouts to create a "vibrant energy" moment.
*   **Do** prioritize vertical whitespace. If it feels like "too much space," add 16px more.

### Don’t:
*   **Don't** use 100% black (#000000) for body text. Use `on_surface` (#1b1c1c) for a more natural, premium reading experience.
*   **Don't** use standard Material Design shadows. They are too "heavy" for this scientific, airy aesthetic.
*   **Don't** use sharp 90-degree corners. Everything in nature has a radius; stick to the `roundedness` scale, favoring `lg` (1rem) for containers.

---

## 7. Spacing & Rhythm

Avoid the "flat grid" look. Use an **8px linear scale**, but favor large leaps. Instead of choosing between 24px and 32px, choose between 32px and 64px. This creates the "Editorial" breathing room required to make the vibrant green accents truly pop without feeling cluttered.