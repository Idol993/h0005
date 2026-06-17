/**
 * 用户角色枚举
 * driver: 驾驶员（租车位）
 * owner: 业主（出租车位）
 * admin: 管理员
 */
export enum UserRole {
  DRIVER = 'driver',
  OWNER = 'owner',
  ADMIN = 'admin',
}

/**
 * 银行卡信息接口
 */
export interface BankInfo {
  /** 持卡人姓名 */
  bankHolder: string;
  /** 开户银行 */
  bankName: string;
  /** 银行卡号 */
  bankAccount: string;
  /** 开户行支行 */
  bankBranch: string;
}

/**
 * 用户接口
 */
export interface User {
  /** 用户唯一标识 */
  id: string;
  /** 手机号 */
  phone: string;
  /** 昵称 */
  nickname: string;
  /** 头像URL */
  avatar: string;
  /** 用户角色 */
  role: UserRole;
  /** 真实姓名（实名后才有） */
  realName?: string;
  /** 身份证号（实名后才有） */
  idCard?: string;
  /** 是否已实名认证 */
  verified: boolean;
  /** 违规次数 */
  violations: number;
  /** 是否被封禁 */
  banned: boolean;
  /** 账号创建时间 */
  createdAt: string;
  /** 银行卡信息（业主才有） */
  bankInfo?: BankInfo;
}

/**
 * 时间段接口
 * 用于表示车位可用的时间范围
 */
export interface TimeSlot {
  /** 星期几（0=周日，1=周一，...，6=周六） */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** 开始时间，格式 HH:mm */
  startTime: string;
  /** 结束时间，格式 HH:mm */
  endTime: string;
}

/**
 * 车位审核状态枚举
 */
export type ParkingStatus = 'pending' | 'approved' | 'rejected' | 'offline';

/**
 * 车位接口
 */
export interface ParkingSpot {
  /** 车位唯一标识 */
  id: string;
  /** 业主ID */
  ownerId: string;
  /** 车位标题 */
  title: string;
  /** 详细地址 */
  address: string;
  /** 所属区域（行政区） */
  district: string;
  /** 纬度 */
  lat: number;
  /** 经度 */
  lng: number;
  /** 车位图片URL数组 */
  images: string[];
  /** 车位描述 */
  description: string;
  /** 设施标签，如：充电桩、监控、遮阳、无障碍等 */
  facilities: string[];
  /** 小时单价（元） */
  hourlyRate: number;
  /** 每日封顶金额（元），0表示不封顶 */
  dailyCap: number;
  /** 可预约的时间段 */
  availableSlots: TimeSlot[];
  /** 审核状态 */
  status: ParkingStatus;
  /** 平均评分（0-5分） */
  avgRating: number;
  /** 累计预订次数 */
  totalBookings: number;
  /** 审核拒绝/下架原因 */
  auditReason?: string;
  /** 发布时间 */
  createdAt: string;
}

/**
 * 订单状态枚举
 * pending: 待支付
 * paid: 已支付未入场
 * active: 使用中
 * completed: 已完成
 * cancelled: 已取消
 * disputed: 有纠纷
 */
export type OrderStatus = 'pending' | 'paid' | 'active' | 'completed' | 'cancelled' | 'disputed' | 'refunded';

/**
 * 支付方式
 */
export type PaymentMethod = 'wechat' | 'alipay' | 'card';

/**
 * 订单接口
 */
export interface Order {
  /** 订单唯一标识 */
  id: string;
  /** 车位ID */
  parkingId: string;
  /** 车位标题（冗余字段，便于展示） */
  parkingTitle: string;
  /** 业主ID */
  ownerId: string;
  /** 驾驶员ID */
  driverId: string;
  /** 预约开始时间 */
  scheduledStart: string;
  /** 预约结束时间 */
  scheduledEnd: string;
  /** 实际入场时间 */
  actualStart?: string;
  /** 实际出场时间 */
  actualEnd?: string;
  /** 预约时长（小时） */
  scheduledHours: number;
  /** 实际时长（小时） */
  actualHours?: number;
  /** 超时时长（小时） */
  overtimeHours?: number;
  /** 基础金额（预约时段费用） */
  baseAmount: number;
  /** 超时费用 */
  overtimeAmount: number;
  /** 订单总金额 = baseAmount + overtimeAmount */
  totalAmount: number;
  /** 预授权冻结金额 */
  preAuthAmount: number;
  /** 6位入场验证码 */
  entryCode: string;
  /** 订单状态 */
  status: OrderStatus;
  /** 支付方式 */
  paymentMethod: PaymentMethod;
  /** 支付时间 */
  paymentTime?: string;
  /** 纠纷原因 */
  disputeReason?: string;
  /** 用户评分（1-5分），完成订单后可评价 */
  rating?: number;
  /** 用户评价文字 */
  review?: string;
  /** 订单创建时间 */
  createdAt: string;
}

