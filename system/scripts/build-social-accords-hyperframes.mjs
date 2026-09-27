import fs from "node:fs";
import path from "node:path";

const repo = process.cwd();
const projectDir = path.join(repo, "projects", "social-accords-hyperframes");
const cleanProjectDir = path.join(repo, "projects", "social-accords-hyperframes-clean");
const assetsDir = path.join(projectDir, "assets");
const brollDir = path.join(assetsDir, "instagram");
const rendersDir = path.join(projectDir, "renders");

const arollOriginalSrc = path.join(repo, "public", "footage", "social-accords", "montana-social-accords-aroll.mp4");
const arollKeyedSrc = path.join(repo, "public", "footage", "social-accords", "montana-social-accords-aroll-keyed.mp4");
const arollSrc = fs.existsSync(arollKeyedSrc) ? arollKeyedSrc : arollOriginalSrc;
const captionsSrc = path.join(repo, "public", "footage", "social-accords", "montana-social-accords-aroll.captions.json");
const manifestSrc = path.join(repo, "assets", "instagram", "source_manifest.json");

const W = 1080;
const H = 1920;
const renderTailTrim = 1.85;

const keptSegments = [
  [0.13, 10.1],
  [10.34, 20.52],
  [20.81, 42.14],
  [42.39, 51.57],
  [51.86, 55.56],
  [55.86, 81.33],
  [81.62, 91.74],
  [92.07, 109.38],
  [109.98, 126.41],
  [126.67, 130.1],
  [130.34, 157.58],
  [157.89, 159.83],
  [160.11, 163.54],
  [163.78, 166.33],
  [166.58, 190.85],
  [191.29, 193.28],
];

