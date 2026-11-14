# Luma Prototype Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the existing Luma prototype easier to explore on phones and smoother to use without presenting conceptual features as shipped functionality.

**Architecture:** Keep the standalone static page and its current CSS/vanilla-JS demo. Add an accessible mobile navigation control, apply a coordinated transition to the existing scenario and view updates, and tune layout spacing at phone/tablet breakpoints.

**Tech Stack:** HTML, CSS, vanilla JavaScript; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-14-luma-prototype-polish-design.md`

## Global Constraints

- Preserve the current editorial identity and conceptual pendant art.
- Keep the demo fictional: no recording, AI, signup, reservation, or availability claims.
- Add no dependencies or public APIs.
- Respect `prefers-reduced-motion` and keep keyboard access.

## Review Focus

- Narrow phones at 320px: menu, hero and demo must not overflow horizontally.
- Escape while the menu is open: close it and return focus to the toggle.
- Selecting a navigation anchor: close the menu and keep the target visible.
- Rapidly switching scenarios/tabs: the final selected state must match the visible content.
- Reduced-motion preference: new content transitions must not animate.

---

### Task 1: Accessible mobile navigation

**Files:**
- Modify: `luma.html`
- Modify: `css/luma.css`
- Modify: `js/luma.js`

- [x] Add a mobile menu button with `aria-controls="lumaNav"`, `aria-expanded`, and an accessible label; give the existing nav the matching id.
- [x] Style the toggle and expandable nav for widths up to 700px; keep the current desktop nav untouched.
- [x] In `js/luma.js`, add open/close helpers, Escape-to-close with focus return, and close-on-link-activation.
- [x] Check desktop and mobile navigation, keyboard operation, 320px width, and `git diff --check`.

### Task 2: Smooth demo state changes

**Files:**
- Modify: `css/luma.css`
- Modify: `js/luma.js`

- [x] Add a short fade/vertical-shift state for `.memory-heading` and `#demo-content` using the existing visual language.
- [x] Update `render()` so scenario and tab changes transition the heading/meta and demo content together, while rapid selections resolve to the latest state.
- [x] Preserve `aria-pressed` and `aria-live`; disable the new motion under reduced motion.
- [x] Manually switch all three scenes and both content tabs, including quick repeated selections; check the announced content and `git diff --check`.

### Task 3: Responsive hierarchy and release check

**Files:**
- Modify: `css/luma.css`

- [x] Refine spacing and type scale around the interactive section and demo card for tablet and phone breakpoints, preserving the desktop composition.
- [x] Review page at desktop, 390px, and 320px widths; verify the demo controls and copy remain readable and no horizontal overflow appears.
- [x] Run `node --check js/luma.js` and `git diff --check`; inspect the production build after deployment.


## Execution record

- Desktop (1440px), tablet (768px), phone (390px), and narrow phone (320px) reviewed locally; no horizontal overflow.
- Mobile menu opened, closed with Escape (focus returned to toggle), and closed after selecting a section anchor. Tab after opening reaches the first menu link.
- Demo scene and tab changes manually checked; the selected controls and displayed content agree.
- `node --check js/luma.js` and `git diff --check` passed. The final review caught and led to fixing the mobile keyboard tab order.
