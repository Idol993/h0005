import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Receipt,
  Wallet,
  PlusCircle,
  Clock,
  Star,
  ArrowRight,
  Calendar,
  FileText,
  Banknote,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useParkingStore } from '@/store/parkingStore';
import { useOrderStore } from '@/store/orderStore';
import { useFinanceStore } from '@/store/financeStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatHourRange } from '@/utils/time';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

/**
 * 业主工作台页面
 * 展示数据统计、收益趋势、最近订单和快捷操作
 */
export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { parkings } = useParkingStore();
  const { getOwnerOrders } = useOrderStore();
  const { getRevenueTrend, getWithdrawableAmount, getPendingAmount, getTotalRevenue } = useFinanceStore();

  /** 收益趋势切换：近7天/30天 */
  const [trendDays, setTrendDays] = useState<7 | 30>(7);

  const ownerId = user?.id || 'o001';
  const ownerParkings = parkings.filter((p) => p.ownerId === ownerId);
  const ownerOrders = getOwnerOrders(ownerId);

  /** 今日日期格式化 */
  const todayStr = useMemo(() => {
    const now = new Date();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${formatDate(now)} 星期${weekDays[now.getDay()]}`;
  }, []);

  /** 今日订单数 */
  const todayOrders = useMemo(() => {
    const today = new Date();
    return ownerOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    }).length;
  }, [ownerOrders]);

  /** 今日收入 */
  const todayIncome = useMemo(() => {
    const today = new Date();
    const todayCompleted = ownerOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate() &&
        (o.status === 'completed' || o.status === 'active')
      );
    });
    return todayCompleted.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [ownerOrders]);

  /** 本月累计收益 */
  const monthlyIncome = useMemo(() => {
    const now = new Date();
    const monthOrders = ownerOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        (o.status === 'completed' || o.status === 'active')
      );
    });
    return monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [ownerOrders]);

  /** 收益趋势数据 */
  const trendData = useMemo(() => getRevenueTrend(trendDays), [trendDays, getRevenueTrend]);

  /** 最近5条订单 */
  const recentOrders = useMemo(() => ownerOrders.slice(0, 5), [ownerOrders]);

  /** 订单状态徽章配置 */
  const getOrderBadge = (status: OrderStatus) => {
    const map: Record<OrderStatus, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
      pending: { variant: 'warning', label: '待支付' },
      paid: { variant: 'info', label: '已支付' },
      active: { variant: 'success', label: '使用中' },
      completed: { variant: 'success', label: '已完成' },
      cancelled: { variant: 'default', label: '已取消' },
      disputed: { variant: 'danger', label: '纠纷中' },
      refunded: { variant: 'info', label: '已退款' },
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
          {/* ========== 顶部欢迎条 ========== */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-6 lg:p-8">
            {/* 装饰光斑 */}
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-10 w-80 h-80 bg-brand-300/20 rounded-full blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  欢迎回来，{user?.nickname || '业主'} 👋
                </h1>
                <p className="text-white/80 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {todayStr}
                </p>
              </div>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                  <span>系统运行正常</span>
                </div>
                <div>今日访问 128 次</div>
              </div>
            </div>
          </div>

          {/* ========== 数据统计卡片 ========== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="车位总数"
              value={ownerParkings.length}
              suffix="个"
              icon={<MapPin className="w-5 h-5" />}
              theme="blue"
              changeRate="+12.5%"
              trend="up"
              trendLabel="较上月"
            />
            <StatCard
              title="今日订单数"
              value={todayOrders}
              suffix="单"
              icon={<Receipt className="w-5 h-5" />}
              theme="green"
              changeRate="+8.3%"
              trend="up"
              trendLabel="较昨日"
            />
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-accent-600 blur opacity-60 animate-pulse-soft" />
              <StatCard
                title="今日收入"
                value={todayIncome.toFixed(2)}
                prefix="¥"
                icon={<Banknote className="w-5 h-5" />}
                theme="orange"
                changeRate="+15.7%"
                trend="up"
                trendLabel="较昨日"
              />
            </div>
            <StatCard
              title="本月累计收益"
              value={monthlyIncome.toFixed(2)}
              prefix="¥"
              icon={<Wallet className="w-5 h-5" />}
              theme="purple"
              changeRate="+22.1%"
              trend="up"
              trendLabel="较上月"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ========== 收益趋势图 ========== */}
            <Card className="lg:col-span-2" header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">收益趋势</h3>
                    <p className="text-xs text-slate-400">实时统计每日收入情况</p>
                  </div>
                </div>
                {/* 切换Tab */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {([7, 30] as const).map((days) => (
                    <button
                      key={days}
                      onClick={() => setTrendDays(days)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                        trendDays === days
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      近{days === 7 ? 7 : 30}天
                    </button>
                  ))}
                </div>
              </div>
            }>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
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
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#1e3a5f"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* ========== 快捷操作区 ========== */}
            <Card header={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-orange-600 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">快捷操作</h3>
                  <p className="text-xs text-slate-400">一键常用功能快速访问</p>
                </div>
              </div>
            }>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/owner/publish')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">发布车位</div>
                    <div className="text-xs text-white/75">新增出租车位信息</div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-75" />
                </button>

                <button
                  onClick={() => navigate('/owner/records')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">查看出租记录</div>
                    <div className="text-xs text-white/75">历史订单与收入明细</div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-75" />
                </button>

                <button
                  onClick={() => navigate('/owner/finance')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-accent-600 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">申请提现</div>
                    <div className="text-xs text-white/75">可提现 ¥{getWithdrawableAmount().toFixed(2)}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-75" />
                </button>

                {/* 资产概览小卡片 */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-xs text-slate-400 mb-1">待结算</div>
                    <div className="text-lg font-bold text-slate-700">
                      ¥{getPendingAmount().toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-xs text-slate-400 mb-1">累计收入</div>
                    <div className="text-lg font-bold text-slate-700">
                      ¥{getTotalRevenue().toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ========== 最近订单列表 ========== */}
          <Card header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">最近订单</h3>
                  <p className="text-xs text-slate-400">最新5条出租订单</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/owner/records')}>
                查看全部
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          }>
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无订单记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="px-5 py-3 font-medium">车位信息</th>
                      <th className="px-5 py-3 font-medium">预约时段</th>
                      <th className="px-5 py-3 font-medium">金额</th>
                      <th className="px-5 py-3 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const badge = getOrderBadge(order.status);
                      return (
                        <tr
                          key={order.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-brand-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-slate-800 truncate max-w-xs">
                                  {order.parkingTitle}
                                </div>
                                <div className="text-xs text-slate-400">
                                  订单号 {order.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-slate-700">
                              {formatHourRange(order.scheduledStart, order.scheduledEnd)}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {order.scheduledHours}小时
                              {order.actualHours && (
                                <span className="ml-1">
                                  · 实际 {order.actualHours.toFixed(1)}h
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-base font-bold text-accent-600">
                              {formatCurrency(order.totalAmount)}
                            </div>
                            {order.overtimeAmount > 0 && (
                              <div className="text-xs text-amber-600">
                                含超时 ¥{order.overtimeAmount.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={badge.variant} size="md">
                              {badge.label}
                            </Badge>
                            {order.rating && (
                              <div className="flex items-center gap-0.5 mt-1.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      'w-3 h-3',
                                      i < order.rating!
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                    )}
                                  />
                                ))}
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
