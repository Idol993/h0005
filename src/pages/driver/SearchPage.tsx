import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Search,
  Star,
  Navigation,
  Zap,
  ShieldCheck,
  Camera,
  Trees,
  Car,
  SlidersHorizontal,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
} from 'lucide-react';
import { DriverHeader } from '@/components/layout/DriverHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useParkingStore } from '@/store/parkingStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ParkingSpot } from '@/types';

/**
 * 车位搜索结果页面组件
 * 左右分栏布局：左侧列表 + 右侧地图
 * 顶部筛选栏：价格、时段、设施、排序
 */
export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { parkings, searchParkings, loading } = useParkingStore();

  /** 搜索关键词（从URL读取） */
  const keyword = searchParams.get('keyword') || '';
  const [searchInput, setSearchInput] = useState(keyword);

  /** 搜索结果 */
  const [results, setResults] = useState<ParkingSpot[]>([]);

  /** 筛选条件 */
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');

  /** 移动端筛选面板显示 */
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  /** 所有设施选项 */
  const allFacilities = ['充电桩', '监控', '安保', '遮阳', '通风', '无障碍', '智能识别', '洗车服务'];

  /** 时段选项 */
  const timeOptions = [
    { value: '', label: '不限时段' },
    { value: 'morning', label: '上午(8-12点)' },
    { value: 'afternoon', label: '下午(12-18点)' },
    { value: 'evening', label: '晚间(18-24点)' },
    { value: 'workday', label: '工作日' },
    { value: 'weekend', label: '周末' },
  ];

  /** 排序选项 */
  const sortOptions = [
    { key: 'distance' as const, label: '距离最近', icon: Navigation },
    { key: 'price' as const, label: '价格最低', icon: DollarSign },
    { key: 'rating' as const, label: '评分最高', icon: Star },
  ];

  /** 执行搜索 */
  useEffect(() => {
    const doSearch = async () => {
      const data = await searchParkings({
        keyword: keyword || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        facilities: selectedFacilities.length > 0 ? selectedFacilities : undefined,
      });
      setResults(data);
    };
    doSearch();
  }, [keyword, searchParkings, minPrice, maxPrice, selectedFacilities]);

  /** 应用排序 */
  const sortedResults = useMemo(() => {
    const list = [...results];
    if (sortBy === 'price') {
      list.sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.avgRating - a.avgRating);
    }
    return list;
  }, [results, sortBy]);

  /** 处理搜索 */
  const handleSearch = () => {
    if (searchInput.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/search');
    }
  };

  /** 切换设施选择 */
  const toggleFacility = (facility: string) => {
    setSelectedFacilities(prev =>
      prev.includes(facility)
        ? prev.filter(f => f !== facility)
        : [...prev, facility]
    );
  };

  /** 清除所有筛选 */
  const clearAllFilters = () => {
    setMinPrice(0);
    setMaxPrice(50);
    setSelectedFacilities([]);
    setTimeRange('');
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

  /** 处理车位点击 */
  const handleParkingClick = (id: string) => {
    navigate(`/parking/${id}`);
  };

  /** 地图上的车位标注颜色 */
  const markerColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-accent-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-orange-500'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 顶部导航 */}
      <DriverHeader />

      {/* 顶部搜索和筛选栏 */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* 搜索框 */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索地址、商圈名称..."
                className="w-full h-11 pl-12 pr-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 font-medium transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none"
              />
            </div>
            <Button variant="primary" size="md" onClick={handleSearch}>
              搜索
            </Button>
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-xl border-2 border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-colors"
            >
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* 桌面端筛选面板 */}
          <div className="hidden lg:flex flex-wrap items-center gap-4">
            {/* 价格区间滑块 */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 whitespace-nowrap">价格：</span>
              <div className="flex items-center gap-2 w-56">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                  className="flex-1 accent-brand-500"
                />
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                  className="flex-1 accent-accent-500"
                />
              </div>
              <span className="text-sm font-medium text-brand-600 whitespace-nowrap tabular-nums">
                ¥{minPrice}-{maxPrice}
              </span>
            </div>

            {/* 时段选择 */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent text-sm text-slate-700 font-medium outline-none cursor-pointer"
              >
                {timeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 排序选择 */}
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
              {sortOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      sortBy === opt.key
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* 清除筛选 */}
            {(minPrice > 0 || maxPrice < 50 || selectedFacilities.length > 0 || timeRange) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
            )}
          </div>
        </div>

        {/* 移动端筛选面板 */}
        {showMobileFilter && (
          <div className="lg:hidden border-t border-slate-200 bg-white animate-slide-down">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* 价格区间 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> 价格区间：¥{minPrice} - ¥{maxPrice}
                </label>
                <div className="space-y-2">
                  <input type="range" min="0" max="50" value={minPrice}
                    onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                    className="w-full accent-brand-500" />
                  <input type="range" min="0" max="50" value={maxPrice}
                    onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                    className="w-full accent-accent-500" />
                </div>
              </div>

              {/* 时段选择 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 时段
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTimeRange(opt.value)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                        timeRange === opt.value
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 设施筛选 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1">
                  <SlidersHorizontal className="w-4 h-4" /> 设施筛选
                </label>
                <div className="flex flex-wrap gap-2">
                  {allFacilities.map(f => (
                    <button
                      key={f}
                      onClick={() => toggleFacility(f)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                        selectedFacilities.includes(f)
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* 排序选择 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> 排序方式
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sortOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
                          sortBy === opt.key
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="md" onClick={clearAllFilters} className="flex-1">
                  清除
                </Button>
                <Button variant="primary" size="md" onClick={() => setShowMobileFilter(false)} className="flex-1">
                  应用筛选
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 设施筛选标签（桌面端） */}
      <div className="hidden lg:block border-b border-slate-100 bg-white">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 mr-2">设施：</span>
          {allFacilities.map(f => {
            const Icon = getFacilityIcon(f);
            const selected = selectedFacilities.includes(f);
            return (
              <button
                key={f}
                onClick={() => toggleFacility(f)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  selected
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* 结果统计 */}
      <div className="container mx-auto px-4 py-3">
        <p className="text-sm text-slate-500">
          共找到 <span className="font-semibold text-brand-600">{sortedResults.length}</span> 个车位
          {keyword && <span className="ml-2">，关键词："<span className="text-slate-700">{keyword}</span>"</span>}
        </p>
      </div>

      {/* 主体内容区：左右分栏 */}
      <div className="flex-1 container mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ========== 左侧：车位列表 ========== */}
          <div className="lg:w-1/2 xl:w-[45%] space-y-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-56 rounded-3xl bg-slate-100 animate-pulse" />
              ))
            ) : sortedResults.length === 0 ? (
              <Card className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无符合条件的车位</h3>
                <p className="text-slate-500 mb-6">试试调整筛选条件或搜索其他区域</p>
                <Button variant="outline" onClick={clearAllFilters}>
                  清除筛选条件
                </Button>
              </Card>
            ) : (
              sortedResults.map((parking, idx) => (
                <Card
                  key={parking.id}
                  hoverable
                  className="animate-fade-in-up cursor-pointer group"
                  onClick={() => handleParkingClick(parking.id)}
                  radius="3xl"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* 图片 */}
                    <div className="sm:w-48 shrink-0">
                      <div className="relative aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden">
                        <img
                          src={parking.images[0]}
                          alt={parking.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800';
                          }}
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
                          <Star className="w-3 h-3 fill-accent-400 text-accent-400" />
                          {parking.avgRating.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                        {parking.title}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-start gap-1 line-clamp-1">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                        {parking.address}
                      </p>

                      {/* 距离和预约数 */}
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {(0.3 + idx * 0.2).toFixed(1)}km
                        </span>
                        <span>·</span>
                        <span>{parking.totalBookings}次预约</span>
                      </div>

                      {/* 设施标签 */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parking.facilities.map(f => (
                          <Badge key={f} variant="info" size="sm" showIcon={false} filled={false}>
                            {f}
                          </Badge>
                        ))}
                      </div>

                      {/* 价格和操作 */}
                      <div className="flex items-end justify-between pt-2">
                        <div>
                          <span className="text-2xl font-bold text-accent-600 tabular-nums">
                            {formatCurrency(parking.hourlyRate)}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">/时</span>
                          {parking.dailyCap > 0 && (
                            <span className="ml-2 text-xs text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">
                              日封顶{formatCurrency(parking.dailyCap)}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleParkingClick(parking.id);
                          }}
                        >
                          立即预订
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* ========== 右侧：地图区域（简化版） ========== */}
          <div className="hidden lg:block lg:w-1/2 xl:w-[55%]">
            <div className="sticky top-[260px]">
              <Card radius="3xl" className="overflow-hidden p-0">
                <div className="relative h-[calc(100vh-340px)] min-h-[500px] bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 overflow-hidden">
                  {/* 地图纹理背景 */}
                  <div className="absolute inset-0 opacity-40">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* 模拟道路 */}
                  <div className="absolute top-1/2 left-0 right-0 h-8 bg-slate-300/60 -translate-y-1/2" />
                  <div className="absolute top-0 bottom-0 left-1/3 w-6 bg-slate-300/60" />
                  <div className="absolute top-0 bottom-0 right-1/4 w-5 bg-slate-300/40" />
                  <div className="absolute top-1/4 left-0 right-0 h-5 bg-slate-300/40" />
                  <div className="absolute bottom-1/3 left-0 right-0 h-6 bg-slate-300/50" />

                  {/* 模拟建筑物区域 */}
                  <div className="absolute top-[15%] left-[10%] w-24 h-32 bg-slate-200/60 rounded-lg" />
                  <div className="absolute top-[20%] right-[15%] w-32 h-24 bg-slate-200/60 rounded-lg" />
                  <div className="absolute bottom-[20%] left-[20%] w-28 h-20 bg-slate-200/60 rounded-lg" />
                  <div className="absolute bottom-[15%] right-[20%] w-36 h-28 bg-slate-200/60 rounded-lg" />
                  <div className="absolute top-[45%] left-[55%] w-20 h-20 bg-slate-200/50 rounded-lg" />

                  {/* 车位标注点 */}
                  {sortedResults.slice(0, 8).map((parking, idx) => {
                    const positions = [
                      { top: '20%', left: '25%' },
                      { top: '35%', left: '60%' },
                      { top: '55%', left: '30%' },
                      { top: '65%', left: '70%' },
                      { top: '25%', left: '75%' },
                      { top: '70%', left: '18%' },
                      { top: '45%', left: '80%' },
                      { top: '80%', left: '50%' },
                    ];
                    const pos = positions[idx % positions.length];
                    const color = markerColors[idx % markerColors.length];

                    return (
                      <button
                        key={parking.id}
                        onClick={() => handleParkingClick(parking.id)}
                        className="absolute -translate-x-1/2 -translate-y-full group z-10"
                        style={{ top: pos.top, left: pos.left }}
                      >
                        {/* 标注气泡 */}
                        <div className={cn(
                          'relative px-2.5 py-1 rounded-xl text-white text-xs font-bold shadow-lg transition-transform group-hover:scale-110',
                          color
                        )}>
                          ¥{parking.hourlyRate}
                          <div className={cn(
                            'absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45',
                            color
                          )} />
                        </div>
                        {/* 脉冲动画 */}
                        <div className={cn(
                          'absolute -bottom-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full animate-ping opacity-40',
                          color
                        )} />

                        {/* 悬浮预览卡片 */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                          <div className="bg-white rounded-2xl shadow-card-hover border border-slate-200 p-3">
                            <div className="flex gap-3">
                              <img
                                src={parking.images[0]}
                                alt={parking.title}
                                className="w-16 h-16 rounded-xl object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800';
                                }}
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <p className="font-semibold text-sm text-slate-800 line-clamp-1">{parking.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{parking.district}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 fill-accent-400 text-accent-400" />
                                  <span className="text-xs font-medium text-slate-700">{parking.avgRating.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* 当前位置标记 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-brand-500 border-4 border-white shadow-lg z-10 relative" />
                      <div className="absolute inset-0 w-5 h-5 rounded-full bg-brand-500 animate-ping opacity-40" />
                    </div>
                  </div>

                  {/* 图例 */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-brand-500 border-2 border-white" />
                        <span>我的位置</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-accent-500" />
                        <span>车位</span>
                      </div>
                    </div>
                  </div>

                  {/* 地图控件 */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                      <ChevronDown className="w-5 h-5" />
                    </button>
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
