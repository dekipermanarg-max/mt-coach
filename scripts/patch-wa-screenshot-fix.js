const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Make the screenshot action explicit and surface any browser-side error inside the modal.
if (!s.includes('const [reportImageError, setReportImageError]')) {
  const stateNeedle = '  const [generatingReportImage, setGeneratingReportImage] = useState(false);';
  if (!s.includes(stateNeedle)) throw new Error("Screenshot generating state not found");
  s = s.replace(stateNeedle, stateNeedle + '\n  const [reportImageError, setReportImageError] = useState<string | null>(null);');
}

s = s.replace(
  'setGeneratingReportImage(true); setMessage("");',
  'setGeneratingReportImage(true); setReportImageError(null); setMessage("");'
);

s = s.replace(
  'setReportImage(canvas.toDataURL("image/png"));',
  'setReportImage(canvas.toDataURL("image/png")); setShowWaReport(false);'
);

s = s.replace(
  'setMessage("Gagal membuat screenshot: " + (e instanceof Error ? e.message : "Unknown error"));',
  'setReportImageError("Gagal membuat screenshot: " + (e instanceof Error ? e.message : "Unknown error"));'
);

// Use an explicit click wrapper so the browser cannot interpret the handler as anything else.
s = s.replace(
  'onClick={generateReportImage} disabled={generatingReportImage}',
  'onClick={() => { void generateReportImage(); }} disabled={generatingReportImage}'
);

// Show the error inside the currently visible WhatsApp modal instead of behind its backdrop.
if (!s.includes('report-image-error')) {
  const actionsNeedle = '<div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={copyWaReport}>';
  const replacement = '<div className="report-image-error" role="alert">{reportImageError}</div><div className="wa-modal-actions"><button type="button" className="secondary-btn" onClick={copyWaReport}>';
  if (!s.includes(actionsNeedle)) throw new Error("WA modal actions marker not found");
  s = s.replace(actionsNeedle, replacement);
}

// Keep the error area compact and make the generated-image layer unambiguously topmost.
const styleNeedle = '<style>{`';
const styleAdd = '.report-image-error{margin-top:10px;padding:10px 12px;border:1px solid #fecaca;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:12px}.report-image-error:empty{display:none}.report-image-modal{z-index:1101!important}.report-image-modal .report-image-wrap{background:#fff}';
if (!s.includes('report-image-error-css-marker')) {
  if (!s.includes(styleNeedle)) throw new Error("Monitoring style marker not found");
  s = s.replace(styleNeedle, styleNeedle + styleAdd);
  s = s.replace('`}</style>', '/* report-image-error-css-marker */`}</style>');
}

fs.writeFileSync(file, s);
console.log("Patched WhatsApp screenshot click/error handling:", file);
