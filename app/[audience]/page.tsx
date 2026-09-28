import { notFound } from "next/navigation";
import { findSalesSheet } from "../../lib/public-sales";
import { SalesSheetExperience } from "../public-experience";
type Props = { params: Promise<{ audience: string }> };
export async function generateMetadata({ params }: Props) {
  const sheet = findSalesSheet((await params).audience);
  return { title: sheet ? `${sheet.audience} | SWAY IRL` : "SWAY IRL" };
}
export default async function Audience({ params }: Props) {
  const sheet = findSalesSheet((await params).audience);
  if (!sheet) notFound();
  return <SalesSheetExperience sheet={sheet} />;
}
