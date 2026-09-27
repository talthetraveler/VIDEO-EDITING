// Shared recorder setup for the El Hamaayan demo.
// Chromium in the cloud container has no egress, so every non-local request is
// fetched by Node (which does) and handed back to the page via page.route.
// Run with: NODE_USE_ENV_PROXY=1 node <script>.mjs
import { chromium } from "/home/user/maayan-trail-planner/node_modules/playwright/index.mjs";

export const APP = process.env.APP_URL ?? "http://127.0.0.1:5199";
const SAFETY_ACK_VERSION = "2026-09-24"; // = SAFETY_DISCLAIMER_VERSION in maayan src/lib/legal.ts
const DROP_REQ = new Set(["host", "content-length", "connection", "accept-encoding"]);
const DROP_RES = new Set(["content-encoding", "content-length", "transfer-encoding", "connection"]);

export async function launch() {
  return chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
}

export async function newContext(browser, { video, storageState, geo } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "en-US",
    timezoneId: "Asia/Jerusalem",
    permissions: ["geolocation"],
    geolocation: geo ?? { latitude: 32.794, longitude: 35.548 }, // near the Sea of Galilee
    ...(storageState ? { storageState } : {}),
    ...(video ? { recordVideo: { dir: video, size: { width: 720, height: 1600 } } } : {}),
  });
  await ctx.addCookies([{ name: "maayan-locale", value: "en", url: APP }]);
  await ctx.addInitScript((v) => {
    try {
      localStorage.setItem("maayan.safety_ack", v);
    } catch {}
  }, SAFETY_ACK_VERSION);
  await ctx.route(
    (url) => !url.href.startsWith(APP) && /^https?:/.test(url.href),
    async (route) => {
      const req = route.request();
      const headers = {};
      for (const [k, v] of Object.entries(await req.allHeaders())) if (!DROP_REQ.has(k) && !k.startsWith(":")) headers[k] = v;
      try {
        const body = req.postDataBuffer();
        const res = await fetch(req.url(), { method: req.method(), headers, body: body ?? undefined, redirect: "manual" });
        const out = {};
        res.headers.forEach((v, k) => { if (!DROP_RES.has(k)) out[k] = v; });
        await route.fulfill({ status: res.status, headers: out, body: Buffer.from(await res.arrayBuffer()) });
      } catch (e) {
        await route.abort().catch(() => {});
      }
    },
  );
  return ctx;
}

// A visible finger: a soft dot that follows touches/pointer, so taps and swipes read on video.
export const FINGER = () => {
  const make = () => {
    if (document.getElementById("__finger")) return;
    const d = document.createElement("div");
    d.id = "__finger";
    Object.assign(d.style, {
      position: "fixed", left: "0", top: "0", width: "44px", height: "44px", margin: "-22px 0 0 -22px",
      borderRadius: "50%", background: "rgba(255,255,255,0.55)", border: "2px solid rgba(0,0,0,0.25)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.25)", pointerEvents: "none", zIndex: "2147483647",
      opacity: "0", transition: "opacity 120ms, transform 120ms", transform: "scale(0.8)",
    });
    document.documentElement.appendChild(d);
  };
  const at = (x, y, down) => {
    make();
    const d = document.getElementById("__finger");
    d.style.left = x + "px"; d.style.top = y + "px";
    if (down !== undefined) { d.style.opacity = down ? "1" : "0"; d.style.transform = down ? "scale(1)" : "scale(0.8)"; }
  };
  addEventListener("pointerdown", (e) => at(e.clientX, e.clientY, true), true);
  addEventListener("pointermove", (e) => at(e.clientX, e.clientY), true);
  addEventListener("pointerup", (e) => at(e.clientX, e.clientY, false), true);
  addEventListener("pointercancel", (e) => at(e.clientX, e.clientY, false), true);
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Human-ish tap: finger appears, presses, lifts.
export async function tap(page, locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("tap: element not visible");
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await sleep(110);
  await page.mouse.up();
}

// Drag from (x1,y1) to (x2,y2) over `ms`, pointer events all the way.
export async function drag(page, x1, y1, x2, y2, ms = 450) {
  const steps = Math.max(8, Math.round(ms / 16));
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.mouse.move(x1 + (x2 - x1) * e, y1 + (y2 - y1) * e);
    await sleep(ms / steps);
  }
  await page.mouse.up();
}

// ---- high-quality capture: Chrome screencast frames -> CFR H.264 --------------------------
// Playwright's recordVideo is ~1 Mbit VP8; screencast JPEGs at q90 are sharp enough to sit in a
// phone frame at 1080p. Frames only arrive on change, so each frame is held until the next one.
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
export const FFMPEG = "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2";

export async function startCapture(page) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 720, maxHeight: 1600, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  const marks = {};
  return {
    mark(name) { marks[name] = Date.now() / 1000 - t0; },
    async stop(out, tail = 0.6) {
      await sleep(300);
      await cdp.send("Page.stopScreencast").catch(() => {});
      const dir = mkdtempSync(join(tmpdir(), "cap-"));
      const start = frames[0]?.t ?? t0;
      let list = "";
      frames.forEach((f, i) => {
        const file = join(dir, `${String(i).padStart(5, "0")}.jpg`);
        writeFileSync(file, Buffer.from(f.data, "base64"));
        const dur = i + 1 < frames.length ? Math.max(0.001, frames[i + 1].t - f.t) : tail;
        list += `file '${file}'\nduration ${dur.toFixed(4)}\n`;
      });
      list += `file '${join(dir, String(frames.length - 1).padStart(5, "0") + ".jpg")}'\n`;
      writeFileSync(join(dir, "list.txt"), list);
      execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"),
        "-vf", "scale=720:1600:flags=lanczos,fps=30", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out]);
      rmSync(dir, { recursive: true, force: true });
      const dur = frames.length ? frames.at(-1).t - start + tail : 0;
      console.log(`captured ${out} — ${frames.length} frames, ${dur.toFixed(1)}s, marks ${JSON.stringify(marks)}`);
      return { frames: frames.length, duration: dur, marks };
    },
  };
}

// Real touch drag (CDP Input.dispatchTouchEvent). A mouse drag on an <img> starts the browser's
// native image drag and the page gets pointercancel — a finger never does that.
export async function swipe(page, x1, y1, x2, y2, ms = 420) {
  const cdp = await page.context().newCDPSession(page);
  const steps = Math.max(8, Math.round(ms / 16));
  const pt = (x, y) => [{ x, y, id: 1, radiusX: 12, radiusY: 12, force: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(x1, y1) });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(x1 + (x2 - x1) * e, y1 + (y2 - y1) * e) });
    await sleep(ms / steps);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach().catch(() => {});
}
