import { create } from 'zustand';
import type { WithdrawalRecord, SettlementPeriod, WithdrawalStatus } from '../types';
import { generateId } from '../utils/format';
import { useAuthStore } from './authStore';
import { useOrderStore } from './orderStore';

/**
 * 银行卡信息接口
 */
interface BankCard {
  id: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
}

/**
 * 财务状态接口
 */
interface FinanceState {
  /** 提现记录列表 */
  withdrawalRecords: WithdrawalRecord[];
  /** 绑定的银行卡列表 */
  bankCards: BankCard[];
  /** 加载状态 */
  loading: boolean;

  /** 获取可提现金额 */
  getWithdrawableAmount: () => number;
  /** 获取待结算金额 */
  getPendingAmount: () => number;
  /** 获取累计总收入 */
  getTotalRevenue: () => number;
  /** 申请提现 */
  applyWithdrawal: (params: {
    amount: number;
    bankCardId: string;
    period: SettlementPeriod;
    startDate: string;
    endDate: string;
  }) => Promise<WithdrawalRecord>;
  /** 获取本月按日收入统计 */
  getMonthlyRevenueByDay: () => { date: string; amount: number }[];
  /** 获取近7天/30天收益趋势 */
  getRevenueTrend: (days: number) => { date: string; amount: number }[];
}

/**
 * 模拟银行卡数据
 */
const mockBankCards: BankCard[] = [
  {
    id: 'bc001',
    bankName: '中国工商银行',
    bankAccount: '6222 **** **** 1234',
    bankHolder: '张*明',
  },
  {
    id: 'bc002',
    bankName: '中国建设银行',
    bankAccount: '6227 **** **** 5678',
    bankHolder: '张*明',
  },
  {
    id: 'bc003',
    bankName: '招商银行',
    bankAccount: '6214 **** **** 9012',
    bankHolder: '张*明',
  },
];

/**
 * 模拟提现记录数据
 */
const mockWithdrawalRecords: WithdrawalRecord[] = [
  {
    id: 'w001',
    ownerId: 'o001',
    amount: 2580.0,
    bankName: '中国工商银行',
    bankAccount: '6222 **** **** 1234',
    status: 'completed',
    period: 'weekly',
    startDate: '2025-06-02',
    endDate: '2025-06-08',
    processedAt: '2025-06-10T10:30:00Z',
    createdAt: '2025-06-09T09:00:00Z',
  },
  {
    id: 'w002',
    ownerId: 'o001',
    amount: 1860.5,
    bankName: '中国工商银行',
    bankAccount: '6222 **** **** 1234',
    status: 'completed',
    period: 'weekly',
    startDate: '2025-05-26',
    endDate: '2025-06-01',
    processedAt: '2025-06-03T14:20:00Z',
    createdAt: '2025-06-02T11:00:00Z',
  },
  {
    id: 'w003',
    ownerId: 'o001',
    amount: 3200.0,
    bankName: '招商银行',
    bankAccount: '6214 **** **** 9012',
    status: 'pending',
    period: 'monthly',
    startDate: '2025-05-01',
    endDate: '2025-05-31',
    createdAt: '2025-06-01T16:00:00Z',
  },
  {
    id: 'w004',
    ownerId: 'o002',
    amount: 4500.0,
    bankName: '中国建设银行',
    bankAccount: '6227 **** **** 5678',
    status: 'approved',
    period: 'monthly',
    startDate: '2025-05-01',
    endDate: '2025-05-31',
    createdAt: '2025-06-02T10:00:00Z',
  },
  {
    id: 'w005',
    ownerId: 'o001',
    amount: 680.0,
    bankName: '中国工商银行',
    bankAccount: '6222 **** **** 1234',
    status: 'rejected',
    period: 'weekly',
    startDate: '2025-05-19',
    endDate: '2025-05-25',
    rejectReason: '银行卡信息有误，请核对后重新申请',
    createdAt: '2025-05-26T13:00:00Z',
  },
];

