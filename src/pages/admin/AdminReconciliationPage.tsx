import { useState, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus, PaymentMethod } from '@/types';

const STATUS_OPTIONS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'active', label: '使用中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'disputed', label: '有纠纷' },
];

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod | 'all'; label: string }> = [
  { value: 'all', label: '全部方式' },
  { value: 'wechat', label: '微信支付' },
  { value: 'alipay', label: '支付宝' },
  { value: 'card', label: '银行卡' },
];

function getStatusBadge(status: OrderStatus): {
  variant: 'warning' | 'info' | 'success' | 'default' | 'danger';
  label: string;
} {
  const map: Record<
    OrderStatus,
    { variant: 'warning' | 'info' | 'success' | 'default' | 'danger'; label: string }
  > = {
    pending: { variant: 'warning', label: '待支付' },
    paid: { variant: 'info', label: '已支付' },
    active: { variant: 'info', label: '使用中' },
    completed: { variant: 'success', label: '已完成' },
    cancelled: { variant: 'default', label: '已取消' },
    disputed: { variant: 'danger', label: '有纠纷' },
    refunded: { variant: 'default', label: '已退款' },
  };
  return map[status];
}

function getPaymentLabel(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    card: '银行卡',
  };
  return map[method];
}

function calcCommission(order: Order): number {
  return order.baseAmount * 0.1 + order.overtimeAmount * 0.15;
}

function calcSettlement(order: Order): number {
  return order.totalAmount - calcCommission(order);
}

