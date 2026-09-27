export type Role="retailer"|"distributor"|"brand"|"influencer";
export const roles:Role[]=["retailer","distributor","brand","influencer"];
export const roleLabels:Record<Role,string>={retailer:"Retailer",distributor:"Distributor",brand:"Brand",influencer:"Creator"};
export const stages=["New","Contacted","Qualified","Proposal","Won","Lost"] as const;
export interface Partner{id:string;email:string;name:string;company:string;role:Role;markets:string;website:string;notes:string;application?:string;created_at:string;updated_at:string}
export interface StoreRecord{id:string;name:string;city:string;state:string;type:string;capacity:number;monthly_cents:number;annual_cents:number;status:"draft"|"published"|"paused";partner_id:string|null;description:string;used:number;open:number;created_at:string;updated_at:string}
export interface PlacementRequest{id:string;partner_id:string;store_id:string;campaign:string;notes:string;billing:"monthly"|"annual";status:"requested"|"confirmed"|"declined"|"cancelled";rate_cents:number;store_name:string;city:string;state:string;company?:string;email?:string;created_at:string;updated_at:string}
export interface Lead{id:string;partner_id:string|null;referrer_id:string|null;name:string;email:string;company:string;role:Role;source:string;stage:typeof stages[number];next_step:string;follow_up:string;owner:string;value_cents:number;notes:string;created_at:string;updated_at:string}
export interface WorkspaceData{profile:Partner|null;applicationStage:string|null;stores:StoreRecord[];requests:PlacementRequest[];referrals:Pick<Lead,"id"|"company"|"name"|"role"|"stage"|"created_at">[];ownStores:StoreRecord[];isAdmin:boolean;partners:Partner[];leads:Lead[]}
export const money=(cents:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(cents/100);
