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
  const weeklyRangeLabel = \`\${formatDate(weekStartStr)} – \${formatDate(weekEndStr)}\`;`;

if (!s.includes("const weeklyRangeLabel")) {
  if (!s.includes(marker)) throw new Error("Weekly date range marker not found");
  s = s.replace(marker, rangeAdd + "\n" + marker);
}

// Keep the date picker editable: any selected date represents its Monday-Sunday week.
// Show the complete weekly period directly beneath the picker.
const oldDateBlock = `        <div className="control-box">\n          <span className="control-label">Tanggal Planning</span>\n          <div className="date-control">\n            <div className="date-icon">📅</div>\n            <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Pilih tanggal..." />\n          </div>\n          {date && <div className="date-caption">{selectedDateLabel}</div>}\n        </div>`;
const newDateBlock = `        <div className="control-box">\n          <span className="control-label">Periode Planning (Mingguan)</span>\n          <div className="date-control">\n            <div className="date-icon">📅</div>\n            <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Pilih tanggal..." />\n          </div>\n          {date && <div className="date-caption"><strong>{weeklyRangeLabel}</strong></div>}\n        </div>`;
if (s.includes(oldDateBlock)) {
  s = s.replace(oldDateBlock, newDateBlock);
} else if (!s.includes("Periode Planning (Mingguan)")) {
  throw new Error("Weekly date control marker not found");
}

// Make list/save/finalize operate on the whole Monday-Sunday period.
s = s.replaceAll(
  '.eq("planning_date", date)',
  '.gte("planning_date", weekStartStr)\n      .lte("planning_date", weekEndStr)'
);

// The selected date remains the session date when adding/editing a session.
fs.writeFileSync(file, s);
console.log("Patched Weekly Planning with a visible Monday-Sunday date range.");
