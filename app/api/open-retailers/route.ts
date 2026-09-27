import { database } from "@/lib/server";
import { publicStoresQuery } from "@/lib/public-network";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const result = await database().prepare(publicStoresQuery).all();
    return Response.json({ stores: result.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("public_open_retailers_failed", error);
    return Response.json({ error: "Retailer availability is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
