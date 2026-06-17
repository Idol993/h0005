function padZero(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export function calculateHours(start: Date | string | number, end: Date | string | number): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return 0;
  const diff = (e - s) / (1000 * 60 * 60);
  return Math.round(diff * 10) / 10;
}

export function calculateOvertime(
  scheduledEnd: Date | string | number,
  actualEnd: Date | string | number
): number {
  const scheduled = new Date(scheduledEnd).getTime();
  const actual = new Date(actualEnd).getTime();
  if (isNaN(scheduled) || isNaN(actual) || actual <= scheduled) return 0;
  const diff = (actual - scheduled) / (1000 * 60 * 60);
  return Math.round(diff * 10) / 10;
}

export function isSameDay(d1: Date | string | number, d2: Date | string | number): boolean {
  const a = new Date(d1);
  const b = new Date(d2);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date | string | number, days: number): Date {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function formatHourRange(
  startTime: string,
  endTime: string
): string {
  if (!startTime || !endTime) return '';
  const parseTime = (t: string): string => {
    if (!t) return '';
    if (t.includes('T')) {
      const d = new Date(t);
      if (!isNaN(d.getTime())) {
        return padZero(d.getHours()) + ':' + padZero(d.getMinutes());
      }
    }
    return t.slice(0, 5);
  };
  return parseTime(startTime) + ' - ' + parseTime(endTime);
}
