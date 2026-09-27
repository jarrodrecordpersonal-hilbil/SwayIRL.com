# Public experience redesign

## Scope

This branch starts from PR #2 at `642fd4fb8c4f5b2d3e789c9fdf213bf3392c0f19` and includes its public sales-sheet changes. It is intended as one combined review against main; PR #2 does not need a separate merge when this combined change is merged. No existing branch was overwritten, merged, or deployed.

- Replaces the homepage with a forest/cream hero, two clear browse actions, four audience cards, public network preview, a short process, Boost, and a sales toolkit.
- Adds public, printable one-page sales-sheet routes for brands, retailers, creators, and distributors. Print / Save PDF uses the browser's print dialog, not a pre-generated download. Clipboard failures expose a manual-copy field.
- Rebuilds the retailer directory with text/region/category filters and distinct loading, unavailable, empty, and no-match states.
- Keeps public retailer JSON restricted to id, name, city, state, type, and public description. No spot counts, owner IDs, rates, or requests are returned. Published retailers with at least one unconfirmed position are listed.
- Adds a separately scoped SWAY Boost page. No automatic POS integration, dynamic pricing, sales lift, or live activation is claimed.
- Existing authentication, management, placement write actions, capacity checks, and migrations are unchanged. This does NOT implement date-based scheduling or reservation holds.
- Existing audience marketing routes remain supported; this visual change is focused on the homepage, public toolkit, retailer directory, and Boost.

## Checks performed

1. `node --experimental-strip-types --experimental-sqlite tests/public-experience.test.mjs`: 8/8 passed using Node 22.16.0, isolated SQLite only.
2. TypeScript transpile syntax diagnostics: 9 TS/TSX source files passed. This is not a full repository typecheck.
3. CSS module reference check: every class used by the component exists.
4. Chromium static-layout checks: 8 pages at 320, 390, 768, 1024, and 1440 pixels, 40/40 with one h1 and no horizontal page overflow. Mobile menu contained public Sales Sheets and opened successfully.
5. Four printed sales sheets each rendered as one Letter page, included the material terms, and hid navigation/print controls. The creator sheet was visually inspected.

Important limitations: the browser layout harness renders the actual component JSX with minimal static hook stubs; it is not a React hydration, click-through integration, or full framework test. Repository PNG assets could not be downloaded in this environment, so the existing logo/hero image appearance is not verified here. Full repo checkout/dependency installation was blocked by runtime DNS. No full Vinext build, authenticated workflow regression run, or production verification was performed.

## Required before publication

Run the repository typecheck, full production build, existing workspace tests, and this new test suite in the normal Sites/build environment. Check actual React fetch/retry/filter behavior, clipboard success and denial, print actions, mobile navigation, and original image assets.

Publish through the existing Sites workflow: a GitHub merge alone does not deploy the hosted Site. Also verify anonymous site-level access. The last available launch notes described an owner-restricted review site; removing page-level sign-in does not override a hosting audience restriction. Confirm custom-domain/DNS status in the hosting UI. Do not remove authentication from portal/admin/API write routes.
