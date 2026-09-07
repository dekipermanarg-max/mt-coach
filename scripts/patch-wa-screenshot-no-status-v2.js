const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep the screenshot compact, but use the full checklist labels. Long labels wrap inside their cells.
const oldCols = 'const cols: Array<[string, number]> = [["MT",260],["Rombel",150],["Mapel",150],["Topik",95],["Att",80],["Star",80],["Score",90],["Sess",80],["Foto",80],["WA",70],["AuVi",90],["LD",80],["Status",115]];';
const newCols = 'const cols: Array<[string, number]> = [["MT",260],["Rombel",150],["Mapel",150],["Topik/Subtopik",95],["Attendance",80],["Starchamps",80],["Activity Score",90],["Report Sessions",80],["Foto KBM",80],["Report WA",70],["AuVi TV",90],["LD",80]];';
if (s.includes(oldCols)) s = s.replace(oldCols, newCols);

// Ensure the report always lists KBM first, then Klinik PR, then any other session type.
const reportRowsPattern = /  const reportRows = useMemo\(\(\) => rows\.filter\(r =>[\s\S]*?\n  \), \[rows, waDate, branchId, selectedMT, mts, rombels, mapels, search\]\);/;
const sortedReportRows = `  const reportRows = useMemo(() => rows.filter(r =>
    r.planning_date === waDate && (branchId === "all" || r.branch_id === branchId) &&
    (selectedMT === "all" || r.mt_id === selectedMT) &&
    \`${'${nameOf(mts, r.mt_id)} ${nameOf(rombels, r.rombel_id)} ${nameOf(mapels, r.mapel_id)} ${r.jenis_sesi}'}\`.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const rank = (jenis: string) => jenis === "KBM" ? 0 : jenis === "Klinik PR" ? 1 : 2;
    const sessionOrder = rank(a.jenis_sesi) - rank(b.jenis_sesi);
    if (sessionOrder !== 0) return sessionOrder;
    const mtOrder = nameOf(mts, a.mt_id).localeCompare(nameOf(mts, b.mt_id));
    if (mtOrder !== 0) return mtOrder;
    return nameOf(rombels, a.rombel_id).localeCompare(nameOf(rombels, b.rombel_id));
  }), [rows, waDate, branchId, selectedMT, mts, rombels, mapels, search]);`;
if (reportRowsPattern.test(s)) s = s.replace(reportRowsPattern, sortedReportRows);

// Wrap checklist headers inside the existing compact columns instead of widening the table.
const oldHeaderLine = '      cols.forEach((c, i) => { ctx.fillStyle = "#334155"; ctx.font = "800 15px Arial"; ctx.textAlign = "left"; ctx.fillText(c[0], colX[i] + 18, tableY + 47); });';
const newHeaderLine = `      const wrapHeader = (text: string, maxWidth: number) => {
        const words = text.split(" "); const lines: string[] = []; let line = "";
        words.forEach(word => { const next = line ? line + " " + word : word; if (ctx.measureText(next).width <= maxWidth) line = next; else { if (line) lines.push(line); line = word; } });
        if (line) lines.push(line); return lines.slice(0, 3);
      };
      cols.forEach((c, i) => {
        ctx.fillStyle = "#334155"; ctx.font = "800 14px Arial"; ctx.textAlign = "left";
        const lines = wrapHeader(c[0], c[1] - 28); const startY = tableY + 39 - ((lines.length - 1) * 8);
        lines.forEach((line, j) => ctx.fillText(line, colX[i] + 14, startY + j * 17));
      });`;
if (!s.includes(oldHeaderLine)) throw new Error("Screenshot header marker not found");
s = s.replace(oldHeaderLine, newHeaderLine);

// Wrap long MT/rombel/mapel names within their own cells.
const oldTrunc = '      const trunc = (v: string, max: number) => v.length > max ? v.slice(0, max - 1) + "…" : v;';
const newTrunc = `      const wrapCell = (text: string, maxWidth: number) => {
        const words = text.split(" "); const lines: string[] = []; let line = "";
        words.forEach(word => { const next = line ? line + " " + word : word; if (ctx.measureText(next).width <= maxWidth) line = next; else { if (line) lines.push(line); line = word; } });
        if (line) lines.push(line); return lines.slice(0, 2);
      };`;
if (!s.includes(oldTrunc)) throw new Error("Screenshot cell text marker not found");
s = s.replace(oldTrunc, newTrunc);

const oldValues = '        const values = [nameOf(mts, row.mt_id), nameOf(rombels, row.rombel_id), nameOf(mapels, row.mapel_id)];\n        ctx.fillStyle = "#172033"; ctx.font = "700 16px Arial";\n        values.forEach((v, i) => ctx.fillText(trunc(v, i === 0 ? 27 : 18), colX[i] + 18, y + 54));';
const newValues = `        const values = [nameOf(mts, row.mt_id), nameOf(rombels, row.rombel_id), nameOf(mapels, row.mapel_id)];
        ctx.fillStyle = "#172033"; ctx.font = "700 16px Arial";
        values.forEach((v, i) => {
          const lines = wrapCell(v, cols[i][1] - 28); const startY = y + (lines.length === 1 ? 54 : 43);
          lines.forEach((line, j) => ctx.fillText(line, colX[i] + 14, startY + j * 19));
        });`;
if (!s.includes(oldValues)) throw new Error("Screenshot row values marker not found");
s = s.replace(oldValues, newValues);

// Remove the Status column if an older generated source still contains it.
s = s.replace(/\n\s*const complete = adminDone\(row\) === adminTotal\(row\);\n\s*const statusText = complete \? "LENGKAP" : \(adminDone\(row\) \+ "\/" \+ adminTotal\(row\)\);\n\s*fillRound\(colX\[12\] \+ 14, y \+ 24, cols\[12\]\[1\] - 28, 40, 20, complete \? "#eaf8ef" : "#fff0f0"\);\n\s*ctx\.fillStyle = complete \? "#15803d" : "#b91c1c"; ctx\.font = "800 15px Arial"; ctx\.textAlign = "center"; ctx\.fillText\(statusText, colX\[12\] \+ cols\[12\]\[1\] \/ 2, y \+ 50\); ctx\.textAlign = "left";/, "");

const extraCss = '.report-image-modal{width:min(1680px,100%);max-height:94vh;padding:24px;z-index:1101}.report-image-wrap{width:100%;overflow:auto;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:10px}.report-image-wrap img{display:block;width:1600px;max-width:none;height:auto;margin:0 auto;border-radius:12px}.report-image-modal .wa-modal-actions{margin-top:14px}.report-image-modal .wa-modal-head{margin-bottom:12px}@media(max-width:700px){.report-image-modal{padding:14px}.report-image-wrap{overflow-x:auto}.report-image-wrap img{width:1600px}}';
if (!s.includes('.report-image-modal{')) {
  const styleClose = s.lastIndexOf('`}</style>');
  if (styleClose >= 0) s = s.slice(0, styleClose) + extraCss + s.slice(styleClose);
}

fs.writeFileSync(file, s);
console.log("Fixed WhatsApp report: full headers with wrapping, KBM first, Klinik PR second, no Status column");
