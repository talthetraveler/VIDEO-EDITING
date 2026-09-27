export * from "./prompt.ts";
export * from "./registry.ts";
export type { Provider, GenerationRequest, GenerationResult } from "./providers/types.ts";
import type { Provider } from "./providers/types.ts";
import { dryRunProvider } from "./providers/dryRun.ts";
import { muapiProvider } from "./providers/muapi.ts";

export const PROVIDERS: Record<string, Provider> = {
  "dry-run": dryRunProvider,
  muapi: muapiProvider,
};

export const getProvider = (name = process.env.GEN_PROVIDER ?? "dry-run"): Provider => {
  const p = PROVIDERS[name];
  if (!p) throw new Error(`Unknown GEN_PROVIDER "${name}". Known: ${Object.keys(PROVIDERS).join(", ")}`);
  return p;
};
