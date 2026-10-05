"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_CSV_BYTES, SALES_TEMPLATE, previewSales, previewStockTarget, type SalesPreview, type StockTargetInput } from "@/lib/flow-preview";
import styles from "./flow.module.css";

const emptyStock = (): StockTargetInput => ({stockUnits:null,targetUnits:null,observedAt:"",maxAgeHours:null,scope:"",source:"",authorizedCount:false,productConfirmed:false,simulateApprovals:false,paused:false});
function numberOrNull(value: string) { return value.trim() === "" ? null : Number(value); }
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function FlowWorkbench() {
  const [report, setReport] = useState<SalesPreview | null>(null);
  const [productId, setProductId] = useState("");
  const [stock, setStock] = useState<StockTargetInput>(emptyStock);
  const [localTime, setLocalTime] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const selected = report?.products.find(p => p.productId === productId);
  const decision = previewStockTarget(stock, now);
  function resetStock() { setStock(emptyStock()); setLocalTime(""); }
  function clear() { setReport(null); setProductId(""); resetStock(); setError(""); if (input.current) input.current.value = ""; }
  async function load(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try {
      if (file.size > MAX_CSV_BYTES) throw new Error("Use a CSV file smaller than 2 MB.");
      const result = previewSales(await file.text(), report?.lines || []);
      setReport(result); setProductId(""); resetStock(); setNow(Date.now());
    } catch (e) { setError(e instanceof Error ? e.message : "The report could not be checked. Previous accepted data is unchanged."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  function exportPreview() {
    if (!report) return;
    download("sway-flow-preview.json", JSON.stringify({schemaVersion:1,mode:"read-only-preview",exportedAt:new Date().toISOString(),report,selectedProductId:productId || null,stockCheck:selected ? stock : null,decision:selected ? previewStockTarget(stock) : null,limitations:["Not a Toast API connection or native Toast import.","Imported line snapshots are not verified complete sales coverage.","Counts and sales are separate observations; no on-hand estimate is derived.","No campaign activated; no ad impact or incremental lift established.","Session data is not saved on the SWAY server."]},null,2), "application/json");
  }
  return <main className={styles.shell}>
    <a className={styles.back} href="/admin">← Back to management</a>
    <header className={styles.heading}><div><p className={styles.eyebrow}>SWAY FLOW / PRIVATE PILOT</p><h1>From stock to action.</h1><p>Check product sales. Record a count. Preview the next move.</p></div><span className={styles.pill}>PREVIEW ONLY</span></header>
    <div className={styles.boundary}><strong>Not connected to Toast. No ads are activated.</strong><p>Files stay in this browser tab. Nothing is saved to the SWAY database; refresh or leaving this page clears the session. Save a preview file to retain the results.</p></div>
    <section className={styles.card} aria-labelledby="sales-heading">
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>01 / SALES</p><h2 id="sales-heading">Check a sales report.</h2></div>{report && <span className={styles.pill}>{report.products.length} products</span>}</div>
      <p>Start with the normalized template. A real Toast export must be reviewed and mapped first; this is not a native Toast importer. Use complete bottle-sale line snapshots with returns and voids resolved. No customer or payment details.</p>
      <div className={styles.actions}>
        <label className={styles.upload}> {busy ? "Checking report…" : report ? "Add / recheck sales CSV" : "Choose sales CSV"}<input ref={input} type="file" accept=".csv,text/csv" disabled={busy} aria-label="Choose normalized sales CSV" onChange={event => { void load(event.target.files?.[0]); }} /></label>
        <button type="button" className={styles.secondary} onClick={() => download("sway-normalized-sales-template.csv", SALES_TEMPLATE, "text/csv")}>Get blank template</button>
        {report && <button type="button" className={styles.secondary} disabled={busy} onClick={clear}>Clear session</button>}
      </div>
      {error && <p className={styles.error} role="alert">{error} No changes from this file were accepted.</p>}
      <details className={styles.help}><summary>What belongs in the template?</summary><p>One complete snapshot per sales line: store ID, stable line ID, last-updated time, original sale time, exact product ID and name, bottle size in mL, original bottles sold, cumulative bottles returned, and status (sale or void). Times must be UTC. A void contributes zero sales. Reimported IDs are deduplicated; a newer snapshot replaces an older one. Conflicting versions stop the import.</p><p>Cases, pours, flights, summary-only reports and uncertain product mappings need conversion or a different adapter first. Do not invent IDs, timestamps, return values or bottle quantities to make an export fit.</p></details>
      {report ? <>
        <div className={styles.reportMeta}><strong>Store ID: {report.storeId}</strong><span>{report.lines.length} distinct sales lines · {report.duplicateRows} duplicate rows · {report.supersededRows} older snapshots superseded or ignored in the merged set</span><span>Original sale timestamps: {report.firstSaleAt} to {report.lastSaleAt}</span><span>These dates do not establish complete sales coverage or a live connection.</span></div>
        <div className={styles.tableWrap}><table><caption>Uploaded product sales — not inventory or attributed advertising results</caption><thead><tr><th>Product</th><th>Bottles sold*</th><th>Returned*</th><th>Net bottles*</th><th>Voided lines</th></tr></thead><tbody>{report.products.map(product => <tr key={product.productId}><th scope="row">{product.productName}<small>{product.productId} · {product.bottleMl} mL</small></th><td>{product.soldUnits}</td><td>{product.returnedUnits}</td><td><strong>{product.netUnits}</strong></td><td>{product.voidedLines}</td></tr>)}</tbody></table></div>
        <p className={styles.fine}>*Voided lines are excluded. Figures are cumulative per original sale line, not a return-period accounting report. A return does not automatically add stock back to the shelf.</p>
      </> : <div className={styles.empty}><strong>No sales loaded.</strong><p>No sample stores, invented inventory or demonstration sales have been added.</p></div>}
    </section>
    <section className={styles.card} aria-labelledby="stock-heading">
      <p className={styles.eyebrow}>02 / STOCK</p><h2 id="stock-heading">Check what is actually there.</h2>
      {!report ? <p>Load a sales report first so the count can be tied to an exact product.</p> : <>
        <label className={styles.field}>Product<select value={productId} onChange={event => { setProductId(event.target.value); resetStock(); }}><option value="">Choose a product</option>{report.products.map(product => <option value={product.productId} key={product.productId}>{product.productName} / {product.bottleMl} mL / {product.productId}</option>)}</select></label>
        {selected && <>
          <label className={styles.check}><input type="checkbox" checked={stock.productConfirmed} onChange={e=>setStock({...stock,productConfirmed:e.target.checked})}/>I matched this exact product and bottle size to the item being counted.</label>
          <div className={styles.fields}>
            <label className={styles.field}>Bottles counted<input type="number" min={0} max={1000000} step={1} value={stock.stockUnits ?? ""} onChange={e=>setStock({...stock,stockUnits:numberOrNull(e.target.value)})}/></label>
            <label className={styles.field}>When was it counted? (your local time)<input type="datetime-local" value={localTime} onChange={e=>{setLocalTime(e.target.value);const date=new Date(e.target.value);setStock({...stock,observedAt:Number.isFinite(date.getTime())?date.toISOString():""});}}/></label>
            <label className={styles.field}>Count covers<select value={stock.scope} onChange={e=>setStock({...stock,scope:e.target.value as StockTargetInput["scope"]})}><option value="">Choose scope</option><option value="store_total">Entire store, including back stock</option><option value="shelf">Shelf only — cannot drive this target</option></select></label>
            <label className={styles.field}>Count supplied by<select value={stock.source} onChange={e=>setStock({...stock,source:e.target.value as StockTargetInput["source"]})}><option value="">Choose source</option><option value="retailer_count">Retailer</option><option value="distributor_count">Distributor</option><option value="brand_count">Brand representative</option></select></label>
          </div>
          <label className={styles.check}><input type="checkbox" checked={stock.authorizedCount} onChange={e=>setStock({...stock,authorizedCount:e.target.checked})}/>The person supplying this count was authorized to count this product at this store.</label>
          <p className={styles.fine}>This is a user-reported count, not independently verified stock. Sales are not subtracted from it: deliveries, transfers, breakage and restocking are not reconciled in this preview.</p>
        </>}
      </>}
    </section>
    <section className={styles.card} aria-labelledby="boost-heading">
      <p className={styles.eyebrow}>03 / BOOST PREVIEW</p><h2 id="boost-heading">See the proposed next move.</h2>
      {!selected ? <p>Choose a product and record its count first.</p> : <>
        <div className={styles.fields}>
          <label className={styles.field}>Stop proposing at this many bottles remaining<input type="number" min={0} max={1000000} step={1} value={stock.targetUnits ?? ""} onChange={e=>setStock({...stock,targetUnits:numberOrNull(e.target.value)})}/></label>
          <label className={styles.field}>Maximum allowed count age (hours)<input type="number" min={0.01} max={8760} step="any" value={stock.maxAgeHours ?? ""} onChange={e=>setStock({...stock,maxAgeHours:numberOrNull(e.target.value)})}/></label>
        </div>
        <label className={styles.check}><input type="checkbox" checked={stock.simulateApprovals} onChange={e=>setStock({...stock,simulateApprovals:e.target.checked})}/>Simulate the condition that all required campaign approvals exist. This does not grant or record real approval.</label>
        <label className={styles.check}><input type="checkbox" checked={stock.paused} onChange={e=>setStock({...stock,paused:e.target.checked})}/>Pause this preview.</label>
        <div className={styles.decision} role="status" aria-live="polite"><span className={styles.eyebrow}>HYPOTHETICAL / NO LIVE ACTION</span><h3>{decision.title}</h3><p>{decision.reason}</p></div>
        <p className={styles.fine}>A one-time stock-target check only. This does not prove a campaign caused a sale, track a depletion allocation, establish a slow-sales baseline or control replenishment. No ad multiplier, charge, discount or creator payout is applied.</p>
      </>}
    </section>
    <footer className={styles.actions}><button type="button" className={styles.primary} disabled={!report || busy} onClick={exportPreview}>Save preview file</button><p className={styles.fine}>Includes the accepted sales rows and selected stock check. It is a local evidence file, not a saved campaign.</p></footer>
  </main>;
}
