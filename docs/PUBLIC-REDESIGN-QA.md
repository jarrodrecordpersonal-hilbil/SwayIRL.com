# Public experience redesign and publication gate

## Scope

PR #3 includes PR #2's public sales-sheet fix. A separate merge of #2 is not needed when merging this combined change.

- Cleaner homepage, four audience cards, public retailer preview, Boost, and sales toolkit.
- Public one-page sheets for brands, retailers, creators, and distributors. Copy Pitch includes a denial fallback. Print / Save PDF uses the browser print dialog.
- Public retailer search and filters. JSON exposes only id, name, city, state, type, and public description; no inventory counts, rates, owners, or requests.
- Existing authentication, management, placement writes, capacity confirmation logic, and application migrations are unchanged.
- This does **not** implement date-based scheduling, reservation holds, payment collection, automatic POS attribution, or automated price changes.

## Reproducible full verification

`.github/workflows/public-redesign-checks.yml` checks out the actual PR merge candidate, installs the exact frozen lockfile, runs the full TypeScript check, executes existing workspace/public tests, builds Vinext, starts the built worker, and runs Chromium against it.

The workflow uses a fresh localhost-only D1 database. `tests/browser/seed-local.sql` is a CI fixture, not a production migration. No Cloudflare production token is requested and all schema/fixture commands explicitly use `--local`.

Coverage:
- 56 existing workspace checks (identity, ownership, pricing, capacity, onboarding, referrals, and follow-ups), plus 8 public logic tests.
- 56 real browser checks, including 8 public routes at 5 widths, actual public API field privacy, search/region/type filtering, no-match/reset, mobile navigation, clipboard success/denial, print invocation and one-page PDFs, loading/empty/unavailable/retry states, invalid-sheet 404, and hydration errors.
- 9 header checks covering old and redesigned page headers at three widths. They verify the entire original logo remains visible, with its aspect ratio preserved.
- Screenshots, PDFs, browser JSON results, worker logs, and the exact tested SHA are uploaded as short-lived QA artifacts.

Both pipefail and independent JSON-report assertions enforce failures. No incomplete/failed browser report should be accepted on the basis of the GitHub summary alone.

## Review history

The initial static harness was not a full app test. It lacked original PNG assets.

The first full CI run (`36355269926`) completed the build and backend tests but its detailed browser report contained one filter-label failure (55/56). Its shell pipeline incorrectly returned green; that run is **not** approval evidence. Stable accessible names were added to the two filter selects without weakening the tests. The CI gate was hardened to propagate failures and validate the JSON report independently.

Visual inspection of the actual-asset screenshot also found an incorrectly cropped header logo. A shared header-only stylesheet now fits the original transparent asset instead of applying image offsets, and the new nine-case header test prevents regression.

Use the latest completed run for the current PR head, inspect its logs and artifacts, and keep the PR unapproved if any test fails. The PR discussion records the final run and reviewed SHA.

## Publishing is separate

A GitHub merge does not publish the existing hosted Site. The authorized Sites workflow must import the approved source, preserve existing production data/bindings, build under the Sites runtime, and publish it.

Do not deploy the standalone CI worker to production: authentication relies on the Sites trusted-identity boundary. Do not remove authentication from portal/admin or workspace write routes.

After publication, check signed-out access to `/`, `/open-retailers`, `/sales-sheets`, all four sheet routes, and `/boost` on the hosted/custom domain. Verify the site-level audience permits anonymous browsing; public route code cannot override a hosting access restriction. Verify portal/admin and private APIs still require authorization. Confirm the custom domain and HTTPS in the existing hosting/DNS controls. No site audience, DNS, real inventory, or production configuration is changed by this CI workflow.
