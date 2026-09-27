import { writeFileSync } from "node:fs";
import type { Provider } from "./types.ts";

/**
 * Default provider. Generates nothing — writes a `.request.json` next to where
 * the asset would go, so you can review the compiled prompt + params before
 * spending on a real generation. Wire a real provider with GEN_PROVIDER=muapi
 * (and its key) once the prompt reads right.
 */
export const dryRunProvider: Provider = {
  name: "dry-run",
  async generate(req) {
    const file = `${req.outPathNoExt}.request.json`;
    writeFileSync(file, JSON.stringify(req, null, 2));
    return {
      ok: true,
      file,
      provider: "dry-run",
      model: req.model,
      seed: req.seed,
      message: "dry run — compiled request written, nothing generated",
    };
  },
};
