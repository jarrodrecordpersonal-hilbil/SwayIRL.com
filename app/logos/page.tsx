import { requireChatGPTUser } from "../chatgpt-auth";
import { isAdmin } from "@/lib/server";
import { redirect } from "next/navigation";
import { SiteHeader,SiteFooter } from "../marketing";
export const dynamic="force-dynamic";
export const metadata={title:"Logo directions | SWAY IRL"};
export default async function Logos(){const user=await requireChatGPTUser("/logos");if(!isAdmin(user))redirect("/portal");return <><SiteHeader portal admin/><main className="page-shell"><div className="page-heading"><div><p className="eyebrow">BRAND STUDIO</p><h1>Same signal. Different energy.</h1><p>Twelve dollar and neon directions, plus the longer-arrow concept.</p></div><a className="underlined" href="/admin">Back to management</a></div><div className="gallery"><figure><img src="/logo-dollar-hero.png" alt="SWAY IRL with a cream neon dollar-sign S and an extended neon path through the wordmark"/><figcaption className="fineprint">Dollar-sign S + longer neon path, with a fully illuminated arrowhead.</figcaption></figure><figure><img src="/logo-options-dollar.png" alt="Options 01 to 06: Tube Dollar, Outline Dollar, Double Stem, Green Inlay, Compact Dollar, Angular Dollar"/></figure><figure><img src="/logo-options-path.png" alt="Options 07 to 12: Throughline, Lower Sweep, Signal Dots, Upper Rail, Twin Trace, Arrow Outline"/></figure></div></main><SiteFooter/></>}
