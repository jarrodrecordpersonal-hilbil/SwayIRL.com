import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { isAdmin } from "@/lib/server";
import { SiteHeader, SiteFooter } from "@/app/marketing";
import FlowWorkbench from "./workbench";

export const dynamic = "force-dynamic";
export const metadata = { title: "SWAY FLOW pilot | SWAY IRL", robots: { index: false, follow: false } };

export default async function FlowPilot() {
  const user = await requireChatGPTUser("/admin/flow");
  if (!isAdmin(user)) {
    return <><SiteHeader portal /><main className="auth-shell"><h1>This space is for the SWAY team.</h1><p>Sales and stock previews are not public.</p><a className="underlined" href="/portal">Go to my partner portal</a></main><SiteFooter /></>;
  }
  return <><SiteHeader portal /><FlowWorkbench /><SiteFooter /></>;
}
