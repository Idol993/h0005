import type { ParkingSpot, TimeSlot } from '../types';

/**
 * 通用全天可用时间段（工作日+周末）
 */
const allDayWeekdays: TimeSlot[] = [
  { dayOfWeek: 1, startTime: '00:00', endTime: '23:59' },
  { dayOfWeek: 2, startTime: '00:00', endTime: '23:59' },
  { dayOfWeek: 3, startTime: '00:00', endTime: '23:59' },
  { dayOfWeek: 4, startTime: '00:00', endTime: '23:59' },
  { dayOfWeek: 5, startTime: '00:00', endTime: '23:59' },
  { dayOfWeek: 6, startTime: '00:00', endTime: '23:59' },
  { dayOfWeek: 0, startTime: '00:00', endTime: '23:59' },
];

/**
 * 工作日白天可用（8:00-20:00）
 */
const workdayDaytime: TimeSlot[] = [
  { dayOfWeek: 1, startTime: '08:00', endTime: '20:00' },
  { dayOfWeek: 2, startTime: '08:00', endTime: '20:00' },
  { dayOfWeek: 3, startTime: '08:00', endTime: '20:00' },
  { dayOfWeek: 4, startTime: '08:00', endTime: '20:00' },
  { dayOfWeek: 5, startTime: '08:00', endTime: '20:00' },
];

/**
 * 工作日晚间+周末全天
 */
const eveningAndWeekend: TimeSlot[] = [
  { dayOfWeek: 1, startTime: '18:00', endTime: '23:59' },
  { dayOfWeek: 2, startTime: '18:00', endTime: '23:59' },
  { dayOfWeek: 3, startTime: '18:00', endTime: '23:59' },
  { dayOfWeek: 4, startTime: '18:00', endTime: '23:59' },
  { dayOfWeek: 5, startTime: '18:00', endTime: '23:59' },
  { dayOfWeek: 6, startTime: '00:00', endTime: '23:59' },
  { dayOfWeek: 0, startTime: '00:00', endTime: '23:59' },
];

/**
 * 车位Mock数据（12个，分布在不同区域）
 */