const selectedBroll = [
  {
    id: "feed-toxic",
    rawStart: 10.4,
    rawEnd: 15.45,
    file: "Montana_Tucker_DUBKswjE9N-.mp4",
    sourceStart: 8,
    label: "HATE BECOMES A TREND",
    sub: "The algorithm rewards what repeats.",
    accent: "#FF4D4D",
    side: "right",
  },
  {
    id: "viral-loop",
    rawStart: 29.7,
    rawEnd: 34.1,
    file: "Montana_Tucker_DTatvYeEzmy.mp4",
    sourceStart: 46,
    label: "COPIED. REPOSTED. REPEATED.",
    sub: "What spreads becomes normal.",
    accent: "#FFB84D",
    side: "left",
  },
  {
    id: "other-side",
    rawStart: 34.2,
    rawEnd: 44.7,
    file: "Montana_Tucker_C8UqBOVJxFA.mp4",
    sourceStart: 12,
    label: "COUNTRY. RELIGION. COMMUNITY.",
    sub: "Different people in one frame.",
    accent: "#4DA3FF",
    side: "right",
  },
  {
    id: "viral-too",
    rawStart: 44.7,
    rawEnd: 51.8,
    file: "Montana_Tucker_C-vEx9rJgwd.mp4",
    sourceStart: 8,
    label: "LOVE CAN GO VIRAL TOO",
    sub: "A different kind of share.",
    accent: "#FFE14D",
    side: "left",
  },
  {
    id: "survivors",
    rawStart: 55.8,
    rawEnd: 62.4,
    file: "Montana_Tucker_DUBKswjE9N-.mp4",
    sourceStart: 70,
    label: "WHERE HATE CAN LEAD",
    sub: "Personal history, public warning.",
    accent: "#FF4D4D",
    side: "right",
  },
  {
    id: "world",
    rawStart: 62.4,
    rawEnd: 72.0,
    file: "Montana_Tucker_DLh9NVbxS_b.mp4",
    sourceStart: 42,
    label: "MEETING PEOPLE",
    sub: "The work starts face to face.",
    accent: "#43E0A0",
    side: "left",
  },
  {
    id: "stereotypes",
    rawStart: 72.0,
    rawEnd: 81.6,
    file: "Montana_Tucker_DJKGD-hsCbJ.mp4",
    sourceStart: 42,
    label: "PEOPLE, NOT STEREOTYPES",
    sub: "Palestinians and Israelis helping each other.",
    accent: "#FFE14D",
    side: "right",
  },
  {
    id: "views",
    rawStart: 81.6,
    rawEnd: 91.9,
    file: "Montana_Tucker_DOYzGPvEYfc.mp4",
    sourceStart: 25,
    label: "3 BILLION VIEWS",
    sub: "Proof that these stories move.",
    accent: "#4DA3FF",
    side: "left",
  },
  {
    id: "question",
    rawStart: 92.0,
    rawEnd: 102.8,
    file: "Montana_Tucker_DEsdVfayw3e.mp4",
    sourceStart: 12,
    label: "MAKE HUMANITY SPREAD",
    sub: "Kindness as a repeatable format.",
    accent: "#43E0A0",
    side: "right",
  },
  {
    id: "helping",
    rawStart: 102.8,
    rawEnd: 112.0,
    file: "Montana_Tucker_DObW_JBERrJ.mp4",
    sourceStart: 16,
    label: "HELPING A STRANGER",
    sub: "Concrete moments, not slogans.",
    accent: "#FFE14D",
    side: "left",
  },
  {
    id: "listening",
    rawStart: 112.0,
    rawEnd: 126.5,
    file: "Montana_Tucker_DTatvYeEzmy.mp4",
    sourceStart: 28,
    label: "ACTUALLY LISTENING",
    sub: "A conversation can rewrite fear.",
    accent: "#4DA3FF",
    side: "right",
  },
  {
    id: "creator-chain",
    rawStart: 130.3,
    rawEnd: 143.2,
    file: "Montana_Tucker_C-vEx9rJgwd.mp4",
    sourceStart: 21,
    label: "ONE CREATOR. THEN ANOTHER.",
    sub: "A movement built by people copying good.",
    accent: "#FFE14D",
    side: "left",
  },
  {
    id: "storytellers",
    rawStart: 143.2,
    rawEnd: 154.0,
    file: "Montana_Tucker_DJ100ADJSgU.mp4",
    sourceStart: 92,
    label: "STORYTELLERS AROUND THE WORLD",
    sub: "Local voices, global reach.",
    accent: "#43E0A0",
    side: "right",
  },
  {
    id: "misunderstanding",
    rawStart: 154.0,
    rawEnd: 163.6,
    file: "Montana_Tucker_DTtIOJ4ErvB.mp4",
    sourceStart: 70,
    label: "BREAKING STEREOTYPES",
    sub: "The people your feed simplified.",
    accent: "#4DA3FF",
    side: "left",
  },
  {
    id: "movement",
    rawStart: 166.6,
    rawEnd: 176.2,
    file: "Montana_Tucker_DVoeFmbE090.mp4",
    sourceStart: 18,
    label: "A GLOBAL MOVEMENT",
    sub: "Storytelling, connection, kindness.",
    accent: "#43E0A0",
    side: "right",
  },
  {
    id: "human-being",
    rawStart: 176.2,
    rawEnd: 185.4,
    file: "Montana_Tucker_DOq1PW9idT2.mp4",
    sourceStart: 104,
    label: "BEHIND EVERY LABEL",
    sub: "A human being.",
    accent: "#FFE14D",
    side: "left",
  },
];

