import type { Role } from "./types";

export type ApplicationField = { key: string; label: string; hint?: string; required?: boolean; options?: string[]; multiline?: boolean; max?: number };
export const applicationFields: Record<Role, ApplicationField[]> = {
  retailer: [
    { key: "address", label: "Store address", required: true, hint: "Street, city, state, and ZIP code." },
    { key: "locations", label: "Number of locations", required: true, options: ["1", "2–5", "6–20", "21+"] },
    { key: "placement", label: "Where could a screen go?", required: true, options: ["Wall", "Shelf / endcap", "Floor stand", "Inside entrance", "Outside entrance", "Help me choose"] },
    { key: "connection", label: "Internet near the screen", required: true, options: ["Wi-Fi available", "Wired connection available", "Not sure yet"] },
    { key: "pos", label: "POS system (optional)", hint: "For example: Lightspeed. No account credentials needed." },
  ],
  brand: [
    { key: "products", label: "Products to promote", required: true, multiline: true },
    { key: "distribution", label: "Where can shoppers buy these products?", required: true, multiline: true, hint: "Retailers, distributors, or markets where you have distribution." },
    { key: "storeCount", label: "Starting store count", required: true, options: ["1–9", "10 ($1,200/month)", "25 ($3,000/month)", "50 ($6,000/month)", "Help me choose"] },
    { key: "goal", label: "Campaign goal", required: true, options: ["Brand awareness", "New product launch", "Sell-through / reorders", "SWAY Boost", "Help me plan"] },
    { key: "creative", label: "Creative readiness", required: true, options: ["I have a 15-second video", "I have content to adapt", "I need a creator match"] },
  ],
  distributor: [
    { key: "territory", label: "Territories you serve", required: true, hint: "States, cities, or regions." },
    { key: "portfolio", label: "Brands / categories in your portfolio", required: true, multiline: true },
    { key: "retailReach", label: "Retail accounts you serve", required: true, options: ["1–25", "26–100", "101–500", "501+"] },
    { key: "introduction", label: "First introduction", required: true, options: ["Advertising brands", "Retail stores", "Both brands and stores"] },
  ],
  influencer: [
    { key: "categories", label: "Content specialties", required: true, hint: "For example: bourbon reviews, cocktails, or agave spirits." },
    { key: "audience", label: "Tell us about your audience", required: true, multiline: true, hint: "Interests, locations, and audience size, if known." },
    { key: "availability", label: "Availability", required: true, options: ["Ready for a campaign", "Within the next month", "Exploring opportunities"] },
    { key: "sample", label: "Sample video link (optional)", hint: "A public link to work you would like us to see." },
  ],
};
export const nextSteps: Record<Role, { review: string; action: string; tab: string; detail: string }> = {
  retailer: { review: "Review store fit and screen placement", action: "Add a store for review", tab: "my-stores", detail: "We review your location, placement, and connection before scheduling installation." },
  brand: { review: "Review distribution and campaign fit", action: "Explore available stores", tab: "network", detail: "Choose stores and send a placement request. We confirm creative, price, and availability before booking." },
  distributor: { review: "Review territory and brand referrals", action: "Make your first introduction", tab: "referrals", detail: "Introduce a brand or retailer you know. The 10% referral share applies to qualifying advertising brands you refer." },
  influencer: { review: "Review creator work and audience fit", action: "View your partner profile", tab: "profile", detail: "We review your work for campaign fit. Creative scope, pay, and usage rights are agreed before you create or license content." },
};
export function parseApplication(value?: string): Record<string, string> {
  try { const result = JSON.parse(value || "{}"); return result && typeof result === "object" && !Array.isArray(result) ? Object.fromEntries(Object.entries(result).filter((entry): entry is [string,string] => typeof entry[1] === "string")) : {}; } catch { return {}; }
}
export function applicationStatus(stage?: string | null): string {
  return ({ New: "Application received", Contacted: "In review", Qualified: "Planning next steps", Proposal: "Discussing your plan", Won: "Onboarding agreed", Lost: "Application closed" } as Record<string,string>)[stage || ""] || "Profile saved";
}

export const creatorBonus = {
  short: "Proposed sales bonus: 5%, or 10% for selected campaigns.",
  detail: "A proposed bonus on qualifying incremental net product sales credited to your campaign through POS reporting and agreed attribution rules. Baseline, eligible products and stores, measurement window, returns, payer, rate, and payout timing must be agreed before launch. POS sales alone do not prove your ad caused a purchase. Production fees and usage rights are agreed separately.",
};
