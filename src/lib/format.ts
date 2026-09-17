// All times are shown in shop time (Asia/Dubai, UTC+4, no DST). Formatting by hand keeps
// output identical on Hermes, JSC and web regardless of the phone's own timezone.
const OFFSET_MS = 4 * 3600_000;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const shop = (iso: string | Date) => new Date(new Date(iso).getTime() + OFFSET_MS);

export function aed(fils: number) {
  const v = fils / 100;
  return `AED ${v.toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function duration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function time12(iso: string) {
  const d = shop(iso);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

export function hhmmTo12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function dayMonth(iso: string) {
  const d = shop(iso);
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function longDate(iso: string) {
  const d = shop(iso);
  return `${DAYS_LONG[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function shortDate(iso: string) {
  const d = shop(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "YYYY-MM-DD" in shop time, `offset` days from today. */
export function dateKey(offset = 0) {
  return new Date(Date.now() + OFFSET_MS + offset * 86_400_000).toISOString().slice(0, 10);
}

export function dateKeyParts(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  return { weekday: DAYS[d.getUTCDay()], weekdayIndex: d.getUTCDay(), day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()] };
}

export function dateKeyOf(iso: string) {
  return shop(iso).toISOString().slice(0, 10);
}

export function relativeDay(iso: string) {
  const key = dateKeyOf(iso);
  if (key === dateKey()) return "Today";
  if (key === dateKey(1)) return "Tomorrow";
  return dayMonth(iso);
}

export function greeting() {
  const h = shop(new Date()).getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
