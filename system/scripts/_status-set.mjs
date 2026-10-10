import { makeClient } from "./lib/frameio-deliver.mjs";
const one = (r) => r?.response?.data ?? r?.data ?? r;
const client = makeClient();
const a = one(await client.accounts.index()); const acc = Array.isArray(a) ? a[0] : a;
const PROJECT = "74af6ae5-c17c-461a-9448-bd630af8dbe5", FIELD = "4f00ee5a-b21c-4ee2-b4ef-d73ae4db5f7c";
const [fileId, optionId] = process.argv.slice(2);
try { await client.metadata.bulkUpdate(acc.id, PROJECT, { data: { file_ids: [fileId], values: [{ field_definition_id: FIELD, value: [optionId] }] } }); }
catch (e) { console.log("ERR", String(e?.message).slice(0, 600)); }
const m = one(await client.metadata.show(acc.id, fileId, { show_null: true }));
console.log("status now:", JSON.stringify((m.metadata ?? m).find(x => x.field_definition_name === "Status")?.value));
