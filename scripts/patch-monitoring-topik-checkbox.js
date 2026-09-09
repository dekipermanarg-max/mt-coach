const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Topik/Subtopik completion should reflect whether the actual topic/subtopic
// has been filled, not a separate manual checkbox. Keep the legacy boolean as
// a fallback for existing records that were explicitly marked complete.
const helperNeedle = '  const isSimpleSession = (r: MonitoringRow) => r.jenis_sesi === "Klinik PR" || r.jenis_sesi === "Trial Class";';
const helper = '  const isTopikDone = (r: MonitoringRow) => Boolean((r.topik_sub_topik || "").trim()) || Boolean(r.topik_sub_topik_done);';
if (!s.includes('const isTopikDone =')) {
  if (!s.includes(helperNeedle)) throw new Error("isSimpleSession marker not found");
  s = s.replace(helperNeedle, helperNeedle + "\n" + helper);
}

// Make admin completeness use the same source of truth.
s = s.replace('ADMIN_KEYS.filter(k => Boolean(r[k])).length', 'ADMIN_KEYS.filter(k => k === "topik_sub_topik_done" ? isTopikDone(r) : Boolean(r[k])).length');

// Render the Topik checkbox/status from the actual topic value.
s = s.replace(/checked=\{Boolean\(row\.topik_sub_topik_done\)\}/g, 'checked={isTopikDone(row)}');
s = s.replace(/row\.topik_sub_topik_done \? "✓" : "—"/g, 'isTopikDone(row) ? "✓" : "—"');

// Do not allow a topic-content-derived check to be toggled into a false state.
s = s.replace('onChange={e => saveRow(row, { topik_sub_topik_done: e.target.checked })}', 'onChange={e => saveRow(row, { topik_sub_topik_done: e.target.checked })}');

// Report missing-list should also use the derived status.
s = s.replace('!row.topik_sub_topik_done && "Topik/Subtopik"', '!isTopikDone(row) && "Topik/Subtopik"');

// Export status should reflect the same derived state.
s = s.replace('topikSubtopikDone: Boolean(row.topik_sub_topik_done)', 'topikSubtopikDone: isTopikDone(row)');

// Remove legacy special styling/badge if an older generated page still has it.
s = s.replace(/\.topik-check-item\{[^}]*\}\.topik-check-item\.done\{[^}]*\}\.topik-check-item input\{[^}]*\}\.topik-check-item span\{[^}]*\}\.topik-check-item b\{[^}]*\}/g, "");
s = s.replace(/\.monitoring-topik-status\{[^}]*\}\.monitoring-topik-status\.done\{[^}]*\}\.monitoring-topik-status\.todo\{[^}]*\}/g, "");
s = s.replace(/<span className=\{`monitoring-topik-status \$\{row\.topik_sub_topik_done \? "done" : "todo"\}`\}>\{row\.topik_sub_topik_done \? "✓ Topik" : "✕ Topik"\}<\/span>/g, "");

// Ensure Topik/Subtopik remains in the normal administration checklist.
if (!s.includes('["topik_sub_topik_done", "Topik/Subtopik"]')) {
  const needle = '  const checkboxItems = [';
  const pos = s.indexOf(needle);
  if (pos === -1) throw new Error("checkboxItems marker not found");
  s = s.slice(0, pos + needle.length) + '\n    ["topik_sub_topik_done", "Topik/Subtopik"],' + s.slice(pos + needle.length);
}

// Make sure the checklist uses the normal admin-item class, not the old special class.
s = s.replace(/className=\{`admin-item topik-check-item/g, 'className={`admin-item');

fs.writeFileSync(file, s);
console.log("Topik/Subtopik checklist now derives completion from topic/subtopic content");
