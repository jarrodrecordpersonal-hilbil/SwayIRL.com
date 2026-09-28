"use client";

import { useEffect, useState, type ReactNode } from "react";
import { salesSheets, salesPitch, type SalesSheet } from "../lib/public-sales";
import { filterPublicStores, parsePublicStores, type PublicStore } from "../lib/public-network";
import s from "./public-experience.module.css";

const links = [["Open retailers", "/open-retailers"], ["Sales sheets", "/sales-sheets"]] as const;
const Arrow = () => <span aria-hidden="true">↗</span>;
function LinkButton({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <a className={`${s.button} ${secondary ? s.secondary : ""}`} href={href}>{children}<Arrow /></a>;
}
export function PublicShell({ children }: { children: ReactNode }) {
  return <div className={s.site}>
    <a className={s.skip} href="#main-content">Skip to content</a>
    <header className={s.header}><div className={s.headerInner}>
      <a className={s.brand} href="/" aria-label="SWAY IRL home"><img src="/brand.png" alt="SWAY IRL" /></a>
      <nav className={s.desktopNav} aria-label="Main navigation">{links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</nav>
      <div className={s.headerActions}><a className={s.login} href="/login">Log in <Arrow /></a></div>
      <details className={s.mobileMenu}><summary>Menu <span aria-hidden="true">+</span></summary><nav aria-label="Mobile navigation">{links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}<a href="/login">Log in</a><a href="/join">Join SWAY</a></nav></details>
    </div></header>
    <main id="main-content">{children}</main>
    <footer className={s.footer}><div><a href="/" className={s.wordmark}>SWAY IRL</a><p>Influence where people buy.</p></div><nav aria-label="Footer navigation">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}<a href="/boost">SWAY Boost</a><a href="/privacy">Privacy</a></nav><p className={s.fine}>Proposed launch terms. Commercial agreements and campaign activation are confirmed with the SWAY team.</p></footer>
  </div>;
}
function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className={s.sectionHeading}><div><p className={s.eyebrow}>{eyebrow}</p><h2>{title}</h2></div>{children}</div>;
}
export function HomeExperience() {
  return <PublicShell>
    <section className={`${s.hero} ${s.homeHero}`}><div className={s.heroInner}><div>
      <p className={s.eyebrow}>INFLUENCE. IN REAL LIFE.</p>
      <h1>Influence where<br /><em>people buy.</em></h1>
      <p className={s.heroIntro}>Creator videos on store TVs. Helping shoppers discover products right where they buy.</p>
      <a className={s.heroPath} href="#partners">Find your place in SWAY <span aria-hidden="true">↓</span></a>
    </div><figure className={s.heroVisual}><img src="/retail-scene.png" alt="Concept illustration of creator videos playing on a retail store TV" /><figcaption>Illustrative store setup</figcaption></figure></div></section>
    <section className={s.partnerSection} id="partners"><div className={s.wrap}>
      <h2>How will you use SWAY?</h2>
      <div className={s.pathGrid}>{[
        { slug: "retailers", label: "Retailers", text: "Host a screen. Promote your store. Earn ad revenue." },
        { slug: "brands", label: "Brands", text: "Put your products in front of shoppers." },
        { slug: "distributors", label: "Distributors", text: "Connect your brands and stores. Earn referral revenue." },
        { slug: "influencers", label: "Creators", text: "Bring your influence into stores." },
      ].map((path) => <a className={s.pathCard} href={`/sales-sheets/${path.slug}`} key={path.slug}>
        <div><h3>{path.label}</h3><Arrow /></div><p>{path.text}</p>
      </a>)}</div>
    </div></section>
    <section className={s.homeExplainer} id="how-it-works"><div className={s.wrap}>
      <h2>How it works.</h2><p>Brands bring the products. Creators tell the story. SWAY brings it to screens where people shop.</p>
    </div></section>
  </PublicShell>;
}

