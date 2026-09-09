const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Topik/Subtopik should use the same visual treatment as the other
// administration checkboxes. The source page already includes it in
// checkboxItems and the existing admin-item styles handle its state.
// Remove any legacy special styling/badge injected by an older patch.
s = s.replace(/\.topik-check-item\{[^}]*\}\.topik-check-item\.done\{[^}]*\}\.topik-check-item input\{[^}]*\}\.topik-check-item span\{[^}]*\}\.topik-check-item b\{[^}]*\}/g, "");
s = s.replace(/\.monitoring-topik-status\{[^}]*\}\.monitoring-topik-status\.done\{[^}]*\}\.monitoring-topik-status\.todo\{[^}]*\}/g, "");
s = s.replace(/<span className=\{`monitoring-topik-status \$\{row\.topik_sub_topik_done \? "done" : "todo"\}`\}>\{row\.topik_sub_topik_done \? "✓ Topik" : "✕ Topik"\}<\/span>/g, "");

// If an older patch removed Topik/Subtopik from checkboxItems, restore it
// in the same position and with the same rendering path as the other items.
if (!s.includes('["topik_sub_topik_done", "Topik/Subtopik"]')) {
  const needle = '  const checkboxItems = [';
  const pos = s.indexOf(needle);
  if (pos === -1) throw new Error("checkboxItems marker not found");
  s = s.slice(0, pos + needle.length) + '\n    ["topik_sub_topik_done", "Topik/Subtopik"],' + s.slice(pos + needle.length);
}

// Remove legacy explicit Topik rendering if present, so there is only one
// checklist item and it inherits the standard admin-item appearance.
s = s.replace(/\{!simple && \<label className=\{`admin-item topik-check-item[^;]*?<\/label>\}/g, "");

fs.writeFileSync(file, s);
console.log("Normalized Topik/Subtopik to the standard administration checkbox style");
