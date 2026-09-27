#!/usr/bin/env node
// Adobe IMS PKCE auth for Tal's Frame.io client.
//
// WHY PKCE: verified 2026-09-20 — this client_id is a PUBLIC (native-app)
// client. Adobe replies "unexpected client_secret parameter" to any
// client_credentials attempt, i.e. it HAS no secret. Public clients authorise
// with PKCE instead, which needs no secret at all.
//
// Its registered redirect is a custom URI scheme:
//   adobe+8dbd241ec9a25997c909020b2c2cfbbf8fe89892://adobeid/<client_id>
// A browser cannot follow that scheme, but the authorisation code is still
// present in the URL it tries to navigate to — which is what we capture.
//
//   node scripts/frameio-auth.mjs url             -> print the authorize URL
//   node scripts/frameio-auth.mjs exchange <code> -> code -> tokens -> credentials.json
import { createHash, randomBytes } from "node:crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const CLIENT_ID = "84dbc380286f47e0b5d0eb4627aa192f";
const REDIRECT = `adobe+8dbd241ec9a25997c909020b2c2cfbbf8fe89892://adobeid/${CLIENT_ID}`;
const SCOPE = "offline_access,openid,email,profile,additional_info.roles";
const IMS = "https://ims-na1.adobelogin.com/ims";

const DIR = "C:/Users/taldo/Downloads/videos to edit/system/projects/_frameio";
const VERIFIER = join(DIR, ".pkce_verifier");
const CRED = join(DIR, "credentials.json");

const b64url = (b) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const [cmd, arg] = process.argv.slice(2);

if (cmd === "url") {
  mkdirSync(DIR, { recursive: true });
  const verifier = b64url(randomBytes(64));
  writeFileSync(VERIFIER, verifier, "utf8");
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const q = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    scope: SCOPE,
    response_type: "code",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  console.log(`${IMS}/authorize/v2?${q}`);
} else if (cmd === "exchange") {
  if (!arg) { console.error("usage: exchange <authorization_code>"); process.exit(1); }
  if (!existsSync(VERIFIER)) { console.error("No PKCE verifier — run `url` first."); process.exit(1); }
  const verifier = readFileSync(VERIFIER, "utf8").trim();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code: decodeURIComponent(arg),
    code_verifier: verifier,
    redirect_uri: REDIRECT,
  });

  const r = await fetch(`${IMS}/token/v3`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    console.error(`Token exchange failed (HTTP ${r.status}): ${JSON.stringify(j)}`);
    console.error(`\nIf this says the code expired, re-run \`url\` and redo the consent —\n` +
                  `Adobe authorisation codes are single-use and short-lived.`);
    process.exit(1);
  }

  const cred = {
    mode: j.refresh_token ? "oauth" : "token",
    client_id: CLIENT_ID,
    public_client: true,
    access_token: j.access_token,
    ...(j.refresh_token ? { refresh_token: j.refresh_token } : {}),
    obtained: new Date().toISOString(),
    expires_in: j.expires_in,
  };
  writeFileSync(CRED, JSON.stringify(cred, null, 2), "utf8");
  console.log(`OK — wrote ${CRED}`);
  console.log(`access_token: ${j.access_token.slice(0, 18)}… (${j.expires_in}s)`);
  console.log(`refresh_token: ${j.refresh_token ? "yes — this will keep working" : "NONE — will expire"}`);
} else {
  console.log("usage: frameio-auth.mjs url | exchange <code>");
}
