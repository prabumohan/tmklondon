/** Parse admin display strings like "Dec 15, 2024" or "2026-12-20" for calendar placement. */
export function parseEventDisplayDate(display: string): Date | null {
  if (!display?.trim()) return null;
  const s = display.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    const y = parseInt(iso[1], 10);
    const m = parseInt(iso[2], 10) - 1;
    const day = parseInt(iso[3], 10);
    if (m >= 0 && m < 12 && day >= 1 && day <= 31) {
      const dt = new Date(y, m, day);
      if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === day) return dt;
    }
  }

  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function compareEventDates(a: Date | null, b: Date | null): number {
  if (a && b) return a.getTime() - b.getTime();
  if (a) return -1;
  if (b) return 1;
  return 0;
}
