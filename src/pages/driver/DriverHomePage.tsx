import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  Star,
  Navigation,
  Zap,
  ShieldCheck,
  DollarSign,
  Clock,
  Camera,
  Trees,
  CircleParking,
  Car,
  ChevronRight,
  Flame,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { DriverHeader } from '@/components/layout/DriverHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useParkingStore } from '@/store/parkingStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ParkingSpot } from '@/types';

/**
 * 驾驶员首页组件
 * 包含搜索区、推荐车位、热门区域、平台优势介绍
 */
export default function DriverHomePage() {
  const navigate = useNavigate();
  const { parkings, loadParkings, loading } = useParkingStore();

  /** 搜索关键词 */
  const [searchValue, setSearchValue] = useState('');
  /** 已通过审核的车位 */
  const [approvedParkings, setApprovedParkings] = useState<ParkingSpot[]>([]);

  /** 加载车位数据 */
  useEffect(() => {
    loadParkings();
  }, [loadParkings]);

  /** 过滤已通过审核的车位 */
  useEffect(() => {
    const approved = parkings.filter(p => p.status === 'approved').slice(0, 4);
    setApprovedParkings(approved);
  }, [parkings]);

  /** 热门搜索标签 */
  const hotTags = ['国贸', '望京', '三里屯', '金融街', '中关村', '亦庄'];

  /** 热门区域配置（8个） */
  const hotAreas = [
    { name: '国贸CBD', count: 128, gradient: 'from-blue-500 to-blue-600', icon: CircleParking },
    { name: '望京SOHO', count: 86, gradient: 'from-purple-500 to-purple-600', icon: Building2 },
    { name: '三里屯', count: 64, gradient: 'from-pink-500 to-pink-600', icon: Car },
    { name: '金融街', count: 92, gradient: 'from-emerald-500 to-emerald-600', icon: TrendingUp },
    { name: '中关村', count: 78, gradient: 'from-orange-500 to-orange-600', icon: Zap },
    { name: '亦庄开发区', count: 56, gradient: 'from-cyan-500 to-cyan-600', icon: Trees },
    { name: '望京科技园', count: 68, gradient: 'from-indigo-500 to-indigo-600', icon: Building2 },
    { name: '通州副中心', count: 45, gradient: 'from-rose-500 to-rose-600', icon: Flame },
  ];

  /** 平台优势特性 */
  const features = [
    {
      icon: ShieldCheck,
      title: '安全保障',
      desc: '全程保险覆盖，24小时客服支持，监控系统全覆盖，让您停车无忧',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      icon: DollarSign,
      title: '价格透明',
      desc: '明码标价，无隐藏费用，实时计费清晰可见，拒绝乱收费',
      color: 'bg-brand-500',
      bgColor: 'bg-brand-50',
      textColor: 'text-brand-600',
    },
    {
      icon: Navigation,
      title: '便捷快速',
      desc: '一键导航直达，车牌自动识别，扫码开门无需等待',
      color: 'bg-accent-500',
      bgColor: 'bg-accent-50',
      textColor: 'text-accent-600',
    },
  ];

  /** 处理搜索 */
  const handleSearch = () => {
    navigate(`/search${searchValue ? `?keyword=${encodeURIComponent(searchValue)}` : ''}`);
  };

  /** 处理热门标签点击 */
  const handleTagClick = (tag: string) => {
    navigate(`/search?keyword=${encodeURIComponent(tag)}`);
  };

  /** 处理车位卡片点击 */
  const handleParkingClick = (id: string) => {
    navigate(`/parking/${id}`);
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <DriverHeader />

      {/* ========== Hero搜索区 ========== */}
      <section className="relative overflow-hidden bg-gradient-brand">
        {/* 噪点纹理 */}
        <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay pointer-events-none" />
        
        {/* 装饰性渐变光斑 */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] bg-brand-300/20 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center text-white animate-fade-in-up">
            {/* 主标题 */}
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              找车位，用智泊
            </h1>
            <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
              智能推荐附近优质车位，一键预订，扫码入场，告别停车难
            </p>

            {/* 搜索框 */}
            <div className="relative max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <MapPin className="w-6 h-6 text-brand-500" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入目的地、地址或商圈名称..."
                className="w-full h-16 pl-16 pr-32 rounded-3xl bg-white text-slate-900 placeholder-slate-400 text-lg font-medium shadow-2xl focus:ring-4 focus:ring-white/30 outline-none transition-all"
              />
              <Button
                variant="accent"
                size="lg"
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-8 rounded-2xl"
                leftIcon={<Search className="w-5 h-5" />}
              >
                搜索
              </Button>
            </div>

            {/* 热门搜索标签 */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <span className="text-white/60 text-sm mr-1">
                <Flame className="w-4 h-4 inline mr-1" />
                热门搜索:
              </span>
              {hotTags.map((tag, idx) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                    'bg-white/10 text-white/90 border border-white/20',
                    'hover:bg-white/20 hover:border-white/30'
                  )}
                  style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== 推荐车位区域 ========== */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        {/* 区域标题 */}
        <div className="flex items-end justify-between mb-8 animate-fade-in-up">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-7 h-7 text-accent-500" />
              精选推荐
            </h2>
            <p className="text-slate-500 mt-2">平台精选高评分车位，品质有保障</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="hidden sm:flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 车位卡片网格 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {approvedParkings.map((parking, idx) => (
              <Card
                key={parking.id}
                hoverable
                className="animate-fade-in-up overflow-hidden group cursor-pointer"
                onClick={() => handleParkingClick(parking.id)}
                radius="3xl"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="-m-5 mb-4">
                  {/* 车位图片 */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={parking.images[0]}
                      alt={parking.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800';
                      }}
                    />
                    {/* 评分徽章 */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
                      <Star className="w-3 h-3 fill-accent-400 text-accent-400" />
                      {parking.avgRating.toFixed(1)}
                    </div>
                    {/* 价格标签 */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-lg">
                      <span className="text-lg font-bold text-accent-600">{formatCurrency(parking.hourlyRate)}</span>
                      <span className="text-xs text-slate-500">/时</span>
                    </div>
                  </div>
                </div>

                {/* 车位信息 */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {parking.title}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-start gap-1 line-clamp-1">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    {parking.address}
                  </p>
                  
                  {/* 距离和预约数 */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {((idx + 1) * 0.3).toFixed(1)}km
                    </span>
                    <span>·</span>
                    <span>{parking.totalBookings}次预约</span>
                  </div>

                  {/* 设施图标 */}
                  <div className="flex items-center gap-2 pt-2">
                    {parking.facilities.slice(0, 4).map((f) => {
                      const Icon = getFacilityIcon(f);
                      return (
                        <div
                          key={f}
                          className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          title={f}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      );
                    })}
                    {parking.facilities.length > 4 && (
                      <span className="text-xs text-slate-400">+{parking.facilities.length - 4}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ========== 热门区域入口 ========== */}
      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-7 h-7 text-accent-500" />
            热门商圈
          </h2>
          <p className="text-slate-500 mt-2">热门区域车位紧张，建议提前预订</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-4">
          {hotAreas.map((area, idx) => {
            const Icon = area.icon;
            return (
              <button
                key={area.name}
                onClick={() => handleTagClick(area.name)}
                className="group relative aspect-square rounded-3xl overflow-hidden animate-fade-in-up hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* 渐变背景 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${area.gradient}`} />
                <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
                
                {/* 内容 */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-center">{area.name}</p>
                  <p className="text-xs text-white/75 mt-1">{area.count}个车位</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========== 平台优势介绍 ========== */}
      <section className="container mx-auto px-4 pb-16 lg:pb-24">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
            为什么选择智泊
          </h2>
          <p className="text-slate-500 mt-3">专业的共享停车平台，让每一次停车都安心</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="animate-fade-in-up text-center p-8 group hover:shadow-card-hover transition-all duration-300"
                radius="3xl"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform', feature.bgColor)}>
                  <Icon className={cn('w-8 h-8', feature.textColor)} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========== 页脚 ========== */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-800">智泊</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2025 智泊科技 版权所有 | 京ICP备xxxxxxxx号
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
