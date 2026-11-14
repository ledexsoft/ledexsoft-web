# Luma prototype page polish

## Intent

Make the existing Luma prototype easier to explore, especially on phones, while keeping its current calm editorial identity and making clear that the product and demo are conceptual.

## Approaches

- **Polish the current demo (chosen):** add accessible mobile navigation, soft transitions between the existing example scenes/tabs, and tighten spacing and hierarchy around the demo. This improves the page without implying unbuilt product capabilities.
- **Make the pendant the main interaction:** animate the concept device and build the experience around it. More visual impact, but it shifts attention away from the demo the page already has.
- **Make it more editorial:** reduce the interactive demo and emphasize the story. Cleaner page, but less useful for showing what Luma could do.

## Scope

- Add a compact mobile menu with a clear open/close control, `aria-expanded`, Escape handling, and close-on-navigation.
- Animate scene and tab changes with a short fade/vertical shift; preserve current content and `aria-live` updates. Respect `prefers-reduced-motion`.
- Refine spacing, type hierarchy, and demo-card proportions at mobile and tablet widths. Preserve the desktop composition and existing concept art.
- Keep all examples fictional; do not add recording, AI, signup, reservations, or claims of shipped functionality.

## Constraints and acceptance

- No new dependencies or public APIs.
- Existing section anchors and scene/tab behavior continue working.
- Navigation remains keyboard accessible, and the layout has no horizontal overflow at phone widths.
- Reduced-motion preference removes the new transition motion.
- After implementation, inspect the page at desktop and mobile sizes and deploy it per the site's established workflow.
