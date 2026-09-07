const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

const oldCols = 'const cols: Array<[string, number]> = [["MT",260],["Rombel",150],["Mapel",150],["Topik",95],["Att",80],["Star",80],["Score",90],["Sess",80],["Foto",80],["WA",70],["AuVi",90],["LD",80],["Status",115]];';
const newCols = 'const cols: Array<[string, number]> = [["MT",260],["Rombel",150],["Mapel",150],["Topik",95],["Att",80],["Star",80],["Score",90],["Sess",80],["Foto",80],["WA",70],["AuVi",90],["LD",80]];';
if (s.includes(oldCols)) s = s.replace(oldCols, newCols);

s = s.replace(/\n\s*const complete = adminDone\(row\) === adminTotal\(row\);\n\s*const statusText = complete \? "LENGKAP" : \(adminDone\(row\) \+ "\/" \+ adminTotal\(row\)\);\n\s*fillRound\(colX\[12\] \+ 14, y \+ 24, cols\[12\]\[1\] - 28, 40, 20, complete \? "#eaf8ef" : "#fff0f0"\);\n\s*ctx\.fillStyle = complete \? "#15803d" : "#b91c1c"; ctx\.font = "800 15px Arial"; ctx\.textAlign = "center"; ctx\.fillText\(statusText, colX\[12\] \+ cols\[12\]\[1\] \/ 2, y \+ 50\); ctx\.textAlign = "left";/, "");

const extraCss = '.report-image-modal{width:min(1680px,100%);max-height:94vh;padding:24px;z-index:1101}.report-image-wrap{width:100%;overflow:auto;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:10px}.report-image-wrap img{display:block;width:1600px;max-width:none;height:auto;margin:0 auto;border-radius:12px}.report-image-modal .wa-modal-actions{margin-top:14px}.report-image-modal .wa-modal-head{margin-bottom:12px}@media(max-width:700px){.report-image-modal{padding:14px}.report-image-wrap{overflow-x:auto}.report-image-wrap img{width:1600px}}';
if (!s.includes('.report-image-modal{')) {
  const styleClose = s.lastIndexOf('`}</style>');
  if (styleClose >= 0) s = s.slice(0, styleClose) + extraCss + s.slice(styleClose);
}

fs.writeFileSync(file, s);
console.log("Removed Status column and applied screenshot preview CSS");
