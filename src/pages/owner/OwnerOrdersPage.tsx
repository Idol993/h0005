import { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Receipt,
  Banknote,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Download,
  MapPin,
  User,
  KeyRound,
  CreditCard,
  MessageSquare,
  FileSpreadsheet,
  Eye,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, formatDateTime, formatDuration, maskPhone } from '@/utils/format';
import { formatHourRange } from '@/utils/time';
import { cn } from '@/lib/utils';
import { getOrderStatusText, getPaymentMethodText } from '@/data/orders';
import type { Order, OrderStatus } from '@/types';

/**
 * 出租订单记录页面
 * 展示业主的所有出租订单，支持状态筛选、搜索、日期范围、导出Excel等
 */
export default function OwnerOrdersPage() {
  const { user } = useAuthStore();
  const { getOwnerOrders } = useOrderStore();

  /** 搜索关键词 */
  const [keyword, setKeyword] = useState('');
  /** 状态筛选Tab */
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  /** 展开的订单详情行 */
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  /** 日期范围 */
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const ownerId = user?.id || 'o001';
  const allOrders = getOwnerOrders(ownerId);

  /** 状态筛选Tab配置 */
  const statusTabs = useMemo(
    () => [
      { key: 'all' as const, label: '全部', variant: 'default' as const },
      { key: 'active' as const, label: '进行中', variant: 'success' as const },
      { key: 'completed' as const, label: '已完成', variant: 'info' as const },
      { key: 'pending' as const, label: '待支付', variant: 'warning' as const },
      { key: 'disputed' as const, label: '纠纷中', variant: 'danger' as const },
    ],
    []
  );

  /** 各状态订单数量 */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allOrders.length };
    statusTabs.slice(1).forEach((tab) => {
      counts[tab.key] = allOrders.filter((o) => o.status === tab.key).length;
    });
    return counts;
  }, [allOrders, statusTabs]);

  /** 筛选后的订单列表 */
  const filteredOrders = useMemo(() => {
    let list = allOrders;
    if (statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(kw) ||
          o.parkingTitle.toLowerCase().includes(kw) ||
          o.driverId.toLowerCase().includes(kw)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((o) => new Date(o.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59').getTime();
      list = list.filter((o) => new Date(o.createdAt).getTime() <= to);
    }
    return list;
  }, [allOrders, statusFilter, keyword, dateFrom, dateTo]);

  /** 顶部统计条数据 */
  const stats = useMemo(() => {
    const totalOrders = allOrders.length;
    const totalIncome = allOrders
      .filter((o) => o.status === 'completed' || o.status === 'active')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const completedOrders = allOrders.filter((o) => o.status === 'completed');
    const avgHourlyRate =
      completedOrders.length > 0
        ? completedOrders.reduce((sum, o) => sum + (o.baseAmount / Math.max(o.scheduledHours, 1)), 0) /
          completedOrders.length
        : 0;
    const pendingSettlement = allOrders
      .filter((o) => o.status === 'active' || o.status === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return { totalOrders, totalIncome, avgHourlyRate, pendingSettlement };
  }, [allOrders]);

  /** 订单状态徽章 */
  const getStatusBadgeVariant = (status: OrderStatus): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    const map: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      pending: 'warning',
      paid: 'info',
      active: 'success',
      completed: 'success',
      cancelled: 'default',
      disputed: 'danger',
      refunded: 'info',
    };
    return map[status];
  };

  /** 模拟导出Excel */
  const handleExport = () => {
    const data = filteredOrders.map((o) => ({
      订单号: o.id,
      车位名称: o.parkingTitle,
      预约开始: formatDateTime(o.scheduledStart),
      预约结束: formatDateTime(o.scheduledEnd),
      预约时长: formatDuration(o.scheduledHours),
      实际时长: o.actualHours ? formatDuration(o.actualHours) : '-',
      基础金额: formatCurrency(o.baseAmount),
      超时金额: formatCurrency(o.overtimeAmount),
      总金额: formatCurrency(o.totalAmount),
      状态: getOrderStatusText(o.status),
      支付方式: getPaymentMethodText(o.paymentMethod),
      创建时间: formatDateTime(o.createdAt),
    }));
    console.log('导出Excel数据:', data);
    alert(`已导出 ${data.length} 条订单数据（模拟）`);
  };

  /** 切换订单行展开 */
  const toggleExpand = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <OwnerSidebar />

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 space-y-6">
          {/* ========== 页面标题 ========== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">出租记录</h1>
              <p className="text-sm text-slate-400 mt-1">
                查看所有出租订单详情、收入明细和租客评价
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<Download className="w-5 h-5" />}
              onClick={handleExport}
              disabled={filteredOrders.length === 0}
            >
              导出Excel
            </Button>
          </div>

          {/* ========== 顶部统计条 ========== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="!p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">总订单数</div>
                  <div className="text-2xl font-bold text-slate-800">{stats.totalOrders}</div>
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-400 to-orange-600 flex items-center justify-center shadow-md">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">总收入</div>
                  <div className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                    ¥{stats.totalIncome.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">平均时租</div>
                  <div className="text-2xl font-bold text-slate-800">
                    ¥{stats.avgHourlyRate.toFixed(1)}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">待结算</div>
                  <div className="text-2xl font-bold text-amber-600">
                    ¥{stats.pendingSettlement.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ========== 状态筛选Tab ========== */}
          <Card className="!p-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {statusTabs.map((tab) => {
                const active = statusFilter === tab.key;
                const count = statusCounts[tab.key] || 0;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 rounded-xl whitespace-nowrap transition-all text-sm font-medium',
                      active
                        ? 'bg-gradient-brand text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-semibold',
                        active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ========== 搜索和日期筛选 ========== */}
          <Card>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索订单号、车位名称..."
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-sm"
                />
              </div>

              {/* 日期范围 */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-12 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-sm"
                  />
                </div>
                <span className="text-slate-400">至</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-12 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-sm"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                  >
                    重置
                  </Button>
                )}
              </div>
            </div>

            {(keyword || dateFrom || dateTo) && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">筛选结果：</span>
                <span className="font-semibold text-brand-600">{filteredOrders.length}</span>
                <span className="text-slate-400">条订单</span>
              </div>
            )}
          </Card>

          {/* ========== 订单明细表 ========== */}
          {filteredOrders.length === 0 ? (
            <Card>
              <EmptyState
                type="order"
                title={keyword || dateFrom || dateTo ? '未找到匹配的订单' : '暂无出租订单'}
                description={
                  keyword || dateFrom || dateTo
                    ? '试试调整搜索关键词或日期范围'
                    : '当有租客预订您的车位时，订单会显示在这里'
                }
              />
            </Card>
          ) : (
            <Card className="overflow-hidden !p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-xs text-slate-400">
                      <th className="px-6 py-4 font-medium w-10"></th>
                      <th className="px-6 py-4 font-medium">订单号</th>
                      <th className="px-6 py-4 font-medium">车位名称</th>
                      <th className="px-6 py-4 font-medium">驾驶员</th>
                      <th className="px-6 py-4 font-medium">预约时段</th>
                      <th className="px-6 py-4 font-medium">实际时长</th>
                      <th className="px-6 py-4 font-medium">金额</th>
                      <th className="px-6 py-4 font-medium">状态</th>
                      <th className="px-6 py-4 font-medium text-right pr-8">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const isExpanded = expandedRow === order.id;
                      return (
                        <>
                          <tr
                            key={order.id}
                            className={cn(
                              'border-b border-slate-50 transition-colors',
                              isExpanded ? 'bg-brand-50/30' : 'hover:bg-slate-50'
                            )}
                          >
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleExpand(order.id)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-brand-100 hover:text-brand-600 flex items-center justify-center transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-mono text-sm font-semibold text-slate-800">
                                {order.id}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {formatDate(order.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 max-w-xs">
                                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                                  <MapPin className="w-4 h-4 text-brand-500" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 truncate">
                                  {order.parkingTitle}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {order.driverId.slice(-2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-700">
                                    用户{order.driverId.slice(-4)}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {maskPhone('13800138000')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-700">
                                {formatHourRange(order.scheduledStart, order.scheduledEnd)}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                预约 {formatDuration(order.scheduledHours)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {order.actualHours ? (
                                <>
                                  <div className="text-sm font-semibold text-emerald-600">
                                    {formatDuration(order.actualHours)}
                                  </div>
                                  {order.overtimeHours && order.overtimeHours > 0 && (
                                    <div className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      超时 {formatDuration(order.overtimeHours)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-base font-bold text-accent-600">
                                {formatCurrency(order.totalAmount)}
                              </div>
                              {order.overtimeAmount > 0 && (
                                <div className="text-xs text-amber-600">
                                  +超时 ¥{order.overtimeAmount.toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={getStatusBadgeVariant(order.status)} size="md">
                                {getOrderStatusText(order.status)}
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
                            <td className="px-6 py-4 text-right pr-8">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!px-3"
                                  onClick={() => toggleExpand(order.id)}
                                  leftIcon={<Eye className="w-4 h-4" />}
                                >
                                  {isExpanded ? '收起' : '详情'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="!px-3"
                                  leftIcon={<FileSpreadsheet className="w-4 h-4" />}
                                >
                                  凭证
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {/* 展开详情行 */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 border-b border-slate-100 animate-slide-down">
                              <td colSpan={9} className="px-6 py-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                  {/* 入场码 */}
                                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                      <KeyRound className="w-3.5 h-3.5" />
                                      入场验证码
                                    </div>
                                    <div className="font-mono text-2xl font-bold text-brand-600 tracking-wider">
                                      {order.entryCode}
                                    </div>
                                  </div>

                                  {/* 支付信息 */}
                                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                      <CreditCard className="w-3.5 h-3.5" />
                                      支付信息
                                    </div>
                                    <div className="text-sm font-semibold text-slate-700">
                                      {getPaymentMethodText(order.paymentMethod)}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                      {order.paymentTime
                                        ? `支付于 ${formatDateTime(order.paymentTime)}`
                                        : '未支付'}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
                                      <span className="text-slate-500">基础费</span>
                                      <span className="font-medium">
                                        {formatCurrency(order.baseAmount)}
                                      </span>
                                    </div>
                                    {order.overtimeAmount > 0 && (
                                      <div className="flex items-center justify-between text-sm mt-1">
                                        <span className="text-amber-600">超时费</span>
                                        <span className="font-medium text-amber-600">
                                          +{formatCurrency(order.overtimeAmount)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-base mt-2 pt-2 border-t border-slate-100">
                                      <span className="text-slate-600 font-semibold">合计</span>
                                      <span className="font-bold text-accent-600">
                                        {formatCurrency(order.totalAmount)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* 评价内容 */}
                                  <div className="p-4 rounded-xl bg-white border border-slate-200 md:col-span-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      租客评价
                                    </div>
                                    {order.review ? (
                                      <div>
                                        <div className="flex items-center gap-1 mb-2">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                              key={i}
                                              className={cn(
                                                'w-5 h-5',
                                                i < (order.rating || 0)
                                                  ? 'fill-amber-400 text-amber-400'
                                                  : 'text-slate-200'
                                              )}
                                            />
                                          ))}
                                          <span className="text-sm font-semibold text-slate-700 ml-2">
                                            {order.rating}.0分
                                          </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                          "{order.review}"
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-slate-400 py-4 text-center">
                                        租客暂未评价
                                      </div>
                                    )}
                                  </div>

                                  {/* 纠纷信息（如果有） */}
                                  {order.status === 'disputed' && order.disputeReason && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 md:col-span-4">
                                      <div className="flex items-center gap-2 text-xs text-red-600 font-semibold mb-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        纠纷说明
                                      </div>
                                      <p className="text-sm text-red-700">{order.disputeReason}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