export function RetailerBrowser({ compact = false }: { compact?: boolean }) {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 12000);
    setStatus("loading");
    async function load() {
      try {
        const response = await fetch("/api/open-retailers", { signal: controller.signal, credentials: "omit", cache: "no-store" });
        if (!response.ok) throw new Error("Retailer directory unavailable.");
        const result = parsePublicStores(await response.json());
        if (active) { setStores(result); setStatus("ready"); }
      } catch { if (active) setStatus("error"); }
      finally { clearTimeout(timer); }
    }
    void load();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [attempt]);
  const filtered = filterPublicStores(stores, { query, state: region, type });
  const shown = compact ? filtered.slice(0, 3) : filtered;
  return <div aria-busy={status === "loading"}>
    {!compact && <div className={s.filters}><label>Search retailer or city<input type="search" value={query} maxLength={150} onChange={(e) => setQuery(e.target.value)} placeholder="Store name, city, or category" /></label><label>State / region<select aria-label="State / region" value={region} onChange={(e) => setRegion(e.target.value)}><option value="">All regions</option>{Array.from(new Set(stores.map((store) => store.state))).sort().map((state) => <option key={state}>{state}</option>)}</select></label><label>Store type<select aria-label="Store type" value={type} onChange={(e) => setType(e.target.value)}><option value="">All store types</option>{Array.from(new Set(stores.map((store) => store.type))).sort().map((item) => <option key={item}>{item}</option>)}</select></label></div>}
    {status === "loading" ? <div className={s.networkState} role="status"><strong>Checking retailer availability…</strong><p>Only published locations accepting requests appear here.</p></div> : status === "error" ? <div className={s.networkState} role="alert"><div><strong>Availability is temporarily unavailable.</strong><p>We could not check the network. This does not mean every store is full.</p></div><button className={`${s.button} ${s.secondary}`} onClick={() => setAttempt((n) => n + 1)}>Try again</button></div> : !stores.length ? <div className={s.networkState}><div><strong>No retailers are accepting new placements right now.</strong><p>Check back as approved locations become available, or introduce your store.</p></div><LinkButton href="/join?role=retailer" secondary>Add my store</LinkButton></div> : !shown.length ? <div className={s.networkState}><div><strong>No retailers match these filters.</strong><p>Try another city or browse every available location.</p></div><button className={`${s.button} ${s.secondary}`} onClick={() => { setQuery(""); setRegion(""); setType(""); }}>Clear filters</button></div> : <div className={s.retailerGrid}>{shown.map((store) => <article className={s.retailerCard} key={store.id}><span className={s.availability}>Open for placements</span><h3>{store.name}</h3><p>{store.city}, {store.state}</p><p className={s.category}>{store.type}</p>{store.description && <details className={s.details}><summary>About this retailer</summary><p>{store.description}</p></details>}<LinkButton href="/login" secondary>Sign in to request</LinkButton></article>)}</div>}
    <p className={s.fine}>A request starts a conversation; it does not reserve or purchase a placement. SWAY confirms availability and terms before booking.</p>
  </div>;
}
export function DirectoryExperience() {
  return <PublicShell><section className={s.pageIntro}><div className={s.wrap}><p className={s.eyebrow}>THE RETAIL NETWORK</p><h1>Find your next market.</h1><p>Browse retailers accepting SWAY placements. No login needed to explore.</p></div></section><section className={s.section}><div className={s.wrap}><RetailerBrowser /></div></section></PublicShell>;
}

