const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Date and branch are intentionally blank on first load. Build the week range only when a date exists.
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

// Replace the date control by locating the control-box that contains the known label.
// This avoids brittle whitespace/formatting assumptions after other planning patches run.
if (!s.includes("Periode Planning (Mingguan)")) {
  const labelIndex = s.indexOf('<span className="control-label">Tanggal Planning</span>');
  if (labelIndex < 0) throw new Error("Weekly date control label not found");
  const controlStart = s.lastIndexOf('        <div className="control-box">', labelIndex);
  const controlEnd = s.indexOf('\n        </div>\n      </section>', labelIndex);
  if (controlStart < 0 || controlEnd < 0) throw new Error("Weekly date control container not found");
  const newDateBlock = `        <div className="control-box">
          <span className="control-label">Periode Planning (Mingguan)</span>
          <div className="date-control">
            <div className="date-icon">📅</div>
            <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Pilih tanggal dalam minggu planning" />
          </div>
          {date && <div className="date-caption"><strong>{weeklyRangeLabel}</strong></div>}
        </div>`;
  s = s.slice(0, controlStart) + newDateBlock + s.slice(controlEnd);
}

// Make list/save/finalize operate on the whole Monday-Sunday period.
s = s.replaceAll(
  '.eq("planning_date", date)',
  '.gte("planning_date", weekStartStr)\n      .lte("planning_date", weekEndStr)'
);

// Never query planning with a blank date on the initial screen.
const loadSessionsGuard = '    const id = await resolveBranchId();\n';
if (s.includes(loadSessionsGuard) && !s.includes('    if (!date) {\n      setSessions([]);\n      setLoading(false);\n      return;\n    }')) {
  s = s.replace(loadSessionsGuard, loadSessionsGuard + '    if (!date) {\n      setSessions([]);\n      setLoading(false);\n      return;\n    }\n');
}

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning with a safe Monday-Sunday date range.");
