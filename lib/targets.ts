export const AUVI_WEEKLY_TARGET = 10;
export const LD_TARGET_PERCENT = 50;

// Number of rombel eligible for LD in each branch.
// LD realization is counted from the rombel_id on sessions that were actually assigned LD.
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

export function countUniqueLDRombels(sessions: LDSession[]) {
  return new Set(
    sessions
      .filter((s) => s.ld === true && s.ld_status !== "Bukan sesi LD" && s.rombel_id)
      .map((s) => s.rombel_id as string),
  ).size;
}
