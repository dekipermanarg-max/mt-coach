export const AUVI_WEEKLY_TARGET = 10;
export const LD_TARGET_PERCENT = 50;

// Ujung Gurun LD eligibility is explicitly limited to these two rombels.
// 12 CHAMP R4.01 is excluded from LD calculations.
export const LD_ELIGIBLE_ROMBEL_NAMES: Record<string, string[]> = {
  "Padang - Ujung Gurun": ["6 SD R4.01", "11 SMA R4.01"],
};

// Number of rombel actually eligible for LD in each branch.
// Ujung Gurun has 2 eligible rombels, while its operational LD target remains 3 assignments/week.
export const LD_ELIGIBLE_ROMBEL: Record<string, number> = {
  "Padang - Ujung Gurun": 2,
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

// Current production IDs for the two eligible Ujung Gurun rombels.
// 6 SD R4.01 = a60a0675-1d03-4b45-ae51-0f1a9eb35ab0
// 11 SMA R4.01 = ca7db70b-f37d-415f-a4f8-01722e5b3958
// Other Ujung Gurun rombel IDs, including 12 CHAMP R4.01, are excluded.
export const LD_ELIGIBLE_ROMBEL_IDS: Record<string, string[]> = {
  "Padang - Ujung Gurun": [
    "a60a0675-1d03-4b45-ae51-0f1a9eb35ab0",
    "ca7db70b-f37d-415f-a4f8-01722e5b3958",
  ],
};

export const LD_BRANCH_IDS: Record<string, string> = {
  "Padang - Ujung Gurun": "7f727cf7-47d0-4f21-9735-f9ae54ca3246",
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
  branch_id?: string | null;
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

export function countUniqueLDRombels(sessions: LDSession[]) {
  return new Set(
    sessions
      .filter((s) => s.ld === true && s.ld_status !== "Bukan sesi LD" && s.rombel_id)
      .filter((s) => {
        const ujungGurunId = LD_BRANCH_IDS["Padang - Ujung Gurun"];
        if (s.branch_id !== ujungGurunId) return true;
        return LD_ELIGIBLE_ROMBEL_IDS["Padang - Ujung Gurun"].includes(s.rombel_id as string);
      })
      .map((s) => s.rombel_id as string),
  ).size;
}
