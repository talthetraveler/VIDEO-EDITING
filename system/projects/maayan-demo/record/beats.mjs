// Record the El Hamaayan demo beats from the real app (English locale, demo account @maya_hikes).
//   NODE_USE_ENV_PROXY=1 node beats.mjs [beat ...]      (no args = all beats)
// Needs: Maayan dev server on 127.0.0.1:5199 (VITE_BIND_HOST=127.0.0.1 bunx vite dev --port 5199)
//        DEMO_EMAIL / DEMO_PASSWORD_FILE in the env (the password never lives in the repo).
// Writes system/public/maayan-demo/clips/<beat>.mp4 + clips/<beat>.json (duration + marks).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { launch, newContext, sleep, tap, drag, swipe, startCapture, FINGER, APP } from "./lib.mjs";

const OUT = new URL("../../../public/maayan-demo/clips/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const EMAIL = process.env.DEMO_EMAIL;
const PASS = readFileSync(process.env.DEMO_PASSWORD_FILE, "utf8").trim();

const PLACE = {
  einPik: { id: "4060d6ef-1d54-464b-96b9-1f0a1effe433", lat: 32.775199, lng: 35.701358, name: "Ein Pik" },
  hexagon: { id: "8ddf90af-db8d-5f30-a069-40c9513d7dd7" },
};
const TRIP = "c0e54445-87e6-47bf-b145-08a13d744936";

// Expose the Leaflet map so the map beat can aim its taps at a real pin.
const LEAFLET_HOOK = () => {
  let real;
  Object.defineProperty(window, "L", {
    configurable: true,
    get: () => real,
    set: (v) => {
      real = v;
      try { v.Map.addInitHook(function () { window.__map = this; }); } catch {}
    },
  });
};

async function session() {
  const browser = await launch();
  const ctx = await newContext(browser);
  await ctx.addInitScript(FINGER);
  await ctx.addInitScript(LEAFLET_HOOK);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { if (!/Hydration/.test(e.message)) console.log("PAGEERR", e.message.slice(0, 160)); });
  await page.goto(APP + "/auth", { waitUntil: "networkidle", timeout: 180000 });
  await sleep(1200);
  await page.getByRole("button", { name: /email/i }).first().click();
  await sleep(700);
  await page.getByRole("textbox").first().fill(EMAIL);
  await page.keyboard.press("Enter");
  await page.locator("input[type=password]").waitFor({ timeout: 30000 });
  await page.locator("input[type=password]").fill(PASS);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/map/, { timeout: 60000 });
  await sleep(1000);
  return { browser, page };
}

const open = async (page, path) => {
  await page.goto(APP + path, { waitUntil: "networkidle", timeout: 180000 });
  await sleep(2500);
};
const scroll = async (page, dy, steps = 12) => {
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await sleep(25); }
};
const save = (name, res) => writeFileSync(`${OUT}${name}.json`, JSON.stringify(res, null, 2));

