#!/usr/bin/env node
// Frame.io login — OAuth Single-Page App credential, PKCE, loopback redirect.
//
// WHY SPA RATHER THAN NATIVE APP (learned the hard way 2026-09-20):
//   The Native App credential forces the Adobe-assigned custom URI scheme
//   (adobe+<hash>://adobeid/<client_id>). Windows routes that scheme correctly —
//   proven: a direct invocation launched our handler and logged
//   "INVOKED ... argv_present=true". But Chrome silently refuses to hand a
//   redirect off to an external protocol when there is no direct user gesture,
//   so the code never arrives and the page dead-ends on /ims/fromSusi#.
//   An SPA credential redirects to http://localhost:PORT/callback, which a
//   local server catches directly. Same PKCE, still no client secret.
//
// SECURITY
//   - OAuth `state` validated before any exchange
//   - code exchanged immediately, never written to disk
//   - token state persisted 0600, never printed
//
//   node scripts/frameio-login-spa.mjs            login
//   node scripts/frameio-login-spa.mjs --status   stored state (no secrets)
import { SPAAuth } from "frameio";
import { createServer } from "node:https";
import { randomBytes } from "node:crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";

const DIR = "C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio";
const CONFIG = join(DIR, "spa-config.json");
const STATE_FILE = join(DIR, "token-state.json");

const PORT = 8080;
const REDIRECT = `https://localhost:${PORT}/callback`;   // Adobe REQUIRES https, even on localhost
const SCOPES = "offline_access,openid,email,profile,additional_info.roles";

mkdirSync(DIR, { recursive: true });

function clientId() {
  const envId = process.env.FRAMEIO_CLIENT_ID;
  if (envId) return envId;
  if (existsSync(CONFIG)) {
    const c = JSON.parse(readFileSync(CONFIG, "utf8"));
    if (c.client_id) return c.client_id;
  }
  console.error(
    `No SPA client id.\n` +
    `Create ${CONFIG}:\n` +
    `  { "client_id": "<the OAuth Single-Page App Client ID>" }\n` +
    `and register this redirect URI on that credential:\n` +
    `  ${REDIRECT}`
  );
  process.exit(1);
}

export function makeAuth() {
  const auth = new SPAAuth({
    clientId: clientId(), redirectUri: REDIRECT, scopes: SCOPES,
    onTokenRefreshed: () => { try { save(auth); } catch {} },
  });
  return auth;
}
function save(auth) {
  writeFileSync(STATE_FILE, JSON.stringify(auth.exportTokens(), null, 2), { mode: 0o600 });
  try { chmodSync(STATE_FILE, 0o600); } catch {}
}
export function loadAuth() {
  if (!existsSync(STATE_FILE)) return null;
  const auth = makeAuth();
  auth.importTokens(JSON.parse(readFileSync(STATE_FILE, "utf8")));
  return auth;
}

const IS_MAIN = !!process.argv[1] && process.argv[1].includes("frameio-login-spa");

if (!IS_MAIN) {
  // imported as a library (e.g. by frameio-test.mjs) — export helpers only
} else if (process.argv.includes("--status")) {
  if (!existsSync(STATE_FILE)) { console.log("NOT AUTHENTICATED"); process.exit(1); }
  const s = JSON.parse(readFileSync(STATE_FILE, "utf8"));
  console.log("stored token state:");
  console.log(`  access_token present : ${!!(s.accessToken ?? s.access_token)}`);
  console.log(`  refresh_token present: ${!!(s.refreshToken ?? s.refresh_token)}`);
  const exp = s.expiresAt ?? s.expires_at;
  // SDK stores expiry in SECONDS; treat anything below 1e12 as seconds
  if (exp) console.log(`  expires              : ${new Date(exp < 1e12 ? exp * 1000 : exp).toISOString()}`);
  process.exit(0);
}

// ------------------------------------------------------------------ login ---
if (IS_MAIN) {
const auth = makeAuth();
const state = randomBytes(24).toString("hex");
const { url, codeVerifier } = await auth.getAuthorizationUrl({ state });
writeFileSync(join(DIR, ".authorize_url"), url, { mode: 0o600 });

const page = (icon, msg) =>
  `<html><body style="font-family:system-ui;background:#111;color:#eee;display:flex;` +
  `align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center">` +
  `<h1 style="font-size:2rem">${icon} ${msg}</h1><p style="opacity:.7">You can close this tab.</p></div></body></html>`;

await new Promise((resolve, reject) => {
  const tls = {
    key: readFileSync(join(DIR, "certs/key.pem")),
    cert: readFileSync(join(DIR, "certs/cert.pem")),
  };
  const server = createServer(tls, async (req, res) => {
    const u = new URL(req.url, `https://localhost:${PORT}`);
    if (!u.pathname.startsWith("/callback")) { res.writeHead(404).end(); return; }

    const send = (code, html) => { res.writeHead(code, { "Content-Type": "text/html; charset=utf-8" }); res.end(html); };
    const err = u.searchParams.get("error");
    if (err) { send(400, page("⚠️", `Adobe error: ${err}`)); server.close(); return reject(new Error(err)); }

    if (u.searchParams.get("state") !== state) {
      send(400, page("⚠️", "State mismatch — rejected"));
      server.close(); return reject(new Error("OAuth state mismatch — nothing exchanged."));
    }
    const code = u.searchParams.get("code");
    if (!code) { send(400, page("⚠️", "No code in callback")); server.close(); return reject(new Error("no code")); }

    try {
      await auth.exchangeCode({ code, codeVerifier });   // immediate, never stored
      send(200, page("✅", "Frame.io connected"));
      server.close(); resolve();
    } catch (e) {
      send(400, page("⚠️", "Token exchange failed"));
      server.close(); reject(e);
    }
  });
  server.on("error", (e) => reject(new Error(
    e.code === "EADDRINUSE" ? `Port ${PORT} is in use — free it and retry.` : e.message)));
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`listening on ${REDIRECT}`);
    console.log("open the URL in .authorize_url, sign in, click Allow.\n");
  });
  setTimeout(() => { server.close(); reject(new Error("Timed out after 5 minutes.")); }, 300_000);
});

save(auth);
console.log(`AUTHENTICATED — token state saved (0600):\n  ${STATE_FILE}`);
console.log("No token or code was printed or logged.");
}
