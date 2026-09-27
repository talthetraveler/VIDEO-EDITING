#!/usr/bin/env node
/**
 * Scaffold a new video project.
 *
 *   npm run new -- miami-outage "Miami Outage" vertical
 *   npm run new -- launch-film "Launch Film" vertical motion
 *
 * args: <slug> [title] [vertical|square|wide] [editorial|motion]
 *
 * Creates:
 *   src/compositions/<slug>/<Pascal>.tsx      composition stub
 *   src/compositions/<slug>/SCENE-PLAN.md     (editorial)  timed scene plan
 *   src/compositions/<slug>/BEAT-SHEET.md     (motion)     4–7 beat sheet
 *   public/<area>/<slug>/                     per-project asset folders
 * and prints the <Composition> line to paste into src/Root.tsx.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [slug, title = slug, format = "vertical", mode = "editorial"] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Usage: npm run new -- <slug:kebab-case> [title] [vertical|square|wide] [editorial|motion]");
  process.exit(1);
}
if (mode !== "editorial" && mode !== "motion") {
  console.error(`Unknown mode "${mode}". Use editorial | motion.`);
  process.exit(1);
}
const pascal = slug.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
const dims = { vertical: [1080, 1920], square: [1080, 1080], wide: [1920, 1080] }[format];
if (!dims) {
  console.error(`Unknown format "${format}". Use vertical | square | wide.`);
  process.exit(1);
}

const root = process.cwd();
const compDir = join(root, "src", "compositions", slug);
if (existsSync(compDir)) {
  console.error(`${compDir} already exists.`);
  process.exit(1);
}
mkdirSync(compDir, { recursive: true });

for (const area of [
  "footage",
  "voiceover",
  "images",
  "screenshots",
  "screen-recordings",
  "logos",
  "music",
  "sfx",
  "generated",
]) {
  const d = join(root, "public", area, slug);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, ".gitkeep"), "");
}

if (mode === "editorial") {
  writeFileSync(
    join(compDir, "SCENE-PLAN.md"),
    `# ${title} — scene plan (editorial / MODE A+B mix)

- format: ${format} (${dims[0]}x${dims[1]}) @ 30fps
- assets: public/*/${slug}/   voiceover: public/voiceover/${slug}/

Fill this in BEFORE writing component code. One block per beat.
Change something meaningful every 1–3s. Big stats get a full-screen moment.
Priority: human footage > real story footage > product UI > screenshots >
maps > data-viz > typography > diagrams > generated.

---

## 00:00–00:03
- Narration:
- Visual:
- Assets:
- Animation:

## 00:03–00:06
- Narration:
- Visual:
- Assets:
- Animation:

## 00:06–00:09
- Narration:
- Visual:
- Assets:
- Animation:
`,
  );
} else {
  writeFileSync(
    join(compDir, "BEAT-SHEET.md"),
    `# ${title} — beat sheet (MODE B / motion)

- format: ${format} (${dims[0]}x${dims[1]}) @ 30fps
- 4–7 beats. ONE visual idea per beat. Hard cuts by default. Numbers get their
  own beat. On-screen text = 2–6 words. Lead with the strongest claim.

---

## BEAT 1 — 0:00–0:03
- Narration:
- On-screen text:
- Visual:            (one idea — e.g. dark map builds outward in cyan)
- Motion:            (camera push / pullback / parallax / orbit — and speed)
- Purpose:

## BEAT 2 — 0:03–0:06
- Narration:
- On-screen text:
- Visual:
- Motion:
- Purpose:

## BEAT 3 — 0:06–0:10
- Narration:
- On-screen text:
- Visual:
- Motion:
- Purpose:

## BEAT 4 — 0:10–0:14   (number moment?)
- Narration:
- On-screen text:
- Visual:
- Motion:
- Purpose:

## BEAT 5 — 0:14–0:16
- Narration:
- On-screen text:
- Visual:
- Motion:
- Purpose:
`,
  );
}

const editorialStub = `import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Frame, Headline, editorialTheme } from "../../components";
import { loadFonts } from "../../lib/fonts";

loadFonts();
const theme = editorialTheme;

// Build scenes here (or split into ./scenes/*.tsx for a long video).

const Scene1: React.FC = () => (
  <Frame theme={theme}>
    <AbsoluteFill style={{ justifyContent: "center", padding: 96 }}>
      <Headline theme={theme} text="${title}" />
    </AbsoluteFill>
  </Frame>
);

export const ${pascal}: React.FC = () => {
  const { fps } = useVideoConfig();
  const F = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.palette.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={F(3)} name="Scene 1">
          <Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 10 })} />
        <TransitionSeries.Sequence durationInFrames={F(3)} name="Scene 2">
          <Scene1 />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/** Bump this as scenes are added, or switch to calculateMetadata for VO timing. */
export const ${pascal.toUpperCase()}_DURATION = Math.round(6 * 30) - 10;
`;

const motionStub = `import React from "react";
import { AbsoluteFill } from "remotion";
import { NeonField, HeroWord, PushIn, MotionSequence, LightSweep, neonTheme, type Beat } from "../../components";
import { loadFonts } from "../../lib/fonts";

loadFonts();
const theme = neonTheme;

// One scene component per beat. ONE visual idea each. See BEAT-SHEET.md.

const Beat1: React.FC = () => (
  <AbsoluteFill>
    <NeonField theme={theme} progress={0.05} />
    <PushIn move="in" amount={0.1}>
      <HeroWord theme={theme} words={["${title.toUpperCase().split(" ").slice(0, 3).join('", "')}"]} />
    </PushIn>
  </AbsoluteFill>
);

const Beat2: React.FC = () => (
  <AbsoluteFill>
    <NeonField theme={theme} progress={0.5} />
  </AbsoluteFill>
);

const BEATS: Beat[] = [
  { id: "b1", durationSeconds: 3, idea: "hook", scene: Beat1 },
  { id: "b2", durationSeconds: 3, idea: "TODO", scene: Beat2, enterOverlay: () => <LightSweep theme={theme} /> },
];

export const ${pascal}: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <MotionSequence beats={BEATS} />
  </AbsoluteFill>
);

export const ${pascal.toUpperCase()}_DURATION = Math.round((3 + 3) * 30);
`;

writeFileSync(join(compDir, `${pascal}.tsx`), mode === "motion" ? motionStub : editorialStub);

console.log(`\n✓ created src/compositions/${slug}/  (${mode} mode)`);
console.log(`\nAdd to src/Root.tsx:\n`);
console.log(`  import { ${pascal}, ${pascal.toUpperCase()}_DURATION } from "./compositions/${slug}/${pascal}";\n`);
console.log(`  <Folder name="${pascal}">`);
console.log(`    <Composition`);
console.log(`      id="${pascal}"`);
console.log(`      component={${pascal}}`);
console.log(`      durationInFrames={${pascal.toUpperCase()}_DURATION}`);
console.log(`      fps={30}`);
console.log(`      width={${dims[0]}}`);
console.log(`      height={${dims[1]}}`);
console.log(`    />`);
console.log(`  </Folder>\n`);
console.log(
  `Next: fill in src/compositions/${slug}/${mode === "motion" ? "BEAT-SHEET.md" : "SCENE-PLAN.md"}, then build.\n`,
);
