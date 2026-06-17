import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  Car,
  QrCode,
  KeyRound,
  ArrowLeft,
  Navigation,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle,
  Camera,
  Timer,
  History,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DriverHeader } from '@/components/layout/DriverHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useOrderStore } from '@/store/orderStore';
import { useParkingStore } from '@/store/parkingStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime, formatDuration } from '@/utils/format';
import { calculateHours, calculateOvertimeFee } from '@/utils/time';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

/**
 * 进行中订单页面组件
 * 入场码展示、计时信息、超时提醒、一键开门、确认离场
 */
export default function ActiveOrderPage() {
  const navigate = useNavigate();
  const { activeOrder, orders, exitParking, enterParking, loading, loadOrders, getDriverOrders } = useOrderStore();
  const orderStoreGet = useOrderStore.getState;
  const { getParkingById } = useParkingStore();
  const { user } = useAuthStore();

  /** 当前订单 */
  const [order, setOrder] = useState<Order | null>(null);
  /** 当前时间（用于实时刷新） */
  const [now, setNow] = useState(new Date());
  /** 扫码开门弹窗 */
  const [showScanModal, setShowScanModal] = useState(false);
  /** 扫码入场状态 */
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'error'>('scanning');
  const [scanErrorMsg, setScanErrorMsg] = useState('');

  /** 定时器引用 */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 加载订单 */
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /** 获取进行中订单 */
  useEffect(() => {
    let found: Order | null = null;
    if (activeOrder) {
      found = activeOrder;
    } else if (user) {
      const driverOrders = getDriverOrders(user.id);
      found = driverOrders.find(o => o.status === 'active' || o.status === 'paid') || null;
    }
    /** 如果没有找到，从mock数据中找一个进行中的订单（用于演示） */
    if (!found) {
      found = orders.find(o => o.status === 'paid' || o.status === 'active') || null;
    }
    setOrder(found);
  }, [activeOrder, user, getDriverOrders, orders]);

  /** 定时刷新时间（每秒） */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /** 计算入场倒计时/计时信息 */
  const timingInfo = useMemo(() => {
    if (!order) return null;

    const scheduledStart = new Date(order.scheduledStart);
    const scheduledEnd = new Date(order.scheduledEnd);

    /** 预约开始倒计时 */
    const toStart = scheduledStart.getTime() - now.getTime();
    const toStartSeconds = Math.max(0, Math.floor(toStart / 1000));

    /** 计算已停时长（已入场状态才计算） */
    let parkedHours = 0;
    let parkedText = '0小时0分钟';

    if (order.status === 'active' && order.actualStart) {
      parkedHours = calculateHours(order.actualStart, now);
      parkedText = formatDuration(parkedHours);
    } else if (order.status === 'paid') {
      parkedText = '尚未入场';
    }

    /** 预计费用 */
    const parking = getParkingById(order.parkingId);
    const hourlyRate = parking?.hourlyRate || 10;
    const estimatedCost = Math.round(parkedHours * hourlyRate * 100) / 100;

    /** 超时判断 */
    const overtimeResult = calculateOvertimeFee(scheduledEnd, now, hourlyRate);
    const isOvertime = overtimeResult.overtimeHours > 0;
    const overtimeHours = overtimeResult.overtimeHours;
    const overtimeAmount = overtimeResult.overtimeFee;
    const overtimeLevel = overtimeResult.level;

    /** 预约结束倒计时 */
    const toEnd = scheduledEnd.getTime() - now.getTime();
    const toEndSeconds = Math.max(0, Math.floor(toEnd / 1000));

    return {
      toStartSeconds,
      parkedHours,
      parkedText,
      estimatedCost,
      overtimeHours,
      isOvertime,
      overtimeAmount,
      overtimeLevel,
      toEndSeconds,
      hourlyRate,
      overtimeResult,
    };
  }, [order, now, getParkingById]);

  /** 格式化秒数为 HH:MM:SS */
  const formatSeconds = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /** 获取车位信息 */
  const parking = order ? getParkingById(order.parkingId) : null;

  /** 处理确认离场 */
  const handleExit = async () => {
    if (!order) return;
    await exitParking(order.id);
    navigate('/driver/orders?status=completed');
  };

  /** 如果没有进行中订单 */
  if (!order || !timingInfo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DriverHeader />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Car className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">暂无进行中订单</h2>
            <p className="text-slate-500 mb-8">您还没有进行中的停车订单，快去预订车位吧！</p>
            <Button variant="primary" size="lg" onClick={() => navigate('/')}>
              去预订车位
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /** QR码内容：订单ID + 入场码 */
  const qrContent = `${order.id}:${order.entryCode}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <DriverHeader />

      <div className="container mx-auto px-4 py-4">
        {/* 返回 */}
        <button
          onClick={() => navigate('/driver/orders')}
          className="flex items-center gap-2 text-slate-600 hover:text-brand-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回订单列表</span>
        </button>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* ========== 入场码展示区 ========== */}
          <Card radius="3xl" className="overflow-hidden animate-fade-in-up shadow-lg shadow-brand/10">
            <div className="relative -mx-5 -mt-5 mb-0 p-8 md:p-10 text-white overflow-hidden">
              {/* 渐变背景 */}
              <div className="absolute inset-0 bg-gradient-brand" />
              <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay" />
              
              {/* 发光装饰 */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent-400/30 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10">
                {/* 订单状态头 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        variant={order.status === 'active' ? 'success' : 'info'}
                        size="md"
                        showIcon={false}
                        className="!bg-white/15 !text-white !border-white/25"
                      >
                        {order.status === 'active' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            已入场 · 计时中
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            待入场
                          </>
                        )}
                      </Badge>
                      <span className="text-white/70 text-sm">
                        订单号：{order.id.toUpperCase()}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">{order.parkingTitle}</h1>
                    <p className="flex items-center gap-1.5 text-white/80">
                      <MapPin className="w-4 h-4" />
                      {parking?.address}
                    </p>
                  </div>

                  {/* 状态倒计时 */}
                  {order.status === 'paid' && timingInfo.toStartSeconds > 0 && (
                    <div className="text-center sm:text-right">
                      <p className="text-white/70 text-sm mb-1">距离预约开始还有</p>
                      <p className="text-4xl font-bold tabular-nums font-mono">
                        {formatSeconds(timingInfo.toStartSeconds)}
                      </p>
                    </div>
                  )}
                </div>

                {/* 入场码大数字 */}
                <div className="mt-8 flex flex-col lg:flex-row items-center gap-8">
                  {/* 数字入场码 */}
                  <div className="flex-1">
                    <p className="text-center lg:text-left text-white/70 text-sm mb-4 flex items-center justify-center lg:justify-start gap-2">
                      <KeyRound className="w-4 h-4" />
                      6位入场验证码
                    </p>
                    <div className="entry-code-container !bg-white/5 !border-white/20">
                      {order.entryCode.split('').map((digit, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'entry-code-digit !bg-gradient-to-br !from-white !to-white/90',
                            idx >= 3 && 'entry-code-digit-accent'
                          )}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>
                    <p className="text-center lg:text-left text-white/60 text-xs mt-4">
                      入场时请在闸机输入此验证码，或使用二维码扫码入场
                    </p>
                  </div>

                  {/* 分隔线 */}
                  <div className="hidden lg:block w-px h-48 bg-white/15" />
                  <div className="block lg:hidden w-full h-px bg-white/15" />

                  {/* 二维码 */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-3xl shadow-2xl">
                      <QRCodeSVG
                        value={qrContent}
                        size={160}
                        level="H"
                        includeMargin={false}
                        fgColor="#1e3a5f"
                      />
                    </div>
                    <p className="text-white/70 text-sm mt-4 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" />
                      扫码入场
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 信息区：两列布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：计时信息 */}
            <div className="lg:col-span-2 space-y-6">
              {/* ========== 计时信息卡片 ========== */}
              <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-brand-500" />
                  计时信息
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* 已停时长 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-white border border-brand-100">
                    <p className="text-xs text-brand-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      已停时长
                    </p>
                    <p className="text-2xl font-bold text-brand-700 tabular-nums">
                      {timingInfo.parkedText}
                    </p>
                  </div>

                  {/* 预计费用 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-accent-50 to-white border border-accent-100">
                    <p className="text-xs text-accent-600 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      预计费用
                    </p>
                    <p className="text-2xl font-bold text-accent-700 tabular-nums">
                      {formatCurrency(timingInfo.estimatedCost || order.baseAmount)}
                    </p>
                  </div>

                  {/* 预计结束 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                    <p className="text-xs text-emerald-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      预约结束
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                      {formatSeconds(timingInfo.toEndSeconds)}
                    </p>
                  </div>

                  {/* 单价 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      超时单价
                    </p>
                    <p className="text-2xl font-bold text-slate-700 tabular-nums">
                      {formatCurrency(timingInfo.hourlyRate)}
                    </p>
                  </div>
                </div>

                {/* 超时提醒条 */}
                {timingInfo.isOvertime && (
                  <div
                    className={cn(
                      'p-4 rounded-2xl mb-6 animate-pulse-soft',
                      timingInfo.overtimeLevel === 'severe'
                        ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-200'
                        : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-200'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={cn(
                            'w-6 h-6 mt-0.5 shrink-0',
                            timingInfo.overtimeLevel === 'severe' ? 'text-red-500' : 'text-amber-500'
                          )}
                        />
                        <div>
                          <p
                            className={cn(
                              'font-semibold',
                              timingInfo.overtimeLevel === 'severe' ? 'text-red-700' : 'text-amber-700'
                            )}
                          >
                            {timingInfo.overtimeLevel === 'severe'
                              ? '严重超时警告'
                              : '已超时提醒'
                            }
                          </p>
                          <p
                            className={cn(
                              'text-sm mt-1',
                              timingInfo.overtimeLevel === 'severe' ? 'text-red-600' : 'text-amber-600'
                            )}
                          >
                            已超时 {formatDuration(timingInfo.overtimeHours)}
                            {timingInfo.overtimeResult.normalHours > 0 && (
                              <>（前2小时按正常费率 {formatCurrency(timingInfo.overtimeResult.normalFee)}）</>
                            )}
                            {timingInfo.overtimeResult.penaltyHours > 0 && (
                              <>（超出2小时部分按1.5倍费率 {formatCurrency(timingInfo.overtimeResult.penaltyFee)}）</>
                            )}
                            {timingInfo.overtimeLevel === 'severe' && '，已超4小时，建议立即离场！'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            'text-sm',
                            timingInfo.overtimeLevel === 'severe' ? 'text-red-600' : 'text-amber-600'
                          )}
                        >
                          超时费用
                        </p>
                        <p
                          className={cn(
                            'text-2xl font-bold tabular-nums',
                            timingInfo.overtimeLevel === 'severe' ? 'text-red-600' : 'text-amber-600'
                          )}
                        >
                          +{formatCurrency(timingInfo.overtimeAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 时段信息 */}
                <div className="p-4 rounded-2xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      预约日期
                    </span>
                    <span className="text-slate-800 font-medium">
                      {formatDateTime(order.scheduledStart).split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      预约时段
                    </span>
                    <span className="text-slate-800 font-medium">
                      {formatDateTime(order.scheduledStart).split(' ')[1]} -{' '}
                      {formatDateTime(order.scheduledEnd).split(' ')[1]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      基础金额
                    </span>
                    <span className="text-slate-800 font-medium">
                      {formatCurrency(order.baseAmount)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* ========== 操作按钮区 ========== */}
              <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Car className="w-5 h-5 text-brand-500" />
                  停车操作
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {order.status === 'paid' && (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setShowScanModal(true)}
                      leftIcon={<KeyRound className="w-5 h-5" />}
                    >
                      扫码开门
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(parking?.address || '')}`)}
                    leftIcon={<Navigation className="w-5 h-5" />}
                  >
                    导航到车位
                  </Button>
                  {order.status === 'active' && (
                    <Button
                      variant="accent"
                      size="lg"
                      className="sm:col-span-2"
                      loading={loading}
                      onClick={handleExit}
                      leftIcon={<CheckCircle className="w-5 h-5" />}
                    >
                      确认离场 · 结算费用
                    </Button>
                  )}
                </div>

                {/* 温馨提示 */}
                <div className="mt-5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-700 leading-relaxed">
                      <p className="font-semibold mb-1">离场说明：</p>
                      <ul className="space-y-1 text-blue-600">
                        <li>· 点击"确认离场"后系统将自动结算费用，预授权多余金额将在1-3个工作日内原路退回</li>
                        <li>· 如有任何问题，请联系24小时客服热线：400-xxx-xxxx</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* 右侧：车位信息和费用明细 */}
            <div className="space-y-6">
              {/* ========== 车位信息卡片 ========== */}
              <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-500" />
                  车位信息
                </h2>

                {/* 车位图片 */}
                <div className="rounded-2xl overflow-hidden mb-4">
                  <img
                    src={parking?.images[0]}
                    alt={parking?.title}
                    className="w-full aspect-video object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600';
                    }}
                  />
                </div>

                <h3 className="font-bold text-slate-900 mb-2">
                  {parking?.title}
                </h3>

                {/* 设施标签 */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {parking?.facilities.map((f) => (
                    <Badge key={f} variant="info" size="sm" showIcon={false}>
                      {f}
                    </Badge>
                  ))}
                </div>

                {/* 业主信息 */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                      业
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">业主 · 张先生</p>
                      <p className="text-xs text-slate-500">已认证业主</p>
                    </div>
                    <Badge variant="success" size="sm" showIcon={false}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      认证
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* ========== 费用明细卡片 ========== */}
              <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-brand-500" />
                  费用明细
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">基础费用（{order.scheduledHours.toFixed(1)}小时）</span>
                    <span className="font-medium text-slate-800 tabular-nums">
                      {formatCurrency(order.baseAmount)}
                    </span>
                  </div>
                  {timingInfo.isOvertime && (
                    <div className="flex items-center justify-between text-amber-600">
                      <span>超时费用（{formatDuration(timingInfo.overtimeHours)}）</span>
                      <span className="font-medium tabular-nums">
                        +{formatCurrency(timingInfo.overtimeAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">服务费</span>
                    <span className="font-medium text-slate-800 tabular-nums">
                      {formatCurrency(0)}
                    </span>
                  </div>
                </div>
                {/* 合计 */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">预计合计</span>
                    <span className="text-2xl font-bold text-accent-600 tabular-nums">
                      {formatCurrency(order.baseAmount + timingInfo.overtimeAmount)}
                    </span>
                  </div>
                  <div className="mt-2 text-right">
                    <p className="text-xs text-slate-500">
                      预授权冻结：{formatCurrency(order.preAuthAmount)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* 扫码开门弹窗 */}
        {showScanModal && order && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card radius="3xl" className="w-full max-w-md mx-auto animate-fade-in-up">
              <div className="text-center">
                {scanStatus === 'success' ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-success-500 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">入场成功</h3>
                    <p className="text-sm text-slate-500 mb-6">
                      闸机已开启，系统开始计时，请尽快驶入车位
                    </p>
                    <Button variant="primary" size="lg" onClick={() => {
                      setShowScanModal(false);
                      setScanStatus('scanning');
                    }}>
                      确认
                    </Button>
                  </>
                ) : scanStatus === 'error' ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-danger-500 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">入场码校验失败</h3>
                    <p className="text-sm text-danger-500 mb-6">{scanErrorMsg}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="ghost" size="lg" onClick={() => {
                        setShowScanModal(false);
                        setScanStatus('scanning');
                      }}>
                        关闭
                      </Button>
                      <Button variant="primary" size="lg" onClick={() => setScanStatus('scanning')}>
                        重新扫码
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">扫码开门</h3>
                    <p className="text-sm text-slate-500 mb-6">
                      将摄像头对准闸机二维码，或对准闸机上的二维码扫描区
                    </p>

                    <div className="aspect-square max-w-xs mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-6 relative overflow-hidden">
                      <div className="absolute inset-0 border-4 border-brand-500/50 rounded-2xl m-8 animate-pulse-soft" />
                      <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-accent-500 animate-bounce-soft" />
                      <Camera className="w-16 h-16 text-slate-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="ghost" size="lg" onClick={() => {
                        setShowScanModal(false);
                        setScanStatus('scanning');
                      }}>
                        取消
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        leftIcon={<CheckCircle className="w-5 h-5" />}
                        loading={loading}
                        onClick={async () => {
                          if (!order) return;
                          const success = await enterParking(order.id, order.entryCode);
                          if (success) {
                            setScanStatus('success');
                            const updated = orderStoreGet().orders.find(o => o.id === order.id) || null;
                            setOrder(updated);
                          } else {
                            setScanErrorMsg('入场码不匹配，请确认闸机信息后重试');
                            setScanStatus('error');
                          }
                        }}
                      >
                        模拟扫码
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
