import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "SWAY IRL — Influence where people buy.", description: "A retail media network connecting brands, retailers, distributors, and creators through in-store screens.", icons: {icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="en"><body>{children}</body></html>;}
