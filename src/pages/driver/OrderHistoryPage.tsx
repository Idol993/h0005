import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Calendar,
  Star,
  Car,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  FileText,
  Eye,
  CreditCard,
  Navigation,
  KeyRound,
  Timer,
  PenLine,
} from 'lucide-react';
import { DriverHeader } from '@/components/layout/DriverHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { useOrderStore } from '@/store/orderStore';
import { useParkingStore } from '@/store/parkingStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

/**
 * 历史订单列表页面组件
 * 状态筛选Tab、订单卡片、评分评价、纠纷处理、详情弹窗
 */
type OrderTab = 'all' | 'active' | 'completed' | 'cancelled' | 'dispute';

const ORDER_TABS: { key: OrderTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
  { key: 'dispute', label: '纠纷中' },
];

const STATUS_CONFIG: Record<OrderStatus, { variant: 'success' | 'info' | 'warning' | 'danger' | 'default'; label: string; icon: typeof CheckCircle }> = {
  pending: { variant: 'warning', label: '待支付', icon: Clock },
  paid: { variant: 'info', label: '已支付', icon: CheckCircle },
  active: { variant: 'success', label: '进行中', icon: Car },
  completed: { variant: 'success', label: '已完成', icon: CheckCircle },
  cancelled: { variant: 'default', label: '已取消', icon: XCircle },
  refunded: { variant: 'info', label: '已退款', icon: CheckCircle },
  disputed: { variant: 'danger', label: '纠纷中', icon: AlertCircle },
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loadOrders, getDriverOrders, submitRating, submitDispute, cancelOrder, payOrder, rescheduleOrder, loading } = useOrderStore();
  const { getParkingById } = useParkingStore();
  const { user } = useAuthStore();

  /** 当前Tab */
  const [activeTab, setActiveTab] = useState<OrderTab>((searchParams.get('status') as OrderTab) || 'all');
  /** 搜索关键词 */
  const [searchKeyword, setSearchKeyword] = useState('');
  /** 详情弹窗 */
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  /** 评分星级 */
  const [ratingOrder, setRatingOrder] = useState<{ order: Order; rating: number; review: string } | null>(null);
  /** 纠纷弹窗 */
  const [disputeOrder, setDisputeOrder] = useState<{ order: Order; reason: string; type: string } | null>(null);
  /** 取消确认弹窗 */
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  /** 入场码弹窗 */
  const [entryCodeOrder, setEntryCodeOrder] = useState<Order | null>(null);
  /** 改签弹窗 */
  const [rescheduleTarget, setRescheduleTarget] = useState<Order | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');

  /** 加载订单 */
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /** 同步URL参数 */
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') {
      params.set('status', activeTab);
    }
    setSearchParams(params, { replace: true });
  }, [activeTab, setSearchParams]);

  /** 获取当前用户的订单列表 - 只按当前账号筛选，不 fallback 到全局订单 */
  const userOrders = useMemo(() => {
    if (user) {
      return getDriverOrders(user.id);
    }
    return [];
  }, [user, getDriverOrders]);

  /** 筛选后的订单 */
  const filteredOrders = useMemo(() => {
    let result = [...userOrders];

    /** 按Tab筛选 */
    if (activeTab === 'active') {
      result = result.filter(o => o.status === 'paid' || o.status === 'active');
    } else if (activeTab === 'completed') {
      result = result.filter(o => o.status === 'completed');
    } else if (activeTab === 'cancelled') {
      result = result.filter(o => o.status === 'cancelled');
    } else if (activeTab === 'dispute') {
      result = result.filter(o => o.status === 'disputed');
    }

    /** 按关键词搜索 */
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter(o =>
        o.parkingTitle.toLowerCase().includes(kw) ||
        o.id.toLowerCase().includes(kw)
      );
    }

    /** 按时间倒序 */
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [userOrders, activeTab, searchKeyword]);

  /** 提交评分 */
  const handleSubmitRating = async () => {
    if (!ratingOrder) return;
    await submitRating(ratingOrder.order.id, ratingOrder.rating, ratingOrder.review);
    setRatingOrder(null);
  };

  /** 提交纠纷 */
  const handleSubmitDispute = async () => {
    if (!disputeOrder) return;
    await submitDispute(disputeOrder.order.id, disputeOrder.reason, disputeOrder.type);
    setDisputeOrder(null);
  };

  /** 渲染星级选择 */
  const renderStarRating = (value: number, onChange?: (v: number) => void, readonly = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(n)}
            className={cn(
              'transition-transform',
              !readonly && 'hover:scale-110 cursor-pointer',
              readonly && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                'w-5 h-5',
                n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DriverHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ========== 页面标题 ========== */}
          <div className="animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">我的订单</h1>
            <p className="text-slate-500">查看和管理您的所有停车订单</p>
          </div>

          {/* ========== 搜索框 ========== */}
          <Card radius="2xl" className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索车位名称或订单号"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
            </div>
          </Card>

          {/* ========== 状态Tab ========== */}
          <Card radius="2xl" className="animate-fade-in-up p-0 overflow-hidden" style={{ animationDelay: '0.1s' }}>
            <div className="flex overflow-x-auto scrollbar-hide">
              {ORDER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 min-w-fit px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap',
                    activeTab === tab.key
                      ? 'text-brand-600'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-brand rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* ========== 订单列表 ========== */}
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-16 h-16 text-slate-300" />}
              title="暂无订单"
              description="还没有相关的停车订单，快去预订吧"
              actionText="去预订车位"
              onAction={() => navigate('/')}
            />
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const parking = getParkingById(order.parkingId);
                const statusCfg = STATUS_CONFIG[order.status];
                const StatusIcon = statusCfg.icon;

                return (
                  <Card
                    key={order.id}
                    radius="2xl"
                    className="animate-fade-in-up overflow-hidden"
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    {/* 订单头 */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <Badge variant={statusCfg.variant} size="md" showIcon={false}>
                          <StatusIcon className="w-3.5 h-3.5 mr-1" />
                          {statusCfg.label}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          订单号：{order.id.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => setDetailOrder(order)}
                        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 订单内容 */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* 车位图片 */}
                      <div
                        className="sm:w-40 shrink-0 rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/parking/${order.parkingId}`)}
                      >
                        <img
                          src={parking?.images[0]}
                          alt={parking?.title}
                          className="w-full aspect-video sm:aspect-square object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400';
                          }}
                        />
                      </div>

                      {/* 订单信息 */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-bold text-slate-900 mb-2 cursor-pointer hover:text-brand-600 transition-colors"
                          onClick={() => navigate(`/parking/${order.parkingId}`)}
                        >
                          {order.parkingTitle}
                        </h3>

                        <p className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{parking?.address}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDateTime(order.scheduledStart).split(' ')[0]}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {formatDateTime(order.scheduledStart).split(' ')[1]} - {formatDateTime(order.scheduledEnd).split(' ')[1]}
                            </span>
                          </div>
                        </div>

                        {/* 已完成订单显示评分（紧凑模式） */}
                        {order.status === 'completed' && order.rating && (
                          <div className="flex items-center gap-2 mb-3">
                            {renderStarRating(order.rating, undefined, true)}
                            {order.review && (
                              <span className="text-xs text-slate-500">"{order.review}"</span>
                            )}
                          </div>
                        )}

                        {/* 金额和操作按钮 */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-xs text-slate-400 mr-1">合计</span>
                            <span className="text-xl font-bold text-accent-600 tabular-nums">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {order.status === 'pending' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                                  onClick={() => navigate(`/payment/${order.id}`)}
                                >
                                  去支付
                                </Button>
                                {!order.rescheduled && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<PenLine className="w-3.5 h-3.5" />}
                                    onClick={() => {
                                      setRescheduleTarget(order);
                                      setRescheduleStart(order.scheduledStart.slice(0, 16));
                                      setRescheduleEnd(order.scheduledEnd.slice(0, 16));
                                    }}
                                  >
                                    改签
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!text-slate-500 hover:!text-red-500"
                                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                  onClick={() => setCancelTarget(order)}
                                >
                                  取消
                                </Button>
                              </>
                            )}

                            {order.status === 'paid' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                                  onClick={() => setEntryCodeOrder(order)}
                                >
                                  入场码
                                </Button>
                                {!order.rescheduled && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<PenLine className="w-3.5 h-3.5" />}
                                    onClick={() => {
                                      setRescheduleTarget(order);
                                      setRescheduleStart(order.scheduledStart.slice(0, 16));
                                      setRescheduleEnd(order.scheduledEnd.slice(0, 16));
                                    }}
                                  >
                                    改签
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Navigation className="w-3.5 h-3.5" />}
                                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(parking?.address || '')}`)}
                                >
                                  导航
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  leftIcon={<Car className="w-3.5 h-3.5" />}
                                  onClick={() => navigate('/order/active')}
                                >
                                  去入场
                                </Button>
                              </>
                            )}

                            {order.status === 'active' && (
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Timer className="w-3.5 h-3.5" />}
                                onClick={() => navigate('/order/active')}
                              >
                                去计时页
                              </Button>
                            )}

                            {order.status === 'completed' && (
                              <>
                                {order.rating ? (
                                  <div className="flex items-center gap-1">
                                    {renderStarRating(order.rating, undefined, true)}
                                  </div>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    leftIcon={<Star className="w-3.5 h-3.5" />}
                                    onClick={() => setRatingOrder({ order, rating: 5, review: '' })}
                                  >
                                    去评价
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
                                  onClick={() => setDisputeOrder({ order, reason: '', type: 'other' })}
                                >
                                  纠纷
                                </Button>
                              </>
                            )}

                            {order.status === 'disputed' && (
                              <Badge variant="warning" size="sm" showIcon={false}>
                                <MessageSquare className="w-3 h-3 mr-1" />
                                处理中
                              </Badge>
                            )}

                            {order.status === 'cancelled' && (
                              <Badge variant="default" size="sm" showIcon={false}>
                                <XCircle className="w-3 h-3 mr-1" />
                                已取消
                              </Badge>
                            )}

                            {order.status === 'refunded' && (
                              <Badge variant="info" size="sm" showIcon={false}>
                                已退款
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========== 订单详情弹窗 ========== */}
      <Modal
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title="订单详情"
      >
        {detailOrder && (() => {
          const parking = getParkingById(detailOrder.parkingId);
          const statusCfg = STATUS_CONFIG[detailOrder.status];
          const StatusIcon = statusCfg.icon;

          return (
            <div className="space-y-5">
              {/* 状态和订单号 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{statusCfg.label}</p>
                    <p className="text-xs text-slate-500">{detailOrder.id.toUpperCase()}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-accent-600">
                  {formatCurrency(detailOrder.totalAmount)}
                </p>
              </div>

              {/* 车位信息 */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">车位信息</p>
                <div className="flex gap-3 p-3 rounded-xl bg-slate-50">
                  <img
                    src={parking?.images[0]}
                    alt={parking?.title}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=200';
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{detailOrder.parkingTitle}</p>
                    <p className="text-sm text-slate-500 truncate flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {parking?.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* 时段信息 */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">预约时段</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">开始时间</span>
                    <span className="text-slate-800 font-medium">{formatDateTime(detailOrder.scheduledStart)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">结束时间</span>
                    <span className="text-slate-800 font-medium">{formatDateTime(detailOrder.scheduledEnd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">预约时长</span>
                    <span className="text-slate-800 font-medium">{detailOrder.scheduledHours.toFixed(1)} 小时</span>
                  </div>
                </div>
              </div>

              {/* 费用明细 */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">费用明细</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">基础费用</span>
                    <span className="text-slate-800 tabular-nums">{formatCurrency(detailOrder.baseAmount)}</span>
                  </div>
                  {detailOrder.overtimeAmount > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>超时费用</span>
                      <span className="tabular-nums">+{formatCurrency(detailOrder.overtimeAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">服务费</span>
                    <span className="text-slate-800 tabular-nums">{formatCurrency(0)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between">
                    <span className="font-semibold text-slate-700">合计</span>
                    <span className="font-bold text-accent-600 text-lg tabular-nums">
                      {formatCurrency(detailOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ========== 评价弹窗 ========== */}
      <Modal
        open={!!ratingOrder}
        onClose={() => setRatingOrder(null)}
        title="订单评价"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => setRatingOrder(null)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleSubmitRating}
              loading={loading}
            >
              提交评价
            </Button>
          </div>
        }
      >
        {ratingOrder && (
          <div className="space-y-5">
            {/* 车位信息 */}
            <div className="flex gap-3 p-3 rounded-xl bg-slate-50">
              <div>
                <p className="font-semibold text-slate-900">{ratingOrder.order.parkingTitle}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDateTime(ratingOrder.order.scheduledStart)}
                </p>
              </div>
            </div>

            {/* 星级评分 */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">整体评分</p>
              <div className="flex items-center gap-4">
                {renderStarRating(ratingOrder.rating, (v) => setRatingOrder({ ...ratingOrder, rating: v }))}
                <span className="text-lg font-bold text-amber-500">
                  {ratingOrder.rating}.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {['', '很差', '一般', '还行', '不错', '非常棒'][ratingOrder.rating]}
              </p>
            </div>

            {/* 评价内容 */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">评价内容（选填）</p>
              <textarea
                value={ratingOrder.review}
                onChange={(e) => setRatingOrder({ ...ratingOrder, review: e.target.value })}
                placeholder="分享您的停车体验..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ========== 纠纷弹窗 ========== */}
      <Modal
        open={!!disputeOrder}
        onClose={() => setDisputeOrder(null)}
        title="发起纠纷"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => setDisputeOrder(null)}
            >
              取消
            </Button>
            <Button
              variant="accent"
              size="lg"
              className="flex-1"
              onClick={handleSubmitDispute}
              loading={loading}
              disabled={!disputeOrder?.reason.trim()}
            >
              提交纠纷
            </Button>
          </div>
        }
      >
        {disputeOrder && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-semibold mb-1">纠纷说明</p>
                  <p className="text-amber-600">请详细描述您遇到的问题，客服会在24小时内介入处理。</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-sm">
              <p className="font-medium text-slate-700 mb-1">{disputeOrder.order.parkingTitle}</p>
              <p className="text-slate-500">
                订单号：{disputeOrder.order.id.toUpperCase()} · {formatCurrency(disputeOrder.order.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">纠纷原因</p>
              <div className="space-y-2">
                {[
                  { reason: '费用计算有误', type: 'overcharge' },
                  { reason: '车位与描述不符', type: 'quality' },
                  { reason: '无法入场', type: 'quality' },
                  { reason: '服务态度问题', type: 'other' },
                  { reason: '其他问题', type: 'other' },
                ].map((item) => (
                  <button
                    key={item.reason}
                    type="button"
                    onClick={() => setDisputeOrder({ ...disputeOrder, reason: item.reason, type: item.type })}
                    className={cn(
                      'w-full p-3 rounded-xl text-left text-sm transition-all border',
                      disputeOrder.reason === item.reason
                        ? 'bg-brand-50 border-brand-300 text-brand-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {item.reason}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">详细描述（选填）</p>
              <textarea
                placeholder="请描述具体情况..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ========== 取消订单确认弹窗 ========== */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="取消订单"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" size="lg" className="flex-1" onClick={() => setCancelTarget(null)}>
              返回
            </Button>
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              loading={loading}
              onClick={async () => {
                if (!cancelTarget) return;
                await cancelOrder(cancelTarget.id);
                setCancelTarget(null);
              }}
            >
              确认取消
            </Button>
          </div>
        }
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-semibold mb-1">确认取消此订单？</p>
                  <p className="text-red-600">取消后订单将无法恢复，如已支付将按退款流程处理。</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-sm">
              <p className="font-medium text-slate-700">{cancelTarget.parkingTitle}</p>
              <p className="text-slate-500 mt-1">
                订单号：{cancelTarget.id.toUpperCase()} · {formatCurrency(cancelTarget.totalAmount)}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ========== 入场码弹窗 ========== */}
      <Modal
        open={!!entryCodeOrder}
        onClose={() => setEntryCodeOrder(null)}
        title="入场验证码"
      >
        {entryCodeOrder && (() => {
          const eparking = getParkingById(entryCodeOrder.parkingId);
          return (
            <div className="space-y-5">
              <div className="text-center py-4">
                <div className="flex justify-center gap-2 mb-4">
                  {entryCodeOrder.entryCode.split('').map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-2xl font-bold flex items-center justify-center shadow-lg"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500">请在闸机输入此6位验证码入场</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
                <p className="font-medium text-slate-800">{entryCodeOrder.parkingTitle}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {eparking?.address}
                </p>
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(entryCodeOrder.scheduledStart)} - {formatDateTime(entryCodeOrder.scheduledEnd).split(' ')[1]}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<Navigation className="w-4 h-4" />}
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(eparking?.address || '')}`)}
                >
                  导航去车位
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Car className="w-4 h-4" />}
                  onClick={() => {
                    setEntryCodeOrder(null);
                    navigate('/order/active');
                  }}
                >
                  去扫码入场
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ========== 改签弹窗 ========== */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="改签预约时间"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" size="lg" className="flex-1" onClick={() => setRescheduleTarget(null)}>
              取消
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              loading={loading}
              disabled={!rescheduleStart || !rescheduleEnd || new Date(rescheduleEnd) <= new Date(rescheduleStart)}
              onClick={async () => {
                if (!rescheduleTarget) return;
                const success = await rescheduleOrder(
                  rescheduleTarget.id,
                  new Date(rescheduleStart).toISOString(),
                  new Date(rescheduleEnd).toISOString()
                );
                if (success) {
                  setRescheduleTarget(null);
                }
              }}
            >
              确认改签
            </Button>
          </div>
        }
      >
        {rescheduleTarget && (() => {
          const rp = getParkingById(rescheduleTarget.parkingId);
          const newStart = rescheduleStart ? new Date(rescheduleStart) : null;
          const newEnd = rescheduleEnd ? new Date(rescheduleEnd) : null;
          const newHours = (newStart && newEnd && newEnd > newStart)
            ? Math.round(((newEnd.getTime() - newStart.getTime()) / 3600000) * 10) / 10
            : 0;
          const newBase = newHours * (rp?.hourlyRate || 10);
          const priceDiff = newBase - rescheduleTarget.baseAmount;
          const timeConflict = newEnd && new Date(rescheduleTarget.scheduledStart).getTime() !== newStart?.getTime();

          return (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">改签须知</p>
                    <p className="text-blue-600">每个订单仅可改签一次，改签后原预约时段将被释放。费用多退少补。</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 text-sm">
                <p className="font-medium text-slate-700">{rescheduleTarget.parkingTitle}</p>
                <p className="text-slate-500 mt-1">
                  原预约：{formatDateTime(rescheduleTarget.scheduledStart)} - {formatDateTime(rescheduleTarget.scheduledEnd).split(' ')[1]}
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">新开始时间</label>
                  <input
                    type="datetime-local"
                    value={rescheduleStart}
                    onChange={(e) => setRescheduleStart(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">新结束时间</label>
                  <input
                    type="datetime-local"
                    value={rescheduleEnd}
                    onChange={(e) => setRescheduleEnd(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              {newHours > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">新预约时长</span>
                    <span className="font-medium text-slate-800">{newHours.toFixed(1)} 小时</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">新基础费用</span>
                    <span className="font-medium text-slate-800">{formatCurrency(newBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">费用差额</span>
                    <span className={cn('font-bold', priceDiff > 0 ? 'text-accent-600' : priceDiff < 0 ? 'text-emerald-600' : 'text-slate-800')}>
                      {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                      {priceDiff > 0 ? '（需补缴）' : priceDiff < 0 ? '（将退还）' : '（无变化）'}
                    </span>
                  </div>
                </div>
              )}
              {newEnd && newEnd <= (newStart || new Date()) && (
                <p className="text-sm text-red-500">结束时间必须晚于开始时间</p>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
