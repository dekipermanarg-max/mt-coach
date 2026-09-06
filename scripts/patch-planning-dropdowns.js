const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

const replacements = [
  [
    'disabled={loading || !branch} required><option value="">Pilih MT...</option>',
    'disabled={!branch} required><option value="">Pilih MT...</option>',
  ],
  [
    'disabled={loading || !branch} required><option value="">Pilih rombel...</option>',
    'disabled={!branch} required><option value="">Pilih rombel...</option>',
  ],
  [
    'disabled={loading || !branch} required><option value="">Pilih mapel...</option>',
    'disabled={!branch} required><option value="">Pilih mapel...</option>',
  ],
];

for (const [from, to] of replacements) {
  if (!s.includes(from)) throw new Error(`dropdown marker not found: ${from}`);
  s = s.replace(from, to);
}

fs.writeFileSync(file, s);
console.log("Patched planning dropdowns so they are not blocked by session loading:", file);
