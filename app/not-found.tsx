import { SiteHeader,SiteFooter } from "./marketing";
import { Button } from "@/components/ui/button";
export default function NotFound(){return <><SiteHeader/><main className="auth-shell"><p className="eyebrow">OFF THE AIR, JUST FOR A MOMENT</p><h1>Let’s get you<br/><em>back on track.</em></h1><p>We couldn’t find that page.</p><Button asChild><a href="/">Back to SWAY IRL</a></Button></main><SiteFooter/></>}
