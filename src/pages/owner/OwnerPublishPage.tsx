import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Image as ImageIcon,
  Wrench,
  Clock as ClockIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Map,
  Zap,
  ShieldCheck,
  Camera,
  Trees,
  Car,
  DoorOpen,
  Fan,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useParkingStore } from '@/store/parkingStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { TimeSlot } from '@/types';

/**
 * 发布/编辑车位表单页面
 * 多步骤表单：基础信息 -> 图片上传 -> 设施配置 -> 价格时段
 */
export default function OwnerPublishPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { publishParking, updateParking, getParkingById, loading } = useParkingStore();

  /** 当前步骤（1-4） */
  const [currentStep, setCurrentStep] = useState(1);
  /** 提交成功提示 */
  const [submitted, setSubmitted] = useState(false);

  // ========== 步骤1：基础信息 ==========
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 39.9042, lng: 116.4074 });

  // ========== 步骤2：图片上传 ==========
  const [images, setImages] = useState<string[]>([]);

  // ========== 步骤3：设施配置 ==========
  const allFacilities = useMemo(
    () => [
      { key: '充电桩', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      { key: '24h监控', icon: Camera, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
      { key: '安保巡逻', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
      { key: '智能道闸', icon: DoorOpen, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200' },
      { key: '洗车服务', icon: Car, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200' },
      { key: '无障碍', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200' },
      { key: '遮阳棚', icon: Trees, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
      { key: '通风系统', icon: Fan, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200' },
    ],
    []
  );
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  // ========== 步骤4：价格时段 ==========
  const [hourlyRate, setHourlyRate] = useState<string>('10');
  const [dailyCap, setDailyCap] = useState<string>('80');
  /** 每天的可用配置：是否开放 + 起止时间 */
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const [dayConfigs, setDayConfigs] = useState<
    Array<{ enabled: boolean; startTime: string; endTime: string }>
  >(
    Array.from({ length: 7 }, (_, i) => ({
      enabled: i >= 1 && i <= 5,
      startTime: '08:00',
      endTime: '20:00',
    }))
  );

  /** 如果是编辑模式，加载已有数据 */
  useEffect(() => {
    if (editId) {
      const parking = getParkingById(editId);
      if (parking) {
        setTitle(parking.title);
        setDescription(parking.description);
        setAddress(parking.address);
        setDistrict(parking.district);
        setCoords({ lat: parking.lat, lng: parking.lng });
        setImages(parking.images);
        setSelectedFacilities(parking.facilities);
        setHourlyRate(String(parking.hourlyRate));
        setDailyCap(String(parking.dailyCap));

        const configs = Array.from({ length: 7 }, () => ({
          enabled: false,
          startTime: '08:00',
          endTime: '20:00',
        }));
        parking.availableSlots.forEach((slot) => {
          configs[slot.dayOfWeek] = {
            enabled: true,
            startTime: slot.startTime,
            endTime: slot.endTime,
          };
        });
        setDayConfigs(configs);
      }
    }
  }, [editId, getParkingById]);

  /** 步骤配置 */
  const steps = [
    { num: 1, title: '基础信息', icon: MapPin, desc: '车位标题、地址等' },
    { num: 2, title: '图片上传', icon: ImageIcon, desc: '车位实景照片' },
    { num: 3, title: '设施配置', icon: Wrench, desc: '附加服务设施' },
    { num: 4, title: '价格时段', icon: ClockIcon, desc: '定价和开放时间' },
  ];

  /** 模拟图片上传 */
  const handleUploadImage = () => {
    if (images.length >= 4) return;
    const placeholderImages = [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800',
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800',
      'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=800',
    ];
    const randomImg = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    setImages([...images, `${randomImg}&sig=${Date.now()}`]);
  };

  /** 删除图片 */
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  /** 切换设施选中 */
  const toggleFacility = (key: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  /** 更新某天的配置 */
  const updateDayConfig = (
    dayIdx: number,
    changes: Partial<{ enabled: boolean; startTime: string; endTime: string }>
  ) => {
    setDayConfigs((prev) =>
      prev.map((cfg, idx) => (idx === dayIdx ? { ...cfg, ...changes } : cfg))
    );
  };

  /** 地图点击选点 */
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarkerPos({ x, y });
    const lat = 40.0 - (y / 100) * 0.2;
    const lng = 116.3 + (x / 100) * 0.3;
    setCoords({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) });
  };

  /** 步骤表单验证 */
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return title.trim().length > 0 && address.trim().length > 0 && district.trim().length > 0;
      case 2:
        return images.length >= 1;
      case 3:
        return true;
      case 4: {
        const rate = Number(hourlyRate);
        const hasEnabledDay = dayConfigs.some((d) => d.enabled);
        return rate > 0 && hasEnabledDay;
      }
      default:
        return true;
    }
  };

  /** 下一步 */
  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  /** 上一步 */
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  /** 提交表单 */
  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    const availableSlots: TimeSlot[] = dayConfigs
      .map((cfg, idx) =>
        cfg.enabled
          ? ({
              dayOfWeek: idx as TimeSlot['dayOfWeek'],
              startTime: cfg.startTime,
              endTime: cfg.endTime,
            } as TimeSlot)
          : null
      )
      .filter((s): s is TimeSlot => s !== null);

    const formData = {
      title: title.trim(),
      description: description.trim() || '暂无详细描述',
      address: address.trim(),
      district: district.trim(),
      lat: coords.lat,
      lng: coords.lng,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'],
      facilities: selectedFacilities,
      hourlyRate: Number(hourlyRate) || 10,
      dailyCap: Number(dailyCap) || 0,
      availableSlots,
    };

    if (editId) {
      await updateParking(editId, formData);
    } else {
      await publishParking(formData);
    }

    setSubmitted(true);
  };

  /** 提交成功后跳转 */
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate('/owner/parking');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <OwnerSidebar />

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
          {/* ========== 页面标题 ========== */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/owner/parking')}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-brand-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {editId ? '编辑车位' : '发布新车位'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {editId ? '修改车位信息并重新提交审核' : '填写车位详细信息，通过审核后即可上架出租'}
              </p>
            </div>
          </div>

          {/* 提交成功提示 */}
          {submitted && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-center gap-4 animate-slide-down">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-800">
                  {editId ? '修改已提交！' : '发布成功！'}
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                  车位信息已提交，正在等待平台审核，预计1-2个工作日完成。审核通过后将自动上架展示。
                </p>
              </div>
              <Badge variant="warning" size="md">
                审核中
              </Badge>
            </div>
          )}

          {/* ========== Step进度指示器 ========== */}
          <Card>
            <div className="flex items-center justify-between relative">
              {/* 连接线 */}
              <div className="absolute left-10 right-10 top-6 h-0.5 bg-slate-200 -z-0">
                <div
                  className="h-full bg-gradient-brand transition-all duration-500 rounded-full"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />
              </div>

              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.num;
                const isActive = currentStep === step.num;
                return (
                  <div key={step.num} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                    <button
                      onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300',
                        isCompleted
                          ? 'bg-gradient-brand text-white shadow-glow-brand'
                          : isActive
                          ? 'bg-gradient-brand text-white shadow-glow-brand scale-110'
                          : 'bg-white border-2 border-slate-200 text-slate-400',
                        step.num < currentStep && 'cursor-pointer hover:scale-105'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </button>
                    <div className="text-center">
                      <div
                        className={cn(
                          'text-sm font-semibold',
                          isActive || isCompleted ? 'text-slate-800' : 'text-slate-400'
                        )}
                      >
                        步骤{step.num}
                      </div>
                      <div
                        className={cn(
                          'text-xs mt-0.5',
                          isActive ? 'text-brand-600 font-medium' : 'text-slate-400'
                        )}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ========== 表单内容区 ========== */}
          <Card>
            {/* 步骤1：基础信息 */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <MapPin className="w-5 h-5 text-brand-500" />
                    基础信息
                  </h2>
                  <p className="text-sm text-slate-400">填写车位的基本信息，帮助租客快速了解车位情况</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      车位标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="如：国贸CBD地下固定车位、小区内私家车位等"
                      maxLength={50}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-sm"
                    />
                    <div className="text-xs text-slate-400 mt-1.5 text-right">{title.length}/50</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">详细描述</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="详细描述车位情况，如位置优势、周边环境、适合车型等..."
                      rows={4}
                      maxLength={300}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-sm resize-none"
                    />
                    <div className="text-xs text-slate-400 mt-1.5 text-right">{description.length}/300</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        所属区域 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="如：朝阳区、浦东新区等"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        详细地址 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="街道门牌号+具体位置"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      地图定位 <span className="text-red-500">*</span>
                      <span className="text-xs text-slate-400 font-normal ml-2">（点击地图选择车位位置）</span>
                    </label>
                    <div
                      onClick={handleMapClick}
                      className="relative w-full h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden cursor-crosshair group"
                    >
                      {/* SVG 简化地图 */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        {/* 道路线条 */}
                        <line x1="0" y1="130" x2="400" y2="130" stroke="#cbd5e1" strokeWidth="6" />
                        <line x1="200" y1="0" x2="200" y2="260" stroke="#cbd5e1" strokeWidth="6" />
                        <line x1="0" y1="70" x2="400" y2="60" stroke="#e2e8f0" strokeWidth="3" />
                        <line x1="0" y1="200" x2="400" y2="190" stroke="#e2e8f0" strokeWidth="3" />
                        <line x1="80" y1="0" x2="90" y2="260" stroke="#e2e8f0" strokeWidth="3" />
                        <line x1="320" y1="0" x2="310" y2="260" stroke="#e2e8f0" strokeWidth="3" />
                        {/* 街区色块 */}
                        <rect x="10" y="10" width="70" height="50" rx="4" fill="#f1f5f9" stroke="#e2e8f0" />
                        <rect x="100" y="10" width="90" height="110" rx="4" fill="#f8fafc" stroke="#e2e8f0" />
                        <rect x="210" y="10" width="100" height="110" rx="4" fill="#f1f5f9" stroke="#e2e8f0" />
                        <rect x="320" y="10" width="70" height="50" rx="4" fill="#f8fafc" stroke="#e2e8f0" />
                        <rect x="10" y="140" width="70" height="50" rx="4" fill="#f8fafc" stroke="#e2e8f0" />
                        <rect x="100" y="140" width="90" height="110" rx="4" fill="#f1f5f9" stroke="#e2e8f0" />
                        <rect x="210" y="140" width="100" height="110" rx="4" fill="#f8fafc" stroke="#e2e8f0" />
                        <rect x="320" y="140" width="70" height="110" rx="4" fill="#f1f5f9" stroke="#e2e8f0" />
                        {/* 图标区域标记 */}
                        <circle cx="145" cy="65" r="8" fill="#1e3a5f" opacity="0.2" />
                        <circle cx="260" cy="70" r="6" fill="#1e3a5f" opacity="0.15" />
                        <circle cx="145" cy="200" r="6" fill="#1e3a5f" opacity="0.15" />
                        <text x="145" y="70" textAnchor="middle" fontSize="14" fill="#1e3a5f" opacity="0.6">P</text>
                      </svg>

                      {/* 已选位置标记 */}
                      {markerPos && (
                        <div
                          className="absolute -translate-x-1/2 -translate-y-full z-10 animate-bounce-soft"
                          style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%` }}
                        >
                          <div className="relative">
                            <div className="absolute -inset-2 bg-accent-500/20 rounded-full blur-xl" />
                            <MapPin className="w-8 h-8 text-accent-500 drop-shadow-lg relative" fill="#f54e12" />
                          </div>
                        </div>
                      )}

                      {/* 提示层 */}
                      {!markerPos && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors">
                          <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                            <Map className="w-10 h-10" />
                            <span className="text-sm font-medium">点击地图选择车位位置</span>
                          </div>
                        </div>
                      )}

                      {/* 坐标显示 */}
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-500" />
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤2：图片上传 */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <ImageIcon className="w-5 h-5 text-brand-500" />
                    图片上传
                  </h2>
                  <p className="text-sm text-slate-400">
                    上传车位实景照片，清晰的图片能显著提升车位吸引力和出租率
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((idx) => {
                    const img = images[idx];
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'relative aspect-square rounded-2xl border-2 border-dashed overflow-hidden transition-all',
                          img
                            ? 'border-transparent'
                            : 'border-slate-200 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/30 cursor-pointer'
                        )}
                        onClick={() => !img && handleUploadImage()}
                      >
                        {img ? (
                          <>
                            <img
                              src={img}
                              alt={`车位图${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800';
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(idx);
                              }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            {idx === 0 && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent-500 text-white text-xs font-semibold">
                                主图
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                              <Upload className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium">点击上传图片</span>
                            <span className="text-[10px] text-slate-300">最多4张 · 清晰实景</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">图片建议</p>
                    <ul className="text-amber-700/80 space-y-0.5 list-disc list-inside text-xs">
                      <li>首张图片会作为封面，建议选择最能体现车位优势的照片</li>
                      <li>建议拍摄车位整体、入口处、周边环境等不同角度</li>
                      <li>避免模糊、过度修图，真实清晰的图片更受租客信任</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤3：设施配置 */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <Wrench className="w-5 h-5 text-brand-500" />
                    设施配置
                  </h2>
                  <p className="text-sm text-slate-400">选择车位提供的附加设施，完善的配置能吸引更多租客</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {allFacilities.map((f) => {
                    const Icon = f.icon;
                    const selected = selectedFacilities.includes(f.key);
                    return (
                      <button
                        key={f.key}
                        onClick={() => toggleFacility(f.key)}
                        className={cn(
                          'relative p-5 rounded-2xl border-2 transition-all text-left group',
                          selected
                            ? `${f.border} ${f.bg} shadow-md`
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                        )}
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors',
                            selected ? `${f.bg} ${f.color}` : 'bg-slate-100 text-slate-400 group-hover:bg-slate-50'
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div
                          className={cn(
                            'font-semibold transition-colors',
                            selected ? 'text-slate-800' : 'text-slate-600'
                          )}
                        >
                          {f.key}
                        </div>
                        {selected && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">已选择 {selectedFacilities.length} 项设施</span>
                    </div>
                    {selectedFacilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFacilities.map((f) => (
                          <Badge key={f} variant="info" size="sm" showIcon={false}>
                            {f}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 步骤4：价格时段 */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <ClockIcon className="w-5 h-5 text-brand-500" />
                    价格时段
                  </h2>
                  <p className="text-sm text-slate-400">设置车位出租价格和每周开放时段</p>
                </div>

                {/* 价格设置 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100">
                    <label className="block text-sm font-medium text-brand-800 mb-2">
                      小时单价 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-brand-600">¥</span>
                      <input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        min={1}
                        max={200}
                        className="w-24 h-14 px-4 rounded-xl border-2 border-brand-200 bg-white text-3xl font-bold text-brand-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition-all"
                      />
                      <span className="text-brand-600 font-medium">/小时</span>
                    </div>
                    <p className="text-xs text-brand-600/70 mt-3">建议参考周边同类型车位价格设置</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      每日封顶价
                    </label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-amber-600">¥</span>
                      <input
                        type="number"
                        value={dailyCap}
                        onChange={(e) => setDailyCap(e.target.value)}
                        min={0}
                        max={2000}
                        className="w-24 h-14 px-4 rounded-xl border-2 border-amber-200 bg-white text-3xl font-bold text-amber-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                      />
                      <span className="text-amber-600 font-medium">/天</span>
                    </div>
                    <p className="text-xs text-amber-700/70 mt-3">设为0表示不封顶，费用按实际时长计算</p>
                  </div>
                </div>

                {/* 时段设置 */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-slate-800">每周开放时段</h3>
                      <p className="text-xs text-slate-400 mt-1">选择每天是否开放及可预约的时间段</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setDayConfigs((prev) =>
                            prev.map((_, i) => ({
                              enabled: i >= 1 && i <= 5,
                              startTime: '08:00',
                              endTime: '20:00',
                            }))
                          )
                        }
                        className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors"
                      >
                        工作日
                      </button>
                      <button
                        onClick={() =>
                          setDayConfigs((prev) =>
                            prev.map(() => ({
                              enabled: true,
                              startTime: '00:00',
                              endTime: '23:59',
                            }))
                          )
                        }
                        className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors"
                      >
                        全天开放
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {weekDays.map((day, idx) => {
                      const cfg = dayConfigs[idx];
                      const isWeekend = idx === 0 || idx === 6;
                      return (
                        <div
                          key={day}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-xl transition-all',
                            cfg.enabled
                              ? isWeekend
                                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100'
                                : 'bg-white border border-slate-200'
                              : 'bg-slate-50/50 border border-slate-100 opacity-70'
                          )}
                        >
                          <div className="flex items-center gap-3 w-28 shrink-0">
                            <button
                              onClick={() => updateDayConfig(idx, { enabled: !cfg.enabled })}
                              className={cn(
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                                cfg.enabled ? 'bg-brand-500' : 'bg-slate-300'
                              )}
                            >
                              <span
                                className={cn(
                                  'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform',
                                  cfg.enabled ? 'translate-x-6' : 'translate-x-1'
                                )}
                              />
                            </button>
                            <span
                              className={cn(
                                'font-semibold',
                                cfg.enabled
                                  ? isWeekend
                                    ? 'text-amber-700'
                                    : 'text-slate-800'
                                  : 'text-slate-400'
                              )}
                            >
                              {day}
                              {isWeekend && <span className="ml-1 text-xs">（周末）</span>}
                            </span>
                          </div>

                          <div className="flex-1 flex items-center gap-3">
                            <input
                              type="time"
                              value={cfg.startTime}
                              onChange={(e) => updateDayConfig(idx, { startTime: e.target.value })}
                              disabled={!cfg.enabled}
                              className={cn(
                                'h-10 px-4 rounded-xl border bg-white text-sm font-medium outline-none transition-all',
                                cfg.enabled
                                  ? 'border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 text-slate-700'
                                  : 'border-slate-100 text-slate-300 cursor-not-allowed'
                              )}
                            />
                            <span className="text-slate-300 font-light">—</span>
                            <input
                              type="time"
                              value={cfg.endTime}
                              onChange={(e) => updateDayConfig(idx, { endTime: e.target.value })}
                              disabled={!cfg.enabled}
                              className={cn(
                                'h-10 px-4 rounded-xl border bg-white text-sm font-medium outline-none transition-all',
                                cfg.enabled
                                  ? 'border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 text-slate-700'
                                  : 'border-slate-100 text-slate-300 cursor-not-allowed'
                              )}
                            />
                            {cfg.enabled && (
                              <span className="text-xs text-slate-400 ml-2">
                                预计可预约 {formatCurrency(Number(hourlyRate) || 0)} × 时段
                              </span>
                            )}
                          </div>

                          <Badge
                            variant={cfg.enabled ? (isWeekend ? 'warning' : 'success') : 'default'}
                            size="sm"
                            showIcon={false}
                          >
                            {cfg.enabled ? '开放' : '关闭'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 预览汇总 */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                  <h3 className="font-bold text-white/90 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    发布预览
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-white/50 mb-1">小时单价</div>
                      <div className="text-xl font-bold text-accent-400">{formatCurrency(Number(hourlyRate) || 0)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-white/50 mb-1">日封顶</div>
                      <div className="text-xl font-bold text-amber-400">
                        {Number(dailyCap) > 0 ? formatCurrency(Number(dailyCap)) : '不封顶'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-white/50 mb-1">开放天数</div>
                      <div className="text-xl font-bold text-emerald-400">
                        {dayConfigs.filter((d) => d.enabled).length}天/周
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-white/50 mb-1">设施数量</div>
                      <div className="text-xl font-bold text-brand-300">{selectedFacilities.length}项</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ========== 底部操作按钮 ========== */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePrev}
              disabled={currentStep === 1 || submitted}
              leftIcon={<ChevronLeft className="w-5 h-5" />}
            >
              上一步
            </Button>

            <div className="text-sm text-slate-400">
              第 <span className="font-bold text-brand-600">{currentStep}</span> / 4 步
            </div>

            {currentStep < 4 ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!validateStep(currentStep) || submitted}
                rightIcon={<ChevronRight className="w-5 h-5" />}
              >
                下一步
              </Button>
            ) : (
              <Button
                variant="accent"
                size="lg"
                onClick={handleSubmit}
                loading={loading}
                disabled={!validateStep(4) || submitted}
                leftIcon={<Check className="w-5 h-5" />}
              >
                {editId ? '保存修改' : '提交发布'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
