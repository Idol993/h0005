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

export interface OvertimeFeeResult {
  overtimeHours: number;
  overtimeFee: number;
  level: 'normal' | 'warning' | 'severe';
  normalHours: number;
  penaltyHours: number;
  normalFee: number;
  penaltyFee: number;
}

export function calculateOvertimeFee(
  scheduledEnd: Date | string | number,
  currentTime: Date | string | number,
  hourlyRate: number
): OvertimeFeeResult {
  const overtimeHours = calculateOvertime(scheduledEnd, currentTime);
  if (overtimeHours <= 0) {
    return {
      overtimeHours: 0,
      overtimeFee: 0,
      level: 'normal',
      normalHours: 0,
      penaltyHours: 0,
      normalFee: 0,
      penaltyFee: 0,
    };
  }

  const normalHours = Math.min(overtimeHours, 2);
  const penaltyHours = Math.max(0, overtimeHours - 2);
  const normalFee = Math.round(normalHours * hourlyRate * 100) / 100;
  const penaltyFee = Math.round(penaltyHours * hourlyRate * 1.5 * 100) / 100;
  const overtimeFee = Math.round((normalFee + penaltyFee) * 100) / 100;

  let level: OvertimeFeeResult['level'] = 'normal';
  if (overtimeHours >= 4) {
    level = 'severe';
  } else if (overtimeHours > 0) {
    level = 'warning';
  }

  return {
    overtimeHours,
    overtimeFee,
    level,
    normalHours,
    penaltyHours,
    normalFee,
    penaltyFee,
  };
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
