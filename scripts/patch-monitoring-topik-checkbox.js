const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

s = s.replace('["topik_sub_topik_done", "Topik/Subtopik"], ', '');

const old = '<div className="monitoring-admin-grid">{checkboxItems.filter(([key]) => !simple || key === "attendance").map(([key, label]) => <label key={key} className={`admin-item ${row[key] ? "done" : "todo"}`}><input type="checkbox" checked={row[key]} disabled={saving === row.id} onChange={e => saveRow(row, { [key]: e.target.checked })} /><span>{label}</span><b>{row[key] ? "✓" : "—"}</b></label>)}';
const replacement = '<div className="monitoring-admin-grid">{!simple && <label className={`admin-item ${row.topik_sub_topik_done ? "done" : "todo"}`}><input type="checkbox" checked={Boolean(row.topik_sub_topik_done)} disabled={saving === row.id} onChange={e => saveRow(row, { topik_sub_topik_done: e.target.checked })} /><span>Topik/Subtopik</span><b>{row.topik_sub_topik_done ? "✓" : "—"}</b></label>}{checkboxItems.filter(([key]) => !simple || key === "attendance").map(([key, label]) => <label key={key} className={`admin-item ${row[key] ? "done" : "todo"}`}><input type="checkbox" checked={row[key]} disabled={saving === row.id} onChange={e => saveRow(row, { [key]: e.target.checked })} /><span>{label}</span><b>{row[key] ? "✓" : "—"}</b></label>)}';

if (s.includes(old)) s = s.replace(old, replacement);
else if (!s.includes('row.topik_sub_topik_done ? "✓" : "—"')) throw new Error("Monitoring checkbox block not found");

fs.writeFileSync(file, s);
