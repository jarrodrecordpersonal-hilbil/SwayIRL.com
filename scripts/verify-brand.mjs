import fs from "node:fs";
const errors=[];
const layout=fs.readFileSync("app/layout.tsx","utf8");
const page=fs.readFileSync("app/public-experience.tsx","utf8");
if(!/SWAY IRL/.test(layout)) errors.push("layout metadata must identify SWAY IRL");
if(!/Influence where people buy\.|Real-world retail media/.test(layout)) errors.push("SWAY market position missing from metadata");
if(!/https:\/\/mixxgroup\.com/.test(page)) errors.push("public experience must link back to MIXX Group");
if(!/swayirl-logo|SWAY/.test(page)) errors.push("public experience missing SWAY brand identity");
if(errors.length){console.error(errors.join("\n"));process.exit(1)}
console.log("SWAY IRL brand smoke checks passed.");