const heroBeats = [
  { id: "phone-shell", start: 0, end: 9.8, kind: "phone" },
  { id: "algorithm-board", start: rawToTimeline(15.6), end: rawToTimeline(29.6), kind: "board" },
  { id: "social-accords-reveal", start: rawToTimeline(163.78), end: rawToTimeline(166.58), kind: "reveal" },
  { id: "closing-lockup", start: rawToTimeline(185.4), end: totalDuration(), kind: "closing" },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyIfNeeded(from, to) {
  if (!fs.existsSync(from)) throw new Error(`Missing source asset: ${from}`);
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function totalDuration() {
  return keptSegments.reduce((sum, [start, end]) => sum + end - start, 0) - renderTailTrim;
}

function rawToTimeline(rawSeconds) {
  let timeline = 0;
  for (const [start, end] of keptSegments) {
    if (rawSeconds < start) return timeline;
    if (rawSeconds <= end) return timeline + (rawSeconds - start);
    timeline += end - start;
  }
  return timeline;
}

function rawRangeToTimeline(start, end) {
  const s = rawToTimeline(start);
  const e = rawToTimeline(end);
  return [Math.max(0, s), Math.max(s + 0.05, e)];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attrNum(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function isKept(rawSeconds) {
  return keptSegments.some(([start, end]) => rawSeconds >= start && rawSeconds <= end);
}

function buildCaptionGroups(captions) {
  const keptWords = captions
    .map((caption) => {
      const rawStart = caption.startMs / 1000;
      const rawEnd = caption.endMs / 1000;
      if (!isKept(rawStart) || !isKept(rawEnd)) return null;
      return {
        text: caption.text.trim(),
        rawStart,
        rawEnd,
        start: rawToTimeline(rawStart),
        end: rawToTimeline(rawEnd),
      };
    })
    .filter(Boolean)
    .filter((word) => word.text);

  const groups = [];
  let group = [];
  for (const word of keptWords) {
    const start = group.length ? group[0].start : word.start;
    const textLength = group.reduce((sum, item) => sum + item.text.length, 0) + word.text.length;
    const wouldRunLong = word.end - start > 1.05;
    const wouldBeTooMany = group.length >= 4;
    const wouldBeTooWide = textLength > 27;
    if (group.length && (wouldRunLong || wouldBeTooMany || wouldBeTooWide)) {
      groups.push(group);
      group = [];
    }
    group.push(word);
  }
  if (group.length) groups.push(group);

  return groups.map((words, index) => ({
    id: `caption-${String(index + 1).padStart(3, "0")}`,
    start: Math.max(0, words[0].start - 0.04),
    end: Math.min(totalDuration(), words.at(-1).end + 0.18),
    words,
  }));
}

const highlightWords = new Set([
  "hate",
  "humanity",
  "kindness",
  "social",
  "accords",
  "viral",
  "love",
  "unity",
  "creator",
  "global",
  "movement",
  "storytelling",
  "misinformation",
  "dehumanization",
  "human",
]);

function captionMarkup(group) {
  return group.words
    .map((word) => {
      const clean = word.text.toLowerCase().replace(/[^a-z]/g, "");
      const cls = highlightWords.has(clean) ? "cap-word emph" : "cap-word";
      return `<span class="${cls}">${escapeHtml(word.text)}</span>`;
    })
    .join(" ");
}

function arollClips() {
  let t = 0;
  return keptSegments
    .map(([start, end], index) => {
      const duration = end - start;
      const id = String(index + 1).padStart(2, "0");
      const html = `
      <video id="aroll-v-${id}" src="assets/montana-social-accords-aroll.mp4" data-start="${attrNum(t)}" data-duration="${attrNum(duration)}" data-media-start="${attrNum(start)}" data-track-index="${index % 2}" muted playsinline class="aroll"></video>
      <audio id="aroll-a-${id}" src="assets/montana-social-accords-aroll.mp4" data-start="${attrNum(t)}" data-duration="${attrNum(duration)}" data-media-start="${attrNum(start)}" data-track-index="${20 + (index % 2)}" data-volume="1"></audio>`;
      t += duration;
      return html;
    })
    .join("\n");
}

function brollClips() {
  return selectedBroll
    .map((scene, index) => {
      const [start, end] = rawRangeToTimeline(scene.rawStart, scene.rawEnd);
      const duration = end - start;
      const sideClass = scene.side === "left" ? "label-left" : "label-right";
      const clipTrack = 4 + (index % 4);
      const labelTrack = 32 + index;
      return `
      <video id="broll-${scene.id}" src="assets/instagram/proxies/${scene.id}.mp4" data-start="${attrNum(start)}" data-duration="${attrNum(duration)}" data-media-start="0" data-track-index="${clipTrack}" muted playsinline class="broll scene-piece"></video>
      <div id="shade-${scene.id}" class="clip broll-shade" data-start="${attrNum(start)}" data-duration="${attrNum(duration)}" data-track-index="${12 + index}">
        <div class="shade ${scene.side === "left" ? "shade-left" : "shade-right"}"></div>
      </div>
      <div id="label-${scene.id}" class="clip broll-label ${sideClass}" data-start="${attrNum(start)}" data-duration="${attrNum(duration)}" data-track-index="${labelTrack}" style="--accent:${scene.accent}">
        <div class="label-kicker">SOURCE: MONTANA TUCKER</div>
        <div class="label-title">${escapeHtml(scene.label)}</div>
        <div class="label-sub">${escapeHtml(scene.sub)}</div>
        <div class="label-rule"></div>
      </div>`;
    })
    .join("\n");
}

function phoneAndBoards() {
  const boardStart = rawToTimeline(15.6);
  const boardEnd = rawToTimeline(29.6);
  const revealStart = rawToTimeline(163.78);
  const revealEnd = rawToTimeline(166.58);
  const closingStart = rawToTimeline(185.4);
  const dur = totalDuration();
  return `
      <video id="phone-video" src="assets/instagram/proxies/phone-insert.mp4" data-start="0" data-duration="9.7" data-media-start="0" data-track-index="8" muted playsinline></video>
      <div id="phone-frame" class="clip phone-frame" data-start="0" data-duration="9.7" data-track-index="9">
        <div class="phone-top"></div>
      </div>
      <div id="hook-hate" class="clip hook-chip" data-start="1.1" data-duration="8.2" data-track-index="90" style="--x:84px; --y:308px; --accent:#FF4D4D">HATE</div>
      <div id="hook-outrage" class="clip hook-chip" data-start="1.55" data-duration="7.7" data-track-index="91" style="--x:688px; --y:430px; --accent:#FFB84D">OUTRAGE</div>
      <div id="hook-copy" class="clip hook-chip" data-start="2.1" data-duration="7.2" data-track-index="92" style="--x:126px; --y:1040px; --accent:#FFFFFF">COPY</div>
      <div id="hook-repost" class="clip hook-chip" data-start="2.55" data-duration="6.9" data-track-index="93" style="--x:650px; --y:1140px; --accent:#FFFFFF">REPOST</div>

      <div id="algorithm-board" class="clip algorithm-board" data-start="${attrNum(boardStart)}" data-duration="${attrNum(boardEnd - boardStart)}" data-track-index="94">
        <div class="board-bg"></div>
        <div class="board-title">HOW HATE SCALES</div>
        <div class="board-item item-1">1 TOXIC VIDEO</div>
        <div class="board-item item-2">2 REPOSTS</div>
        <div class="board-item item-3">4 REACTIONS</div>
        <div class="board-item item-4">DOZENS OF COPIES</div>
      </div>

      <div id="social-accords-reveal" class="clip reveal-card" data-start="${attrNum(revealStart)}" data-duration="${attrNum(revealEnd - revealStart)}" data-track-index="95">
        <div class="reveal-ring"></div>
        <div class="reveal-wordmark"><span>THE SOCIAL</span><span>ACCORDS</span></div>
        <div class="reveal-tag">MAKE HUMANITY VIRAL</div>
      </div>

      <video id="closing-video" src="assets/instagram/proxies/closing-insert.mp4" data-start="${attrNum(closingStart)}" data-duration="${attrNum(dur - closingStart)}" data-media-start="0" data-track-index="10" muted playsinline class="closing-video"></video>
      <div id="closing-lockup" class="clip closing-lockup" data-start="${attrNum(closingStart)}" data-duration="${attrNum(dur - closingStart)}" data-track-index="96">
        <div class="closing-title">MAKE HUMANITY VIRAL</div>
        <div class="closing-brand">THE SOCIAL ACCORDS</div>
        <div class="closing-small">Montana Tucker</div>
      </div>`;
}

function captionClips(groups) {
  return groups
    .map((group, index) => {
      const start = group.start;
      const duration = Math.max(0.12, group.end - group.start);
      return `<div id="${group.id}" class="clip caption" data-start="${attrNum(start)}" data-duration="${attrNum(duration)}" data-track-index="${140 + index}" data-layout-allow-caption-zone>${captionMarkup(group)}</div>`;
    })
    .join("\n");
}

function timelineScript(includeCaptions, groups) {
  const brollAnims = selectedBroll
    .map((scene) => {
      const [start, end] = rawRangeToTimeline(scene.rawStart, scene.rawEnd);
      const duration = end - start;
      const enterX = scene.side === "left" ? -36 : 36;
      return `
      tl.fromTo("#broll-${scene.id}", { opacity: 0, scale: 1.045 }, { opacity: 1, scale: 1, duration: 0.34, ease: "power3.out", overwrite: "auto", immediateRender: false }, ${attrNum(start)});
      tl.fromTo("#broll-${scene.id}", { scale: 1.33 }, { scale: 1.50, duration: ${attrNum(duration)}, ease: "none", immediateRender: false }, ${attrNum(start)});
      tl.to("#broll-${scene.id}", { opacity: 0, duration: 0.26, ease: "power2.in" }, ${attrNum(Math.max(start, end - 0.26))});
      tl.set("#broll-${scene.id}", { opacity: 0 }, ${attrNum(end)});
      tl.fromTo("#label-${scene.id}", { opacity: 0, x: ${enterX}, y: 18, scale: 0.96 }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.3, ease: "power4.out" }, ${attrNum(start + 0.08)});
      tl.fromTo("#label-${scene.id} .label-rule", { scaleX: 0 }, { scaleX: 1, duration: ${attrNum(Math.max(0.5, duration - 0.4))}, ease: "none" }, ${attrNum(start + 0.16)});`;
    })
    .join("\n");

  const captionAnims = includeCaptions
    ? groups
        .map((group) => {
          return `tl.fromTo("#${group.id}", { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.08, ease: "power4.out" }, ${attrNum(group.start)});`;
        })
        .join("\n")
    : "";

  const boardStart = rawToTimeline(15.6);
  const revealStart = rawToTimeline(163.78);
  const closingStart = rawToTimeline(185.4);
  const dur = totalDuration();
  return `
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      tl.to("#scan-bars", { x: -180, duration: ${attrNum(dur)}, ease: "none" }, 0);
      tl.fromTo("#phone-video", { opacity: 0, scale: 0.92 }, { opacity: 0.86, scale: 1, duration: 0.24, ease: "power3.out" }, 0.1);
      tl.fromTo("#phone-frame", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.24, ease: "power3.out" }, 0.1);
      ["#hook-hate", "#hook-outrage", "#hook-copy", "#hook-repost"].forEach((selector, index) => {
        const start = 1.05 + index * 0.18;
        tl.fromTo(selector, { opacity: 0, y: 48, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.16, ease: "power4.out" }, start);
      });
      tl.fromTo("#algorithm-board", { opacity: 0, y: 120, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.34, ease: "power4.out" }, ${attrNum(boardStart)});
      ["#algorithm-board .item-1", "#algorithm-board .item-2", "#algorithm-board .item-3", "#algorithm-board .item-4"].forEach((selector, index) => {
        tl.fromTo(selector, { opacity: 0, y: 54, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: "power4.out" }, ${attrNum(boardStart + 0.28)} + index * 0.38);
      });
      ${brollAnims}
      tl.fromTo("#social-accords-reveal", { opacity: 0, scale: 0.74, y: 80 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.7)" }, ${attrNum(revealStart)});
      tl.fromTo("#social-accords-reveal .reveal-ring", { rotation: -14, scale: 0.74 }, { rotation: 4, scale: 1, duration: 0.7, ease: "power3.out" }, ${attrNum(revealStart)});
      tl.fromTo("#social-accords-reveal .reveal-tag", { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.22, ease: "power4.out" }, ${attrNum(revealStart + 0.38)});
      tl.fromTo("#closing-video", { opacity: 0, scale: 1.25 }, { opacity: 0.38, scale: 1.38, duration: ${attrNum(dur - closingStart)}, ease: "none" }, ${attrNum(closingStart)});
      tl.fromTo("#closing-lockup", { opacity: 0, y: 80, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.36, ease: "power4.out" }, ${attrNum(closingStart + 0.12)});
      tl.to("#closing-lockup", { opacity: 0, duration: 0.45, ease: "power2.in" }, ${attrNum(Math.max(0, dur - 0.55))});
      ${captionAnims}
      window.__timelines["social-accords-launch"] = tl;
    </script>`;
}

function html({ includeCaptions }) {
  const captions = JSON.parse(fs.readFileSync(captionsSrc, "utf8"));
  const groups = buildCaptionGroups(captions);
  const captionLayer = includeCaptions ? captionClips(groups) : "";
  const duration = totalDuration();
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>The Social Accords - Montana Tucker Launch ${includeCaptions ? "Captioned" : "Clean"}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      html, body {
        margin: 0;
        width: ${W}px;
        height: ${H}px;
        overflow: hidden;
        background: #050506;
        color: #ffffff;
        font-family: Montserrat, Arial, sans-serif;
      }
      #root {
        position: relative;
        width: ${W}px;
        height: ${H}px;
        overflow: hidden;
        background: #050506;
      }
      .clip {
        position: absolute;
        box-sizing: border-box;
        will-change: transform, opacity;
      }
      .aroll, .broll, .closing-video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: #050506;
      }
      .aroll {
        z-index: 1;
        filter: contrast(1.03) saturate(1.02);
      }
      .broll, .closing-video {
        z-index: 18;
        object-position: 50% 20%;
        opacity: 0;
      }
      .broll-shade {
        z-index: 19;
        inset: 0;
        pointer-events: none;
      }
      .shade {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(180deg, rgba(5,5,6,0.26), rgba(5,5,6,0.04) 35%, rgba(5,5,6,0.78) 78%, rgba(5,5,6,0.94)),
          linear-gradient(90deg, rgba(5,5,6,0.68), rgba(5,5,6,0) 58%);
      }
      .shade-right {
        transform: scaleX(-1);
      }
      #scan-bars {
        z-index: 30;
        inset: 0;
        width: 1260px;
        opacity: 0.18;
        pointer-events: none;
        background:
          repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 2px, rgba(255,255,255,0) 2px 90px),
          repeating-linear-gradient(180deg, rgba(255,255,255,0.07) 0 1px, rgba(255,255,255,0) 1px 9px);
      }
      #phone-video {
        position: absolute;
        z-index: 35;
        left: 118px;
        top: 618px;
        width: 166px;
        height: 350px;
        object-fit: cover;
        border-radius: 25px;
        transform: rotate(-5deg);
        box-shadow: 0 18px 48px rgba(0,0,0,0.55);
        opacity: 0;
      }
      .phone-frame {
        z-index: 36;
        left: 118px;
        top: 618px;
        width: 166px;
        height: 350px;
        border-radius: 29px;
        border: 5px solid rgba(255,255,255,0.62);
        transform: rotate(-5deg);
        box-shadow: inset 0 0 0 3px rgba(0,0,0,0.62);
        pointer-events: none;
      }
      .phone-top {
        position: absolute;
        top: 8px;
        left: 55px;
        width: 56px;
        height: 8px;
        border-radius: 999px;
        background: rgba(0,0,0,0.75);
      }
      .hook-chip {
        z-index: 37;
        left: var(--x);
        top: var(--y);
        padding: 12px 18px;
        border: 3px solid var(--accent);
        background: rgba(5,5,6,0.78);
        color: var(--accent);
        font-family: "Archivo Black", Montserrat, sans-serif;
        font-size: 44px;
        line-height: 1;
        box-shadow: 0 20px 50px rgba(0,0,0,0.38);
      }
      .phone-frame,
      .hook-chip,
      .algorithm-board,
      .broll-label,
      .reveal-card,
      .closing-lockup {
        opacity: 0;
      }
      .algorithm-board {
        z-index: 38;
        inset: 0;
        background: #08080b;
        padding: 210px 70px;
        overflow: hidden;
      }
      .board-bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 52% 18%, rgba(255,77,77,0.24), rgba(255,77,77,0) 34%),
          linear-gradient(180deg, rgba(8,8,11,0.2), rgba(8,8,11,0.96)),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 2px, rgba(255,255,255,0) 2px 98px);
      }
      .board-title {
        position: relative;
        font-family: "League Gothic", Oswald, sans-serif;
        font-size: 122px;
        line-height: 0.9;
        color: #ffffff;
        text-transform: uppercase;
      }
      .board-item {
        position: relative;
        width: 420px;
        margin-top: 52px;
        padding: 28px 24px;
        border: 4px solid #ffb84d;
        background: rgba(24,24,32,0.94);
        color: #ffffff;
        font-family: "Archivo Black", Montserrat, sans-serif;
        font-size: 46px;
        line-height: 1;
      }
      .item-2, .item-4 {
        margin-left: 310px;
        border-color: #ff4d4d;
      }
      .broll-label {
        z-index: 40;
        top: 128px;
        max-width: 700px;
        padding: 20px 22px 18px;
        border-left: 8px solid var(--accent);
        background: rgba(5,5,6,0.72);
        box-shadow: 0 18px 50px rgba(0,0,0,0.42);
        color: #ffffff;
      }
      .label-left { left: 58px; }
      .label-right { right: 58px; }
      .label-kicker {
        color: var(--accent);
        font-family: "IBM Plex Mono", monospace;
        font-size: 22px;
        line-height: 1;
        margin-bottom: 14px;
      }
      .label-title {
        font-family: "Archivo Black", Montserrat, sans-serif;
        font-size: 42px;
        line-height: 1.02;
      }
      .label-sub {
        margin-top: 12px;
        color: rgba(255,255,255,0.86);
        font-size: 28px;
        line-height: 1.12;
        font-weight: 700;
      }
      .label-rule {
        height: 5px;
        width: 100%;
        margin-top: 18px;
        background: var(--accent);
        transform-origin: left center;
      }
      .reveal-card {
        z-index: 55;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background:
          radial-gradient(circle at 50% 42%, rgba(255,225,77,0.28), rgba(255,225,77,0) 39%),
          linear-gradient(180deg, #050506, #111119);
        text-align: center;
      }
      .reveal-ring {
        position: absolute;
        width: 760px;
        height: 760px;
        border: 3px solid rgba(255,255,255,0.18);
      }
      .reveal-wordmark {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 2px;
        color: #ffffff;
        font-family: "League Gothic", Oswald, sans-serif;
        font-size: 148px;
        line-height: 0.82;
        text-transform: uppercase;
      }
      .reveal-tag {
        position: relative;
        margin-top: 38px;
        padding: 14px 22px;
        color: #050506;
        background: #ffe14d;
        font-family: "Archivo Black", Montserrat, sans-serif;
        font-size: 34px;
        line-height: 1;
      }
      .closing-video {
        z-index: 56;
      }
      .closing-lockup {
        z-index: 57;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(5,5,6,0.62);
        text-align: center;
      }
      .closing-title {
        max-width: 900px;
        font-family: "League Gothic", Oswald, sans-serif;
        font-size: 146px;
        line-height: 0.82;
        color: #ffffff;
      }
      .closing-brand {
        margin-top: 36px;
        color: #ffe14d;
        font-family: "Archivo Black", Montserrat, sans-serif;
        font-size: 38px;
        line-height: 1;
      }
      .closing-small {
        margin-top: 18px;
        color: rgba(255,255,255,0.78);
        font-family: "IBM Plex Mono", monospace;
        font-size: 24px;
      }
      .caption {
        z-index: 70;
        left: 56px;
        right: 56px;
        bottom: 250px;
        min-height: 142px;
        padding: 18px 24px;
        border-radius: 6px;
        background: rgba(5,5,6,0.76);
        color: #ffffff;
        text-align: center;
        font-family: "Archivo Black", Montserrat, sans-serif;
        font-size: 54px;
        line-height: 1.03;
        text-transform: uppercase;
        text-shadow: 0 4px 16px rgba(0,0,0,0.72);
      }
      .cap-word {
        display: inline-block;
      }
      .cap-word.emph {
        color: #ffe14d;
        text-shadow: 0 0 24px rgba(255,225,77,0.48), 0 4px 16px rgba(0,0,0,0.72);
      }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="social-accords-launch" data-start="0" data-width="${W}" data-height="${H}" data-duration="${attrNum(duration)}" data-fps="30">
      ${arollClips()}
      <div id="scan-bars" class="clip" data-start="0" data-duration="${attrNum(duration)}" data-track-index="3" data-layout-ignore></div>
      ${phoneAndBoards()}
      ${brollClips()}
      ${captionLayer}
    </div>
    ${timelineScript(includeCaptions, groups)}
  </body>
</html>
`;
}

function writeDocs(targetDir = projectDir, clean = false) {
  const manifest = JSON.parse(fs.readFileSync(manifestSrc, "utf8"));
  const clipsById = new Map(manifest.clips.map((clip) => [clip.id, clip]));
  const manifestRows = selectedBroll
    .map((scene) => {
      const key = scene.file.replace("Montana_Tucker_", "").replace(".mp4", "");
      const source = clipsById.get(key);
      return `| ${scene.id} | ${scene.label} | ${scene.rawStart}-${scene.rawEnd}s raw | ${scene.sourceStart}s | ${scene.file} | ${source?.source_url ?? ""} |`;
    })
    .join("\n");
  const failures = (manifest.failures || [])
    .map((failure) => `- ${failure.url}: ${failure.reason}`)
    .join("\n");
  const docs = {
    "BRIEF.md": `# The Social Accords - Montana Tucker Launch

Format: vertical 9:16, 1080x1920, social-first.

Goal: edit Montana Tucker's A-roll into a premium launch video for The Social Accords using HyperFrames, with tightened speech, phone-screen replacement, B-roll proof moments, bold embedded captions, and a large reveal when she first names The Social Accords.

Tone: Nas Daily pace, polished advocacy reel, concrete human footage over generic graphics.
`,
    "DESIGN.md": `# Design

Palette:
- Background: #050506
- Foreground: #ffffff
- Heat accent: #ff4d4d
- Warm accent: #ffe14d
- Humanity accent: #43e0a0
- Trust accent: #4da3ff

Type:
- Display: League Gothic / Oswald
- Impact captions: Archivo Black / Montserrat
- Metadata: IBM Plex Mono

Motion:
- Fast caption pops synced to ASR word groups.
- B-roll enters with short blur/scale pushes.
- The Social Accords reveal uses a spring-pop entrance and centered brand lockup.
`,
    "SOURCE-MANIFEST.md": `# Source Manifest

Primary A-roll:
- assets/montana-social-accords-aroll.mp4
- Kept as 16 speech chunks reconstructed from the transcript-cut pass.

Selected B-roll:

| Use | On-screen label | A-roll window | Source start | File | Source URL |
| --- | --- | --- | --- | --- | --- |
${manifestRows}

Unavailable references:
${failures || "- None recorded."}
`,
    "UNILLUSTRATED-LINES.md": `# Unillustrated Lines

The final third is covered with concrete Montana source footage instead of plain A-roll wherever the brief called for global movement, storytelling, kindness, labels, and humanity.

No separate licensed music bed is baked into the composition yet. The voice remains clean and dominant; add a licensed/approved BGM file at assets/audio/bgm.mp3 if a music bed is cleared for release.
`,
    "README.md": `# Social Accords HyperFrames Edit

Composition:
- index.html: ${clean ? "clean master without captions" : "captioned master"}

Render examples:
- npx hyperframes check --snapshots
- npx hyperframes render --output renders/${clean ? "social-accords-clean.mp4" : "social-accords-captioned.mp4"}
`,
  };

  for (const [name, content] of Object.entries(docs)) {
    fs.writeFileSync(path.join(targetDir, name), content);
  }
}

function stageProject(targetDir, includeCaptions) {
  const targetAssets = path.join(targetDir, "assets");
  const targetBroll = path.join(targetAssets, "instagram");
  ensureDir(targetDir);
  ensureDir(targetAssets);
  ensureDir(targetBroll);
  ensureDir(path.join(targetDir, "renders"));
  copyIfNeeded(arollSrc, path.join(targetAssets, "montana-social-accords-aroll.mp4"));
  for (const scene of selectedBroll) {
    copyIfNeeded(path.join(repo, "assets", "instagram", scene.file), path.join(targetBroll, scene.file));
  }
  fs.writeFileSync(path.join(targetDir, "index.html"), html({ includeCaptions }));
  fs.writeFileSync(
    path.join(targetDir, "index.motion.json"),
    JSON.stringify(
      {
        duration: Number(attrNum(totalDuration())),
        assertions: [
          { kind: "appearsBy", selector: "#phone-frame", bySec: 0.7 },
          { kind: "appearsBy", selector: "#algorithm-board", bySec: Number(attrNum(rawToTimeline(15.6) + 0.6)) },
          { kind: "appearsBy", selector: "#social-accords-reveal", bySec: Number(attrNum(rawToTimeline(163.78) + 0.6)) },
          { kind: "appearsBy", selector: "#closing-lockup", bySec: Number(attrNum(rawToTimeline(185.4) + 0.7)) },
          { kind: "keepsMoving", withinSelector: "#root", maxStaticSec: 2.5 },
        ],
      },
      null,
      2,
    ),
  );
  writeDocs(targetDir, !includeCaptions);
}

function main() {
  stageProject(projectDir, true);
  stageProject(cleanProjectDir, false);
  console.log(`Built ${projectDir}`);
  console.log(`Built ${cleanProjectDir}`);
  console.log(`Duration ${attrNum(totalDuration())}s`);
}

main();
