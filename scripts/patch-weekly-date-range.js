const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep the existing single-date state as the range start, then add an independent end date.
const stateMarker = '  const [date, setDate] = useState(DEFAULT_DATE);';
const stateAdd = `${stateMarker}\n  const [endDate, setEndDate] = useState(() => {\n    const end = new Date(DEFAULT_DATE + "T00:00:00");\n    end.setDate(end.getDate() + 6);\n    return end.toISOString().slice(0, 10);\n  });`;
if (!s.includes("const [endDate, setEndDate]")) {
  if (!s.includes(stateMarker)) throw new Error("Weekly planning date state marker not found");
  s = s.replace(stateMarker, stateAdd);
}

// Keep the target-detail patch marker available, while exposing the currently selected range.
const marker = '  const selectedDateLabel = date ? formatDate(date) : "";';
const rangeAdd = `  const selectedDateLabel = date ? formatDate(date) : "";\n  const selectedEndDateLabel = endDate ? formatDate(endDate) : "";`;
if (!s.includes("const selectedEndDateLabel")) {
  if (!s.includes(marker)) throw new Error("Weekly planning selected date marker not found");
  s = s.replace(marker, rangeAdd);
}

// Replace the planning control section with Monitoring-style selectable start/end cards.
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
            <input
              className="date-input"
              type="date"
              value={date}
              onChange={(e) => {
                const next = e.target.value;
                setDate(next);
                if (endDate < next) setEndDate(next);
              }}
              aria-label="Pilih tanggal awal planning"
            />
          </div>
        </div>
        <div className="control-box">
          <span className="control-label">Tanggal Akhir</span>
          <div className="date-control">
            <div className="date-icon">📅</div>
            <input
              className="date-input"
              type="date"
              value={endDate}
              min={date || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="Pilih tanggal akhir planning"
            />
          </div>
        </div>
      </section>`;

  s = s.slice(0, sectionStart) + newControl + s.slice(sectionEnd + "      </section>".length);
}

// Load, save draft, and finalize the selected planning range.
s = s.replaceAll(
  '.eq("planning_date", date)',
  '.gte("planning_date", date)\n      .lte("planning_date", endDate)'
);

const effectMarker = '  }, [branch, date]);';
if (s.includes(effectMarker)) {
  s = s.replace(effectMarker, '  }, [branch, date, endDate]);');
}

const loadSessionsGuard = '    const id = await resolveBranchId();\n';
if (s.includes(loadSessionsGuard) && !s.includes('    if (!date || !endDate) {\n      setSessions([]);\n      setLoading(false);\n      return;\n    }')) {
  s = s.replace(loadSessionsGuard, loadSessionsGuard + '    if (!date || !endDate) {\n      setSessions([]);\n      setLoading(false);\n      return;\n    }\n');
}

// The session form continues to use the start date as the session date; the range controls which Drafts are shown/managed.
s = s.replace(
  'const payload = { branch_id: branchId, planning_date: date,',
  'const payload = { branch_id: branchId, planning_date: date,'
);

// Make the visible date text for the planning/table headers reflect the selected range without breaking the existing target-detail patch.
if (!s.includes("const planningRangeLabel")) {
  const labelMarker = '  const selectedEndDateLabel = endDate ? formatDate(endDate) : "";';
  if (!s.includes(labelMarker)) throw new Error("Weekly planning end-date label marker not found");
  s = s.replace(labelMarker, labelMarker + '\n  const planningRangeLabel = date && endDate ? `${formatDate(date)} – ${formatDate(endDate)}` : "Pilih rentang planning";');
}
s = s.replace(
  'Input sesi untuk <strong>{selectedDateLabel}</strong>. Jam tidak diperlukan.',
  'Input sesi untuk <strong>{planningRangeLabel}</strong>. Jam tidak diperlukan.'
);
s = s.replace(
  '<p>{branch} · {selectedDateLabel}</p>',
  '<p>{branch} · {planningRangeLabel}</p>'
);

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning with selectable Monitoring-style start/end date cards.");
