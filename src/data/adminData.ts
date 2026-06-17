import type {
  ViolationRecord,
  Dispute,
  WithdrawalRecord,
  DashboardStats,
} from '../types';

/**
 * 违规记录Mock数据
 */
export const violationRecords: ViolationRecord[] = [
  {
    id: 'v001',
    userId: 'd004',
    type: 'overstay',
    description: '订单号o20250602001超时2小时10分钟，此前已有两次超时记录，累计超时超5小时。',
    evidence: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    ],
    penalty: 'suspend',
    suspendDays: 7,
    createdAt: '2025-06-03T10:00:00Z',
  },
  {
    id: 'v002',
    userId: 'd004',
    type: 'overstay',
    description: '订单号o20250530001超时2小时20分钟，未按预约时间离场。',
    evidence: [],
    penalty: 'warning',
    createdAt: '2025-05-31T09:30:00Z',
  },
  {
    id: 'v003',
    userId: 'o002',
    type: 'fake_listing',
    description: '发布的车位信息与实际不符，宣传有充电桩但现场未配备，遭到多位用户投诉。',
    evidence: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600',
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600',
    ],
    penalty: 'warning',
    createdAt: '2025-05-20T14:00:00Z',
  },
  {
    id: 'v004',
    userId: 'd002',
    type: 'payment_default',
    description: '订单号o20250515008超时费用35元逾期15天未支付，经多次催缴仍未处理。',
    evidence: [],
    penalty: 'suspend',
    suspendDays: 14,
    createdAt: '2025-06-05T11:00:00Z',
  },
  {
    id: 'v005',
    userId: 'd001',
    type: 'abuse',
    description: '多次恶意取消订单（近30天取消23次），占用资源影响其他用户正常使用，经警告无效。',
    evidence: [],
    penalty: 'ban',
    createdAt: '2025-06-10T16:00:00Z',
  },
  {
    id: 'v006',
    userId: 'o003',
    type: 'fake_listing',
    description: '车位p011产权证明造假，提交的材料与不动产登记信息不一致。',
    evidence: [
      'https://images.unsplash.com/photo-1583417268892-f4600fe34041?w=600',
    ],
    penalty: 'suspend',
    suspendDays: 30,
    createdAt: '2025-06-12T08:30:00Z',
  },
  {
    id: 'v007',
    userId: 'd003',
    type: 'overstay',
    description: '订单号o20250601003超时1小时30分钟，首次超时给予警告。',
    evidence: [],
    penalty: 'warning',
    createdAt: '2025-06-15T13:00:00Z',
  },
];

/**
 * 纠纷工单Mock数据
 */
export const disputes: Dispute[] = [
  {
    id: 'disp001',
    orderId: 'o20250530001',
    complainantId: 'd001',
    respondentId: 'o003',
    type: 'overcharge',
    description: '实际离开时间是21:50，但系统显示23:30离场，多收了2小时超时费用。有支付记录截图和停车场监控为证。',
    evidences: [
      'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=600',
      'https://images.unsplash.com/photo-1587019158091-1a4f1d5e8d7b?w=600',
    ],
    status: 'processing',
    createdAt: '2025-05-31T08:00:00Z',
  },
  {
    id: 'disp002',
    orderId: 'o20250528002',
    complainantId: 'd002',
    respondentId: 'o001',
    type: 'quality',
    description: '预订时页面显示车位有遮阳棚，但实际到场发现地面车位完全暴露在阳光下，夏天车内温度过高。要求退款50%。',
    evidences: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600',
    ],
    status: 'resolved',
    result: '已与业主沟通，业主同意退还30元作为补偿，已完成退款。同时更新了车位信息，去掉了遮阳棚描述。',
    createdAt: '2025-05-29T11:00:00Z',
  },
  {
    id: 'disp003',
    orderId: 'o20250529002',
    complainantId: 'o002',
    respondentId: 'd004',
    type: 'other',
    description: '用户停车时不慎刮蹭到车位旁柱子，造成约500元维修费用，要求用户赔偿。',
    evidences: [
      'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=600',
      'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=600',
    ],
    status: 'open',
    createdAt: '2025-06-01T09:00:00Z',
  },
  {
    id: 'disp004',
    orderId: 'o20250531001',
    complainantId: 'd003',
    respondentId: 'o004',
    type: 'refund',
    description: '因临时行程改变，在预约前6小时申请取消订单，根据平台政策应全额退款，但至今未收到退款。',
    evidences: [
      'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=600',
    ],
    status: 'resolved',
    result: '经核实，取消操作符合退款政策，已全额退款80元，到账时间约1-3个工作日。',
    createdAt: '2025-06-01T15:00:00Z',
  },
  {
    id: 'disp005',
    orderId: 'o20250605001',
    complainantId: 'o003',
    respondentId: 'd003',
    type: 'quality',
    description: '用户使用后在车内留下大量垃圾，还将饮料洒在车位地面上，增加了清洁难度和成本。',
    evidences: [],
    status: 'closed',
    result: '对用户进行警告处理，暂不涉及经济赔偿。如再发生类似情况将考虑封禁账号。',
    createdAt: '2025-06-06T10:30:00Z',
  },
  {
    id: 'disp006',
    orderId: 'o20250606001',
    complainantId: 'd004',
    respondentId: 'o004',
    type: 'overcharge',
    description: '超时15分钟被收了8元，认为超时1小时内应按1小时半价收费，而不是全价。',
    evidences: [],
    status: 'open',
    createdAt: '2025-06-07T14:00:00Z',
  },
];

