export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    isNaN(lat1) ||
    isNaN(lng1) ||
    isNaN(lat2) ||
    isNaN(lng2)
  ) {
    return 0;
  }

  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 100) / 100;
}

export const mockDistricts: string[] = [
  '朝阳区',
  '海淀区',
  '东城区',
  '西城区',
  '丰台区',
  '通州区',
  '浦东新区',
  '静安区',
  '徐汇区',
  '长宁区',
  '天河区',
  '越秀区',
  '海珠区',
  '南山区',
  '福田区',
  '罗湖区',
  '西湖区',
  '余杭区',
  '滨江区',
  '锦江区',
  '武侯区',
  '高新区',
];
