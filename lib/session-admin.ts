export type SessionAdminFields = {
  jenis_sesi: string | null | undefined;
  topik_sub_topik_done: boolean | null | undefined;
  attendance: boolean | null | undefined;
  starchamps: boolean | null | undefined;
  activity_score: boolean | null | undefined;
  report_sessions: boolean | null | undefined;
  foto_kbm: boolean | null | undefined;
  report_wa: boolean | null | undefined;
  auvi_tv_status: string | null | undefined;
  ld_status: string | null | undefined;
};

export const ADMIN_KEYS = [
  "topik_sub_topik_done", "attendance", "starchamps", "activity_score",
  "report_sessions", "foto_kbm", "report_wa",
] as const;

export function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export function isSimpleSession(session: Pick<SessionAdminFields, "jenis_sesi">) {
  const jenis = normalizeStatus(session.jenis_sesi);
  return jenis === "Klinik PR" || jenis === "Trial Class";
}

export function isAuviComplete(session: Pick<SessionAdminFields, "auvi_tv_status">) {
  const status = normalizeStatus(session.auvi_tv_status);
  return status === "Bukan sesi AuVi TV" || status === "Connect ke TV";
}

export function isLdComplete(session: Pick<SessionAdminFields, "ld_status">) {
  const status = normalizeStatus(session.ld_status);
  return status === "Bukan sesi LD" || status === "Sudah report di CMS";
}

export function isSessionAdminComplete(session: SessionAdminFields) {
  if (isSimpleSession(session)) return Boolean(session.attendance);
  return ADMIN_KEYS.every(key => Boolean(session[key])) && isAuviComplete(session) && isLdComplete(session);
}

export function getAdminDone(session: SessionAdminFields) {
  if (isSimpleSession(session)) return session.attendance ? 1 : 0;
  return ADMIN_KEYS.filter(key => Boolean(session[key])).length +
    (isAuviComplete(session) ? 1 : 0) +
    (isLdComplete(session) ? 1 : 0);
}

export function getAdminTotal(session: Pick<SessionAdminFields, "jenis_sesi">) {
  return isSimpleSession(session) ? 1 : ADMIN_KEYS.length + 2;
}

export function getAdminPercent(session: SessionAdminFields) {
  return Math.round((getAdminDone(session) / getAdminTotal(session)) * 100);
}

export function getMissingAdmin(session: SessionAdminFields) {
  if (isSimpleSession(session)) return session.attendance ? [] : ["Attendance"];
  return [
    !session.topik_sub_topik_done && "Topik/Subtopik",
    !session.attendance && "Attendance",
    !session.starchamps && "Starchamps",
    !session.activity_score && "Activity Score",
    !session.report_sessions && "Report Sessions",
    !session.foto_kbm && "Foto KBM",
    !session.report_wa && "Report WA",
    !isAuviComplete(session) && "AuVi TV",
    !isLdComplete(session) && "LD",
  ].filter(Boolean) as string[];
}
