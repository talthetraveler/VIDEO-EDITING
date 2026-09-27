// Separate entry for the El Hamaayan demo. src/Root.tsx imports every shoot's footage JSON from
// public/footage (not in git), so it cannot bundle on a fresh checkout — this one needs only
// public/maayan-demo/. Render:
//   npx remotion render src/maayan-demo/index.ts MaayanDemo out.mp4 --scale=0.5 --crf 24
import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
