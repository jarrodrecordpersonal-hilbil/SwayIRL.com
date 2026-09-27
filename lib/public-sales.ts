export type SalesSheet = {
  slug: string;
  audience: string;
  role: string;
  headline: string;
  intro: string;
  offer: string;
  offerLabel: string;
  benefits: string[];
  steps: string[];
  terms: string;
  action: string;
};

// Proposed commercial terms. Keep this source shared by the library and sheets.
export const salesSheets: SalesSheet[] = [
  {
    slug: "brands", audience: "Brands", role: "brand",
    headline: "Get your story on screen.",
    intro: "Creator-powered product stories inside retail stores, where discovery can become a purchase.",
    offer: "$120", offerLabel: "per store / month · proposed launch pricing",
    benefits: ["One recurring 15-second brand spot.", "Choose relevant retailers and markets.", "Add creator production or SWAY Boost by separate agreement."],
    steps: ["Browse public retailer availability.", "Sign in and request your placements.", "Agree creative, capacity, and commercial terms before launch."],
    terms: "Requests do not reserve inventory or take payment. Creator production, Boost, and annual packages are quoted separately. Sales lift and impressions are not guaranteed; reporting is scoped per campaign.",
    action: "Find open retailers",
  },
  {
    slug: "retailers", audience: "Retailers", role: "retailer",
    headline: "Make your space work harder.",
    intro: "Host a SWAY screen, promote your store, and participate in the advertising revenue generated at your location.",
    offer: "25%", offerLabel: "of your store's ad revenue · proposed launch terms",
    benefits: ["SWAY supplies the TV and coordinates installation.", "Four free 15-second store ads in every rotation.", "Creator-led brand stories where your customers already shop."],
    steps: ["Tell us about your location.", "Agree placement, connectivity, and operating responsibilities.", "Publish your location when approved and ready for placements."],
    terms: "SWAY owns the supplied TV under the proposed launch model. Installation responsibilities, revenue definitions, and payout timing are agreed in the store agreement. Revenue depends on booked placements; occupancy and earnings are not guaranteed.",
    action: "Add my store",
  },
  {
    slug: "influencers", audience: "Creators", role: "influencer",
    headline: "Take your influence into stores.",
    intro: "Give your product knowledge a real-world stage through concise content made for the shopping moment.",
    offer: "5%", offerLabel: "proposed sales bonus · 10% for selected campaigns",
    benefits: ["Create product stories for in-store screens.", "Agree production fees and usage rights per campaign.", "Participate in qualifying incremental net product sales attributed to your campaign."],
    steps: ["Share your channels, work, and preferred markets.", "Agree the creative, compensation, and content license.", "Set POS data, baseline, attribution, payer, and payout terms before launch."],
    terms: "The proposed bonus is separate from ad fees. Exclude returns, duplicate sales, and unrelated uplift under agreed attribution rules. POS records verify purchases, not individual ad exposure. Integrations are scoped per campaign. Signup does not grant content rights or guarantee work or earnings.",
    action: "Join as a creator",
  },
  {
    slug: "distributors", audience: "Distributors", role: "distributor",
    headline: "Put your relationships to work.",
    intro: "Connect the brands and retailers you already know to a recurring in-store media opportunity.",
    offer: "10%", offerLabel: "of referred-brand ad revenue while qualifying placements stay active",
    benefits: ["Introduce relevant brands and retail locations.", "Follow your submitted referrals in the partner portal.", "Let SWAY coordinate placement review and screen operations."],
    steps: ["Introduce your company, categories, and markets.", "Submit a partner introduction with their permission.", "Agree attribution and payout terms before activation."],
    terms: "The proposed 10% share applies only to brands you refer, not every advertiser in a store. Eligibility, revenue definitions, and payment timing are agreed before launch. Referral submission does not send an email or guarantee a placement.",
    action: "Become a distribution partner",
  },
];

export function findSalesSheet(slug: string): SalesSheet | undefined {
  return salesSheets.find((sheet) => sheet.slug === slug);
}
export function salesPitch(sheet: SalesSheet): string {
  return `${sheet.headline} ${sheet.intro}\n\n${sheet.offer} — ${sheet.offerLabel}.\n${sheet.benefits.join("\n")}\n\n${sheet.terms}`;
}
