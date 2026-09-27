import { requireChatGPTUser } from "../chatgpt-auth";
import { isAdmin } from "@/lib/server";
import Workspace from "../workspace";
import { SiteHeader,SiteFooter } from "../marketing";
export const dynamic="force-dynamic";
export const metadata={title:"Manage the network | SWAY IRL"};
export default async function Admin(){const user=await requireChatGPTUser("/admin");if(!isAdmin(user))return <><SiteHeader portal/><main className="auth-shell"><h1>This space is for the SWAY team.</h1><p>Your partner account is ready in the portal.</p><a className="underlined" href="/portal">Go to my partner portal</a></main><SiteFooter/></>;return <Workspace user={user} adminMode/>}
