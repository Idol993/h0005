import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Navigation,
  Zap,
  ShieldCheck,
  Camera,
  Trees,
  Car,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  Info,
  User,
  CheckCircle,
  ArrowLeft,
  Heart,
  Share2,
} from 'lucide-react';
import { DriverHeader } from '@/components/layout/DriverHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useParkingStore } from '@/store/parkingStore';
import { useOrderStore } from '@/store/orderStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { calculateHours } from '@/utils/time';
import { cn } from '@/lib/utils';
import type { ParkingSpot } from '@/types';

/**
 * 车位详情页面组件
 * 图片轮播、车位信息、业主信息、预订卡片
 */
export default function ParkingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getParkingById, loading } = useParkingStore();
  const { createOrder, loading: orderLoading } = useOrderStore();

  /** 当前车位 */
  const [parking, setParking] = useState<ParkingSpot | null>(null);
  /** 当前图片索引 */
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  /** 是否已收藏 */
  const [isFavorited, setIsFavorited] = useState(false);

  /** 预约日期 */
  const [bookingDate, setBookingDate] = useState('');
  /** 开始时间 */
  const [startTime, setStartTime] = useState('08:00');
  /** 结束时间 */
  const [endTime, setEndTime] = useState('18:00');

  /** 显示日历选择 */
  const [showCalendar, setShowCalendar] = useState(false);
  /** 当前日历月份 */
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  /** 获取车位数据 */
  useEffect(() => {
    if (id) {
      const data = getParkingById(id);
      if (data) {
        setParking(data);
        /** 图片扩展（如果少于4张补充默认图） */
        if (data.images.length < 4) {
          const extraImages = [
            'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800',
          ];
          const extended = [...data.images];
          for (let i = 0; i < 4 - data.images.length; i++) {
            extended.push(extraImages[i % extraImages.length]);
          }
          setParking({ ...data, images: extended });
        }
      }
    }
  }, [id, getParkingById]);

  /** 默认日期设置为明天 */
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(formatDate(tomorrow));
  }, []);

  /** 计算价格 */
  const priceInfo = useMemo(() => {
    if (!parking || !bookingDate || !startTime || !endTime) {
      return { hours: 0, baseAmount: 0, preAuthAmount: 0, overtimeEstimate: 0 };
    }
    const start = new Date(`${bookingDate}T${startTime}:00`);
    const end = new Date(`${bookingDate}T${endTime}:00`);
    if (end <= start) {
      return { hours: 0, baseAmount: 0, preAuthAmount: 0, overtimeEstimate: 0 };
    }
    const hours = calculateHours(start, end);
    let baseAmount = Math.round(hours * parking.hourlyRate * 100) / 100;
    if (parking.dailyCap > 0) {
      baseAmount = Math.min(baseAmount, parking.dailyCap);
    }
    /** 超时预估（按额外1小时计算） */
    const overtimeEstimate = Math.round(1 * parking.hourlyRate * 100) / 100;
    /** 预授权金额：总价 * 1.5 */
    const preAuthAmount = Math.round(baseAmount * 1.5 * 100) / 100;

    return { hours, baseAmount, preAuthAmount, overtimeEstimate };
  }, [parking, bookingDate, startTime, endTime]);

  /** 时间选项 */
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      options.push(`${h.toString().padStart(2, '0')}:00`);
      options.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return options;
  }, []);

  /** 生成日历天数 */
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    /** 填充开头 */
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -firstDay.getDay() + i + 1));
    }
    /** 当前月份 */
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    /** 填充结尾 */
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  }, [calendarMonth]);

  /** 判断日期是否可选（今天及以后） */
  const isDateSelectable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target >= today;
  };

  /** 判断是否今天 */
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  /** 判断是否选中 */
  const isSelected = (date: Date): boolean => {
    return formatDate(date) === bookingDate;
  };

  /** 选择日期 */
  const handleSelectDate = (date: Date) => {
    if (!isDateSelectable(date)) return;
    setBookingDate(formatDate(date));
    setShowCalendar(false);
  };

  /** 设施图标映射 */
  const getFacilityIcon = (facility: string) => {
    const iconMap: Record<string, typeof Zap> = {
      '充电桩': Zap,
      '监控': Camera,
      '安保': ShieldCheck,
      '遮阳': Trees,
      '通风': Trees,
      '无障碍': ShieldCheck,
      '智能识别': Zap,
      '洗车服务': Car,
    };
    return iconMap[facility] || Zap;
  };

  /** 图片切换 */
  const prevImage = () => {
    if (!parking) return;
    setCurrentImageIdx(prev => (prev - 1 + parking.images.length) % parking.images.length);
  };
  const nextImage = () => {
    if (!parking) return;
    setCurrentImageIdx(prev => (prev + 1) % parking.images.length);
  };

  /** 处理立即预订 */
  const handleBooking = async () => {
    if (!parking) return;
    if (!bookingDate || !startTime || !endTime) return;
    if (priceInfo.hours <= 0) return;

    const scheduledStart = new Date(`${bookingDate}T${startTime}:00`).toISOString();
    const scheduledEnd = new Date(`${bookingDate}T${endTime}:00`).toISOString();

    const order = await createOrder({
      parkingId: parking.id,
      scheduledStart,
      scheduledEnd,
      paymentMethod: 'wechat',
    });

    if (order) {
      navigate(`/payment/${order.id}`);
    }
  };

  /** 加载中 */
  if (loading || !parking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DriverHeader />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-96 rounded-3xl bg-slate-200" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 rounded-3xl bg-slate-200" />
                <div className="h-64 rounded-3xl bg-slate-200" />
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
          <span>返回搜索结果</span>
        </button>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* ========== 图片轮播区 ========== */}
        <div className="relative rounded-3xl overflow-hidden mb-8 animate-fade-in-up shadow-card group">
          <div className="aspect-[16/7] bg-slate-900 relative">
            <img
              src={parking.images[currentImageIdx]}
              alt={parking.title}
              className="w-full h-full object-cover transition-opacity duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200';
              }}
            />
            {/* 图片遮罩渐变 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* 切换按钮 */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* 图片计数器 */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
              {currentImageIdx + 1} / {parking.images.length}
            </div>

            {/* 标题信息（叠加在图片上） */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{parking.title}</h1>
                  <p className="flex items-center gap-1.5 text-white/85">
                    <MapPin className="w-4 h-4" />
                    {parking.address}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={cn(
                      'w-11 h-11 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all',
                      isFavorited
                        ? 'bg-accent-500 border-accent-400 text-white'
                        : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                    )}
                  >
                    <Heart className={cn('w-5 h-5', isFavorited && 'fill-current')} />
                  </button>
                  <button className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 缩略图导航 */}
          <div className="hidden md:flex gap-3 p-4 bg-slate-900/95">
            {parking.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIdx(idx)}
                className={cn(
                  'relative aspect-video rounded-xl overflow-hidden transition-all flex-1',
                  currentImageIdx === idx
                    ? 'ring-2 ring-accent-500 ring-offset-2 ring-offset-slate-900'
                    : 'opacity-60 hover:opacity-100'
                )}
              >
                <img
                  src={img}
                  alt={`${parking.title} ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=300';
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ========== 主体内容：左侧信息 + 右侧预订卡片 ========== */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ========== 左侧：车位详情 ========== */}
          <div className="flex-1 space-y-6 lg:space-y-8">
            {/* 评分和统计 */}
            <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-wrap items-center gap-6">
                {/* 评分大数字 */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-glow-accent">
                    <span className="text-2xl font-bold text-white">{parking.avgRating.toFixed(1)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i <= Math.round(parking.avgRating) ? 'fill-accent-400 text-accent-400' : 'fill-slate-200 text-slate-200'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">{parking.totalBookings}条好评</p>
                  </div>
                </div>

                <div className="h-12 w-px bg-slate-200 hidden sm:block" />

                {/* 统计数据 */}
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{parking.totalBookings}</p>
                    <p className="text-sm text-slate-500">累计预订</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(parking.hourlyRate)}</p>
                    <p className="text-sm text-slate-500">每小时起</p>
                  </div>
                  {parking.dailyCap > 0 && (
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(parking.dailyCap)}</p>
                      <p className="text-sm text-slate-500">每日封顶</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* 设施标签 */}
            <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}
              header={<h2 className="text-lg font-bold text-slate-900">车位设施</h2>}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {parking.facilities.map(f => {
                  const Icon = getFacilityIcon(f);
                  return (
                    <div key={f} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-brand-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-600">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-700">{f}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 车位描述 */}
            <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}
              header={<h2 className="text-lg font-bold text-slate-900">车位介绍</h2>}
            >
              <p className="text-slate-600 leading-relaxed text-base">
                {parking.description}
              </p>
            </Card>

            {/* 业主信息卡片 */}
            <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}
              header={<h2 className="text-lg font-bold text-slate-900">业主信息</h2>}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">业主 · 张先生</h3>
                    <Badge variant="success" size="sm" showIcon={false}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      已认证
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">业主信用分：98分 · 响应时间：平均30分钟</p>
                </div>
                <Button variant="outline" size="md">
                  联系业主
                </Button>
              </div>
            </Card>

            {/* 评分评论预览 */}
            <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}
              header={
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">用户评价</h2>
                  <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">查看全部</button>
                </div>
              }
            >
              <div className="space-y-5">
                {[
                  { name: '李**', avatar: 'L', rating: 5, date: '2025-05-12', content: '车位位置很好找，离地铁站很近，业主也很热情，下次还会再来！' },
                  { name: '王**', avatar: 'W', rating: 5, date: '2025-05-08', content: '价格实惠，比商场停车场便宜一半，环境干净，有充电桩非常方便。' },
                  { name: '赵**', avatar: 'Z', rating: 4, date: '2025-04-28', content: '车位很宽敞，我的SUV停进去没问题，就是高峰期出口有点拥堵。' },
                ].map((review, idx) => (
                  <div key={idx} className={cn('pt-5', idx === 0 && 'pt-0')}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold shrink-0">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-800">{review.name}</span>
                          <span className="text-xs text-slate-400">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              className={cn(
                                'w-3.5 h-3.5',
                                i <= review.rating ? 'fill-accent-400 text-accent-400' : 'fill-slate-200 text-slate-200'
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>
                      </div>
                    </div>
                    {idx < 2 && <div className="mt-5 h-px bg-slate-100" />}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ========== 右侧：悬浮预订卡片 ========== */}
          <div className="lg:w-96 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-5">
              <Card radius="3xl" className="shadow-card-hover overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                {/* 价格标题 */}
                <div className="bg-gradient-brand p-5 -mx-5 -mt-5 mb-5 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/70 text-sm mb-1">每小时价格</p>
                      <p className="text-4xl font-bold">{formatCurrency(parking.hourlyRate)}</p>
                    </div>
                    {parking.dailyCap > 0 && (
                      <div className="text-right">
                        <p className="text-white/70 text-xs mb-0.5">每日封顶</p>
                        <p className="text-xl font-semibold">{formatCurrency(parking.dailyCap)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 日期选择 */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> 预订日期
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-left text-slate-800 font-medium flex items-center justify-between hover:border-brand-400 transition-colors"
                    >
                      <span>{bookingDate || '请选择日期'}</span>
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* 日历弹窗 */}
                    {showCalendar && (
                      <div className="absolute z-20 top-full mt-2 w-full p-4 rounded-2xl bg-white shadow-card-hover border border-slate-200 animate-slide-down">
                        {/* 月份导航 */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="font-semibold text-slate-800">
                            {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
                          </span>
                          <button
                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        {/* 星期表头 */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* 日期格子 */}
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((date, idx) => {
                            const selectable = isDateSelectable(date);
                            const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelectDate(date)}
                                disabled={!selectable}
                                className={cn(
                                  'aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center',
                                  !isCurrentMonth && 'text-slate-300',
                                  !selectable && 'text-slate-300 cursor-not-allowed',
                                  selectable && !isSelected(date) && !isToday(date) && isCurrentMonth && 'hover:bg-brand-50 text-slate-700',
                                  isToday(date) && !isSelected(date) && isCurrentMonth && 'border-2 border-brand-500 text-brand-600',
                                  isSelected(date) && 'bg-gradient-brand text-white shadow-md'
                                )}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 时间段选择 */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> 开始时间
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium outline-none focus:border-brand-500 transition-colors cursor-pointer"
                    >
                      {timeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> 结束时间
                    </label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium outline-none focus:border-brand-500 transition-colors cursor-pointer"
                    >
                      {timeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 价格明细 */}
                <div className="space-y-3 pt-4 border-t border-slate-100 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      时长：{priceInfo.hours.toFixed(1)}小时 x {formatCurrency(parking.hourlyRate)}
                    </span>
                    <span className="text-slate-800 font-medium tabular-nums">{formatCurrency(priceInfo.baseAmount)}</span>
                  </div>
                  {priceInfo.overtimeEstimate > 0 && (
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-amber-50">
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        超时1小时预估
                      </span>
                      <span className="text-amber-700 font-medium tabular-nums">+{formatCurrency(priceInfo.overtimeEstimate)}</span>
                    </div>
                  )}

                  {/* 预授权说明 */}
                  <div className="p-3 rounded-xl bg-blue-50 mt-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="text-blue-700 font-medium mb-1">预授权金额</p>
                        <p className="text-blue-600 leading-relaxed">
                          将冻结 <span className="font-bold text-lg">{formatCurrency(priceInfo.preAuthAmount)}</span>，
                          超时费用从预授权中扣除，未超时则全额退还
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 预订按钮 */}
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full h-14 text-lg"
                  loading={orderLoading}
                  onClick={handleBooking}
                  disabled={priceInfo.hours <= 0}
                  rightIcon={<ArrowLeft className="w-5 h-5 rotate-180" />}
                >
                  立即预订 · {formatCurrency(priceInfo.baseAmount)}
                </Button>

                <p className="text-center text-xs text-slate-400 mt-3">
                  支持微信支付、支付宝、银行卡 · 免费取消（入场前1小时）
                </p>
              </Card>

              {/* 温馨提示 */}
              <Card radius="3xl" className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  预订须知
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                    <span>入场前1小时可免费取消，超时需支付违约金</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                    <span>凭6位入场码或二维码扫码入场</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                    <span>全程保险保障，发生纠纷平台先行赔付</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
