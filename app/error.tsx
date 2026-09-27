"use client";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{reset:()=>void}){return <main className="auth-shell"><h1>A brief interruption.</h1><p>This page could not load. Please try again.</p><Button onClick={reset}>Try again</Button><a href="/" className="underlined" style={{marginLeft:20}}>Back to SWAY</a></main>}
