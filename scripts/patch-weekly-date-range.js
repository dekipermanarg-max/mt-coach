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

// Replace only the existing planning control section. Keep the JSX simple and avoid nested <style> tags.
if (!s.includes("weekly-range-layout")) {
  const sectionStart = s.indexOf('      <section className="planning-control-card">');
  if (sectionStart < 0) throw new Error("Weekly planning control section not found");
  const sectionEnd = s.indexOf("      </section>", sectionStart);
  if (sectionEnd < 0) throw new Error("Weekly planning control section end not found");

  const newControl = `      <section className="planning-control-card weekly-range-layout" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <div className="control-box">
          <span className="control-label">Cabang</span>
          <select className="branch-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
            {BRANCHES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="control-box">
          <span className="control-label">Tanggal Awal</span>
          <div className="date-control">
            <div className="date-icon">📅</div>
            <input className="date-input" type="date" value={weekStartStr || date} onChange={(e) => setDate(e.target.value)} aria-label="Pilih tanggal awal minggu planning" />
          </div>
        </div>
        <div className="control-box">
          <span className="control-label">Tanggal Akhir</span>
          <div className="date-control">
            <div className="date-icon">📅</div>
            <input className="date-input" type="date" value={weekEndStr || date} readOnly aria-label="Tanggal akhir minggu planning" />
          </div>
        </div>
      </section>`;

  s = s.slice(0, sectionStart) + newControl + s.slice(sectionEnd + "      </section>".length);
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
