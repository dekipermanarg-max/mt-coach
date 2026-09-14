const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Topik/Subtopik completion should reflect whether the actual topic/subtopic
// has been filled, not a separate manual checkbox. Keep the legacy boolean as
// a fallback for existing records that were explicitly marked complete.
const helper = '  const isTopikDone = (r: MonitoringRow) => Boolean((r.topik_sub_topik || "").trim()) || Boolean(r.topik_sub_topik_done);';
const topikInline = 'Boolean((row.topik_sub_topik || "").trim()) || Boolean(row.topik_sub_topik_done)';
const topikInlineR = 'Boolean((r.topik_sub_topik || "").trim()) || Boolean(r.topik_sub_topik_done)';

if (!s.includes('const isTopikDone =')) {
  const helperNeedle = /^\s*const isSimpleSession\s*=.*$/m;
  if (helperNeedle.test(s)) {
    s = s.replace(helperNeedle, match => match + "\n" + helper);
  } else {
    // Some generated Monitoring variants no longer contain isSimpleSession.
    // In that case do not leave dangling isTopikDone references behind.
    s = s.replace(/isTopikDone\(row\)/g, topikInline);
    s = s.replace(/isTopikDone\(r\)/g, topikInlineR);
    console.log("ℹ️ isSimpleSession marker not found; using inline Topik/Subtopik completion logic.");
  }
}

// Make admin completeness use the same source of truth.
s = s.replace('ADMIN_KEYS.filter(k => Boolean(r[k])).length', 'ADMIN_KEYS.filter(k => k === "topik_sub_topik_done" ? isTopikDone(r) : Boolean(r[k])).length');

// Render the Topik checkbox/status from the actual topic value.
s = s.replace(/checked=\{Boolean\(row\.topik_sub_topik_done\)\}/g, 'checked={isTopikDone(row)}');
s = s.replace(/row\.topik_sub_topik_done \? "✓" : "—"/g, 'isTopikDone(row) ? "✓" : "✕"');

// For all administration checklist items, use ✓ when complete and ✕ when incomplete.
s = s.replace(/row\[key\] \? "✓" : "—"/g, 'row[key] ? "✓" : "✕"');

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
  const needle = /\bconst checkboxItems = \[/;
  if (!needle.test(s)) {
    console.log("ℹ️ checkboxItems marker not found; skipping checklist insertion because source shape has changed.");
  } else {
    s = s.replace(needle, match => match + '\n    ["topik_sub_topik_done", "Topik/Subtopik"],');
  }
}

// Make sure the checklist uses the normal admin-item class, not the old special class.
s = s.replace(/className=\{`admin-item topik-check-item/g, 'className={`admin-item');

fs.writeFileSync(file, s);
console.log("Topik/Subtopik and incomplete administration statuses now use explicit check/X indicators");
