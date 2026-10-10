import { makeClient, filesIn } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const fs = (await filesIn(client, acc.id, "f77f3cb5-3d67-4d41-9106-9b9ccdf3c298")).filter(f => /hospital/i.test(f.name));
for (const f of fs) {
  const m = one(await client.metadata.show(acc.id, f.id, { show_null: true }));
  const st = (m.metadata ?? m).find?.(x => /status/i.test(x.field_definition_name ?? x.name ?? ""));
  console.log(f.id, "|", f.name, "| project", f.project_id, "| status:", JSON.stringify(st?.value), "| field", st?.field_definition_id);
  if (f === fs[0]) console.log(JSON.stringify(st, null, 1).slice(0, 1500));
}
