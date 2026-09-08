const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

const oldFormat = `function formatDate(date: string) {\n  return new Intl.DateTimeFormat("id-ID", {\n    weekday: "long",\n    day: "numeric",\n    month: "long",\n    year: "numeric",\n  }).format(new Date(\`${date}T00:00:00\`));\n}`;
const newFormat = `function getWeekStart(date: string) {\n  const d = new Date(\`${date}T00:00:00\`);\n  const day = d.getDay();\n  const diff = day === 0 ? -6 : 1 - day;\n  d.setDate(d.getDate() + diff);\n  return d.toISOString().slice(0, 10);\n}\n\nfunction addDays(date: string, days: number) {\n  const d = new Date(\`${date}T00:00:00\`);\n  d.setDate(d.getDate() + days);\n  return d.toISOString().slice(0, 10);\n}\n\nfunction formatDate(date: string) {\n  return new Intl.DateTimeFormat("id-ID", {\n    weekday: "long",\n    day: "numeric",\n    month: "long",\n    year: "numeric",\n  }).format(new Date(\`${date}T00:00:00\`));\n}\n\nfunction formatWeekRange(date: string) {\n  if (!date) return "";\n  const start = getWeekStart(date);\n  const end = addDays(start, 6);\n  const startLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long" }).format(new Date(\`${start}T00:00:00\`));\n  const endLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(\`${end}T00:00:00\`));\n  return `${startLabel} – ${endLabel}`;\n}`;
if (!s.includes(oldFormat)) throw new Error("planning date formatter marker not found");
s = s.replace(oldFormat, newFormat);

const oldSelected = '  const selectedDateLabel = date ? formatDate(date) : "";';
const newSelected = '  const selectedDateLabel = date ? formatWeekRange(date) : "";';
if (!s.includes(oldSelected)) throw new Error("selectedDateLabel marker not found");
s = s.replace(oldSelected, newSelected);

const oldInput = '<input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Pilih tanggal..." />';
const newInput = '<input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value ? getWeekStart(e.target.value) : "")} placeholder="Pilih minggu..." aria-label="Pilih minggu planning" />';
if (!s.includes(oldInput)) throw new Error("planning date input marker not found");
s = s.replace(oldInput, newInput);

const oldLabel = '<span className="control-label">Tanggal Planning</span>';
const newLabel = '<span className="control-label">Minggu Planning</span>';
if (!s.includes(oldLabel)) throw new Error("planning date label marker not found");
s = s.replace(oldLabel, newLabel);

const oldCaption = '{date && <div className="date-caption">{selectedDateLabel}</div>}';
const newCaption = '{date && <div className="date-caption"><strong>{selectedDateLabel}</strong><span style={{ display: "block", fontSize: 12, color: "#64748b", marginTop: 3 }}>Senin – Minggu</span></div>}';
if (!s.includes(oldCaption)) throw new Error("date caption marker not found");
s = s.replace(oldCaption, newCaption);

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning: planning date now represents a Monday–Sunday weekly range; database key remains the Monday start date.");
