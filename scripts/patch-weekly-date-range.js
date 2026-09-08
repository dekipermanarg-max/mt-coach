const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

const marker = '  const selectedDateLabel = date ? formatDate(date) : "";';
const rangeAdd = `  const weekBase = new Date(date + "T00:00:00");
  const weekDay = weekBase.getDay();
  const weekDiff = weekDay === 0 ? -6 : 1 - weekDay;
  const weekStart = new Date(weekBase);
  weekStart.setDate(weekBase.getDate() + weekDiff);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const weeklyRangeLabel = \`${formatDate(weekStartStr)} – ${formatDate(weekEndStr)}\`;`;

if (!s.includes("const weeklyRangeLabel")) {
  if (!s.includes(marker)) throw new Error("Weekly date range marker not found");
  s = s.replace(marker, rangeAdd + "\n" + marker);
}

const dateControlRegex = /<div className="control-box">\s*<span className="control-label">Tanggal Planning<\/span>\s*<div className="date-control">\s*<div className="date-icon">📅<\/div>\s*<input className="date-input" type="date" value=\{date\} onChange=\{\(e\) => setDate\(e\.target\.value\)\} \/>\s*<\/div>\s*<div className="date-caption">\{selectedDateLabel\}<\/div>\s*<\/div>/;
const dateControl = `<div className="control-box">
          <span className="control-label">Periode Planning</span>
          <div className="date-control" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="date-icon">📅</div>
            <input className="date-input" type="date" value={weekStartStr} aria-label="Tanggal mulai minggu" readOnly />
            <span style={{ fontWeight: 800, color: "#64748b" }}>→</span>
            <input className="date-input" type="date" value={weekEndStr} aria-label="Tanggal akhir minggu" readOnly />
          </div>
          <div className="date-caption">{weeklyRangeLabel}</div>
        </div>`;
if (dateControlRegex.test(s)) {
  s = s.replace(dateControlRegex, dateControl);
} else if (!s.includes("Periode Planning")) {
  throw new Error("Weekly date control marker not found");
}

// Load, save, and finalize the complete Monday-Sunday planning period.
s = s.replaceAll(
  '.eq("planning_date", date)',
  '.gte("planning_date", weekStartStr)\n      .lte("planning_date", weekEndStr)'
);

// Each session still gets its own day inside the selected weekly period.
const formGridNeedle = '<div className="planning-form-grid">';
const sessionDateField = '<label className="planning-field"><span>Tanggal Sesi</span><input type="date" value={date} min={weekStartStr} max={weekEndStr} onChange={(e) => setDate(e.target.value)} required /></label>';
if (!s.includes('<span>Tanggal Sesi</span>')) {
  if (!s.includes(formGridNeedle)) throw new Error("Weekly session date field marker not found");
  s = s.replace(formGridNeedle, formGridNeedle + "\n          " + sessionDateField);
}

s = s.replace('<p>{branch} · {selectedDateLabel}</p>', '<p>{branch} · {weeklyRangeLabel}</p>');

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning to show and operate on a Monday-Sunday date range.");
