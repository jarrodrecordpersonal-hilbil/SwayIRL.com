import { env } from "cloudflare:workers";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import type { Partner } from "./types";
export function database(){if(!env.DB)throw new Error("Database binding unavailable");return env.DB;}
export function isAdmin(user:ChatGPTUser){const allowed=(env.SWAY_ADMIN_EMAILS||"").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);return allowed.includes(user.email.toLowerCase());}
export async function getProfile(id:string){return database().prepare("SELECT * FROM partners WHERE id = ?").bind(id).first<Partner>();}
