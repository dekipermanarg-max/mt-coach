const fs = require('fs');

const replacements = [
  ['app/layout.tsx', [
    ['title: "MT Coach"', 'title: "Dashboard Administrasi MT Regional Sumbar"'],
    ['description: "Monitoring, Planning, dan Performance Management"', 'description: "Dashboard Administrasi MT Regional Sumbar — Monitoring, Planning, dan Performance Management"'],
  ]],
  ['app/page.tsx', [
    ['<div className="eyebrow">MT COACH · OVERVIEW</div>', '<div className="eyebrow">ADMINISTRASI MT REGIONAL SUMBAR · OVERVIEW</div>'],
  ]],
  ['app/login/page.tsx', [
    ['MT COACH · SECURE ACCESS', 'DASHBOARD ADMINISTRASI MT REGIONAL SUMBAR · SECURE ACCESS'],
    ['Masuk ke MT Coach', 'Masuk ke Dashboard Administrasi'],
    ['Gunakan akun MT Coach yang sudah terdaftar.', 'Gunakan akun yang sudah terdaftar pada Dashboard Administrasi MT Regional Sumbar.'],
  ]],
  ['app/set-password/page.tsx', [
    ['MT COACH · ACCOUNT SETUP', 'DASHBOARD ADMINISTRASI MT REGIONAL SUMBAR · ACCOUNT SETUP'],
    ['Buat password untuk akun MT Coach kamu.', 'Buat password untuk akun Dashboard Administrasi MT Regional Sumbar kamu.'],
    ['Password berhasil dibuat. Silakan masuk ke MT Coach.', 'Password berhasil dibuat. Silakan masuk ke Dashboard Administrasi.'],
    ['Akun berhasil diverifikasi, tetapi belum terhubung ke data akun MT Coach.', 'Akun berhasil diverifikasi, tetapi belum terhubung ke data akun Dashboard Administrasi.'],
  ]],
];

for (const [file, reps] of replacements) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [from, to] of reps) s = s.split(from).join(to);
  fs.writeFileSync(file, s);
  console.log(`Branding patched: ${file}`);
}
