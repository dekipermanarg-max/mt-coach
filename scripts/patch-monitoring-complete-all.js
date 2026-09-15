const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// The canonical Monitoring UI now places all session actions in one row:
// [✓ Semua Lengkap] [✏️ Edit Sesi] [🗑️ Hapus]
// Do not add a separate quick-action row above Edit Sesi.
const quickAction = /\s*\{!complete && <div className="monitoring-card-quick-actions"[\s\S]*?<\/div>\}\s*(?=\{open && <div className="monitoring-card-body">)/;
if (quickAction.test(s)) {
  s = s.replace(quickAction, "\n            ");
}

// Make Semua Lengkap visually the same size as Edit Sesi and Hapus.
const sizeFix = '.monitoring-action-size-fix{height:36px!important;min-height:36px!important;box-sizing:border-box;padding:8px 12px!important;font-size:13px!important;line-height:18px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important}.monitoring-session-actions .complete-all-btn,.monitoring-session-actions .secondary-btn,.monitoring-session-actions .danger-btn{height:36px!important;min-height:36px!important;box-sizing:border-box;padding:8px 12px!important;font-size:13px!important;line-height:18px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important}';
if (!s.includes('monitoring-action-size-fix')) {
  const styleNeedle = '<style>{`';
  if (!s.includes(styleNeedle)) throw new Error('Monitoring style marker not found');
  s = s.replace(styleNeedle, styleNeedle + sizeFix);
}

fs.writeFileSync(file, s, "utf8");
console.log("✓ Monitoring action buttons normalized to the same size.");