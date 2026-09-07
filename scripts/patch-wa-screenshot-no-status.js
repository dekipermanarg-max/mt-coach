const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Remove the Status column from the generated WhatsApp screenshot table.
const oldCols = 'const cols: Array<[string, number]> = [["MT",260],["Rombel",150],["Mapel",150],["Topik",95],["Att",80],["Star",80],["Score",90],["Sess",80],["Foto",80],["WA",70],["AuVi",90],["LD",80],["Status",115]];';
const newCols = 'const cols: Array<[string, number]> = [["MT",260],["Rombel",150],["Mapel",150],["Topik",95],["Att",80],["Star",80],["Score",90],["Sess",80],["Foto",80],["WA",70],["AuVi",90],["LD",80]];';
if (!s.includes(oldCols)) throw new Error("Screenshot columns marker not found");
s = s.replace(oldCols, newCols);

// Remove per-row Status pill; checklist marks remain unchanged.
s = s.replace(/\n\s*const complete = adminDone\(row\) === adminTotal\(row\);\n\s*const statusText = complete \? "LENGKAP" : \(adminDone\(row\) \+ "\/" \+ adminTotal\(row\)\);\n\s*fillRound\(colX\[12\] \+ 14, y \+ 24, cols\[12\]\[1\] - 28, 40, 20, complete \? "#eaf8ef" : "#fff0f0"\);\n\s*ctx\.fillStyle = complete \? "#15803d" : "#b91c1c"; ctx\.font = "800 15px Arial"; ctx\.textAlign = "center"; ctx\.fillText\(statusText, colX\[12\] \+ cols\[12\]\[1\] \/ 2, y \+ 50\); ctx\.textAlign = "left";/, "");

fs.writeFileSync(file, s);
console.log("Removed Status column from WhatsApp screenshot report");