/**
 * 提现记录Mock数据
 */
export const withdrawalRecords: WithdrawalRecord[] = [
  {
    id: 'w001',
    ownerId: 'o001',
    amount: 2680.5,
    bankName: '中国工商银行',
    bankAccount: '**** **** **** 1234',
    status: 'completed',
    period: 'weekly',
    startDate: '2025-05-19',
    endDate: '2025-05-25',
    processedAt: '2025-05-28T10:00:00Z',
    createdAt: '2025-05-26T09:00:00Z',
  },
  {
    id: 'w002',
    ownerId: 'o002',
    amount: 3420.0,
    bankName: '中国建设银行',
    bankAccount: '**** **** **** 2345',
    status: 'completed',
    period: 'weekly',
    startDate: '2025-05-19',
    endDate: '2025-05-25',
    processedAt: '2025-05-28T10:15:00Z',
    createdAt: '2025-05-26T10:00:00Z',
  },
  {
    id: 'w003',
    ownerId: 'o003',
    amount: 1856.8,
    bankName: '中国农业银行',
    bankAccount: '**** **** **** 3456',
    status: 'completed',
    period: 'weekly',
    startDate: '2025-05-19',
    endDate: '2025-05-25',
    processedAt: '2025-05-28T10:30:00Z',
    createdAt: '2025-05-26T11:00:00Z',
  },
  {
    id: 'w004',
    ownerId: 'o004',
    amount: 2100.0,
    bankName: '招商银行',
    bankAccount: '**** **** **** 4567',
    status: 'completed',
    period: 'weekly',
    startDate: '2025-05-19',
    endDate: '2025-05-25',
    processedAt: '2025-05-28T10:45:00Z',
    createdAt: '2025-05-26T12:00:00Z',
  },
  {
    id: 'w005',
    ownerId: 'o001',
    amount: 3250.0,
    bankName: '中国工商银行',
    bankAccount: '**** **** **** 1234',
    status: 'completed',
    period: 'weekly',
    startDate: '2025-05-26',
    endDate: '2025-06-01',
    processedAt: '2025-06-04T10:00:00Z',
    createdAt: '2025-06-02T09:00:00Z',
  },
  {
    id: 'w006',
    ownerId: 'o002',
    amount: 4100.5,
    bankName: '中国建设银行',
    bankAccount: '**** **** **** 2345',
    status: 'approved',
    period: 'weekly',
    startDate: '2025-05-26',
    endDate: '2025-06-01',
    createdAt: '2025-06-02T10:00:00Z',
  },
  {
    id: 'w007',
    ownerId: 'o003',
    amount: 2380.0,
    bankName: '中国农业银行',
    bankAccount: '**** **** **** 3456',
    status: 'pending',
    period: 'weekly',
    startDate: '2025-05-26',
    endDate: '2025-06-01',
    createdAt: '2025-06-02T11:00:00Z',
  },
  {
    id: 'w008',
    ownerId: 'o004',
    amount: 2760.0,
    bankName: '招商银行',
    bankAccount: '**** **** **** 4567',
    status: 'rejected',
    period: 'weekly',
    startDate: '2025-05-26',
    endDate: '2025-06-01',
    rejectReason: '银行卡信息有误，请核对后重新申请提现',
    createdAt: '2025-06-02T12:00:00Z',
  },
  {
    id: 'w009',
    ownerId: 'o001',
    amount: 9800.0,
    bankName: '中国工商银行',
    bankAccount: '**** **** **** 1234',
    status: 'completed',
    period: 'monthly',
    startDate: '2025-05-01',
    endDate: '2025-05-31',
    processedAt: '2025-06-05T14:00:00Z',
    createdAt: '2025-06-03T09:30:00Z',
  },
  {
    id: 'w010',
    ownerId: 'o002',
    amount: 12560.0,
    bankName: '中国建设银行',
    bankAccount: '**** **** **** 2345',
    status: 'pending',
    period: 'monthly',
    startDate: '2025-05-01',
    endDate: '2025-05-31',
    createdAt: '2025-06-03T10:30:00Z',
  },
  {
    id: 'w011',
    ownerId: 'o003',
    amount: 7650.0,
    bankName: '中国农业银行',
    bankAccount: '**** **** **** 3456',
    status: 'approved',
    period: 'monthly',
    startDate: '2025-05-01',
    endDate: '2025-05-31',
    createdAt: '2025-06-03T11:00:00Z',
  },
  {
    id: 'w012',
    ownerId: 'o001',
    amount: 1580.0,
    bankName: '中国工商银行',
    bankAccount: '**** **** **** 1234',
    status: 'pending',
    period: 'weekly',
    startDate: '2025-06-09',
    endDate: '2025-06-15',
    createdAt: '2025-06-16T09:00:00Z',
  },
  {
    id: 'w013',
    ownerId: 'o002',
    amount: 1950.0,
    bankName: '中国建设银行',
    bankAccount: '**** **** **** 2345',
    status: 'pending',
    period: 'weekly',
    startDate: '2025-06-09',
    endDate: '2025-06-15',
    createdAt: '2025-06-16T10:00:00Z',
  },
  {
    id: 'w014',
    ownerId: 'o004',
    amount: 2280.0,
    bankName: '招商银行',
    bankAccount: '**** **** **** 4567',
    status: 'pending',
    period: 'weekly',
    startDate: '2025-06-09',
    endDate: '2025-06-15',
    createdAt: '2025-06-16T11:00:00Z',
  },
];

