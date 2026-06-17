export function formatCurrency(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '¥0.00';
  return '¥' + num.toFixed(2);
}

function padZero(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate());
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return formatDate(d) + ' ' + padZero(d.getHours()) + ':' + padZero(d.getMinutes());
}

export function formatDuration(hours: number): string {
  if (isNaN(hours) || hours < 0) return '0小时0分钟';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return m + '分钟';
  if (m === 0) return h + '小时';
  return h + '小时' + m + '分钟';
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone || '';
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

let idCounter = 0;
export function generateId(prefix: string = ''): string {
  idCounter = (idCounter + 1) % 1000000;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  const counter = idCounter.toString(36).padStart(4, '0');
  return prefix + timestamp + random + counter;
}
