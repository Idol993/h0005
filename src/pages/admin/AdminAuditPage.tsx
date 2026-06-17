import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Square,
  CheckSquare,
  Filter,
  Image,
  Tag,
  DollarSign,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useParkingStore } from '@/store/parkingStore';
import { getOwnerName, findUserById } from '@/data/users';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ParkingSpot, ParkingStatus } from '@/types';

/**
 * 车位审核管理页面
 * 包含待审核统计、状态Tab筛选、审核列表、详情展开、批量操作
 */
export default function AdminAuditPage() {
  const { parkings, auditParking, loading } = useParkingStore();

  /** 当前Tab状态 */
  const [activeTab, setActiveTab] = useState<ParkingStatus | 'all'>('pending');
  /** 搜索关键词 */
  const [searchKeyword, setSearchKeyword] = useState('');
  /** 展开详情的车位ID */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** 选中的车位ID列表（批量操作） */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** 驳回弹窗 */
  const [rejectModal, setRejectModal] = useState<{ open: boolean; parkingId: string | null; isBatch: boolean }>({
    open: false,
    parkingId: null,
    isBatch: false,
  });
  /** 驳回原因输入 */
  const [rejectReason, setRejectReason] = useState('');
  const [rejectPreset, setRejectPreset] = useState('');
  /** 确认弹窗 */
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'approve' | 'reject'; ids: string[] }>({
    open: false,
    type: 'approve',
    ids: [],
  });

  /** 预设驳回原因 */
  const rejectPresets = [
    '车位图片不清晰或与实际不符',
    '产权证明文件不完整或无效',
    '地址信息不准确，无法定位',
    '车位设施描述与实际不符',
    '价格信息不合理',
    '其他原因（请补充说明）',
  ];

  /** ========== 统计数据 ========== */
  const stats = useMemo(() => {
    const pending = parkings.filter((p) => p.status === 'pending').length;
    const approved = parkings.filter((p) => p.status === 'approved').length;
    const rejected = parkings.filter((p) => p.status === 'rejected').length;
    const todayApproved = parkings.filter((p) => {
      if (p.status !== 'approved') return false;
      const d = new Date(p.createdAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;
    const passRate = pending + approved + rejected > 0
      ? Math.round((approved / (approved + rejected)) * 100)
      : 0;

    return {
      pending,
      approved,
      rejected,
      todayApproved,
      passRate,
      avgDuration: '4.2 小时',
    };
  }, [parkings]);

  /** ========== 筛选后的车位列表 ========== */
  const filteredParkings = useMemo(() => {
    let result = parkings;

    if (activeTab !== 'all') {
      result = result.filter((p) => p.status === activeTab);
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.address.toLowerCase().includes(kw) ||
          p.district.toLowerCase().includes(kw) ||
          getOwnerName(p.ownerId).toLowerCase().includes(kw)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [parkings, activeTab, searchKeyword]);

  /** ========== 状态徽章配置 ========== */
  const getStatusBadge = (status: ParkingStatus) => {
    const map: Record<ParkingStatus, { variant: 'warning' | 'success' | 'danger' | 'default'; label: string }> = {
      pending: { variant: 'warning', label: '待审核' },
      approved: { variant: 'success', label: '已通过' },
      rejected: { variant: 'danger', label: '已驳回' },
      offline: { variant: 'default', label: '已下架' },
    };
    return map[status];
  };

  /** ========== 车位状态Tab配置 ========== */
  const tabItems: Array<{ key: ParkingStatus | 'all'; label: string; count: number; variant: 'warning' | 'success' | 'danger' | 'info' | 'default' }> = [
    { key: 'pending', label: '待审核', count: stats.pending, variant: 'warning' },
    { key: 'approved', label: '已通过', count: stats.approved, variant: 'success' },
    { key: 'rejected', label: '已驳回', count: stats.rejected, variant: 'danger' },
    { key: 'all', label: '全部', count: parkings.length, variant: 'info' },
  ];

  /** ========== 全选/取消全选 ========== */
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredParkings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredParkings.map((p) => p.id)));
    }
  };

  /** ========== 单个选择 ========== */
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  /** ========== 通过审核 ========== */
  const handleApprove = async (ids: string[]) => {
    for (const id of ids) {
      await auditParking(id, 'approved');
    }
    setSelectedIds(new Set());
    setConfirmModal({ open: false, type: 'approve', ids: [] });
  };

  /** ========== 驳回审核 ========== */
  const handleReject = async () => {
    const reason = rejectPreset && rejectPreset !== '其他原因（请补充说明）'
      ? rejectPreset + (rejectReason ? `：${rejectReason}` : '')
      : rejectReason || rejectPreset;

    if (!reason.trim()) return;

    const ids = rejectModal.isBatch
      ? Array.from(selectedIds)
      : rejectModal.parkingId
        ? [rejectModal.parkingId]
        : [];

    for (const id of ids) {
      await auditParking(id, 'rejected', reason);
    }

    setSelectedIds(new Set());
    setRejectModal({ open: false, parkingId: null, isBatch: false });
    setRejectReason('');
    setRejectPreset('');
  };

  /** ========== 统计卡片渲染 ========== */
  const StatItem = ({
    icon: Icon,
    label,
    value,
    color,
    iconBg,
  }: {
    icon: typeof ShieldCheck;
    label: string;
    value: string | number;
    color: string;
    iconBg: string;
  }) => (
    <div className="flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
        <Icon className={cn('w-6 h-6', color)} />
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        <div className={cn('text-2xl font-bold tabular-nums', color)}>{value}</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 深色侧边栏 */}
      <AdminSidebar />

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 space-y-6">
          {/* ========== 页面标题 ========== */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">车位审核管理</h1>
            <p className="text-sm text-slate-500 mt-1">审核业主发布的车位信息，确保信息真实有效</p>
          </div>

          {/* ========== 待审核统计条 ========== */}
          <Card className="bg-gradient-to-r from-slate-50 to-white">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatItem
                icon={Clock}
                label="待审数量"
                value={stats.pending}
                color="text-amber-600"
                iconBg="bg-amber-100"
              />
              <StatItem
                icon={CheckCircle2}
                label="今日已审"
                value={stats.todayApproved}
                color="text-emerald-600"
                iconBg="bg-emerald-100"
              />
              <StatItem
                icon={ShieldCheck}
                label="通过率"
                value={`${stats.passRate}%`}
                color="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatItem
                icon={Calendar}
                label="平均审核时长"
                value={stats.avgDuration}
                color="text-indigo-600"
                iconBg="bg-indigo-100"
              />
            </div>
          </Card>

          {/* ========== 状态Tab + 搜索 + 批量操作 ========== */}
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              {/* Tab切换 */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto w-fit">
                {tabItems.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setSelectedIds(new Set());
                    }}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                      activeTab === tab.key
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-semibold',
                        activeTab === tab.key
                          ? 'bg-brand-50 text-brand-600'
                          : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* 搜索框 */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索车位标题、地址、业主..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-72 pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 批量操作栏 */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between px-4 py-3 mb-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Filter className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-indigo-700">
                    已选择 <span className="font-bold">{selectedIds.size}</span> 个车位
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    取消选择
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={loading}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => setConfirmModal({ open: true, type: 'approve', ids: Array.from(selectedIds) })}
                  >
                    批量通过
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={loading}
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => {
                      setRejectModal({ open: true, parkingId: null, isBatch: true });
                      setRejectReason('');
                      setRejectPreset('');
                    }}
                  >
                    批量驳回
                  </Button>
                </div>
              </div>
            )}

            {/* 全选栏 */}
            <div className="flex items-center justify-between px-1 mb-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors"
              >
                {selectedIds.size === filteredParkings.length && filteredParkings.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-brand-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                全选当前列表（{filteredParkings.length}项）
              </button>
              <span className="text-xs text-slate-400">共 {filteredParkings.length} 条记录</span>
            </div>

            {/* ========== 审核列表 ========== */}
            <div className="space-y-4">
              {filteredParkings.length === 0 ? (
                <div className="py-16 text-center">
                  <Filter className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-400">暂无符合条件的车位</p>
                </div>
              ) : (
                filteredParkings.map((parking) => {
                  const badge = getStatusBadge(parking.status);
                  const owner = findUserById(parking.ownerId);
                  const isExpanded = expandedId === parking.id;
                  const isSelected = selectedIds.has(parking.id);

                  return (
                    <div
                      key={parking.id}
                      className={cn(
                        'rounded-2xl border transition-all overflow-hidden',
                        isSelected
                          ? 'border-brand-300 bg-brand-50/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      )}
                    >
                      {/* 列表项头部 */}
                      <div className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* 选择框 */}
                          <button
                            onClick={() => toggleSelect(parking.id)}
                            className="shrink-0 self-start lg:self-center mt-0.5"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-brand-500" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 hover:text-slate-500 transition-colors" />
                            )}
                          </button>

                          {/* 车位缩略图 */}
                          <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                            {parking.images[0] ? (
                              <img
                                src={parking.images[0]}
                                alt={parking.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Image className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          {/* 基本信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="text-base font-semibold text-slate-800 truncate">
                                {parking.title}
                              </h3>
                              <Badge variant={badge.variant} size="md">
                                {badge.label}
                              </Badge>
                            </div>

                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">{parking.address}</span>
                              </div>
                              <div className="flex items-center gap-4 text-slate-600">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span>{owner?.nickname || getOwnerName(parking.ownerId)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span>{formatDate(parking.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span>¥{parking.hourlyRate}/时</span>
                                </div>
                              </div>
                            </div>

                            {/* 驳回原因显示 */}
                            {parking.status === 'rejected' && parking.auditReason && (
                              <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                                <div className="flex items-start gap-2 text-xs text-red-700">
                                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold">驳回原因：</span>
                                    {parking.auditReason}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex lg:flex-col items-center lg:items-end gap-2 shrink-0">
                            {parking.status === 'pending' && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={loading}
                                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                                  onClick={() => setConfirmModal({ open: true, type: 'approve', ids: [parking.id] })}
                                >
                                  通过
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  loading={loading}
                                  leftIcon={<XCircle className="w-4 h-4" />}
                                  onClick={() => {
                                    setRejectModal({ open: true, parkingId: parking.id, isBatch: false });
                                    setRejectReason('');
                                    setRejectPreset('');
                                  }}
                                >
                                  驳回
                                </Button>
                              </>
                            )}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : parking.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-all"
                            >
                              {isExpanded ? '收起' : '查看详情'}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 展开详情区域 */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                            {/* 设施标签 */}
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                车位设施
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {parking.facilities.length === 0 ? (
                                  <span className="text-sm text-slate-400">暂无设施信息</span>
                                ) : (
                                  parking.facilities.map((f) => (
                                    <span
                                      key={f}
                                      className="px-3 py-1 rounded-lg bg-white text-sm text-slate-700 border border-slate-200 shadow-sm"
                                    >
                                      {f}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* 价格时段 */}
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5" />
                                价格与时段
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 rounded-lg bg-white border border-slate-200">
                                  <div className="text-xs text-slate-500 mb-1">小时单价</div>
                                  <div className="text-xl font-bold text-accent-600">¥{parking.hourlyRate}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-slate-200">
                                  <div className="text-xs text-slate-500 mb-1">每日封顶</div>
                                  <div className="text-xl font-bold text-indigo-600">
                                    {parking.dailyCap > 0 ? `¥${parking.dailyCap}` : '无封顶'}
                                  </div>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-slate-200">
                                  <div className="text-xs text-slate-500 mb-1">可用时段数</div>
                                  <div className="text-xl font-bold text-emerald-600">
                                    {parking.availableSlots.length} 段
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 产权证明图片 */}
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                车位图片 / 产权证明
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {parking.images.slice(0, 3).map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                  >
                                    <img
                                      src={img}
                                      alt={`车位图片${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                                {parking.images.length === 0 && (
                                  <div className="col-span-3 p-6 rounded-lg bg-white border border-slate-200 border-dashed text-center text-slate-400 text-sm">
                                    <Image className="w-8 h-8 mx-auto mb-2" />
                                    未上传图片
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 车位描述 */}
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">车位描述</div>
                              <p className="text-sm text-slate-700 leading-relaxed p-3 rounded-lg bg-white border border-slate-200">
                                {parking.description || '暂无描述'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* ========== 确认弹窗 ========== */}
      <Modal
        open={confirmModal.open}
        title={confirmModal.type === 'approve' ? '确认通过审核' : '确认操作'}
        size="sm"
        onClose={() => setConfirmModal({ open: false, type: 'approve', ids: [] })}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ open: false, type: 'approve', ids: [] })}
            >
              取消
            </Button>
            <Button
              variant={confirmModal.type === 'approve' ? 'primary' : 'danger'}
              loading={loading}
              onClick={() => handleApprove(confirmModal.ids)}
            >
              确认通过
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-slate-700">
            确定通过 <span className="font-bold text-brand-600">{confirmModal.ids.length}</span> 个车位的审核？
          </p>
          <p className="text-xs text-slate-400 mt-2">通过后车位将正式上架，用户可进行预订</p>
        </div>
      </Modal>

      {/* ========== 驳回弹窗 ========== */}
      <Modal
        open={rejectModal.open}
        title={rejectModal.isBatch ? `批量驳回（${selectedIds.size}个车位）` : '驳回车位审核'}
        size="lg"
        onClose={() => setRejectModal({ open: false, parkingId: null, isBatch: false })}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setRejectModal({ open: false, parkingId: null, isBatch: false })}
            >
              取消
            </Button>
            <Button
              variant="danger"
              loading={loading}
              disabled={!rejectPreset && !rejectReason.trim()}
              leftIcon={<XCircle className="w-4 h-4" />}
              onClick={handleReject}
            >
              确认驳回
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-semibold mb-1">驳回后将通知业主</p>
                <p className="text-red-600/80">请务必填写清晰的驳回原因，便于业主了解问题并重新提交</p>
              </div>
            </div>
          </div>

          {/* 预设原因 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择预设原因 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rejectPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setRejectPreset(preset)}
                  className={cn(
                    'p-3 rounded-xl text-left text-sm transition-all border-2',
                    rejectPreset === preset
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 自定义原因 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              补充说明 {rejectPreset ? '（可选）' : <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="请详细说明驳回原因，便于业主了解具体问题..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
