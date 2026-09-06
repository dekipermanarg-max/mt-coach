const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "app/planning/page.tsx");
let s = fs.readFileSync(file, "utf8");

// Keep the selectors interactive. Master data is shared and does not depend on session loading.
s = s.replaceAll(' disabled={!branch}', '');

// Load MT, rombel and mapel even before a branch is selected. Branch selection only resolves branch_id.
const start = s.indexOf("  async function loadMasters() {");
const end = s.indexOf("\n  async function resolveBranchId()", start);
if (start === -1 || end === -1) throw new Error("loadMasters block marker not found");

const replacement = `  async function loadMasters() {
    setMtRows([]);
    setRombelRows([]);
    setMapelRows([]);
    setMt("");
    setRombel("");
    setMapel("");
    setBranchId("");

    const branchResult = branch
      ? await supabase.from("branches").select("id,name").eq("name", branch).single()
      : { data: null, error: null };

    if (branchResult.data) setBranchId(branchResult.data.id as string);

    const [mtRes, rRes, mRes] = await Promise.all([
      supabase.from("master_mt").select("id,name").eq("active", true).order("name"),
      supabase.from("master_rombel").select("id,name").eq("active", true).order("name"),
      supabase.from("master_mapel").select("id,name").eq("active", true).order("name"),
    ]);

    setMtRows(mtRes.data || []);
    setRombelRows(rRes.data || []);
    setMapelRows(mRes.data || []);

    if (branch && branchResult.error) {
      setMessage("Cabang tidak ditemukan di database.");
    } else if (mtRes.error || rRes.error || mRes.error) {
      setMessage("Gagal memuat master data dari database.");
    }
  }`;

s = s.slice(0, start) + replacement + s.slice(end);

fs.writeFileSync(file, s);
console.log("Patched Weekly Planning: master dropdowns load independently of branch/session loading:", file);
