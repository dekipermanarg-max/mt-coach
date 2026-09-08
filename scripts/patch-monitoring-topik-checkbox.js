const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep Topik/Subtopik out of the generic list so we can render it explicitly.
s = s.replace('["topik_sub_topik_done", "Topik/Subtopik"], ', "");
s = s.replace('["topik_sub_topik_done", "Topik/Subtopik"],', "");

const marker = '<div className="monitoring-admin-grid">';
const checkbox = '<label className={`admin-item ${row.topik_sub_topik_done ? "done" : "todo"}`}><input type="checkbox" checked={Boolean(row.topik_sub_topik_done)} disabled={saving === row.id} onChange={e => saveRow(row, { topik_sub_topik_done: e.target.checked })} /><span>Topik/Subtopik</span><b>{row.topik_sub_topik_done ? "✓" : "—"}</b></label>';

// Idempotent: if the explicit checkbox is already present, leave the file alone.
if (!s.includes('>Topik/Subtopik</span>')) {
  const pos = s.indexOf(marker);
  if (pos === -1) throw new Error("Monitoring admin grid marker not found");
  s = s.slice(0, pos + marker.length) + `{!simple && ${checkbox}}` + s.slice(pos + marker.length);
}

fs.writeFileSync(file, s);
console.log("Forced Topik/Subtopik checkbox into Monitoring UI");