/**
 * 管理后台数据统计概览
 */
export const dashboardStats: DashboardStats = {
  totalUsers: 12,
  totalOwners: 5,
  totalDrivers: 5,
  totalParkings: 12,
  approvedParkings: 9,
  pendingParkings: 1,
  totalOrders: 20,
  todayOrders: 3,
  totalRevenue: 45680.5,
  monthlyRevenue: 18750.8,
  openDisputes: 3,
  pendingWithdrawals: 5,
};

/**
 * 按用户ID查询违规记录
 */
export function findViolationsByUser(userId: string): ViolationRecord[] {
  return violationRecords
    .filter((v) => v.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 按订单ID查询纠纷工单
 */
export function findDisputesByOrder(orderId: string): Dispute[] {
  return disputes.filter((d) => d.orderId === orderId);
}

/**
 * 按状态筛选纠纷工单
 */
export function filterDisputesByStatus(status: Dispute['status']): Dispute[] {
  return disputes
    .filter((d) => d.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 按业主ID查询提现记录
 */
export function findWithdrawalsByOwner(ownerId: string): WithdrawalRecord[] {
  return withdrawalRecords
    .filter((w) => w.ownerId === ownerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 按状态筛选提现记录
 */
export function filterWithdrawalsByStatus(status: WithdrawalRecord['status']): WithdrawalRecord[] {
  return withdrawalRecords
    .filter((w) => w.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 获取违规类型中文描述
 */
export function getViolationTypeText(type: ViolationRecord['type']): string {
  const typeMap: Record<ViolationRecord['type'], string> = {
    fake_listing: '虚假发布',
    overstay: '超时停车',
    payment_default: '拖欠费用',
    abuse: '恶意行为',
  };
  return typeMap[type];
}

/**
 * 获取处罚类型中文描述
 */
export function getPenaltyText(penalty: ViolationRecord['penalty'], days?: number): string {
  const penaltyMap: Record<ViolationRecord['penalty'], string> = {
    warning: '警告',
    suspend: `暂停使用${days || 0}天`,
    ban: '永久封禁',
  };
  return penaltyMap[penalty];
}

/**
 * 获取纠纷类型中文描述
 */
export function getDisputeTypeText(type: Dispute['type']): string {
  const typeMap: Record<Dispute['type'], string> = {
    quality: '车位质量问题',
    refund: '退款申请',
    overcharge: '多收费争议',
    other: '其他问题',
  };
  return typeMap[type];
}

/**
 * 获取纠纷状态中文描述
 */
export function getDisputeStatusText(status: Dispute['status']): string {
  const statusMap: Record<Dispute['status'], string> = {
    open: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  };
  return statusMap[status];
}

/**
 * 获取提现状态中文描述
 */
export function getWithdrawalStatusText(status: WithdrawalRecord['status']): string {
  const statusMap: Record<WithdrawalRecord['status'], string> = {
    pending: '待审核',
    approved: '审核通过',
    rejected: '审核拒绝',
    completed: '已打款',
  };
  return statusMap[status];
}

/**
 * 获取结算周期中文描述
 */
export function getPeriodText(period: WithdrawalRecord['period']): string {
  return period === 'weekly' ? '周结' : '月结';
}
