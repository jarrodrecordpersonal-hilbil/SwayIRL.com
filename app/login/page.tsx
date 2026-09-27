import { getChatGPTUser,chatGPTSignInPath } from "../chatgpt-auth";
import { redirect } from "next/navigation";
import { SiteHeader,SiteFooter } from "../marketing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
export const dynamic="force-dynamic";
export const metadata={title:"Partner login | SWAY IRL"};
export default async function Login(){const user=await getChatGPTUser();if(user)redirect("/portal");return <><SiteHeader/><main className="auth-shell"><p className="eyebrow">WELCOME BACK</p><h1>Your network.<br/><em>One place.</em></h1><p>Access store availability, follow your placement requests, and keep your partner profile up to date.</p><div className="panel"><h2>Sign in to SWAY IRL</h2><p style={{marginBottom:22}}>Use your ChatGPT account to continue securely.</p><Button size="lg" asChild><a href={chatGPTSignInPath("/portal")} target="_top">Continue with ChatGPT<ArrowRight size={16}/></a></Button><p style={{marginTop:24}}>New here? <a className="underlined" href="/join">Join the network</a></p></div><p className="fineprint" style={{marginTop:18}}>SWAY team? <a className="underlined" href={chatGPTSignInPath("/admin")} target="_top">Open management</a></p></main><SiteFooter/></>}
