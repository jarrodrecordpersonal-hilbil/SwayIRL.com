/** Read-only, in-memory pilot tools. Not a Toast adapter or a live campaign controller. */
export const SALES_COLUMNS = ["store_id", "line_id", "updated_at", "sold_at", "product_id", "product_name", "bottle_ml", "units_sold", "units_returned", "status"] as const;
export const SALES_TEMPLATE = SALES_COLUMNS.join(",") + "\n";
export const MAX_CSV_BYTES = 2_000_000;
const MAX_ROWS = 10_000;
export type SalesLine = { storeId: string; lineId: string; updatedAt: string; soldAt: string; productId: string; productName: string; bottleMl: number; unitsSold: number; unitsReturned: number; status: "sale" | "void" };
export type ProductSales = { productId: string; productName: string; bottleMl: number; soldUnits: number; returnedUnits: number; netUnits: number; voidedLines: number };
export type SalesPreview = { storeId: string; lines: SalesLine[]; products: ProductSales[]; duplicateRows: number; supersededRows: number; firstSaleAt: string; lastSaleAt: string; lastUpdatedAt: string };

/** RFC-style quoted CSV; strict schema intentionally excludes customer/payment columns. */
export function parseCsv(text: string): string[][] {
  if (typeof text !== "string" || new TextEncoder().encode(text).length > MAX_CSV_BYTES) throw new Error("Use a CSV file smaller than 2 MB.");
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false, closedQuote = false;
  const field = () => { row.push(value); value = ""; closedQuote = false; if (row.length > 50) throw new Error("Too many columns. Use the normalized template."); };
  const record = () => { field(); if (row.some(v => v.trim())) rows.push(row); row = []; if (rows.length > MAX_ROWS + 1) throw new Error("Split this report into files of at most 10,000 rows."); };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { value += '"'; i++; } else { quoted = false; closedQuote = true; } }
      else value += ch;
    } else if (ch === ",") field();
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; record(); }
    else if (ch === '"') { if (value || closedQuote) throw new Error("Malformed CSV quotation."); quoted = true; }
    else { if (closedQuote) throw new Error("Unexpected text after a quoted CSV field."); value += ch; }
    if (value.length > 1000) throw new Error("A CSV field is too long.");
  }
  if (quoted) throw new Error("The CSV has an unclosed quoted field.");
  if (value || row.length || closedQuote) record();
  return rows;
}
function label(value: string, name: string, max = 180): string {
  const result = value.trim();
  if (!result || result.length > max || /[\x00-\x1f\x7f]/.test(result)) throw new Error(`Check ${name}: use nonempty text without control characters.`);
  return result;
}
function integer(value: string, name: string, min = 0, max = 1_000_000): number {
  if (!/^\d+$/.test(value.trim())) throw new Error(`Check ${name}: use whole, nonnegative bottle units.`);
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min || result > max) throw new Error(`Check ${name}: value is outside the supported range.`);
  return result;
}
function timestamp(value: string, name: string, now: number): string {
  const input = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(input)) throw new Error(`Check ${name}: use an explicit UTC timestamp, such as YYYY-MM-DDTHH:mm:ssZ.`);
  const ms = Date.parse(input);
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== (input.length === 20 ? input.replace("Z", ".000Z") : input) || ms > now) throw new Error(`Check ${name}: invalid or future timestamp.`);
  return new Date(ms).toISOString();
}
function validateLine(line: SalesLine, now: number): SalesLine {
  const result: SalesLine = {
    storeId: label(line.storeId, "store_id"), lineId: label(line.lineId, "line_id"),
    updatedAt: timestamp(line.updatedAt, "updated_at", now), soldAt: timestamp(line.soldAt, "sold_at", now),
    productId: label(line.productId, "product_id"), productName: label(line.productName, "product_name", 300),
    bottleMl: integer(String(line.bottleMl), "bottle_ml", 1, 20_000),
    unitsSold: integer(String(line.unitsSold), "units_sold", 1), unitsReturned: integer(String(line.unitsReturned), "units_returned"), status: line.status,
  };
  if (result.status !== "sale" && result.status !== "void") throw new Error("Status must be sale or void. Resolve other states before import.");
  if (result.unitsReturned > result.unitsSold) throw new Error("Returned units cannot exceed units sold on the original line.");
  if (result.updatedAt < result.soldAt) throw new Error("updated_at cannot precede sold_at.");
  return result;
}
/** Latest complete line snapshot wins. Reimports do not append another sale. No partial commit on errors. */
export function previewSales(csv: string, previous: SalesLine[] = [], now = Date.now()): SalesPreview {
  if (!Number.isFinite(now)) throw new Error("Invalid preview time.");
  if (previous.length > MAX_ROWS) throw new Error("Too many lines in this session. Clear the preview first.");
  const [rawHeader, ...rows] = parseCsv(csv);
  if (!rawHeader || !rows.length) throw new Error("Add sales rows to the normalized template first.");
  const header = rawHeader.map(v => v.trim().toLowerCase());
  if (header.length !== SALES_COLUMNS.length || new Set(header).size !== header.length || SALES_COLUMNS.some(c => !header.includes(c))) throw new Error("This is not the normalized sales template. Map the source export first; do not include customer or payment fields.");
  const candidate: SalesLine[] = [];
  for (let index = 0; index < rows.length; index++) {
    try {
      const row = rows[index];
      if (row.length !== header.length) throw new Error("The number of columns does not match the header.");
      const get = (name: typeof SALES_COLUMNS[number]) => row[header.indexOf(name)].trim();
      candidate.push(validateLine({storeId:get("store_id"),lineId:get("line_id"),updatedAt:get("updated_at"),soldAt:get("sold_at"),productId:get("product_id"),productName:get("product_name"),bottleMl:integer(get("bottle_ml"),"bottle_ml",1,20_000),unitsSold:integer(get("units_sold"),"units_sold",1),unitsReturned:integer(get("units_returned"),"units_returned"),status:get("status") as SalesLine["status"]}, now));
    } catch (error) { throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : "Invalid sales row."}`); }
  }
  const byLine = new Map<string, SalesLine>();
  let duplicateRows = 0, supersededRows = 0;
  const all = [...previous.map(line => validateLine(line, now)), ...candidate];
  const stores = new Set(all.map(line => line.storeId));
  if (stores.size !== 1) throw new Error("One store per session. Clear the preview before loading another store.");
  // Detect conflicting snapshots even when a later revision occurs earlier in the file.
  const snapshots = new Map<string, string>();
  for (const line of all) {
    const snapshotKey = JSON.stringify([line.lineId, line.updatedAt]);
    const encoded = JSON.stringify(line);
    const seen = snapshots.get(snapshotKey);
    if (seen && seen !== encoded) throw new Error("Conflicting versions of the same sales line have the same updated_at. Resolve the source records first.");
    snapshots.set(snapshotKey, encoded);
    const current = byLine.get(line.lineId);
    if (!current) byLine.set(line.lineId, line);
    else if (line.updatedAt === current.updatedAt) duplicateRows++;
    else { supersededRows++; if (line.updatedAt > current.updatedAt) byLine.set(line.lineId, line); }
  }
  if (byLine.size > MAX_ROWS) throw new Error("This session exceeds 10,000 unique sales lines. Clear the preview and use a smaller reporting window.");
  const lines = [...byLine.values()];
  const products = new Map<string, ProductSales>();
  for (const line of lines) {
    let product = products.get(line.productId);
    if (!product) { product = {productId:line.productId,productName:line.productName,bottleMl:line.bottleMl,soldUnits:0,returnedUnits:0,netUnits:0,voidedLines:0}; products.set(line.productId, product); }
    if (product.bottleMl !== line.bottleMl || product.productName !== line.productName) throw new Error("A product ID has conflicting names or bottle sizes. Resolve the product mapping first.");
    if (line.status === "void") product.voidedLines++;
    else { product.soldUnits += line.unitsSold; product.returnedUnits += line.unitsReturned; product.netUnits += line.unitsSold - line.unitsReturned; }
  }
  const saleTimes = lines.map(line => line.soldAt).sort();
  const updateTimes = lines.map(line => line.updatedAt).sort();
  return {storeId:lines[0].storeId,lines,products:[...products.values()].sort((a,b)=>a.productName.localeCompare(b.productName)),duplicateRows,supersededRows,firstSaleAt:saleTimes[0],lastSaleAt:saleTimes.at(-1)!,lastUpdatedAt:updateTimes.at(-1)!};
}
export type StockTargetInput = {
  stockUnits: number | null; targetUnits: number | null; observedAt: string; maxAgeHours: number | null;
  scope: "store_total" | "shelf" | ""; source: "retailer_count" | "distributor_count" | "brand_count" | "";
  authorizedCount: boolean; productConfirmed: boolean; simulateApprovals: boolean; paused: boolean;
};
export type StockDecision = { status: "paused" | "waiting" | "blocked" | "target_met" | "would_boost"; title: string; reason: string; live: false };
/** One hypothetical inventory-target check. Never schedules content, spends money or changes a POS. */
export function previewStockTarget(input: StockTargetInput, now = Date.now()): StockDecision {
  const result = (status: StockDecision["status"], title: string, reason: string): StockDecision => ({status,title,reason,live:false});
  if (input.paused) return result("paused","Paused in preview","No Boost is proposed while the preview pause is on.");
  if (!Number.isFinite(now)) return result("blocked","Check preview time","A valid clock is required.");
  if (!input.productConfirmed) return result("waiting","Confirm the product","Match the exact product and bottle size to the shelf item first.");
  if (input.scope !== "store_total") return result("blocked","Need a total-store count","A shelf-only count cannot establish total store inventory.");
  if (!["retailer_count","distributor_count","brand_count"].includes(input.source) || !input.authorizedCount) return result("waiting","Need an authorized count","Choose who supplied the count and confirm their authorization.");
  if (input.stockUnits === null || input.targetUnits === null || input.maxAgeHours === null || !input.observedAt) return result("waiting","Complete the stock check","Enter count, count time, remaining-stock target and allowed count age. Blank is not zero.");
  if (![input.stockUnits,input.targetUnits].every(v=>Number.isSafeInteger(v)&&v>=0&&v<=1_000_000) || !Number.isFinite(input.maxAgeHours) || input.maxAgeHours <= 0 || input.maxAgeHours > 8760) return result("blocked","Check the numbers","Use nonnegative whole bottles and an allowed count age greater than zero and no more than 8,760 hours.");
  let observed: string;
  try { observed = timestamp(input.observedAt,"count time",now); } catch { return result("blocked","Check the count time","Use a real count time that is not in the future."); }
  if (now-Date.parse(observed)>input.maxAgeHours*3_600_000) return result("blocked","Count is too old","Refresh the authorized count. Sales rows alone do not establish current inventory.");
  if (input.stockUnits<=input.targetUnits) return result("target_met","Count meets the stock target","No Boost is proposed by this count. This does not prove sales, ad impact or completion of a real campaign.");
  if (!input.simulateApprovals) return result("waiting","Approval simulation is off","Real store, funding and content approvals are not connected. You may simulate the approval condition for this preview only.");
  return result("would_boost","Would propose a Boost","The count is above the target. Live scheduling, campaign limits, rights, approvals and stop controls still need integration. No ad has been activated.");
}
