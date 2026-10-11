// Lists the caption chunks of the last build so ar_uganda.py can report missing Arabic lines.
import fs from "node:fs";
const j = JSON.parse(fs.readFileSync("projects/st-uganda/BUILD-LOG.json"));
const t = j.captions.map(x => x.text);
const u = [...new Set(t.flatMap(x => [x.replace(/\n/g, " "), ...x.split("\n")]))];
fs.writeFileSync("projects/st-uganda/chunks.txt", u.join("\n"));
console.log(t.map(x => x.replace(/\n/g, " // ")).join(" | "));
