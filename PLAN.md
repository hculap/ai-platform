# Task & Context
Improve mobile-first responsive design across the AI Platform frontend so the app delivers a polished UI/UX on small viewports without regressing desktop behavior.

## Current State (codebase scan)
- React + TypeScript SPA in `frontend/src`, styled with Tailwind classes supplemented by `index.css` utilities.
- Landing experience composed of modular sections under `components/landing/`; dashboards/forms under `components/*` with mixed flex/grid layouts.
- Global header/navigation in `components/Header.tsx`; hero and URL intake handled by `LandingPage.tsx`, `URLSection.tsx`, and `BusinessForm.tsx`.
- Tailwind config available but mobile-specific spacing, typography, and interaction patterns appear desktop-first.

## Proposed Changes (files & functions)
- Adjust layout and spacing in `components/Header.tsx`, `LandingPage.tsx`, and each `components/landing/*.tsx` section for stacked mobile layouts.
- Refine intake/auth flows (`URLSection.tsx`, `SignupForm.tsx`, `SignInForm.tsx`, `BusinessForm.tsx`) with responsive grids, button sizing, and modal behavior.
- Introduce shared responsive helpers or Tailwind variants in `index.css`/`tailwind.config.js` if breakpoints or custom utilities are required.
- Ensure dashboard modules (`Dashboard.tsx`, tables like `Offers.tsx`, `Competition.tsx`, `Agents.tsx`) handle narrow widths via collapsible cards or horizontal scrolling.

## Step-by-Step Plan
1. Audit key screens (landing, onboarding, dashboard) at breakpoints ≤768px to catalogue layout, typography, and interaction issues.
2. Update global structure: ensure Header/nav, background elements, and overall containers use mobile-friendly padding, stacking, and safe-area handling.
3. Refactor landing sections to mobile-first stacks (hero, feature blocks, pricing) using Tailwind responsive classes and lightweight utility tweaks.
4. Tackle forms and modals: adjust input/button sizing, spacing, and validation messaging for small screens; verify scroll locking.
5. Improve data-heavy views with responsive patterns (card stacking, overflow scroll, collapsible sections) across dashboard components.
6. Validate across breakpoints (375px, 414px, 768px, 1024px) and run `npm test` to ensure UI changes don’t break logic; update screenshots/docs if needed.

## Risks & Assumptions
- No dedicated mobile design specs; will rely on UX heuristics and existing desktop style.
- Potential coupling between Tailwind classes and background animations may complicate stacking changes.
- Complex tables/cards may require significant restructuring to remain readable on mobile.

## Validation & Done Criteria
- Layout remains readable and interactive at common mobile breakpoints without horizontal scroll.
- Navigation, forms, and dashboards operate correctly on touch devices (tested via browser dev tools/emulated devices).
- Automated frontend tests continue to pass; manual sanity checks confirm no regression on desktop viewports.

## Open Questions
- Are there brand guidelines or design references to align with?
No, keep current design practices, and also make UX (especialy navigation) proper for mobile
- Should mobile navigation collapse into a drawer/hamburger pattern, and if so, do we have iconography preferences?
 drawer/hamburger pattern
- Any analytics or priority screens to focus on first for mobile optimization?
No