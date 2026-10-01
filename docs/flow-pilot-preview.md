# SWAY FLOW — private report preview

## This increment

Adds `/admin/flow` behind the existing verified ChatGPT identity and server-side admin allowlist. It does not change existing routes, database tables, production stores, pricing, sign-in, runtime configuration or public retailer visibility. No real store is seeded or published. The page has a link back to management; an entry in the main management navigation is not part of this increment.

The workbench runs in browser memory only. It previews normalized product-level bottle sales, records one user-reported physical stock check, and evaluates a hypothetical remaining-stock target. It cannot connect to Toast, schedule content, spend money, issue discounts or pay commissions. TV/music and golf bookings are outside scope.

Files are not sent to a new API or database. Refreshing, leaving the page, or clearing the session discards them. The explicit Save preview file action exports JSON locally; restore/import of that JSON is not implemented. No localStorage or shared server cache stores sales data.

## Normalized input — NOT a native Toast CSV schema

The first real retailer export must be inspected before implementing its adapter. Do not manufacture missing fields or assume a summary export provides transaction-level records.

Required CSV headers (any order, case-insensitive):

`store_id,line_id,updated_at,sold_at,product_id,product_name,bottle_ml,units_sold,units_returned,status`

- One complete line snapshot. IDs must be stable source identifiers. One store per session.
- `updated_at` and original `sold_at`: UTC ISO timestamps with seconds, with optional three-digit milliseconds. Invalid calendar dates, future times and update-before-sale records are rejected. A future adapter must convert the source timezone explicitly, accounting for daylight saving time.
- `units_sold`: original positive whole bottles; `units_returned`: cumulative returned bottles, between zero and original quantity. Fully refunded lines retain the original quantity with an equal returned quantity. `status=void` contributes no sales or returns, regardless of the original quantity.
- `status`: `sale` or `void`. Other states require source reconciliation before import. Monetary refunds without a physical-unit refund are not automatically bottle returns.
- Net sales are calculated per original line, not by the date of the refund. These are not recognized-revenue or return-period accounting totals.
- `bottle_ml`: positive whole mL for the exact bottle. Cases, pours, cocktails, multipacks and summary-only product-mix reports are not supported by this adapter.
- Extra columns are rejected to discourage importing customer or payment data. Actual field content is not independently verified, so the operator must still remove personal information and review mappings.

Up to 10,000 unique sales lines in a session, 10,000 incoming rows per file, and 2 MB per file. Same line ID and update time with identical normalized values is deduplicated. Newer snapshots supersede older ones. Same-timestamp conflicts block the entire file, including conflicts between historical snapshots. A product ID with inconsistent name or bottle size blocks the file. Failed imports leave previously accepted session data unchanged. These guarantees apply only to the current browser session, not durable ingestion across devices.

The sales timestamp range is observed coverage only, not evidence of complete reporting. Displayed counts do not certify an integration, a sale's authenticity, attribution or incremental lift.

## Count and target preview

User-reported counts remain separate from sales. There is no derived live on-hand stock. A shelf count cannot satisfy a total-store target. Product confirmation, count source and asserted authorization, explicit count time, target and acceptable count age are required. Empty numeric input remains null, not zero. Stale/future/invalid counts cannot propose a Boost. The browser rechecks count age every 30 seconds while mounted, and re-evaluates at export.

All approval conditions are explicitly simulated, never represented as granted permissions. The pause and target controls affect only this hypothetical check. Replenishment policy, source conflicts, original-allocation tracking, rights records, budget/exposure caps, real approvals and the actual campaign state machine are not implemented. Never use this client-side preview as an authority decision for a live scheduler.

## Before a live pilot

1. Obtain an authorized redacted itemized sales export and matching current stock observations. Inspect actual source IDs, times, returned/voided rows, bottle sizes, location scope and completeness. Select the correct read-only Toast access route separately; no Toast credentials belong in GitHub or browser code.
2. Add a source-specific adapter plus persistent tenant-scoped events, corrections, transactions, audit history, count provenance and authorization. Implement returns/transfers/receipts/breakage reconciliation, source priority and conflict holds. Preserve account and store isolation.
3. Integrate current retailer/brand/distributor permissions, rights-cleared product/creator mappings, campaign objectives, funding/exposure limits, manual override, pause/stop/replenishment behavior and scheduler acknowledgements. Do not infer causality from sales during playback.
4. Test actual authenticated and unauthorized browser flows, exact product matching, duplicate imports, corrections, stock freshness, reconciliation, stop conditions and data isolation. Deploy only through the existing approved Sites workflow after review; a repository branch is not a deployment.

## Tests and evidence

`node --experimental-strip-types --test tests/flow-preview.test.mjs`

Tests run the actual dependency-free TypeScript parsing and decision code. The repository's existing Node 24 workflow runs `tests/*.test.mjs` and a full typecheck/build. Local core tests alone do not verify the app build, hosted authentication or browser layout. This increment does not alter that workflow.
