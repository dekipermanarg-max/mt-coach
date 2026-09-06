const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

const replacements = [
  ['const DEFAULT_DATE = "2026-08-31";', 'const DEFAULT_DATE = "";'],
  ['  const [date, setDate] = useState(DEFAULT_DATE);', '  const [date, setDate] = useState("");'],
  ['  const [branch, setBranch] = useState(BRANCHES[0]);', '  const [branch, setBranch] = useState("");'],
  ['  const [type, setType] = useState<(typeof SESSION_TYPES)[number]>("KBM");', '  const [type, setType] = useState<(typeof SESSION_TYPES)[number] | "">("");'],
  ['    setMt(mtRes.data?.[0]?.id || "");\n    setRombel(rRes.data?.[0]?.id || "");\n    setMapel(mRes.data?.[0]?.id || "");', '    setMt("");\n    setRombel("");\n    setMapel("");'],
  ['    setMt(mtRows[0]?.id || "");\n    setRombel(rombelRows[0]?.id || "");\n    setMapel(mapelRows[0]?.id || "");\n    setType("KBM");', '    setMt("");\n    setRombel("");\n    setMapel("");\n    setType("");'],
  ['  const selectedDateLabel = formatDate(date);', '  const selectedDateLabel = date ? formatDate(date) : "";'],
  ['    if (b.data) setBranchId(b.data.id);', '    if (b.data) setBranchId(b.data.id);\n    else setBranchId("");'],
  ['    if (!branchId || !date || !mt || !rombel || !mapel || !type) {\n      setMessage("Lengkapi Cabang, Tanggal Planning, MT, Rombel, Mapel, dan Jenis Sesi terlebih dahulu.");\n      return;\n    }', '    if (!branchId || !date || !mt || !rombel || !mapel || !type) {\n      setMessage("Lengkapi Cabang, Tanggal Planning, MT, Rombel, Mapel, dan Jenis Sesi terlebih dahulu.");\n      return;\n    }'],
  ['          <select className="branch-select" value={branch} onChange={(e) => setBranch(e.target.value)}>\n            {BRANCHES.map((item) => <option key={item}>{item}</option>)}\n          </select>', '          <select className="branch-select" value={branch} onChange={(e) => setBranch(e.target.value)}>\n            <option value="">Pilih cabang...</option>\n            {BRANCHES.map((item) => <option key={item}>{item}</option>)}\n          </select>'],
  ['          <div className="date-control">\n            <div className="date-icon">📅</div>\n            <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />\n          </div>\n          <div className="date-caption">{selectedDateLabel}</div>', '          <div className="date-control">\n            <div className="date-icon">📅</div>\n            <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Pilih tanggal..." />\n          </div>\n          {date && <div className="date-caption">{selectedDateLabel}</div>}'],
  ['          <label className="planning-field"><span>MT</span><select value={mt} onChange={(e) => setMt(e.target.value)} disabled={loading} required>{mtRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>', '          <label className="planning-field"><span>MT</span><select value={mt} onChange={(e) => setMt(e.target.value)} disabled={loading || !branch} required><option value="">Pilih MT...</option>{mtRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>'],
  ['          <label className="planning-field"><span>Rombel</span><select value={rombel} onChange={(e) => setRombel(e.target.value)} disabled={loading} required>{rombelRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>', '          <label className="planning-field"><span>Rombel</span><select value={rombel} onChange={(e) => setRombel(e.target.value)} disabled={loading || !branch} required><option value="">Pilih rombel...</option>{rombelRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>'],
  ['          <label className="planning-field"><span>Mapel</span><select value={mapel} onChange={(e) => setMapel(e.target.value)} disabled={loading} required>{mapelRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>', '          <label className="planning-field"><span>Mapel</span><select value={mapel} onChange={(e) => setMapel(e.target.value)} disabled={loading || !branch} required><option value="">Pilih mapel...</option>{mapelRows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>'],
  ['          <label className="planning-field"><span>Jenis Sesi</span><select value={type} onChange={(e) => setType(e.target.value as (typeof SESSION_TYPES)[number])}><option>KBM</option><option>Klinik PR</option><option>Trial Class</option></select></label>', '          <label className="planning-field"><span>Jenis Sesi</span><select value={type} onChange={(e) => setType(e.target.value as (typeof SESSION_TYPES)[number] | "")} required><option value="">Pilih jenis sesi...</option><option>KBM</option><option>Klinik PR</option><option>Trial Class</option></select></label>'],
];

for (const [from, to] of replacements) {
  if (!s.includes(from)) throw new Error(`planning marker not found: ${from.slice(0, 80)}`);
  s = s.replace(from, to);
}

fs.writeFileSync(file, s);
console.log("Patched planning defaults to blank:", file);
