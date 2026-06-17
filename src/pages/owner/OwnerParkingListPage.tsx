import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  PlusCircle,
  Star,
  Edit3,
  BarChart3,
  Trash2,
  ChevronDown,
  Clock,
  Zap,
  ShieldCheck,
  Camera,
  Trees,
  Car,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useParkingStore } from '@/store/parkingStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ParkingSpot, ParkingStatus } from '@/types';

/**
 * 车位管理列表页面
 * 展示业主所有车位的列表，支持搜索、筛选、上下架、编辑等操作
 */
export default function OwnerParkingListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { parkings, updateParking, auditParking } = useParkingStore();

  /** 搜索关键词 */
  const [keyword, setKeyword] = useState('');
  /** 状态筛选 */
  const [statusFilter, setStatusFilter] = useState<ParkingStatus | 'all'>('all');
  /** 展开的状态筛选下拉 */
  const [filterOpen, setFilterOpen] = useState(false);
  /** 删除确认弹窗 */
  const [deleteTarget, setDeleteTarget] = useState<ParkingSpot | null>(null);

  const ownerId = user?.id || 'o001';

  /** 状态选项配置 */
  const statusOptions: Array<{ value: ParkingStatus | 'all'; label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = [
    { value: 'all', label: '全部状态', variant: 'default' },
    { value: 'approved', label: '已上架', variant: 'success' },
    { value: 'pending', label: '审核中', variant: 'warning' },
    { value: 'offline', label: '已下架', variant: 'info' },
    { value: 'rejected', label: '已驳回', variant: 'danger' },
  ];

  /** 业主的车位列表（带筛选） */
  const filteredParkings = useMemo(() => {
    let list = parkings.filter((p) => p.ownerId === ownerId);
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.address.toLowerCase().includes(kw) ||
          p.district.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [parkings, ownerId, statusFilter, keyword]);

  /** 状态徽章配置 */
  const getStatusBadge = (status: ParkingStatus) => {
    const map: Record<ParkingStatus, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string; icon: typeof CheckCircle2 }> = {
      approved: { variant: 'success', label: '已上架', icon: CheckCircle2 },
      pending: { variant: 'warning', label: '审核中', icon: AlertTriangle },
      rejected: { variant: 'danger', label: '已驳回', icon: XCircle },
      offline: { variant: 'info', label: '已下架', icon: EyeOff },
    };
    return map[status];
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
      '智能道闸': Zap,
      '24h监控': Camera,
      '安保巡逻': ShieldCheck,
    };
    return iconMap[facility] || Zap;
  };

  /** 切换上下架 */
  const handleToggleStatus = async (parking: ParkingSpot) => {
    if (parking.status === 'pending' || parking.status === 'rejected') return;
    const newStatus: ParkingStatus = parking.status === 'approved' ? 'offline' : 'approved';
    await auditParking(parking.id, newStatus);
  };

  /** 删除车位（模拟） */
  const handleDelete = async (parking: ParkingSpot) => {
    await updateParking(parking.id, { status: 'offline', auditReason: '业主主动删除' });
    setDeleteTarget(null);
  };

  /** 编辑车位 */
  const handleEdit = (parking: ParkingSpot) => {
    navigate(`/owner/publish?id=${parking.id}`);
  };

  /** 查看数据 */
  const handleViewStats = (parking: ParkingSpot) => {
    navigate(`/owner/parking/${parking.id}/stats`);
  };

  const currentFilter = statusOptions.find((o) => o.value === statusFilter) || statusOptions[0];

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
              <h1 className="text-2xl font-bold text-slate-800">车位管理</h1>
              <p className="text-sm text-slate-400 mt-1">
                共 {filteredParkings.length} 个车位
                {statusFilter !== 'all' && ` · ${currentFilter.label}`}
                {keyword && ` · 搜索："${keyword}"`}
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<PlusCircle className="w-5 h-5" />}
              onClick={() => navigate('/owner/publish')}
            >
              发布新车位
            </Button>
          </div>

          {/* ========== 顶部工具栏 ========== */}
          <Card>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索车位标题、地址、区域..."
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all text-sm"
                />
              </div>

              {/* 状态筛选下拉 */}
              <div className="relative w-full lg:w-48">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50/30 transition-all flex items-center justify-between gap-2"
                >
                  <Badge variant={currentFilter.variant} size="sm" showIcon={currentFilter.value !== 'all'}>
                    {currentFilter.label}
                  </Badge>
                  <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', filterOpen && 'rotate-180')} />
                </button>
                {filterOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white rounded-xl border border-slate-200 shadow-card-hover z-20 animate-slide-down">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setStatusFilter(opt.value);
                          setFilterOpen(false);
                        }}
                        className={cn(
                          'w-full px-3 py-2 rounded-lg text-left flex items-center justify-between transition-colors',
                          statusFilter === opt.value
                            ? 'bg-brand-50 text-brand-700'
                            : 'hover:bg-slate-50 text-slate-600'
                        )}
                      >
                        <Badge variant={opt.variant} size="sm" showIcon={opt.value !== 'all'}>
                          {opt.label}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ========== 车位卡片网格 ========== */}
          {filteredParkings.length === 0 ? (
            <Card>
              <EmptyState
                type="data"
                title={keyword ? '未找到匹配的车位' : '暂无车位'}
                description={keyword ? '试试调整搜索关键词或筛选条件' : '点击上方按钮发布您的第一个车位'}
                actionText={keyword ? undefined : '立即发布'}
                onAction={keyword ? undefined : () => navigate('/owner/publish')}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredParkings.map((parking, idx) => {
                const badge = getStatusBadge(parking.status);
                const canToggle = parking.status !== 'pending' && parking.status !== 'rejected';
                return (
                  <Card
                    key={parking.id}
                    hoverable
                    className="overflow-hidden group animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="-m-5 mb-4">
                      {/* 车位图片区 */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={parking.images[0]}
                          alt={parking.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800';
                          }}
                        />
                        {/* 状态徽章 */}
                        <div className="absolute top-3 left-3">
                          <Badge variant={badge.variant} size="md">
                            {badge.label}
                          </Badge>
                        </div>
                        {/* 图片数量 */}
                        {parking.images.length > 1 && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {parking.images.length}张
                          </div>
                        )}
                        {/* 驳回原因提示 */}
                        {parking.status === 'rejected' && parking.auditReason && (
                          <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-gradient-to-t from-red-600/95 to-red-500/80 backdrop-blur text-white text-xs">
                            <div className="font-semibold mb-0.5 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              驳回原因
                            </div>
                            <div className="opacity-90 line-clamp-2">{parking.auditReason}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 车位信息 */}
                    <div className="space-y-3">
                      {/* 标题和地址 */}
                      <div>
                        <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-brand-600 transition-colors">
                          {parking.title}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-start gap-1 line-clamp-2 mt-1">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                          {parking.address}
                        </p>
                      </div>

                      {/* 价格信息 */}
                      <div className="flex items-baseline gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50">
                        <div>
                          <span className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                            {formatCurrency(parking.hourlyRate)}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">/小时</span>
                        </div>
                        {parking.dailyCap > 0 && (
                          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white text-slate-500 border border-slate-200">
                            <Clock className="w-3 h-3" />
                            日封顶 {formatCurrency(parking.dailyCap)}
                          </div>
                        )}
                      </div>

                      {/* 评分和预订数 */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-slate-700">
                            {parking.avgRating > 0 ? parking.avgRating.toFixed(1) : '暂无'}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="text-slate-500">
                          <span className="font-semibold text-brand-600">{parking.totalBookings}</span>
                          <span className="ml-1">次预订</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="text-xs text-slate-400">
                          {formatDate(parking.createdAt)} 发布
                        </div>
                      </div>

                      {/* 设施图标 */}
                      <div className="flex items-center gap-2">
                        {parking.facilities.slice(0, 6).map((f) => {
                          const Icon = getFacilityIcon(f);
                          return (
                            <div
                              key={f}
                              className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                              title={f}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                          );
                        })}
                        {parking.facilities.length > 6 && (
                          <span className="text-xs text-slate-400 px-2">
                            +{parking.facilities.length - 6}
                          </span>
                        )}
                      </div>

                      {/* 上下架开关 */}
                      <div className="flex items-center justify-between py-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm">
                          {canToggle ? (
                            <>
                              {parking.status === 'approved' ? (
                                <Eye className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-400" />
                              )}
                              <span className="text-slate-600">
                                {parking.status === 'approved' ? '已上架展示中' : '已下架隐藏'}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              <span className="text-slate-500 text-xs">
                                {parking.status === 'pending' ? '审核完成后可操作' : '修改后重新提交'}
                              </span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleStatus(parking)}
                          disabled={!canToggle}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            parking.status === 'approved' ? 'bg-brand-500' : 'bg-slate-300',
                            !canToggle && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform',
                              parking.status === 'approved' ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          leftIcon={<Edit3 className="w-4 h-4" />}
                          onClick={() => handleEdit(parking)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          leftIcon={<BarChart3 className="w-4 h-4" />}
                          onClick={() => handleViewStats(parking)}
                        >
                          数据
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!px-3 text-red-500 hover:!bg-red-50 hover:!text-red-600"
                          onClick={() => setDeleteTarget(parking)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white shadow-2xl animate-slide-down">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">确认删除车位？</h3>
                <p className="text-sm text-slate-500 mt-0.5">此操作将下架车位，可重新上架</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 mb-5">
              <p className="text-sm font-medium text-slate-700">{deleteTarget.title}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {deleteTarget.address}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
              >
                取消
              </Button>
              <Button
                variant="danger"
                size="lg"
                className="flex-1"
                onClick={() => handleDelete(deleteTarget)}
              >
                确认下架
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