function CopyPitch({ sheet }: { sheet: SalesSheet }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const pitch = salesPitch(sheet);
  async function copy() {
    try { await navigator.clipboard.writeText(pitch); setState("copied"); }
    catch { setState("manual"); }
  }
  return <div className={s.copyArea}><button type="button" className={`${s.button} ${s.secondary}`} onClick={() => void copy()}>Copy pitch</button><span role="status" className={s.copyStatus}>{state === "copied" ? "Pitch copied." : ""}</span>{state === "manual" && <label className={s.manualCopy}>Clipboard unavailable. Select and copy this pitch:<textarea readOnly value={pitch} rows={5} onFocus={(e) => e.currentTarget.select()} /></label>}</div>;
}
export function SalesLibraryExperience() {
  return <PublicShell><section className={s.pageIntro}><div className={s.wrap}><p className={s.eyebrow}>THE PUBLIC SALES TOOLKIT</p><h1>A clear pitch.<br /><em>For every partner.</em></h1><p>Open a one-page sheet. Copy the pitch. Print or save as PDF. No account or payment required.</p></div></section><section className={s.section}><div className={s.wrap}><div className={s.libraryGrid}>{salesSheets.map((sheet, i) => <article className={s.libraryCard} data-accent={i} key={sheet.slug}><p className={s.eyebrow}>{sheet.audience} · ONE-PAGE OVERVIEW</p><h2>{sheet.headline}</h2><p>{sheet.intro}</p><div className={s.miniOffer}><strong>{sheet.offer}</strong><span>{sheet.offerLabel}</span></div><div className={s.actions}><LinkButton href={`/sales-sheets/${sheet.slug}`}>View sheet</LinkButton><CopyPitch sheet={sheet} /></div></article>)}</div><div className={s.related}><div><strong>Need product to move faster?</strong><p>Explore SWAY Boost: a separately scoped campaign service.</p></div><LinkButton href="/boost" secondary>Explore SWAY Boost</LinkButton></div></div></section></PublicShell>;
}
export function SalesSheetExperience({ sheet }: { sheet: SalesSheet }) {
  return <PublicShell><div className={`${s.wrap} ${s.sheetWrapper}`}><div className={s.sheetControls}><a href="/sales-sheets">← All sales sheets</a><div className={s.actions}><CopyPitch sheet={sheet} /><button className={s.button} type="button" onClick={() => window.print()}>Print / Save PDF</button></div></div><article className={s.paper}>
    <div className={s.paperMasthead}><strong>SWAY IRL</strong><span>{sheet.audience} partner program</span></div>
    <p className={s.eyebrow}>INFLUENCE WHERE PEOPLE BUY.</p><h1>{sheet.headline}</h1><p className={s.paperIntro}>{sheet.intro}</p>
    <div className={s.paperOffer}><strong>{sheet.offer}</strong><p>{sheet.offerLabel}</p></div>
    <section className={s.paperSection}><h2>What you get</h2><ul>{sheet.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></section>
    <section className={s.paperSection}><h2>How it works</h2><ol>{sheet.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>
    <section className={s.paperTerms}><h2>Before we launch</h2><p>{sheet.terms}</p></section>
    <div className={s.paperFooter}><strong>SWAY IRL · {sheet.audience}</strong><span>Proposed terms · Confirmed by agreement</span></div>
  </article><div className={s.sheetCta}><LinkButton href={sheet.slug === "brands" ? "/open-retailers" : `/join?role=${sheet.role}`}>{sheet.action}</LinkButton><p className={s.fine}>Reading and sharing this sheet is free. Joining is a separate next step.</p></div></div></PublicShell>;
}
function BoostBlock({ showLink = true }: { showLink?: boolean }) {
  return <section className={s.boost}><div className={s.wrap}><div className={s.boostGrid}><div><p className={s.eyebrow}>SWAY BOOST · OPTIONAL CAMPAIGN SERVICE</p><h2>Need product to move?<br /><em>Turn up the market.</em></h2><p>Focus attention where inventory needs support—with the goal of faster sell-through, reorders, and capital freed for what comes next.</p>{showLink && <LinkButton href="/boost">Explore SWAY Boost</LinkButton>}</div><ol>{[["Pick the market", "Focus on selected retailers and products."], ["Add frequency", "Scope extra exposure without reducing agreed base placements."], ["Plan the offer", "Agree retailer-controlled QR offers or stock-based reductions where supported."], ["Agree the measurement", "Define available POS data, attribution, and the comparison baseline."]].map(([title, body], i) => <li key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol></div><p className={s.boostFine}>Separately quoted. Offers, integrations, and measurement are scoped per campaign; no automated POS integration or guaranteed sales lift is promised.</p></div></section>;
}
export function BoostExperience() {
  return <PublicShell><section className={s.pageIntro}><div className={s.wrap}><p className={s.eyebrow}>WHEN A MARKET NEEDS MORE ATTENTION</p><h1>SWAY Boost.</h1><p>A focused campaign service built around your product, selected markets, and a clear sell-through goal.</p></div></section><BoostBlock showLink={false} /><section className={s.section}><div className={s.wrap}><Heading eyebrow="PLAN BEFORE ACTIVATION" title="One campaign. Agreed terms." /><div className={s.offerChecklist}><div><h3>The campaign brief</h3><ul><li>Product, retailers, dates, and inventory objective.</li><li>Extra frequency and creative.</li><li>Retailer-approved offer rules and pricing boundaries.</li></ul></div><div><h3>The measurement plan</h3><ul><li>Available POS data and pre-campaign baseline.</li><li>Attribution, returns, and overlapping campaigns.</li><li>Any creator bonus, its payer, and payout terms.</li></ul></div></div><div className={s.actions}><LinkButton href="/join?role=brand">Discuss a Boost campaign</LinkButton><LinkButton href="/sales-sheets/brands" secondary>View brand sales sheet</LinkButton></div><p className={s.fine}>This page describes a proposed service, not an automated inventory, pricing, or POS product. Final scope and commercial terms require agreement.</p></div></section></PublicShell>;
}
