const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Empty Topik/Subtopik is already represented by the red incomplete marker.
// Do not print a dash beside that marker.
s = s.replace(/row\.topik_sub_topik \|\| ["']—["']/g, 'row.topik_sub_topik || ""');
s = s.replace(/String\(text \|\| ["']—["']\)/g, 'String(text || "")');

fs.writeFileSync(file, s);
console.log("Removed placeholder dash from empty Topik/Subtopik in screenshot report");
