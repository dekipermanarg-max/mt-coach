const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep Topik/Subtopik out of the generic list so it can be rendered explicitly
// and remain visible as the first required administration item.
s = s.replace('["topik_sub_topik_done", "Topik/Subtopik"], ', "");
s = s.replace('["topik_sub_topik_done", "Topik/Subtopik"],', "");

const marker = '<div className="monitoring-admin-grid">';
const checkbox = '<label className={`admin-item topik-check-item ${row.topik_sub_topik_done ? "done" : "todo"}`}><input type="checkbox" checked={Boolean(row.topik_sub_topik_done)} disabled={saving === row.id} onChange={e => saveRow(row, { topik_sub_topik_done: e.target.checked })} /><span>Topik/Subtopik</span><b>{row.topik_sub_topik_done ? "✓" : "—"}</b></label>';
const oldCheckbox = '<label className={`admin-item ${row.topik_sub_topik_done ? "done" : "todo"}`}><input type="checkbox" checked={Boolean(row.topik_sub_topik_done)} disabled={saving === row.id} onChange={e => saveRow(row, { topik_sub_topik_done: e.target.checked })} /><span>Topik/Subtopik</span><b>{row.topik_sub_topik_done ? "✓" : "—"}</b></label>';

// Replace any previous explicit version with the styled version.
s = s.replace(oldCheckbox, checkbox);
if (!s.includes('topik-check-item')) {
  const pos = s.indexOf(marker);
  if (pos === -1) throw new Error("Monitoring admin grid marker not found");
  s = s.slice(0, pos + marker.length) + `{!simple && ${checkbox}}` + s.slice(pos + marker.length);
}

// Also surface the Topik/Subtopik status without requiring the session card to be opened.
const statusMarker = '<div className="monitoring-card-status">';
const statusBadge = '<span className={`monitoring-topik-status ${row.topik_sub_topik_done ? "done" : "todo"}`}>{row.topik_sub_topik_done ? "✓ Topik" : "✕ Topik"}</span>';
if (!s.includes('monitoring-topik-status')) {
  const pos = s.indexOf(statusMarker);
  if (pos === -1) throw new Error("Monitoring card status marker not found");
  s = s.slice(0, pos + statusMarker.length) + statusBadge + s.slice(pos + statusMarker.length);
}

const styleNeedle = '<style>{`';
const style = '.topik-check-item{border:1.5px solid #93c5fd!important;background:#eff6ff!important;box-shadow:inset 0 0 0 1px rgba(59,130,246,.04)}.topik-check-item.done{border-color:#86efac!important;background:#ecfdf5!important}.topik-check-item input{width:18px;height:18px;accent-color:#16a34a;cursor:pointer}.topik-check-item span{font-weight:800}.topik-check-item b{font-size:16px}.monitoring-topik-status{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800;white-space:nowrap}.monitoring-topik-status.done{background:#dcfce7;color:#15803d}.monitoring-topik-status.todo{background:#fee2e2;color:#b91c1c}';
if (!s.includes('.topik-check-item{')) {
  if (!s.includes(styleNeedle)) throw new Error("Monitoring style marker not found");
  s = s.replace(styleNeedle, styleNeedle + style);
}

fs.writeFileSync(file, s);
console.log("Made Topik/Subtopik checklist and card status explicit in Monitoring UI");
