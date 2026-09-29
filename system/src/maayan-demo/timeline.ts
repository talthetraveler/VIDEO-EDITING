/**
 * El Hamaayan demo — the edit, as data. Script: projects/maayan-demo/SCENE-PLAN.md (v2).
 * Clips are real screen recordings of the app (projects/maayan-demo/record/beats.mjs).
 * `from`/`to` are SOURCE seconds; `rate` speeds a segment up; captions are seconds from beat start.
 */
export const FPS = 30;

export type Segment = { clip: string; from: number; to: number; rate?: number };
export type Cue = { at: number; to: number; text: string; accent?: string };
export type Beat = {
  id: string;
  kind: "hook" | "phone" | "photo" | "end";
  image?: string; // photo beats: path under public/maayan-demo/
  segments?: Segment[];
  duration?: number; // hook/end only
  captions: Cue[];
};

export const BEATS: Beat[] = [
  { id: "hook", kind: "hook", duration: 2.8, captions: [{ at: 0.15, to: 2.8, text: "Where's there water today?", accent: "water" }] },
  {
    id: "map",
    kind: "phone",
    segments: [
      { clip: "map", from: 0.9, to: 2.2 }, // tap the north cluster, clusters split
      { clip: "map", from: 5.4, to: 8.8 }, // hard cut past the soft mid-flight tiles: the Golan, tap Ein Pik
    ],
    captions: [
      { at: 0, to: 2.4, text: "1,000+ springs, trails and lookouts", accent: "1,000+" },
      { at: 2.4, to: 99, text: "All on one map" },
    ],
  },
  {
    id: "place",
    kind: "phone",
    segments: [{ clip: "place", from: 1.0, to: 8.3, rate: 1.45 }],
    captions: [
      { at: 0, to: 2.3, text: "Real photos" },
      { at: 2.3, to: 99, text: "Updates from people who were there", accent: "Updates" },
    ],
  },
  {
    id: "discover",
    kind: "phone",
    segments: [
      { clip: "discover", from: 0.0, to: 5.0 }, // like, then skip — the 3rd swipe is cut
      { clip: "discover", from: 8.0, to: 10.3 },
    ],
    captions: [
      { at: 0, to: 1.0, text: "Can't decide?" },
      { at: 1.0, to: 3.3, text: "Swipe right to like", accent: "right" },
      { at: 3.3, to: 5.0, text: "Left to skip", accent: "Left" },
      { at: 5.0, to: 99, text: "Your picks, saved" },
    ],
  },
  {
    id: "nearby",
    kind: "phone",
    segments: [{ clip: "nearby", from: 3.8, to: 8.6, rate: 1.7 }],
    captions: [{ at: 0, to: 99, text: "What's near me? One tap.", accent: "One tap." }],
  },
  {
    id: "save",
    kind: "phone",
    segments: [
      { clip: "save", from: 0.6, to: 1.9 },
      { clip: "lists", from: 1.0, to: 1.7 }, // shelf + tap
      { clip: "lists", from: 3.8, to: 4.9 }, // album, photos loaded (skeleton cut)
    ],
    captions: [{ at: 0, to: 99, text: "Save it. Sort it into lists." }],
  },
  {
    id: "trips",
    kind: "phone",
    segments: [
      { clip: "tripnew", from: 3.0, to: 8.7, rate: 1.5 },
      { clip: "trip", from: 0.6, to: 1.7 }, // dashboard + tap Gear
      { clip: "trip", from: 2.62, to: 4.2 }, // packing list, "I will bring it" (skeleton cut)
    ],
    captions: [
      { at: 0, to: 4.9, text: "Plan the trip together", accent: "together" },
      { at: 4.9, to: 99, text: "Who brings what" }, // = packing list on screen
    ],
  },
  {
    id: "community",
    kind: "phone",
    segments: [{ clip: "community", from: 0.8, to: 4.4, rate: 1.2 }],
    captions: [{ at: 0, to: 99, text: "Find people to hike with" }],
  },
  {
    // Belonging: the three founders, from the founder-story carousel (text-free crop, plate blurred).
    id: "founders",
    kind: "photo",
    image: "founders/three-founders.jpg",
    duration: 4.2,
    captions: [
      { at: 0, to: 2.0, text: "Made by three friends", accent: "three friends" },
      { at: 2.0, to: 99, text: "Itay, Yotam and Yoav" },
    ],
  },
  { id: "end", kind: "end", duration: 4.5, captions: [] },
];

export const segSeconds = (s: Segment) => (s.to - s.from) / (s.rate ?? 1);
export const beatSeconds = (b: Beat) =>
  b.segments ? b.segments.reduce((n, s) => n + segSeconds(s), 0) : (b.duration ?? 0);
export const f = (sec: number) => Math.round(sec * FPS);

/** Beats with absolute frame offsets — the whole cut in one list. */
export const PLAN = (() => {
  let at = 0;
  return BEATS.map((b) => {
    const from = at;
    const len = f(beatSeconds(b));
    at += len;
    return { ...b, from, len };
  });
})();
export const TOTAL_FRAMES = PLAN.reduce((n, b) => n + b.len, 0);