const BEATS = {
  async map(page) {
    await open(page, "/map");
    // Pre-warm the fly-in's tiles (fly there, wait, jump back) so the recorded zoom never shows a
    // blank map while tiles stream in.
    const home = await page.evaluate(() => ({ c: window.__map.getCenter(), z: window.__map.getZoom() }));
    for (const z of [9, 11, 13, 14]) {
      await page.evaluate(({ lat, lng, z }) => window.__map.setView([lat, lng - 0.004], z, { animate: false }), { ...PLACE.einPik, z });
      await sleep(1800);
    }
    await page.evaluate(({ c, z }) => window.__map.setView(c, z, { animate: false }), home);
    await sleep(2500);
    const cap = await startCapture(page);
    await sleep(900);
    cap.mark("act");
    // Finger taps the north cluster, then a smooth fly-in to the Golan (a cut-free zoom reads better
    // than cluster-hopping), then the finger taps the real Ein Pik pin and the sheet peeks up.
    await tap(page, page.locator(".maayan-cluster-wrap", { hasText: /^312$/ }));
    await sleep(700);
    await page.evaluate(({ lat, lng }) => window.__map.flyTo([lat, lng - 0.004], 14, { duration: 2.4 }), PLACE.einPik);
    await sleep(3000);
    const target = await page.evaluate(({ lat, lng }) => {
      const m = window.__map; const p = m.latLngToContainerPoint([lat, lng]); const r = m.getContainer().getBoundingClientRect();
      return { x: p.x + r.x, y: p.y + r.y };
    }, PLACE.einPik);
    const pins = await page.locator(".maayan-marker").evaluateAll((els) => els.map((e, i) => {
      const r = e.getBoundingClientRect(); return { i, x: r.x + r.width / 2, y: r.y + r.height / 2, label: e.getAttribute("aria-label") };
    }));
    const pin = pins.sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))[0];
    console.log("  pin", pin?.label, "target", JSON.stringify(target));
    cap.mark("pin");
    await tap(page, page.locator(".maayan-marker").nth(pin.i));
    await sleep(3000);
    return cap.stop(`${OUT}map.mp4`);
  },

  async place(page) {
    await open(page, `/place/${PLACE.einPik.id}`);
    const cap = await startCapture(page);
    await sleep(900);
    cap.mark("act");
    await drag(page, 300, 230, 70, 235, 380); await sleep(900);
    await drag(page, 300, 230, 70, 235, 380); await sleep(1000);
    cap.mark("status");
    await sleep(900);
    await tap(page, page.getByRole("link", { name: /update/i }).or(page.getByRole("button", { name: /^update$/i })).first());
    await page.waitForURL(/\/report\//, { timeout: 30000 });
    await sleep(1800);
    cap.mark("report");
    await tap(page, page.getByText("A trickle", { exact: true }).first());
    await sleep(1600); // never submitted: a demo account must not post a fake condition report
    return cap.stop(`${OUT}place.mp4`);
  },

  async discover(page) {
    await open(page, "/discover?areas=%5B%22golan%22%5D&types=%5B%22trail%22%5D"); // Golan trails: all 23 have English names
    const cap = await startCapture(page);
    await sleep(900);
    cap.mark("act");
    await swipe(page, 150, 400, 330, 385, 520); await sleep(1300);
    cap.mark("left");
    await swipe(page, 210, 400, 30, 385, 520); await sleep(1300);
    await swipe(page, 150, 400, 330, 385, 480); await sleep(1300);
    cap.mark("summary");
    await tap(page, page.getByRole("link", { name: /summary/i }).or(page.getByRole("button", { name: /summary/i })).first());
    await sleep(2400);
    return cap.stop(`${OUT}discover.mp4`);
  },

  async nearby(page) {
    await open(page, "/trips");
    const cap = await startCapture(page);
    cap.mark("act");
    await page.goto(APP + "/nearby", { waitUntil: "networkidle", timeout: 180000 });
    await sleep(1800);
    cap.mark("results");
    await scroll(page, 420, 20);
    await sleep(1400);
    return cap.stop(`${OUT}nearby.mp4`);
  },

  async save(page) {
    await open(page, `/place/${PLACE.hexagon.id}`);
    const cap = await startCapture(page);
    await sleep(1000);
    cap.mark("act");
    await tap(page, page.locator("button[aria-pressed][data-tsd-source*=PlaceHero]").first());
    await sleep(1800);
    return cap.stop(`${OUT}save.mp4`);
  },

  async lists(page) {
    await open(page, "/collections");
    const cap = await startCapture(page);
    await sleep(1400);
    cap.mark("act");
    await tap(page, page.getByText("Golan weekend").first());
    await sleep(2400);
    return cap.stop(`${OUT}lists.mp4`);
  },

  async tripnew(page) {
    await open(page, "/trips");
    const cap = await startCapture(page);
    cap.mark("act");
    await page.goto(APP + "/trips/new", { waitUntil: "networkidle", timeout: 180000 });
    await sleep(1600);
    cap.mark("type");
    await tap(page, page.locator("#name"));
    await page.locator("#name").pressSequentially("Golan weekend", { delay: 70 });
    await sleep(900); // not submitted — the seeded trip below is the one we show
    return cap.stop(`${OUT}tripnew.mp4`);
  },

  async trip(page) {
    await open(page, `/trips/${TRIP}`);
    const cap = await startCapture(page);
    await sleep(1400);
    cap.mark("act");
    await tap(page, page.getByRole("link", { name: /gear/i }).first());
    await page.waitForURL(/\/gear/, { timeout: 30000 });
    await sleep(1400);
    cap.mark("gear");
    await tap(page, page.getByRole("button", { name: /i will bring it/i }).first());
    await sleep(1800);
    return cap.stop(`${OUT}trip.mp4`);
  },

  async community(page) {
    await open(page, "/community");
    const cap = await startCapture(page);
    await sleep(1200);
    cap.mark("act");
    await drag(page, 320, 250, 60, 255, 600);
    await sleep(1200);
    await scroll(page, 300, 15);
    await sleep(1200);
    return cap.stop(`${OUT}community.mp4`);
  },
};

const pick = process.argv.slice(2);
const names = pick.length ? pick : Object.keys(BEATS);
for (const name of names) {
  const { browser, page } = await session();
  try {
    save(name, await BEATS[name](page));
  } catch (e) {
    console.log(`✗ ${name}: ${e.message.split("\n")[0]}`);
    await page.screenshot({ path: `${OUT}${name}-FAILED.png` }).catch(() => {});
  } finally {
    await browser.close();
  }
}
