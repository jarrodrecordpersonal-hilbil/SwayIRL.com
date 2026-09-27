import { notFound } from "next/navigation";
import { MarketingPage, audiences } from "../marketing";
export async function generateMetadata({params}:{params:Promise<{audience:string}>}) { const {audience}=await params; const a=audiences[audience]; return {title:a ? `${a.label} | SWAY IRL` : "SWAY IRL"}; }
export default async function Audience({params}:{params:Promise<{audience:string}>}) {const {audience}=await params; if(!audiences[audience]) notFound(); return <MarketingPage audience={audience}/>;}
