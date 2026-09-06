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
  ['    if (!branchId || !mt || !rombel || !mapel) return;', '    if (!branchId || !date || !mt || !rombel || !mapel || !type) {\n      setMessage("Lengkapi Cabang, Tanggal Planning, MT, Rombel, Mapel, dan Jenis Sesi terlebih dahulu.");\n      return;\n    }'],
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

// Load MT only for the selected branch. Rombel and mapel are shared master data.
const oldLoadMasters = `  async function loadMasters() {\n    const [b, mtRes, rRes, mRes] = await Promise.all([\n      supabase.from("branches").select("id,name").eq("name", branch).single(),\n      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),\n      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),\n      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),\n    ]);\n    if (b.data) setBranchId(b.data.id);\n    else setBranchId("");\n    setMtRows(mtRes.data || []);\n    setRombelRows(rRes.data || []);\n    setMapelRows(mRes.data || []);\n    setMt("");\n    setRombel("");\n    setMapel("");\n    if (b.error || mtRes.error || rRes.error || mRes.error) {\n      setMessage("Gagal memuat master data dari database.");\n    }\n  }`;
const newLoadMasters = `  async function loadMasters() {\n    setMtRows([]);\n    setRombelRows([]);\n    setMapelRows([]);\n    setMt("");\n    setRombel("");\n    setMapel("");\n    setBranchId("");\n    if (!branch) return;\n\n    const b = await supabase.from("branches").select("id,name").eq("name", branch).single();\n    if (!b.data) {\n      setMessage("Cabang tidak ditemukan di database.");\n      return;\n    }\n    const id = b.data.id as string;\n    setBranchId(id);\n\n    const [mtRes, rRes, mRes] = await Promise.all([\n      supabase.from("master_mt").select("id,name").eq("branch_id", id).eq("active", true).order("name"),\n      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),\n      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),\n    ]);\n    setMtRows(mtRes.data || []);\n    setRombelRows(rRes.data || []);\n    setMapelRows(mRes.data || []);\n    if (mtRes.error || rRes.error || mRes.error) {\n      setMessage("Gagal memuat master data dari database.");\n    }\n  }`;
if (!s.includes(oldLoadMasters)) throw new Error('loadMasters marker not found');
s = s.replace(oldLoadMasters, newLoadMasters);

// Keep names visible for already-saved sessions even when a master row is outside the current dropdown scope.
const oldPlanningRow = `  mapel_id: string | null;\n};`;
const newPlanningRow = `  mapel_id: string | null;\n  mt_name?: string;\n  rombel_name?: string;\n  mapel_name?: string;\n};`;
if (!s.includes(oldPlanningRow)) throw new Error('PlanningRow marker not found');
s = s.replace(oldPlanningRow, newPlanningRow);

const oldLoadSessionsData = `    } else {\n      setSessions((data || []) as PlanningRow[]);\n    }`;
const newLoadSessionsData = `    } else {\n      const rows = (data || []) as PlanningRow[];\n      const mtIds = [...new Set(rows.map((x) => x.mt_id).filter(Boolean))] as string[];\n      const rombelIds = [...new Set(rows.map((x) => x.rombel_id).filter(Boolean))] as string[];\n      const mapelIds = [...new Set(rows.map((x) => x.mapel_id).filter(Boolean))] as string[];\n      const [mtNames, rombelNames, mapelNames] = await Promise.all([\n        mtIds.length ? supabase.from("master_mt").select("id,name").in("id", mtIds) : Promise.resolve({ data: [] as MasterRow[] }),\n        rombelIds.length ? supabase.from("master_rombel").select("id,name").in("id", rombelIds) : Promise.resolve({ data: [] as MasterRow[] }),\n        mapelIds.length ? supabase.from("master_mapel").select("id,name").in("id", mapelIds) : Promise.resolve({ data: [] as MasterRow[] }),\n      ]);\n      const mtMap = new Map((mtNames.data || []).map((x) => [x.id, x.name]));\n      const rombelMap = new Map((rombelNames.data || []).map((x) => [x.id, x.name]));\n      const mapelMap = new Map((mapelNames.data || []).map((x) => [x.id, x.name]));\n      const hydrated = rows.map((x) => ({ ...x, mt_name: x.mt_id ? mtMap.get(x.mt_id) || "" : "", rombel_name: x.rombel_id ? rombelMap.get(x.rombel_id) || "" : "", mapel_name: x.mapel_id ? mapelMap.get(x.mapel_id) || "" : "" }));\n      setSessions(hydrated);\n      setMtRows((prev) => { const extra = hydrated.filter((x) => x.mt_id && x.mt_name && !prev.some((p) => p.id === x.mt_id)).map((x) => ({ id: x.mt_id as string, name: x.mt_name as string })); return [...prev, ...extra]; });\n      setRombelRows((prev) => { const extra = hydrated.filter((x) => x.rombel_id && x.rombel_name && !prev.some((p) => p.id === x.rombel_id)).map((x) => ({ id: x.rombel_id as string, name: x.rombel_name as string })); return [...prev, ...extra]; });\n    }`;
if (!s.includes(oldLoadSessionsData)) throw new Error('loadSessions data marker not found');
s = s.replace(oldLoadSessionsData, newLoadSessionsData);

// Render saved values from the hydrated session first, then fall back to current master arrays.
s = s.replace('{nameOf(mtRows, session.mt_id)}', '{session.mt_name || nameOf(mtRows, session.mt_id)}');
s = s.replace('{nameOf(rombelRows, session.rombel_id)}', '{session.rombel_name || nameOf(rombelRows, session.rombel_id)}');
s = s.replace('{nameOf(mapelRows, session.mapel_id)}', '{session.mapel_name || nameOf(mapelRows, session.mapel_id)}');

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning defaults, branch-scoped MT, shared rombel, and saved-session name hydration:", file);
