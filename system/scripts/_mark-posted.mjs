import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const PROJECT = "74af6ae5-c17c-461a-9448-bd630af8dbe5", FIELD = "4f00ee5a-b21c-4ee2-b4ef-d73ae4db5f7c", POSTED = "1fafac7c-7380-4b2a-b9e2-09d7429d85cb";
const [dest, ...ids] = process.argv.slice(2);
await client.metadata.bulkUpdate(acc.id, PROJECT, { data: { file_ids: ids, values: [{ field_definition_id: FIELD, value: [POSTED] }] } });
for (const id of ids) {
  await client.files.move(acc.id, id, { data: { parent_id: dest } });
  const f = one(await client.files.show(acc.id, id));
  const m = one(await client.metadata.show(acc.id, id, { show_null: true }));
  const st = (m.metadata ?? m).find(x => x.field_definition_name === "Status")?.value?.[0]?.display_name;
  console.log(f.parent_id === dest ? "MOVED" : "NOT MOVED", "| status:", st, "|", f.name);
}
