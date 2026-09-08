const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

const marker = '  const selectedDateLabel = date ? formatDate(date) : "";';
const rangeAdd = `  const weekStartStr = date ? (() => {
    const base = new Date(date + "T00:00:00");
    const day = base.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(base);
    start.setDate(base.getDate() + diff);
    return start.toISOString().slice(0, 10);
  })() : "";
  const weekEndStr = date ? (() => {
    const base = new Date(date + "T00:00:00");
    const day = base.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(base);
    start.setDate(base.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end.toISOString().slice(0, 10);
  })() : "";
  const weeklyRangeLabel = date && weekStartStr && weekEndStr
    ? \`\${formatDate(weekStartStr)} – \${formatDate(weekEndStr)}\`
    : "Pilih tanggal planning";`;

if (!s.includes("const weeklyRangeLabel")) {
  if (!s.includes(marker)) throw new Error("Weekly date range marker not found");
  s = s.replace(marker, rangeAdd + "\n" + marker);
}

// Match the Monitoring look: three cards for branch, start date, and end date.
if (!s.includes("weekly-range-layout")) {
  const labelIndex = s.indexOf('<span className="control-label">Tanggal Planning</span>');
  if (labelIndex < 0) throw new Error("Weekly date control label not found");
  const controlStart = s.lastIndexOf('        <div className="control-box">', labelIndex);
  const controlEndMarker = '\n        </div>\n      </section>';
  const controlEnd = s.indexOf(controlEndMarker, labelIndex);
  if (controlStart < 0 || controlEnd < 0) throw new Error("Weekly date control container not found");

  const newDateBlock = `        <style>{\`\n          .weekly-range-layout { grid-template-columns: 1fr 1fr 1fr !important; }\n          .weekly-range-layout .date-input { width: 100%; }\n          .weekly-range-layout .date-input[readonly] { cursor: default; }\n          @media (max-width: 1000px) { .weekly-range-layout { grid-template-columns: 1fr !important; } }\n        \`}</style>\n        <div className="control-box">\n          <span className="control-label">Cabang</span>\n          <select className="branch-select" value={branch} onChange={(e) => setBranch(e.target.value)}>\n            {BRANCHES.map((item) => <option key={item}>{item}</option>)}\n          </select>\n        </div>\n        <div className="control-box">\n          <span className="control-label">Tanggal Awal</span>\n          <div className="date-control">\n            <div className="date-icon">📅</div>\n            <input className="date-input" type="date" value={weekStartStr || date} onChange={(e) => setDate(e.target.value)} aria-label="Pilih tanggal awal minggu planning" />\n          </div>\n        </div>\n        <div className="control-box">\n          <span className="control-label">Tanggal Akhir</span>\n          <div className="date-control">\n            <div className="date-icon">📅</div>\n            <input className="date-input" type="date" value={weekEndStr} readOnly aria-label="Tanggal akhir minggu planning" />\n          </div>\n        </div>`;

  const sectionStart = s.lastIndexOf('      <section className="planning-control-card">', labelIndex);
  if (sectionStart < 0) throw new Error("Weekly planning control section not found");
  const sectionEnd = s.indexOf('      </section>', controlEnd);
  if (sectionEnd < 0) throw new Error("Weekly planning control section end not found");
  const replacement = `      <section className="planning-control-card weekly-range-layout">\n${newDateBlock}\n`;
  s = s.slice(0, sectionStart) + replacement + s.slice(sectionEnd + '      </section>'.length);
}

// Keep all weekly operations on Monday-Sunday.
s = s.replaceAll(
  '.eq("planning_date", date)',
  '.gte("planning_date", weekStartStr)\n      .lte("planning_date", weekEndStr)'
);

const loadSessionsGuard = '    const id = await resolveBranchId();\n';
if (s.includes(loadSessionsGuard) && !s.includes('    if (!date) {\n      setSessions([]);\n      setLoading(false);\n      return;\n    }')) {
  s = s.replace(loadSessionsGuard, loadSessionsGuard + '    if (!date) {\n      setSessions([]);\n      setLoading(false);\n      return;\n    }\n');
}

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning with Monitoring-style start/end date cards.");
