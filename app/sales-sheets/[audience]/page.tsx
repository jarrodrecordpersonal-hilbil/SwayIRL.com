import { notFound } from "next/navigation";
import { findSalesSheet, salesSheets } from "../../../lib/public-sales";
import { SalesSheetExperience } from "../../public-experience";
type Props = { params: Promise<{ audience: string }> };
export function generateStaticParams() { return salesSheets.map((sheet) => ({ audience: sheet.slug })); }
export async function generateMetadata({ params }: Props) {
  const sheet = findSalesSheet((await params).audience);
  return { title: sheet ? `${sheet.audience} sales sheet | SWAY IRL` : "Sales sheets | SWAY IRL" };
}
export default async function SalesSheet({ params }: Props) {
  const sheet = findSalesSheet((await params).audience);
  if (!sheet) notFound();
  return <SalesSheetExperience sheet={sheet} />;
}
