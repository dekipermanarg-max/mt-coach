const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/monitoring/page.tsx");
let s = fs.readFileSync(file, "utf8");

// The AuVi-status commit accidentally dropped the final component-closing brace.
// Restore it before the deployment patch scripts run.
if (!s.trimEnd().endsWith("}")) {
  s = s.replace(/\s*$/, "\n}\n");
  fs.writeFileSync(file, s);
  console.log("Restored missing Monitoring component closing brace.");
} else {
  console.log("Monitoring component closing brace already present.");
}
