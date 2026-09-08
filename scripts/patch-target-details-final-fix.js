const fs = require("fs");
const path = require("path");

function patchPlanning() {
  const file = path.join(process.cwd(), "app/planning/page.tsx");
  let s = fs.readFileSync(file, "utf8");

  // The target-detail patch generates a conditional JSX wrapper. Ensure the outer
  // expression is closed before the following form element.
  const modalStart = '      {targetDetail && <div className="target-modal-backdrop"';
  const start = s.indexOf(modalStart);
  if (start >= 0) {
    const end = s.indexOf('</section></div>', start);
    if (end >= 0 && s.slice(end, end + 15) === '</section></div>') {
      const after = end + '</section></div>'.length;
      if (s[after] !== '}') s = s.slice(0, after) + '}' + s.slice(after);
    }
  }

  const css = '.monitoring-target-click{position:relative;text-align:left;cursor:pointer;border:0;width:100%;transition:transform .16s ease,box-shadow .16s ease}.monitoring-target-click:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,.08)}.target-card-hint{margin-left:auto;font-size:11px;color:#64748b;font-weight:600}.target-modal-backdrop{position:fixed;inset:0;z-index:1200;background:rgba(15,23,42,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px}.target-modal{width:min(720px,100%);max-height:88vh;overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(15,23,42,.22)}.target-modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.target-modal-head h2{margin:4px 0;font-size:21px}.target-modal-head p{margin:0;color:#64748b;font-size:12px}.target-close{width:36px;height:36px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:24px;cursor:pointer}.target-modal-summary{display:flex;align-items:center;gap:10px;margin:18px 0}.target-summary-pill{padding:8px 12px;border-radius:999px;font-weight:800;font-size:13px}.target-summary-pill.auvi{background:#f3e8ff;color:#7e22ce}.target-summary-pill.ld{background:#dcfce7;color:#15803d}.target-summary-note{font-size:12px;color:#64748b}.target-section-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#475569;margin:12px 0 8px}.target-assignment-list{display:grid;gap:8px}.target-assignment-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc}.target-assignment-row strong,.target-assignment-row span{display:block}.target-assignment-row span{font-size:11px;color:#64748b;margin-top:3px}.target-assignment-row b{font-size:11px;color:#64748b;white-space:nowrap}.target-empty{padding:18px;text-align:center;color:#64748b;background:#f8fafc;border-radius:12px}.target-gap-box{display:flex;align-items:baseline;gap:8px;margin-top:14px;padding:13px 14px;border-radius:12px;background:#f8fafc;border:1px dashed #cbd5e1}.target-gap-box strong{font-size:20px}.target-gap-box span{font-size:12px;color:#64748b}@media(max-width:700px){.target-modal{padding:16px}.target-assignment-row{align-items:flex-start;flex-direction:column}.target-card-hint{display:none}}';
  if (!s.includes('.target-modal-backdrop{')) {
    const styleMarker = '<style>{`';
    if (s.includes(styleMarker)) s = s.replace(styleMarker, styleMarker + css);
  }
  fs.writeFileSync(file, s);
  console.log('Finalized Weekly Planning target-detail JSX/CSS.');
}

function patchMonitoring() {
  const file = path.join(process.cwd(), "app/monitoring/page.tsx");
  let s = fs.readFileSync(file, "utf8");

  // The weekly-target patch already declares targetLdRombels. The detail patch
  // injected a second declaration, so remove only that duplicate declaration.
  const dup = /\n  const targetLdRombels = Array\.from\(new Map\(targetLdDetailRows\.map\(r => \[r\.rombel_id!, r\]\)\)\.values\(\)\);/;
  const first = s.search(dup);
  if (first >= 0) {
    const secondText = s.slice(first + 1);
    const second = secondText.search(dup);
    if (second >= 0) {
      const removeAt = first + 1 + second;
      s = s.slice(0, removeAt) + s.slice(removeAt).replace(dup, '');
    }
  }

  const css = '.monitoring-target-click{position:relative;text-align:left;cursor:pointer;border:0;width:100%;transition:transform .16s ease,box-shadow .16s ease}.monitoring-target-click:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,.08)}.target-card-hint{display:block;margin-top:7px;font-size:11px;color:#64748b;font-weight:600}.target-modal-backdrop{position:fixed;inset:0;z-index:1200;background:rgba(15,23,42,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px}.target-modal{width:min(720px,100%);max-height:88vh;overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(15,23,42,.22)}.target-modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.target-modal-head h2{margin:4px 0;font-size:21px}.target-modal-head p{margin:0;color:#64748b;font-size:12px}.target-close{width:36px;height:36px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:24px;cursor:pointer}.target-modal-summary{display:flex;align-items:center;gap:10px;margin:18px 0}.target-summary-pill{padding:8px 12px;border-radius:999px;font-weight:800;font-size:13px}.target-summary-pill.auvi{background:#f3e8ff;color:#7e22ce}.target-summary-pill.ld{background:#dcfce7;color:#15803d}.target-summary-note{font-size:12px;color:#64748b}.target-section-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#475569;margin:12px 0 8px}.target-assignment-list{display:grid;gap:8px}.target-assignment-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc}.target-assignment-row strong,.target-assignment-row span{display:block}.target-assignment-row span{font-size:11px;color:#64748b;margin-top:3px}.target-assignment-row b{font-size:11px;color:#64748b;white-space:nowrap}.target-empty{padding:18px;text-align:center;color:#64748b;background:#f8fafc}.target-gap-box{display:flex;align-items:baseline;gap:8px;margin-top:14px;padding:13px 14px;border-radius:12px;background:#f8fafc;border:1px dashed #cbd5e1}.target-gap-box strong{font-size:20px}.target-gap-box span{font-size:12px;color:#64748b}@media(max-width:700px){.target-modal{padding:16px}.target-assignment-row{align-items:flex-start;flex-direction:column}}';
  if (!s.includes('.target-modal-backdrop{')) {
    const styleMarker = '<style>{`';
    if (s.includes(styleMarker)) s = s.replace(styleMarker, styleMarker + css);
  }
  fs.writeFileSync(file, s);
  console.log('Finalized Monitoring target-detail declarations/CSS.');
}

patchMonitoring();
patchPlanning();