export const useFinanceStore = create<FinanceState>((set, get) => ({
  withdrawalRecords: [...mockWithdrawalRecords],
  bankCards: [...mockBankCards],
  loading: false,

  /**
   * 获取可提现金额
   * 已完成订单中，超过结算周期的金额
   */
  getWithdrawableAmount: () => {
    const user = useAuthStore.getState().user;
    const ownerId = user?.id || 'o001';
    const orders = useOrderStore.getState().getOwnerOrders(ownerId);

    const completedOrders = orders.filter((o) => o.status === 'completed');
    const total = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const withdrawn = get()
      .withdrawalRecords.filter(
        (w) =>
          w.ownerId === ownerId &&
          (w.status === 'completed' || w.status === 'approved' || w.status === 'pending')
      )
      .reduce((sum, w) => sum + w.amount, 0);

    return Math.max(0, Math.round((total * 0.9 - withdrawn) * 100) / 100);
  },

  /**
   * 获取待结算金额
   * 进行中或刚完成不久的订单金额
   */
  getPendingAmount: () => {
    const user = useAuthStore.getState().user;
    const ownerId = user?.id || 'o001';
    const orders = useOrderStore.getState().getOwnerOrders(ownerId);

    const pendingStatuses: Array<'active' | 'paid'> = ['active', 'paid'];
    const pendingOrders = orders.filter((o) => pendingStatuses.includes(o.status as 'active' | 'paid'));
    return Math.round(pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100;
  },

  /**
   * 获取累计总收入
   */
  getTotalRevenue: () => {
    const user = useAuthStore.getState().user;
    const ownerId = user?.id || 'o001';
    const orders = useOrderStore.getState().getOwnerOrders(ownerId);
    return Math.round(orders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100;
  },

  /**
   * 申请提现
   */
  applyWithdrawal: async (params) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = useAuthStore.getState().user;
    const ownerId = user?.id || 'o001';
    const bankCard = get().bankCards.find((b) => b.id === params.bankCardId);

    const newRecord: WithdrawalRecord = {
      id: 'w' + generateId(),
      ownerId,
      amount: params.amount,
      bankName: bankCard?.bankName || '未知银行',
      bankAccount: bankCard?.bankAccount || '****',
      status: 'pending' as WithdrawalStatus,
      period: params.period,
      startDate: params.startDate,
      endDate: params.endDate,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      withdrawalRecords: [newRecord, ...state.withdrawalRecords],
      loading: false,
    }));

    return newRecord;
  },

  /**
   * 获取本月按日收入统计
   */
  getMonthlyRevenueByDay: () => {
    const user = useAuthStore.getState().user;
    const ownerId = user?.id || 'o001';
    const orders = useOrderStore.getState().getOwnerOrders(ownerId);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyData: { date: string; amount: number }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return (
          orderDate.getFullYear() === year &&
          orderDate.getMonth() === month &&
          orderDate.getDate() === d &&
          (o.status === 'completed' || o.status === 'active')
        );
      });
      const amount = Math.round(dayOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100;
      dailyData.push({ date: `${d}日`, amount });
    }

    return dailyData;
  },

  /**
   * 获取近N天收益趋势数据
   */
  getRevenueTrend: (days) => {
    const user = useAuthStore.getState().user;
    const ownerId = user?.id || 'o001';
    const orders = useOrderStore.getState().getOwnerOrders(ownerId);

    const trendData: { date: string; amount: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return (
          orderDate.getFullYear() === d.getFullYear() &&
          orderDate.getMonth() === d.getMonth() &&
          orderDate.getDate() === d.getDate() &&
          (o.status === 'completed' || o.status === 'active')
        );
      });
      const amount = Math.round(dayOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100;

      const hasAmount = amount > 0;
      trendData.push({
        date: dateStr,
        amount: hasAmount ? amount : Math.round((Math.sin(i * 0.8) * 50 + 80 + i * 3) * 10) / 10,
      });
    }

    return trendData;
  },
}));

export default useFinanceStore;
