# SWAY IRL

A retail media network site with audience pages, partner onboarding, available store positions, placement requests, and a management dashboard.

## Routes

- `/`: network overview
- `/retailers`, `/distributors`, `/brands`, `/influencers`: audience sales pages
- `/join`, `/login`, `/portal`: ChatGPT sign-in and partner workspace
- `/admin`: allowlisted management workspace
- `/logos`: allowlisted logo direction gallery

## Runtime

Uses the Sites starter with Vinext, React, Cloudflare Workers, and D1. `.openai/hosting.json` declares the logical `DB` binding. Sites owns production wiring and applies the schema-only Drizzle migrations. Keep runtime values in Sites environment settings.

`SWAY_ADMIN_EMAILS` is a comma-separated server-side allowlist. It must be configured to enable management. Missing or empty values grant nobody admin access. Partner roles never grant management permissions.

Authentication uses the dispatcher-owned ChatGPT sign-in flow and verified identity headers. Do not expose the Worker behind a proxy that trusts arbitrary client identity headers.

## Inventory and sales

Only published stores appear in the network. Confirmed requests consume one recurring position; pending requests do not reserve capacity. An atomic conditional SQL update prevents overbooking. Releasing a confirmed request returns capacity. Rates are snapshotted when a request is submitted. This application does not collect payments, send email, or operate screen playback.

Partner signups, retailer store submissions, and distributor referrals create sales leads. The team can manage stages, next steps, notes, ownership, estimated values, and follow-up dates.

There are no fake production locations, partners, leads, or performance metrics. The in-store photo is an illustrative concept image. Launch pricing uses the approved $120 per store/month, recurring 15-second offer. Retailers receive four free 15-second ads per rotation. Creator bonuses are proposed at 5%, or 10% for selected campaigns, on qualifying incremental net product sales under agreed POS attribution terms. POS integration and payments are not implemented.

## Validation

`pnpm exec tsc --noEmit` checks types.
`node --experimental-sqlite tests/workspace.test.mjs` executes the actual API handlers against an isolated SQLite adapter, checking identity, authorization, data ownership, capacity, and workflow persistence. It never touches production data.

Build and publish through the Sites workflow. Keep `.env`, `.sites-runtime`, and `.wrangler` out of source archives.

## Source and deployment

GitHub: https://github.com/jarrodrecordpersonal-hilbil/SwayIRL.com

Current hosted site: https://swayirl.jarrod547362.chatgpt.site

Requested custom domain: swayirl.com. Domain activation requires DNS validation. GitHub stores the application source; pushing to this repository does not automatically deploy the Site.

This initial import matches published Site source `8b7b70ec055de9c96ecbcb1a499a64b128ca6d0a`, with this README updated and generated TypeScript cache excluded.