export default function AdminReconciliationPage() {
  const { orders, flagOrder } = useOrderStore();
  const { user } = useAuthStore();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [flagModalOrder, setFlagModalOrder] = useState<Order | null>(null);

  const pageSize = 10;

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (startDate) {
      result = result.filter((o) => new Date(o.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.createdAt) <= end);
    }
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (paymentFilter !== 'all') {
      result = result.filter((o) => o.paymentMethod === paymentFilter);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, startDate, endDate, statusFilter, paymentFilter]);

  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalAmount = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOvertime = filteredOrders.reduce((sum, o) => sum + o.overtimeAmount, 0);
    const totalBase = totalAmount - totalOvertime;
    const platformCommission = totalBase * 0.1 + totalOvertime * 0.15;

    return { totalOrders, totalAmount, totalOvertime, platformCommission };
  }, [filteredOrders]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setCurrentPage(1);
  };

  const handleFlagOrder = (orderId: string, flagged: boolean) => {
    flagOrder(orderId, flagged);
    if (!flagged) {
      setFlagModalOrder(null);
    }
  };

  const handleFilterChange = (
    setter: (val: any) => void,
    val: any
  ) => {
    setter(val);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">订单对账</h1>
            <p className="text-sm text-slate-500 mt-1">
              查看订单交易明细，核对平台抽成与业主结算
            </p>
          </div>

          <Card>
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">订单状态</label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    handleFilterChange(setStatusFilter, e.target.value as OrderStatus | 'all')
                  }
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">支付方式</label>
                <select
                  value={paymentFilter}
                  onChange={(e) =>
                    handleFilterChange(setPaymentFilter, e.target.value as PaymentMethod | 'all')
                  }
                  className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  {PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="md"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={resetFilters}
              >
                重置
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">总订单数</div>
                  <div className="text-2xl font-bold text-blue-600 tabular-nums">
                    {summary.totalOrders}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">总交易金额</div>
                  <div className="text-2xl font-bold text-emerald-600 tabular-nums">
                    {formatCurrency(summary.totalAmount)}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">总超时费</div>
                  <div className="text-2xl font-bold text-amber-600 tabular-nums">
                    {formatCurrency(summary.totalOvertime)}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">平台抽成</div>
                  <div className="text-2xl font-bold text-indigo-600 tabular-nums">
                    {formatCurrency(summary.platformCommission)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      订单号
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      车位
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      预约时段
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      订单金额
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      超时费
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      平台抽成
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      业主结算
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      支付方式
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        暂无符合条件的订单
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => {
                      const statusBadge = getStatusBadge(order.status);
                      const commission = calcCommission(order);
                      const settlement = calcSettlement(order);

                      return (
                        <tr
                          key={order.id}
                          className={cn(
                            'border-b border-slate-50 transition-colors',
                            order.flagged
                              ? 'bg-amber-50/50 hover:bg-amber-50'
                              : 'hover:bg-slate-50'
                          )}
                        >
                          <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">
                            {order.id.toUpperCase()}
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-[160px] truncate">
                            {order.parkingTitle}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            <span className="text-xs">
                              {formatDateTime(order.scheduledStart)}
                            </span>
                            <span className="mx-1 text-slate-400">~</span>
                            <span className="text-xs">
                              {formatDateTime(order.scheduledEnd)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700 tabular-nums">
                            {formatCurrency(order.baseAmount)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            {order.overtimeAmount > 0 ? (
                              <span className="text-amber-600 font-medium">
                                {formatCurrency(order.overtimeAmount)}
                              </span>
                            ) : (
                              <span className="text-slate-400">¥0.00</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-indigo-600 tabular-nums">
                            {formatCurrency(commission)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600 tabular-nums">
                            {formatCurrency(settlement)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {getPaymentLabel(order.paymentMethod)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={statusBadge.variant} size="sm">
                              {statusBadge.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {order.flagged ? (
                              <button
                                onClick={() => setFlagModalOrder(order)}
                                className="inline-flex items-center"
                              >
                                <Badge variant="warning" size="sm" showIcon={false}>
                                  已标记
                                </Badge>
                              </button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Flag className="w-3.5 h-3.5" />}
                                onClick={() => handleFlagOrder(order.id, true)}
                              >
                                标记待核对
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  共 {filteredOrders.length} 条记录，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      <Modal
        open={flagModalOrder !== null}
        title="标记订单详情"
        size="lg"
        onClose={() => setFlagModalOrder(null)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setFlagModalOrder(null)}>
              关闭
            </Button>
            <Button
              variant="primary"
              leftIcon={<Flag className="w-4 h-4" />}
              onClick={() => {
                if (flagModalOrder) {
                  handleFlagOrder(flagModalOrder.id, false);
                }
              }}
            >
              取消标记
            </Button>
          </div>
        }
      >
        {flagModalOrder && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700">
                <Flag className="w-5 h-5" />
                <span className="font-semibold">此订单已被标记待核对</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">订单号</div>
                <div className="font-mono text-sm font-semibold text-slate-800">
                  {flagModalOrder.id.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">车位</div>
                <div className="text-sm text-slate-800">{flagModalOrder.parkingTitle}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">预约开始</div>
                <div className="text-sm text-slate-800">
                  {formatDateTime(flagModalOrder.scheduledStart)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">预约结束</div>
                <div className="text-sm text-slate-800">
                  {formatDateTime(flagModalOrder.scheduledEnd)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">基础金额</div>
                <div className="text-sm font-semibold text-slate-800">
                  {formatCurrency(flagModalOrder.baseAmount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">超时费用</div>
                <div className="text-sm font-semibold text-slate-800">
                  {formatCurrency(flagModalOrder.overtimeAmount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">总金额</div>
                <div className="text-sm font-bold text-emerald-600">
                  {formatCurrency(flagModalOrder.totalAmount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">平台抽成</div>
                <div className="text-sm font-semibold text-indigo-600">
                  {formatCurrency(calcCommission(flagModalOrder))}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">业主结算</div>
                <div className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(calcSettlement(flagModalOrder))}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">支付方式</div>
                <div className="text-sm text-slate-800">
                  {getPaymentLabel(flagModalOrder.paymentMethod)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">订单状态</div>
                <Badge
                  variant={getStatusBadge(flagModalOrder.status).variant}
                  size="sm"
                >
                  {getStatusBadge(flagModalOrder.status).label}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">创建时间</div>
                <div className="text-sm text-slate-800">
                  {formatDateTime(flagModalOrder.createdAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
