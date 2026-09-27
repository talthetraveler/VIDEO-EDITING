#!/usr/bin/env node
// Frame.io login via the OFFICIAL SDK (frameio@4.x) — NativeAppAuth + PKCE.
//
// Verified against Tal's credential 2026-09-20:
//   - PUBLIC client: Adobe replies "unexpected client_secret parameter" to any
//     client_credentials attempt. There is no secret; S2S is impossible.
//   - The ONLY registered redirect is the Adobe-assigned custom URI scheme.
//     A 127.0.0.1 loopback reaches the consent screen but Adobe silently
//     refuses to redirect to it afterwards (dead-ends on /ims/fromSusi#), and
//     the local server receives nothing. Confirmed by a 5-minute timeout with
//     zero requests.
//   => Windows routes the custom scheme to scripts/frameio-callback.mjs, which
//      hands the URL back here.
//
// SECURITY
//   - OAuth `state` is validated HERE before any exchange
//   - the code is exchanged immediately and the handoff file deleted at once
//   - tokens are persisted 0600 and never printed
//
//   node scripts/frameio-login.mjs            interactive login
//   node scripts/frameio-login.mjs --status   stored state (no secrets printed)
import { NativeAppAuth } from "frameio";
import { randomBytes } from "node:crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync, chmodSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const CLIENT_ID = process.env.FRAMEIO_CLIENT_ID || "84dbc380286f47e0b5d0eb4627aa192f";
const REDIRECT = "adobe+8dbd241ec9a25997c909020b2c2cfbbf8fe89892://adobeid/84dbc380286f47e0b5d0eb4627aa192f";
const SCOPES = "offline_access,openid,email,profile,additional_info.roles";

const DIR = "C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio";
const STATE_FILE = join(DIR, "token-state.json");
const HANDOFF = join(DIR, ".callback_url");
const PENDING = join(DIR, ".pending");

mkdirSync(DIR, { recursive: true });

export function makeAuth() {
  const auth = new NativeAppAuth({
    clientId: CLIENT_ID, redirectUri: REDIRECT, scopes: SCOPES,
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

if (process.argv.includes("--status")) {
  if (!existsSync(STATE_FILE)) { console.log("NOT AUTHENTICATED"); process.exit(1); }
  const s = JSON.parse(readFileSync(STATE_FILE, "utf8"));
  console.log("stored token state:");
  console.log(`  access_token present : ${!!(s.accessToken ?? s.access_token)}`);
  console.log(`  refresh_token present: ${!!(s.refreshToken ?? s.refresh_token)}`);
  const exp = s.expiresAt ?? s.expires_at;
  if (exp) console.log(`  expires              : ${new Date(exp).toISOString()}`);
  process.exit(0);
}

// ------------------------------------------------------------------ login ---
const auth = makeAuth();
const state = randomBytes(24).toString("hex");
const { url, codeVerifier } = await auth.getAuthorizationUrl({ state });

// clear stale artefacts, then arm the handler
for (const f of [HANDOFF, PENDING]) if (existsSync(f)) rmSync(f, { force: true });
writeFileSync(PENDING, String(Date.now()), { mode: 0o600 });

writeFileSync(join(DIR, ".authorize_url"), url, { mode: 0o600 });
console.log("waiting for the Adobe callback via the Windows protocol handler…");
console.log("(sign in, click Allow, then click Open if Chrome asks)\n");
// Deliberately NOT auto-opening: `cmd /c start` uses the DEFAULT browser,
// which on this machine is Edge. Tal wants Chrome. The URL is written to
// .authorize_url and opened in Chrome by the caller instead.

const deadline = Date.now() + 300_000;
let callbackUrl = null;
while (Date.now() < deadline) {
  if (existsSync(HANDOFF)) {
    callbackUrl = readFileSync(HANDOFF, "utf8").trim();
    rmSync(HANDOFF, { force: true });           // never leave the code on disk
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}
rmSync(PENDING, { force: true });                // disarm the handler

if (!callbackUrl) {
  console.error("\nTIMED OUT after 5 minutes — no callback arrived.");
  console.error("If Chrome never asked to open an external app, the protocol");
  console.error("handler is not registered or Chrome suppressed the prompt.");
  process.exit(1);
}

const params = new URLSearchParams(callbackUrl.slice(callbackUrl.indexOf("?") + 1));
const code = params.get("code");
const gotState = params.get("state");

// ---- state validation, before any exchange ---------------------------------
if (gotState !== state) {
  console.error("\nOAUTH STATE MISMATCH — callback rejected, nothing exchanged.");
  process.exit(1);
}
if (!code) { console.error("\nNo authorization code in callback."); process.exit(1); }

try {
  await auth.exchangeCode({ code, codeVerifier });
} catch (e) {
  console.error(`\nToken exchange failed: ${e.message}`);
  console.error("Adobe codes are single-use and short-lived — re-run to try again.");
  process.exit(1);
}

save(auth);
console.log(`AUTHENTICATED — token state saved (0600):\n  ${STATE_FILE}`);
console.log("No token, code or callback URL was printed or logged.");
