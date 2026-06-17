import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowLeft,
  CreditCard,
  Check,
  AlertCircle,
  Lock,
  Info,
  Car,
  Timer,
} from 'lucide-react';
import { DriverHeader } from '@/components/layout/DriverHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useOrderStore } from '@/store/orderStore';
import { useParkingStore } from '@/store/parkingStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Order, PaymentMethod } from '@/types';

/**
 * 支付页面组件
 * 订单摘要、支付方式选择、预授权协议、立即支付
 */
export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, payOrder, loading } = useOrderStore();
  const { getParkingById } = useParkingStore();

  /** 当前订单 */
  const [order, setOrder] = useState<Order | null>(null);
  /** 支付方式 */
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  /** 是否同意预授权协议 */
  const [agreedAuth, setAgreedAuth] = useState(false);
  /** 支付倒计时 */
  const [countdown, setCountdown] = useState(900);

  /** 获取订单信息 */
  useEffect(() => {
    if (id) {
      const found = orders.find(o => o.id === id) || null;
      setOrder(found);
    }
  }, [id, orders]);

  /** 倒计时 */
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  /** 格式化倒计时 */
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /** 支付方式配置 */
  const paymentMethods = [
    {
      key: 'wechat' as PaymentMethod,
      name: '微信支付',
      desc: '推荐使用，快速安全',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      key: 'alipay' as PaymentMethod,
      name: '支付宝',
      desc: '支付宝账号支付',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      key: 'card' as PaymentMethod,
      name: '银行卡',
      desc: '储蓄卡/信用卡支付',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
  ];

  /** 处理支付 */
  const handlePayment = async () => {
    if (!order) return;
    if (!agreedAuth) return;

    await payOrder(order.id);
    /** 支付成功跳转到进行中订单 */
    navigate('/driver/order/active');
  };

  /** 获取车位信息 */
  const parking = order ? getParkingById(order.parkingId) : null;

  /** 加载中 */
  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DriverHeader />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto animate-pulse space-y-6">
            <div className="h-16 rounded-3xl bg-slate-200" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 rounded-3xl bg-slate-200" />
                <div className="h-80 rounded-3xl bg-slate-200" />
              </div>
              <div className="h-96 rounded-3xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DriverHeader />

      {/* 返回按钮 */}
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回订单确认</span>
        </button>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* 页面标题和倒计时 */}
        <div className="max-w-5xl mx-auto mb-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-7 h-7 text-emerald-500" />
                确认支付
              </h1>
              <p className="text-slate-500 mt-1">请在倒计时结束前完成支付，超时订单将自动取消</p>
            </div>

            {/* 倒计时 */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-accent-50 border border-accent-200">
              <Timer className="w-5 h-5 text-accent-600" />
              <div>
                <p className="text-xs text-accent-600 font-medium">剩余支付时间</p>
                <p className="text-2xl font-bold text-accent-600 tabular-nums font-mono">
                  {formatCountdown(countdown)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ========== 左侧：订单详情和支付方式 ========== */}
          <div className="flex-1 space-y-6">
            {/* ========== 订单摘要卡片 ========== */}
            <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Car className="w-5 h-5 text-brand-500" />
                订单信息
              </h2>

              <div className="flex gap-5 pb-5 border-b border-slate-100">
                {/* 车位图片 */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0">
                  <img
                    src={parking?.images[0]}
                    alt={parking?.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400';
                    }}
                  />
                </div>

                {/* 车位信息 */}
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-bold text-slate-900 text-lg line-clamp-1">
                    {order.parkingTitle}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-start gap-1 line-clamp-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    {parking?.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateTime(order.scheduledStart).split(' ')[0]}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(order.scheduledStart).split(' ')[1]} - {formatDateTime(order.scheduledEnd).split(' ')[1]}
                    </span>
                    <span className="text-xs text-slate-500">
                      时长 {order.scheduledHours.toFixed(1)}小时
                    </span>
                  </div>
                </div>
              </div>

              {/* 金额明细 */}
              <div className="pt-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">基础费用（{order.scheduledHours.toFixed(1)}小时）</span>
                  <span className="text-slate-800 font-medium tabular-nums">{formatCurrency(order.baseAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">服务费</span>
                  <span className="text-slate-800 font-medium tabular-nums">{formatCurrency(0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-blue-50">
                  <span className="text-blue-600 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    预授权冻结金额
                    <span className="text-xs text-blue-500">(超时从这里扣除)</span>
                  </span>
                  <span className="text-blue-700 font-bold text-lg tabular-nums">
                    {formatCurrency(order.preAuthAmount)}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
                  <span className="text-slate-700 font-medium">实付金额</span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-accent-600 tabular-nums">
                      {formatCurrency(order.baseAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* ========== 支付方式选择 ========== */}
            <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-500" />
                选择支付方式
              </h2>

              <div className="space-y-3">
                {paymentMethods.map((method, idx) => {
                  const selected = paymentMethod === method.key;
                  return (
                    <button
                      key={method.key}
                      onClick={() => setPaymentMethod(method.key)}
                      className={cn(
                        'w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left',
                        selected
                          ? `${method.bgColor} ${method.borderColor} shadow-sm`
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      )}
                      style={{ animationDelay: `${0.12 + idx * 0.05}s` }}
                    >
                      {/* 支付图标 */}
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        method.bgColor,
                        !selected && 'bg-slate-50'
                      )}>
                        {method.key === 'wechat' && (
                          <svg className={cn('w-7 h-7', selected ? method.color : 'text-slate-400')} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.245 0-.06-.023-.12-.04-.177l-.327-1.233a.49.49 0 0 1 .177-.554C23.026 18.514 24 16.708 24 14.653c0-3.21-2.931-5.757-6.656-5.795zm-1.85 3.188c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                          </svg>
                        )}
                        {method.key === 'alipay' && (
                          <svg className={cn('w-7 h-7', selected ? method.color : 'text-slate-400')} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.422 15.358c-.598-.247-3.618-1.504-4.908-2.05.24-.61.458-1.235.65-1.872h-3.528v-.947h4.338v-.524h-4.338V7.85h4.853V7.32H6.387v.53h4.86v1.115H7.22v.524h3.78v.947H7.221v.53h7.42c-.15.494-.323.995-.515 1.492-1.69-.516-4.825-1.355-6.777-1.355-2.629 0-4.067 1.546-4.067 3.154 0 1.913 1.559 2.849 3.49 2.849 2.02 0 3.82-1.052 4.966-2.503 2.082 1.002 6.182 2.697 9.232 4.414 1.29.727 3.503 2.042 5.263 2.042v-4.208c0-.336 0-.625-.182-.915zm-16.532 1.48c-1.33 0-2.044-.723-2.044-1.601 0-.893.735-1.463 1.944-1.463 1.41 0 3.201.606 5.032 1.177-.929 1.212-2.204 1.887-4.932 1.887z"/>
                          </svg>
                        )}
                        {method.key === 'card' && (
                          <CreditCard className={cn('w-6 h-6', selected ? method.color : 'text-slate-400')} />
                        )}
                      </div>

                      {/* 名称描述 */}
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-semibold', selected ? 'text-slate-900' : 'text-slate-700')}>
                          {method.name}
                        </p>
                        <p className={cn('text-sm', selected ? 'text-slate-500' : 'text-slate-400')}>
                          {method.desc}
                        </p>
                      </div>

                      {/* 选中标记 */}
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        selected
                          ? 'bg-brand-500 border-brand-500'
                          : 'border-slate-300'
                      )}>
                        {selected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* ========== 预授权协议 ========== */}
            <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-500" />
                支付协议
              </h2>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedAuth}
                    onChange={(e) => setAgreedAuth(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-2 cursor-pointer"
                  />
                </div>
                <div className="text-sm">
                  <p className="text-slate-700 leading-relaxed mb-2">
                    我已阅读并同意
                    <a href="#" className="text-brand-600 hover:underline mx-1">《预授权协议》</a>
                    、
                    <a href="#" className="text-brand-600 hover:underline mx-1">《支付服务协议》</a>
                    ，并理解：
                  </p>
                  <ul className="space-y-1.5 text-slate-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />
                      <span>支付成功后，将额外冻结预授权金额 {formatCurrency(order.preAuthAmount)} 用于可能的超时费用</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />
                      <span>若未超时，预授权金额将在离场后自动解冻退还</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />
                      <span>若产生超时费用，从预授权金额中扣除，多退少补</span>
                    </li>
                  </ul>
                </div>
              </label>

              {!agreedAuth && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2 text-sm animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-amber-700">请勾选协议后再进行支付</span>
                </div>
              )}
            </Card>
          </div>

          {/* ========== 右侧：悬浮支付卡片 ========== */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-5">
              <Card radius="3xl" className="shadow-card-hover overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {/* 金额区 */}
                <div className="bg-gradient-brand p-6 -mx-5 -mt-5 mb-5 text-white text-center">
                  <p className="text-white/70 text-sm mb-1">应付金额</p>
                  <p className="text-5xl font-bold tabular-nums mb-3">{formatCurrency(order.baseAmount)}</p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-white/75">
                      <Lock className="w-4 h-4" />
                      安全加密支付
                    </span>
                    <Badge variant="success" size="sm" showIcon={false} className="!bg-white/15 !text-white !border-white/25">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      平台保障
                    </Badge>
                  </div>
                </div>

                {/* 金额明细简版 */}
                <div className="space-y-2.5 text-sm pb-5 border-b border-slate-100 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">基础金额</span>
                    <span className="text-slate-800 font-medium tabular-nums">{formatCurrency(order.baseAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">预授权冻结</span>
                    <span className="text-blue-600 font-medium tabular-nums">{formatCurrency(order.preAuthAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-slate-700 font-semibold">合计支付</span>
                    <span className="text-2xl font-bold text-accent-600 tabular-nums">{formatCurrency(order.baseAmount)}</span>
                  </div>
                </div>

                {/* 支付按钮 */}
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full h-14 text-lg shadow-glow-accent"
                  loading={loading}
                  disabled={!agreedAuth}
                  onClick={handlePayment}
                  rightIcon={<Lock className="w-5 h-5" />}
                >
                  立即支付
                </Button>

                <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
                  支付即表示您同意《用户服务协议》<br />
                  支持SSL加密传输，保障支付安全
                </p>
              </Card>

              {/* 安全保障 */}
              <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">资金安全</p>
                      <p className="text-xs text-slate-500">银行级加密保护</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">极速退款</p>
                      <p className="text-xs text-slate-500">取消1小时内退回</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">先行赔付</p>
                      <p className="text-xs text-slate-500">纠纷平台先行处理</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
