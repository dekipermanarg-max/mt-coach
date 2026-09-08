const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep Topik/Subtopik out of the generic list so we can render it explicitly.
s = s.replace('["topik_sub_topik_done", "Topik/Subtopik"], ', "");
s = s.replace('["topik_sub_topik_done", "Topik/Subtopik"],', "");

const marker = '<div className="monitoring-admin-grid">';
const oldCheckbox = '<label className={`admin-item ${row.topik_sub_topik_done ? "done" : "todo"}`}><input type="checkbox" checked={Boolean(row.topik_sub_topik_done)} disabled={saving === row.id} onChange={e => saveRow(row, { topik_sub_topik_done: e.target.checked })} /><span>Topik/Subtopik</span><b>{row.topik_sub_topik_done ? "✓" : "—"}</b></label>';
const newCheckbox = '<label className={`admin-item topik-check-item ${row.topik_sub_topik_done ? "done" : "todo"}`}><input type="checkbox" checked={Boolean(row.topik_sub_topik_done)} disabled={saving === row.id} onChange={e => saveRow(row, { topik_sub_topik_done: e.target.checked })} /><span>Topik/Subtopik</span><b>{row.topik_sub_topik_done ? "✓" : "—"}</b></label>';

// Replace any previous version so the Topik checklist is always styled explicitly.
s = s.replace(oldCheckbox, newCheckbox);

if (!s.includes('topik-check-item')) {
  const pos = s.indexOf(marker);
  if (pos === -1) throw new Error("Monitoring admin grid marker not found");
  s = s.slice(0, pos + marker.length) + `{!simple && ${newCheckbox}}` + s.slice(pos + marker.length);
}

const styleNeedle = '<style>{`';
const style = '.topik-check-item{border:1.5px solid #93c5fd!important;background:#eff6ff!important;box-shadow:inset 0 0 0 1px rgba(59,130,246,.04)}.topik-check-item.done{border-color:#86efac!important;background:#ecfdf5!important}.topik-check-item input{width:18px;height:18px;accent-color:#16a34a;cursor:pointer}.topik-check-item span{font-weight:800}.topik-check-item b{font-size:16px}';
if (!s.includes('.topik-check-item{')) {
  if (!s.includes(styleNeedle)) throw new Error("Monitoring style marker not found");
  s = s.replace(styleNeedle, styleNeedle + style);
}

fs.writeFileSync(file, s);
console.log("Made Topik/Subtopik checklist explicit and prominent in Monitoring UI");
