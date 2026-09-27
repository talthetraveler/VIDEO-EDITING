#!/usr/bin/env node
// Windows URL-protocol handler for the Adobe custom scheme.
//
// Windows launches this with the FULL callback URL as argv[2]. Node receives it
// as one argument, so the "&" separators survive intact — a .bat/.cmd handler
// would let cmd.exe treat them as command chaining.
//
// SAFEGUARDS (both required before anything is handed off):
//   1. STRUCTURE — must match the exact registered scheme, host and client id.
//   2. PENDING LOGIN — a login must actually be in flight (.pending marker).
//
// The OAuth `state` is NOT validated here — frameio-login.mjs owns that and
// validates it before exchanging the code.
//
// NOTHING SENSITIVE IS LOGGED: not the URL, not the code, not the state.
import { writeFileSync, mkdirSync, existsSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio";
const HANDOFF = join(DIR, ".callback_url");
const PENDING = join(DIR, ".pending");
const LOG = join(DIR, ".handler_log");

const CLIENT_ID = "84dbc380286f47e0b5d0eb4627aa192f";
const SCHEME = "adobe+8dbd241ec9a25997c909020b2c2cfbbf8fe89892";
const EXPECTED = new RegExp(
  "^" + SCHEME.replace(/\+/g, "\\+") + "://adobeid/" + CLIENT_ID + "(?:[/?#]|$)", "i"
);
const PENDING_MAX_AGE_MS = 10 * 60 * 1000;

const url = process.argv[2] ?? "";

// PROOF OF INVOCATION — written before any validation, so even a rejected test
// proves Windows launched this script. The URL itself is never recorded.
mkdirSync(DIR, { recursive: true });
appendFileSync(LOG, "INVOKED " + new Date().toISOString() + " argv_present=" + (url.length > 0) + "\n", { mode: 0o600 });
console.log("\nFRAME.IO PROTOCOL HANDLER: INVOKED");

const bail = (msg) => {
  console.log("  rejected: " + msg + "\n");
  appendFileSync(LOG, "  rejected: " + msg + "\n", { mode: 0o600 });
  process.exit(1);
};

// ---- safeguard 1: structure -------------------------------------------------
if (!EXPECTED.test(url)) bail("unrecognised URL structure");
if (url.indexOf("?") === -1) bail("no query string");

const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
if (params.get("error")) bail("Adobe returned error=" + params.get("error"));
if (!params.get("code") || !params.get("state")) bail("missing code or state");

// ---- safeguard 2: an active login must be pending ---------------------------
if (!existsSync(PENDING)) bail("no Frame.io login is pending");
if (Date.now() - statSync(PENDING).mtimeMs > PENDING_MAX_AGE_MS) bail("pending login expired");

// ---- hand off ---------------------------------------------------------------
writeFileSync(HANDOFF, url, { mode: 0o600 });
appendFileSync(LOG, "  accepted: handed off to waiting login\n", { mode: 0o600 });
console.log("  authorization received — return to Claude.\n");
