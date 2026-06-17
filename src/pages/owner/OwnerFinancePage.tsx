import { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  Clock,
  Trophy,
  Banknote,
  ChevronDown,
  Calendar,
  CreditCard,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  PiggyBank,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useFinanceStore } from '@/store/financeStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { SettlementPeriod, WithdrawalStatus } from '@/types';

/**
 * 收入统计与提现页面
 * 展示收益概览、提现申请、收益图表和提现记录
 */
export default function OwnerFinancePage() {
  const { user } = useAuthStore();
  const {
    bankCards,
    withdrawalRecords,
    loading,
    getWithdrawableAmount,
    getPendingAmount,
    getTotalRevenue,
    getMonthlyRevenueByDay,
    applyWithdrawal,
  } = useFinanceStore();

  const ownerId = user?.id || 'o001';

  /** 结算周期切换 */
  const [period, setPeriod] = useState<SettlementPeriod>('weekly');
  /** 提现金额 */
  const [withdrawAmount, setWithdrawAmount] = useState('');
  /** 选择的银行卡 */
  const [selectedBankId, setSelectedBankId] = useState(bankCards[0]?.id || '');
  /** 银行卡选择下拉展开 */
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  /** 提交成功提示 */
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /** 三个大数字 */
  const withdrawable = useMemo(() => getWithdrawableAmount(), [getWithdrawableAmount]);
  const pending = useMemo(() => getPendingAmount(), [getPendingAmount]);
  const totalRevenue = useMemo(() => getTotalRevenue(), [getTotalRevenue]);

  /** 本月按日收入数据 */
  const monthlyData = useMemo(() => getMonthlyRevenueByDay(), [getMonthlyRevenueByDay]);

  /** 我的提现记录 */
  const myRecords = useMemo(
    () => withdrawalRecords.filter((w) => w.ownerId === ownerId),
    [withdrawalRecords, ownerId]
  );

  /** 结算周期范围计算 */
  const periodRange = useMemo(() => {
    const now = new Date();
    if (period === 'weekly') {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const start = new Date(now);
      start.setDate(now.getDate() + mondayOffset - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        start: formatDate(start),
        end: formatDate(end),
        label: '上周（周一至周日）',
      };
    } else {
      const year = now.getFullYear();
      const month = now.getMonth() - 1;
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return {
        start: formatDate(firstDay),
        end: formatDate(lastDay),
        label: `${month + 1}月整月`,
      };
    }
  }, [period]);

  /** 默认填入可提现金额 */
  useEffect(() => {
    if (!withdrawAmount && withdrawable > 0) {
      setWithdrawAmount(withdrawable.toFixed(2));
    }
  }, [withdrawable, withdrawAmount]);

  /** 选中的银行卡信息 */
  const selectedBank = bankCards.find((b) => b.id === selectedBankId);

  /** 提现金额数字 */
  const amountNum = Number(withdrawAmount) || 0;

  /** 校验是否可提交 */
  const canSubmit =
    amountNum > 0 && amountNum <= withdrawable && !!selectedBankId && !loading;

  /** 预计到账时间 */
  const estimatedArrival = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + (period === 'weekly' ? 2 : 4));
    return formatDate(now);
  }, [period]);

  /** 提交提现申请 */
  const handleSubmit = async () => {
    if (!canSubmit) return;
    await applyWithdrawal({
      amount: amountNum,
      bankCardId: selectedBankId,
      period,
      startDate: periodRange.start,
      endDate: periodRange.end,
    });
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setWithdrawAmount('');
    }, 3000);
  };

  /** 全部提现 */
  const handleWithdrawAll = () => {
    setWithdrawAmount(withdrawable.toFixed(2));
  };

  /** 提现状态徽章 */
  const getWithdrawBadge = (status: WithdrawalStatus) => {
    const map: Record<WithdrawalStatus, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string; icon: typeof CheckCircle2 }> = {
      pending: { variant: 'warning', label: '待审核', icon: AlertTriangle },
      approved: { variant: 'info', label: '待打款', icon: Clock },
      completed: { variant: 'success', label: '已完成', icon: CheckCircle2 },
      rejected: { variant: 'danger', label: '已拒绝', icon: XCircle },
    };
    return map[status];
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <OwnerSidebar />

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 space-y-6">
          {/* ========== 页面标题 ========== */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">财务中心</h1>
            <p className="text-sm text-slate-400 mt-1">
              查看收益统计、申请提现、管理提现记录
            </p>
          </div>

          {/* ========== 收益概览区 ========== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 可提现 */}
            <Card className="relative overflow-hidden !p-6">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">可提现金额</div>
                      <div className="text-xs text-emerald-600/70">已结算可申请</div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    可提现
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold bg-gradient-brand bg-clip-text text-transparent">
                    ¥
                  </span>
                  <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 bg-clip-text text-transparent tabular-nums">
                    {withdrawable.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="text-slate-400">上次提现</span>
                  <span className="font-medium text-slate-600">
                    ¥{myRecords.find((r) => r.status === 'completed')?.amount.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </Card>

            {/* 待结算 */}
            <Card className="relative overflow-hidden !p-6">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">待结算金额</div>
                      <div className="text-xs text-amber-600/70">结算周期内</div>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">
                    结算中
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-amber-500/80">¥</span>
                  <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-accent-600 bg-clip-text text-transparent tabular-nums">
                    {pending.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    预计到账
                  </span>
                  <span className="font-medium text-slate-600">{period === 'weekly' ? '本周内' : '本月底'}</span>
                </div>
              </div>
            </Card>

            {/* 累计总收入 */}
            <Card className="relative overflow-hidden !p-6">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-brand-400/20 to-indigo-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">累计总收入</div>
                      <div className="text-xs text-brand-600/70">历史全部收益</div>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">
                    总计
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold bg-gradient-brand bg-clip-text text-transparent">
                    ¥
                  </span>
                  <span className="text-4xl lg:text-5xl font-bold bg-gradient-brand bg-clip-text text-transparent tabular-nums">
                    {totalRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="text-slate-400">平台服务费</span>
                  <span className="font-medium text-slate-600">10%</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ========== 提现申请表单 ========== */}
            <Card className="lg:col-span-1" header={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-orange-600 flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">申请提现</h3>
                  <p className="text-xs text-slate-400">将可提现金额转入银行卡</p>
                </div>
              </div>
            }>
              {/* 提交成功提示 */}
              {submitSuccess && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-slide-down">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div className="text-sm">
                    <div className="font-semibold text-emerald-800">提现申请已提交！</div>
                    <div className="text-emerald-700/80 text-xs mt-0.5">
                      预计 {estimatedArrival} 前到账
                    </div>
                  </div>
                </div>
              )}

              {/* 结算周期切换 */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  结算周期
                </label>
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                  {(['weekly', 'monthly'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                        period === p
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      {p === 'weekly' ? '周结' : '月结'}
                    </button>
                  ))}
                </div>
                <div className="mt-2 px-3 py-2 rounded-lg bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                  <span>{periodRange.label}</span>
                  <span className="font-medium text-slate-600">
                    {periodRange.start} ~ {periodRange.end}
                  </span>
                </div>
              </div>

              {/* 提现金额 */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    <Banknote className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    提现金额
                  </label>
                  <button
                    onClick={handleWithdrawAll}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    全部提现
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                    ¥
                  </span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={withdrawable}
                    min={0}
                    step={0.01}
                    className="w-full h-16 pl-12 pr-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-3xl font-bold text-slate-800 tabular-nums"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    可提现上限：
                    <span className="font-semibold text-emerald-600">¥{withdrawable.toFixed(2)}</span>
                  </span>
                  {amountNum > withdrawable && (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      超过可提现金额
                    </span>
                  )}
                </div>
              </div>

              {/* 银行卡选择 */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  收款银行卡
                </label>
                <div className="relative">
                  <button
                    onClick={() => setBankDropdownOpen(!bankDropdownOpen)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-brand-300 transition-all flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {selectedBank?.bankName || '请选择银行卡'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {selectedBank?.bankAccount || ''} · {selectedBank?.bankHolder || ''}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-slate-400 shrink-0 transition-transform',
                        bankDropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {bankDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-card-hover z-20 animate-slide-down">
                      {bankCards.map((bank) => (
                        <button
                          key={bank.id}
                          onClick={() => {
                            setSelectedBankId(bank.id);
                            setBankDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-left',
                            selectedBankId === bank.id
                              ? 'bg-brand-50 text-brand-700'
                              : 'hover:bg-slate-50 text-slate-600'
                          )}
                        >
                          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <CreditCard className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{bank.bankName}</div>
                            <div className="text-xs text-slate-400">{bank.bankAccount}</div>
                          </div>
                          {selectedBankId === bank.id && (
                            <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 到账提示 */}
              <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-600">
                  <div className="font-semibold text-slate-700">预计到账时间</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    提现申请提交后，{period === 'weekly' ? '1-2个工作日' : '2-4个工作日'}内完成审核打款。
                    预计最晚 <span className="font-semibold text-brand-600">{estimatedArrival}</span> 前到账。
                  </div>
                </div>
              </div>

              {/* 提交按钮 */}
              <Button
                variant="accent"
                size="lg"
                className="w-full h-14 text-base rounded-2xl"
                loading={loading}
                disabled={!canSubmit}
                onClick={handleSubmit}
                leftIcon={<Send className="w-5 h-5" />}
              >
                确认提现 {amountNum > 0 && formatCurrency(amountNum)}
              </Button>
            </Card>

            {/* ========== 本月收入柱状图 ========== */}
            <Card className="lg:col-span-2" header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">本月收入明细</h3>
                    <p className="text-xs text-slate-400">按日统计每日收入情况</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <PiggyBank className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-500">本月已收入</span>
                  <span className="font-bold text-emerald-600">
                    ¥{monthlyData.reduce((s, d) => s + d.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            }>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e3a5f" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6087ff" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.floor(monthlyData.length / 10)}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `¥${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 8px 32px rgba(30, 58, 95, 0.15)',
                        padding: '12px 16px',
                      }}
                      formatter={(value: number) => [`¥${value.toFixed(2)}`, '收入']}
                      cursor={{ fill: 'rgba(30, 58, 95, 0.05)' }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ========== 提现记录表格 ========== */}
          <Card header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">提现记录</h3>
                  <p className="text-xs text-slate-400">历史提现申请及处理状态</p>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                共 <span className="font-bold text-brand-600">{myRecords.length}</span> 条记录
              </div>
            </div>
          }>
            {myRecords.length === 0 ? (
              <div className="py-12 text-center">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">暂无提现记录</p>
                <p className="text-sm text-slate-400 mt-1">申请提现后，记录会显示在这里</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-3 font-medium">申请时间</th>
                      <th className="px-6 py-3 font-medium">提现金额</th>
                      <th className="px-6 py-3 font-medium">结算周期</th>
                      <th className="px-6 py-3 font-medium">收款账户</th>
                      <th className="px-6 py-3 font-medium">状态</th>
                      <th className="px-6 py-3 font-medium text-right pr-8">处理时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRecords.map((record) => {
                      const badge = getWithdrawBadge(record.status);
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-700">
                              {formatDateTime(record.createdAt)}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {record.id}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-lg font-bold bg-gradient-brand bg-clip-text text-transparent">
                              {formatCurrency(record.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Badge variant={record.period === 'weekly' ? 'info' : 'warning'} size="sm" showIcon={false}>
                                {record.period === 'weekly' ? '周结' : '月结'}
                              </Badge>
                              <div className="text-xs text-slate-400">
                                {record.startDate} ~ {record.endDate}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-700">{record.bankName}</div>
                            <div className="text-xs text-slate-400">{record.bankAccount}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={badge.variant} size="md">
                              {badge.label}
                            </Badge>
                            {record.status === 'rejected' && record.rejectReason && (
                              <div className="text-xs text-red-500 mt-1.5 max-w-xs truncate" title={record.rejectReason}>
                                {record.rejectReason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right pr-8">
                            {record.processedAt ? (
                              <div>
                                <div className="text-sm text-slate-700 font-medium">
                                  {formatDate(record.processedAt)}
                                </div>
                                <div className="text-xs text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  已到账
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400">
                                {record.status === 'rejected' ? '-' : '处理中...'}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
