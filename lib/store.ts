import masterData from "./master-data.json";

export type MT = { id: number; name: string; branch: string; status: "Active" | "Inactive" };
export type Rombel = { id: number; name: string; level: string; branch: string; status: "Active" | "Inactive" };
export type Mapel = { id: number; name: string; status: "Active" | "Inactive" };
export type SessionStatus = "Planned" | "Changed" | "Cancelled" | "Realized";
export type Session = {
  id: number;
  date: string;
  time: string;
  mt: string;
  rombel: string;
  type: string;
  status: SessionStatus;
  auviTv?: boolean;
  ld?: boolean;
};

const seedMT: MT[] = masterData.mt.map((name, index) => ({
  id: index + 1,
  name,
  branch: "Semua Cabang",
  status: "Active",
}));

const seedRombel: Rombel[] = masterData.rombel.map((name, index) => ({
  id: index + 1,
  name,
  level: name.startsWith("SIAP") || name.startsWith("SNBT") ? "SNBT" : name.split(" ")[1] || "",
  branch: "Semua Cabang",
  status: "Active",
}));

const seedMapel: Mapel[] = masterData.mapel.map((name, index) => ({
  id: index + 1,
  name,
  status: "Active",
}));

const seedSessions: Session[] = [
  { id: 1, date: "Senin, 31 Aug", time: "08.00–09.30", mt: "Deki", rombel: "6 SD R4.01", type: "KBM", status: "Realized", auviTv: true },
  { id: 2, date: "Senin, 31 Aug", time: "10.00–11.30", mt: "Farah", rombel: "7 SMP R3.01", type: "KBM", status: "Realized", auviTv: true },
  { id: 3, date: "Senin, 31 Aug", time: "13.00–14.30", mt: "Yogi", rombel: "8 SMP R3.01", type: "KBM", status: "Changed", auviTv: false },
  { id: 4, date: "Selasa, 1 Sep", time: "09.00–10.30", mt: "Ariel", rombel: "10 SMA R4.01", type: "KBM", status: "Planned", auviTv: true, ld: true },
];

const keys = {
  mt: "mt-coach-mt",
  rombel: "mt-coach-rombel",
  mapel: "mt-coach-mapel",
  sessions: "mt-coach-sessions",
};

function read<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : seed;
  } catch {
    return seed;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

export function getMTs() { return read(keys.mt, seedMT); }
export function saveMTs(value: MT[]) { write(keys.mt, value); }
export function getRombels() { return read(keys.rombel, seedRombel); }
export function saveRombels(value: Rombel[]) { write(keys.rombel, value); }
export function getMapels() { return read(keys.mapel, seedMapel); }
export function saveMapels(value: Mapel[]) { write(keys.mapel, value); }
export function getSessions() { return read(keys.sessions, seedSessions); }
export function saveSessions(value: Session[]) { write(keys.sessions, value); }