/**
 * 违规类型枚举
 * fake_listing: 虚假发布
 * overstay: 超时停车
 * payment_default: 拖欠费用
 * abuse: 恶意行为/滥用
 */
export type ViolationType = 'fake_listing' | 'overstay' | 'payment_default' | 'abuse';

/**
 * 处罚类型枚举
 * warning: 警告
 * suspend: 暂停使用（天数）
 * ban: 永久封禁
 */
export type PenaltyType = 'warning' | 'suspend' | 'ban';

/**
 * 违规记录接口
 */
export interface ViolationRecord {
  /** 记录唯一标识 */
  id: string;
  /** 违规用户ID */
  userId: string;
  /** 违规类型 */
  type: ViolationType;
  /** 违规描述 */
  description: string;
  /** 证据图片/文件URL数组 */
  evidence: string[];
  /** 处罚类型 */
  penalty: PenaltyType;
  /** 处罚时长（天），仅suspend时有值 */
  suspendDays?: number;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 纠纷类型枚举
 * quality: 车位与描述不符
 * refund: 退款申请
 * overcharge: 多收费
 * other: 其他
 */
export type DisputeType = 'quality' | 'refund' | 'overcharge' | 'other';

/**
 * 纠纷状态枚举
 * open: 待处理
 * processing: 处理中
 * resolved: 已解决
 * closed: 已关闭
 */
export type DisputeStatus = 'open' | 'processing' | 'resolved' | 'closed';

/**
 * 纠纷工单接口
 */
export interface Dispute {
  /** 工单唯一标识 */
  id: string;
  /** 关联订单ID */
  orderId: string;
  /** 申诉人ID */
  complainantId: string;
  /** 被申诉人ID */
  respondentId: string;
  /** 纠纷类型 */
  type: DisputeType;
  /** 纠纷描述 */
  description: string;
  /** 证据图片/文件URL数组 */
  evidences: string[];
  /** 当前状态 */
  status: DisputeStatus;
  /** 处理结果说明 */
  result?: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 提现状态枚举
 * pending: 待审核
 * approved: 审核通过待打款
 * rejected: 审核拒绝
 * completed: 已完成
 */
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed';

/**
 * 结算周期类型
 * weekly: 周结
 * monthly: 月结
 */
export type SettlementPeriod = 'weekly' | 'monthly';

/**
 * 提现记录接口
 */
export interface WithdrawalRecord {
  /** 记录唯一标识 */
  id: string;
  /** 业主ID */
  ownerId: string;
  /** 提现金额（元） */
  amount: number;
  /** 开户银行 */
  bankName: string;
  /** 银行卡号（脱敏展示） */
  bankAccount: string;
  /** 审核状态 */
  status: WithdrawalStatus;
  /** 结算周期 */
  period: SettlementPeriod;
  /** 结算周期开始日期 */
  startDate: string;
  /** 结算周期结束日期 */
  endDate: string;
  /** 处理/打款时间 */
  processedAt?: string;
  /** 拒绝原因，仅rejected时有值 */
  rejectReason?: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 数据统计概览接口
 */
export interface DashboardStats {
  /** 累计用户总数 */
  totalUsers: number;
  /** 累计车主数 */
  totalOwners: number;
  /** 累计驾驶员数 */
  totalDrivers: number;
  /** 车位总数 */
  totalParkings: number;
  /** 已审核通过车位 */
  approvedParkings: number;
  /** 待审核车位 */
  pendingParkings: number;
  /** 订单总数 */
  totalOrders: number;
  /** 今日订单数 */
  todayOrders: number;
  /** 累计交易金额（元） */
  totalRevenue: number;
  /** 本月交易金额（元） */
  monthlyRevenue: number;
  /** 待处理纠纷数 */
  openDisputes: number;
  /** 待审核提现数 */
  pendingWithdrawals: number;
}
