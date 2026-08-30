export type MT = { id: number; name: string; branch: string; status: "Active" | "Inactive" };
export type Rombel = { id: number; name: string; level: string; branch: string; status: "Active" | "Inactive" };
export type SessionStatus = "Planned" | "Changed" | "Cancelled" | "Realized";
export type Session = { id: number; date: string; time: string; mt: string; rombel: string; type: string; status: SessionStatus };

const seedMT: MT[] = [
  { id: 1, name: "Deki", branch: "Tarandam", status: "Active" },
  { id: 2, name: "Farah", branch: "Tarandam", status: "Active" },
  { id: 3, name: "Ariel", branch: "Tarandam", status: "Active" },
  { id: 4, name: "Yogi", branch: "Tarandam", status: "Inactive" },
];

const seedRombel: Rombel[] = [
  { id: 1, name: "6 SD A", level: "SD", branch: "Tarandam", status: "Active" },
  { id: 2, name: "6 SD B", level: "SD", branch: "Tarandam", status: "Active" },
  { id: 3, name: "7 SMP A", level: "SMP", branch: "Tarandam", status: "Active" },
  { id: 4, name: "8 SMP A", level: "SMP", branch: "Tarandam", status: "Active" },
  { id: 5, name: "10 SMA A", level: "SMA", branch: "Tarandam", status: "Active" },
];

const seedSessions: Session[] = [
  { id: 1, date: "Senin, 31 Aug", time: "08.00–09.30", mt: "Deki", rombel: "6 SD A", type: "KBM", status: "Realized" },
  { id: 2, date: "Senin, 31 Aug", time: "10.00–11.30", mt: "Farah", rombel: "7 SMP A", type: "KBM", status: "Realized" },
  { id: 3, date: "Senin, 31 Aug", time: "13.00–14.30", mt: "Yogi", rombel: "8 SMP A", type: "KBM", status: "Changed" },
  { id: 4, date: "Selasa, 1 Sep", time: "09.00–10.30", mt: "Ariel", rombel: "10 SMA A", type: "KBM", status: "Planned" },
];

const keys = { mt: "mt-coach-mt", rombel: "mt-coach-rombel", sessions: "mt-coach-sessions" };

function read<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : seed;
  } catch { return seed; }
}
function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

export function getMTs() { return read(keys.mt, seedMT); }
export function saveMTs(value: MT[]) { write(keys.mt, value); }
export function getRombels() { return read(keys.rombel, seedRombel); }
export function saveRombels(value: Rombel[]) { write(keys.rombel, value); }
export function getSessions() { return read(keys.sessions, seedSessions); }
export function saveSessions(value: Session[]) { write(keys.sessions, value); }
