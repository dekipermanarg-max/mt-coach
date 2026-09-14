export const AUVI_WEEKLY_TARGET = 10;
export const LD_TARGET_PERCENT = 50;

// Ujung Gurun has an explicit LD whitelist. These are the rombel IDs currently
// used by the branch for the two eligible rombels:
// - 6 SD R4.01
// - 11 SMA R4.01
// 12 CHAMP R4.01 is explicitly excluded.
export const LD_ELIGIBLE_ROMBEL_NAMES: Record<string, string[]> = {
  "Padang - Ujung Gurun": ["6 SD R4.01", "11 SMA R4.01"],
};

// Number of eligible LD rombel slots used by the target configuration.
// Ujung Gurun's operational weekly target remains 3 LD assignments.
export const LD_ELIGIBLE_ROMBEL: Record<string, number> = {
  "Padang - Ujung Gurun": 6,
  "Padang - Tarandam": 6,
  "Padang - Sutomo": 11,
  "Padang - S. Parman": 6,
  "Padang - Gajah Mada": 10,
  "Solok - Pandan": 6,
  "Payakumbuh - Simpang Benteng": 9,
  "Painan - Pagaruyung": 6,
  "Bukittinggi - Manggis Ganting": 5,
  "Bukittinggi - Jambu Air": 6,
};

export const LD_ELIGIBLE_ROMBEL_IDS: Record<string, string[]> = {
  "Padang - Ujung Gurun": [
    "a60a0675-1d03-4b45-ae51-0f1a9eb35ab0", // 6 SD R4.01
    "ca7db70b-f37d-415f-a4f8-01722e5b3958", // 11 SMA R4.01
  ],
};

export function getBranchTargetKey(name: string) {
  const normalized = name
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return Object.keys(LD_ELIGIBLE_ROMBEL).find(
    (key) => normalized === key.toLowerCase(),
  ) || null;
}

export function getLDEligibleCount(branchName: string) {
  const key = getBranchTargetKey(branchName);
  return key ? LD_ELIGIBLE_ROMBEL[key] : 0;
}

export function getLDWeeklyTarget(branchName: string) {
  if (getBranchTargetKey(branchName) === "Padang - Ujung Gurun") return 3;
  return Math.ceil(getLDEligibleCount(branchName) * LD_TARGET_PERCENT / 100);
}

export function getLDWeeklyTargetForBranches(branchNames: string[]) {
  return branchNames.reduce((total, name) => total + getLDWeeklyTarget(name), 0);
}

type LDSession = {
  rombel_id: string | null;
  ld?: boolean | null;
  ld_status?: string | null;
};

export function isLDEligibleRombel(branchName: string, rombelId: string | null) {
  if (!rombelId) return false;
  const key = getBranchTargetKey(branchName);
  if (!key) return false;
  const ids = LD_ELIGIBLE_ROMBEL_IDS[key];
  return ids ? ids.includes(rombelId) : true;
}

export function countUniqueLDRombels(sessions: LDSession[], branchName?: string) {
  return new Set(
    sessions
      .filter((s) => s.ld === true && s.ld_status !== "Bukan sesi LD" && s.rombel_id)
      .filter((s) => !branchName || isLDEligibleRombel(branchName, s.rombel_id))
      .map((s) => s.rombel_id as string),
  ).size;
}