export const parkings: ParkingSpot[] = [
  {
    id: 'p001',
    ownerId: 'o001',
    title: '国贸CBD地下固定车位',
    address: '北京市朝阳区建国门外大街1号国贸中心地下B2层125号',
    district: '朝阳区',
    lat: 39.9087,
    lng: 116.4605,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800',
    ],
    description: 'CBD核心区地下车位，24小时安保，监控全覆盖，离国贸地铁站仅5分钟步行距离。车位宽敞，适合中大型SUV。',
    facilities: ['监控', '安保', '充电桩', '通风'],
    hourlyRate: 15,
    dailyCap: 120,
    availableSlots: workdayDaytime,
    status: 'approved',
    avgRating: 4.8,
    totalBookings: 156,
    createdAt: '2025-02-01T10:00:00Z',
  },
  {
    id: 'p002',
    ownerId: 'o001',
    title: '望京SOHO地面车位',
    address: '北京市朝阳区望京街道阜通东大街6号望京SOHO T1楼下',
    district: '朝阳区',
    lat: 39.9968,
    lng: 116.4778,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800',
    ],
    description: '望京商圈核心位置，地面车位，出入方便。周边商业配套齐全，吃饭购物便利。',
    facilities: ['监控', '遮阳'],
    hourlyRate: 10,
    dailyCap: 80,
    availableSlots: allDayWeekdays,
    status: 'approved',
    avgRating: 4.5,
    totalBookings: 89,
    createdAt: '2025-02-20T14:30:00Z',
  },
  {
    id: 'p003',
    ownerId: 'o002',
    title: '陆家嘴金融中心地下车位',
    address: '上海市浦东新区世纪大道100号环球金融中心B3层088号',
    district: '浦东新区',
    lat: 31.2353,
    lng: 121.5058,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800',
    ],
    description: '上海金融区黄金地段，地下三层智能车位，车牌自动识别，充电桩齐全。周边写字楼林立，商务出行首选。',
    facilities: ['监控', '安保', '充电桩', '智能识别', '无障碍'],
    hourlyRate: 20,
    dailyCap: 180,
    availableSlots: workdayDaytime,
    status: 'approved',
    avgRating: 4.9,
    totalBookings: 234,
    createdAt: '2025-02-15T09:00:00Z',
  },
  {
    id: 'p004',
    ownerId: 'o002',
    title: '张江科技园小区车位',
    address: '上海市浦东新区张江高科技园区碧波路888号小区15号车位',
    district: '浦东新区',
    lat: 31.2059,
    lng: 121.5908,
    images: [
      'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=800',
    ],
    description: '张江核心区小区内车位，安静安全，适合长期租用。距离张江地铁站步行10分钟。',
    facilities: ['监控', '遮阳'],
    hourlyRate: 6,
    dailyCap: 50,
    availableSlots: eveningAndWeekend,
    status: 'approved',
    avgRating: 4.3,
    totalBookings: 67,
    createdAt: '2025-03-05T16:00:00Z',
  },
  {
    id: 'p005',
    ownerId: 'o003',
    title: '天河城购物中心旁车位',
    address: '广州市天河区天河路208号天河城西塔地下停车场B2-156',
    district: '天河区',
    lat: 23.1317,
    lng: 113.3239,
    images: [
      'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800',
      'https://images.unsplash.com/photo-1587019158091-1a4f1d5e8d7b?w=800',
    ],
    description: '广州最繁华商圈，购物娱乐零距离。地下二层恒温车库，配备洗车服务。周末紧张，建议提前预订。',
    facilities: ['监控', '安保', '充电桩', '洗车服务', '通风'],
    hourlyRate: 12,
    dailyCap: 100,
    availableSlots: allDayWeekdays,
    status: 'approved',
    avgRating: 4.6,
    totalBookings: 312,
    createdAt: '2025-03-10T11:00:00Z',
  },
  {
    id: 'p006',
    ownerId: 'o003',
    title: '珠江新城高层住宅车位',
    address: '广州市天河区珠江新城冼村路11号保利心语花园地下A023',
    district: '天河区',
    lat: 23.1187,
    lng: 113.3231,
    images: [
      'https://images.unsplash.com/photo-1545223791-7118877cd556?w=800',
    ],
    description: '珠江新城高端住宅区内车位，环境优美安静，24小时保安巡逻。适合在附近上班的白领长期租用。',
    facilities: ['监控', '安保', '充电桩'],
    hourlyRate: 8,
    dailyCap: 60,
    availableSlots: eveningAndWeekend,
    status: 'approved',
    avgRating: 4.4,
    totalBookings: 78,
    createdAt: '2025-03-20T15:00:00Z',
  },
  {
    id: 'p007',
    ownerId: 'o004',
    title: '西湖景区附近小区车位',
    address: '杭州市西湖区文三路478号华星时代广场地下B1-089',
    district: '西湖区',
    lat: 30.2741,
    lng: 120.1551,
    images: [
      'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=800',
      'https://images.unsplash.com/photo-1597328286624-3403cf27c618?w=800',
    ],
    description: '距离西湖景区仅1.5公里，来杭旅游首选。周边配套齐全，吃饭购物方便。车位宽敞，新手友好。',
    facilities: ['监控', '充电桩', '无障碍'],
    hourlyRate: 10,
    dailyCap: 80,
    availableSlots: allDayWeekdays,
    status: 'approved',
    avgRating: 4.7,
    totalBookings: 198,
    createdAt: '2025-04-01T08:30:00Z',
  },
  {
    id: 'p008',
    ownerId: 'o004',
    title: '杭州未来科技城写字楼车位',
    address: '杭州市余杭区文一西路969号阿里巴巴西溪园区旁地下车位',
    district: '余杭区',
    lat: 30.2808,
    lng: 120.0073,
    images: [
      'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800',
    ],
    description: '未来科技城核心区域，毗邻阿里园区。周边互联网公司众多，车位紧张，此车位工作日全天开放。',
    facilities: ['监控', '安保', '充电桩', '通风'],
    hourlyRate: 8,
    dailyCap: 64,
    availableSlots: workdayDaytime,
    status: 'approved',
    avgRating: 4.2,
    totalBookings: 145,
    createdAt: '2025-04-10T13:00:00Z',
  },
  {
    id: 'p009',
    ownerId: 'o001',
    title: '三里屯太古里共享车位',
    address: '北京市朝阳区三里屯路19号太古里北区地下B2-201',
    district: '朝阳区',
    lat: 39.9377,
    lng: 116.4551,
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
    ],
    description: '潮流圣地三里屯核心地段，逛街购物绝佳选择。紧邻地铁10号线团结湖站。',
    facilities: ['监控', '安保', '充电桩', '洗车服务'],
    hourlyRate: 18,
    dailyCap: 150,
    availableSlots: allDayWeekdays,
    status: 'approved',
    avgRating: 4.6,
    totalBookings: 267,
    createdAt: '2025-04-25T10:30:00Z',
  },
  {
    id: 'p010',
    ownerId: 'o002',
    title: '静安寺商务楼地下车位',
    address: '上海市静安区南京西路1788号国际中心B2层112号',
    district: '静安区',
    lat: 31.2236,
    lng: 121.4452,
    images: [
      'https://images.unsplash.com/photo-1499940939972-696c982e0655?w=800',
    ],
    description: '静安寺商圈，久光百货、芮欧百货近在咫尺。地铁2号线、7号线静安寺站直达。',
    facilities: ['监控', '安保', '充电桩', '智能识别'],
    hourlyRate: 18,
    dailyCap: 160,
    availableSlots: workdayDaytime,
    status: 'pending',
    avgRating: 0,
    totalBookings: 0,
    createdAt: '2025-06-15T09:00:00Z',
  },
  {
    id: 'p011',
    ownerId: 'o003',
    title: '深圳南山科技园车位',
    address: '深圳市南山区科苑南路3099号中国储能大厦地下B3-056',
    district: '南山区',
    lat: 22.5431,
    lng: 113.9501,
    images: [
      'https://images.unsplash.com/photo-1583417268892-f4600fe34041?w=800',
    ],
    description: '深圳科技园核心区，腾讯、百度、阿里等大厂环绕。商务通勤首选，充电桩齐全。',
    facilities: ['监控', '安保', '充电桩', '通风'],
    hourlyRate: 15,
    dailyCap: 120,
    availableSlots: workdayDaytime,
    status: 'rejected',
    avgRating: 0,
    totalBookings: 0,
    auditReason: '车位产权证明不清晰，请补充上传有效证件',
    createdAt: '2025-06-10T14:00:00Z',
  },
  {
    id: 'p012',
    ownerId: 'o004',
    title: '成都春熙路IFS旁车位',
    address: '成都市锦江区红星路三段1号IFS国际金融中心L4停车场',
    district: '锦江区',
    lat: 30.6571,
    lng: 104.0815,
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    ],
    description: '成都最火商圈，春熙路太古里步行5分钟。来成都旅游必选，美食购物一网打尽。',
    facilities: ['监控', '安保', '充电桩', '洗车服务'],
    hourlyRate: 10,
    dailyCap: 80,
    availableSlots: allDayWeekdays,
    status: 'offline',
    avgRating: 4.5,
    totalBookings: 123,
    auditReason: '业主临时停用，预计7月恢复',
    createdAt: '2025-03-15T16:30:00Z',
  },
];

/**
 * 所有区域列表
 */
export const districts: string[] = [
  ...new Set(parkings.map((p) => p.district)),
];

/**
 * 所有设施标签列表
 */
export const allFacilities: string[] = [
  ...new Set(parkings.flatMap((p) => p.facilities)),
];

/**
 * 根据ID查找车位
 */
export function findParkingById(id: string): ParkingSpot | undefined {
  return parkings.find((p) => p.id === id);
}

/**
 * 根据业主ID查找车位
 */
export function findParkingsByOwner(ownerId: string): ParkingSpot[] {
  return parkings.filter((p) => p.ownerId === ownerId);
}

/**
 * 搜索车位（按区域或关键字）
 */
export function searchParkings(keyword: string): ParkingSpot[] {
  const kw = keyword.toLowerCase();
  return parkings.filter(
    (p) =>
      p.status === 'approved' &&
      (p.title.toLowerCase().includes(kw) ||
        p.address.toLowerCase().includes(kw) ||
        p.district.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw))
  );
}

/**
 * 按区域筛选已通过审核的车位
 */
export function filterParkingsByDistrict(district: string): ParkingSpot[] {
  return parkings.filter(
    (p) => p.status === 'approved' && p.district === district
  );
}
