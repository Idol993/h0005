import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Ban,
  Search,
  Filter,
  Plus,
  User,
  Calendar,
  Image,
  ShieldAlert,
  AlertCircle,
  XCircle,
  FileWarning,
  CheckCircle2,
  Eye,
  Upload,
  X,
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useAdminStore } from '@/store/adminStore';
import { findUserById, users } from '@/data/users';
import { getViolationTypeText, getPenaltyText, findViolationsByUser } from '@/data/adminData';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ViolationRecord, ViolationType, PenaltyType, UserRole } from '@/types';
import { UserRole as UserRoleEnum } from '@/types';

/**
 * 违规处罚管理页面
 * 包含违规统计、筛选、违规记录表格、新增违规、处罚操作
 */
export default function AdminViolationsPage() {
  const { violations, addViolation, loading } = useAdminStore();

  /** 用户角色筛选 */
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  /** 违规类型筛选 */
  const [typeFilter, setTypeFilter] = useState<ViolationType | 'all'>('all');
  /** 处罚方式筛选 */
  const [penaltyFilter, setPenaltyFilter] = useState<PenaltyType | 'all'>('all');
  /** 搜索关键词 */
  const [searchKeyword, setSearchKeyword] = useState('');

  /** 新增违规弹窗 */
  const [addModal, setAddModal] = useState(false);
  /** 处罚弹窗 */
  const [penaltyModal, setPenaltyModal] = useState<{ open: boolean; violation: ViolationRecord | null }>({
    open: false,
    violation: null,
  });
  /** 处罚确认弹窗 */
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; penalty: PenaltyType; suspendDays?: number }>({
    open: false,
    penalty: 'warning',
  });

  /** 新增违规表单 */
  const [newViolation, setNewViolation] = useState({
    userId: '',
    userSearch: '',
    type: 'fake_listing' as ViolationType,
    description: '',
    penalty: 'warning' as PenaltyType,
    suspendDays: 7,
    evidence: [] as string[],
  });

  /** 处罚选择 */
  const [selectedPenalty, setSelectedPenalty] = useState<PenaltyType>('warning');
  const [suspendDaysInput, setSuspendDaysInput] = useState(7);

  /** ========== 违规统计 ========== */
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekNew = violations.filter((v) => new Date(v.createdAt) >= weekAgo).length;
    const processing = violations.filter((v) => v.penalty === 'warning' && v.type !== 'fake_listing').length;
    const banned = users.filter((u) => u.banned).length;
    const pendingPenalty = violations.filter((v) => v.penalty === 'warning').length;

    return {
      weekNew,
      processing,
      banned,
      pendingPenalty,
    };
  }, [violations]);

  /** ========== 计算用户违规次数 ========== */
  const getUserViolationCount = (userId: string) => {
    return violations.filter((v) => v.userId === userId).length;
  };

  /** ========== 用户是否连续3次虚假发布 ========== */
  const isBanned3xFake = (userId: string) => {
    const userViolations = violations.filter(
      (v) => v.userId === userId && v.type === 'fake_listing'
    );
    return userViolations.length >= 3;
  };

  /** ========== 搜索用户（新增违规用） ========== */
  const searchedUsers = useMemo(() => {
    if (!newViolation.userSearch.trim()) return [];
    const kw = newViolation.userSearch.toLowerCase();
    return users
      .filter(
        (u) =>
          u.role !== UserRoleEnum.ADMIN &&
          (u.nickname.toLowerCase().includes(kw) ||
            u.phone.includes(kw) ||
            u.id.toLowerCase().includes(kw))
      )
      .slice(0, 5);
  }, [newViolation.userSearch]);

  /** ========== 筛选后的违规记录 ========== */
  const filteredViolations = useMemo(() => {
    let result = violations;

    if (roleFilter !== 'all') {
      result = result.filter((v) => {
        const user = findUserById(v.userId);
        return user?.role === roleFilter;
      });
    }

    if (typeFilter !== 'all') {
      result = result.filter((v) => v.type === typeFilter);
    }

    if (penaltyFilter !== 'all') {
      result = result.filter((v) => v.penalty === penaltyFilter);
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter((v) => {
        const user = findUserById(v.userId);
        return (
          v.description.toLowerCase().includes(kw) ||
          user?.nickname.toLowerCase().includes(kw) ||
          user?.phone.includes(kw) ||
          v.id.toLowerCase().includes(kw)
        );
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [violations, roleFilter, typeFilter, penaltyFilter, searchKeyword]);

  /** ========== 违规类型徽章 ========== */
  const getTypeBadge = (type: ViolationType) => {
    const map: Record<ViolationType, { variant: 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
      fake_listing: { variant: 'danger', label: '虚假发布' },
      overstay: { variant: 'warning', label: '超时停车' },
      payment_default: { variant: 'info', label: '拖欠费用' },
      abuse: { variant: 'warning', label: '恶意行为' },
    };
    return map[type];
  };

  /** ========== 处罚徽章 ========== */
  const getPenaltyBadge = (penalty: PenaltyType, days?: number) => {
    const map: Record<PenaltyType, { variant: 'info' | 'warning' | 'danger'; label: string }> = {
      warning: { variant: 'info', label: '警告' },
      suspend: { variant: 'warning', label: `暂停${days || 0}天` },
      ban: { variant: 'danger', label: '永久封禁' },
    };
    return map[penalty];
  };

  /** ========== 提交新增违规 ========== */
  const handleAddViolation = async () => {
    if (!newViolation.userId || !newViolation.description.trim()) return;

    await addViolation({
      userId: newViolation.userId,
      type: newViolation.type,
      description: newViolation.description,
      penalty: newViolation.penalty,
      suspendDays: newViolation.penalty === 'suspend' ? newViolation.suspendDays : undefined,
      evidence: newViolation.evidence,
    });

    setAddModal(false);
    setNewViolation({
      userId: '',
      userSearch: '',
      type: 'fake_listing',
      description: '',
      penalty: 'warning',
      suspendDays: 7,
      evidence: [],
    });
  };

  /** ========== 确认处罚 ========== */
  const handleConfirmPenalty = async () => {
    if (!penaltyModal.violation) return;
    await addViolation({
      userId: penaltyModal.violation.userId,
      type: penaltyModal.violation.type,
      description: penaltyModal.violation.description,
      penalty: confirmModal.penalty,
      suspendDays: confirmModal.suspendDays,
    });
    setConfirmModal({ open: false, penalty: 'warning' });
    setPenaltyModal({ open: false, violation: null });
  };

  /** 统计卡片渲染 */
  const StatItem = ({
    icon: Icon,
    label,
    value,
    color,
    iconBg,
  }: {
    icon: typeof AlertTriangle;
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">违规处罚管理</h1>
              <p className="text-sm text-slate-500 mt-1">管理用户违规行为，维护平台良好秩序</p>
            </div>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setAddModal(true)}
            >
              新增违规记录
            </Button>
          </div>

          {/* ========== 违规统计条 ========== */}
          <Card className="bg-gradient-to-r from-slate-50 to-white">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatItem
                icon={FileWarning}
                label="本周新增"
                value={stats.weekNew}
                color="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatItem
                icon={Clock}
                label="处理中"
                value={stats.processing}
                color="text-amber-600"
                iconBg="bg-amber-100"
              />
              <StatItem
                icon={Ban}
                label="已封号"
                value={stats.banned}
                color="text-red-600"
                iconBg="bg-red-100"
              />
              <StatItem
                icon={AlertCircle}
                label="待处罚"
                value={stats.pendingPenalty}
                color="text-indigo-600"
                iconBg="bg-indigo-100"
              />
            </div>
          </Card>

          {/* ========== 筛选区 ========== */}
          <Card>
            <div className="flex flex-col gap-4 mb-5">
              {/* 筛选行 */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                      className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                    >
                      <option value="all">全部角色</option>
                      <option value="driver">驾驶员</option>
                      <option value="owner">业主</option>
                    </select>
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as ViolationType | 'all')}
                    className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                  >
                    <option value="all">全部违规类型</option>
                    <option value="fake_listing">虚假发布</option>
                    <option value="overstay">超时停车</option>
                    <option value="payment_default">拖欠费用</option>
                    <option value="abuse">恶意行为</option>
                  </select>

                  <select
                    value={penaltyFilter}
                    onChange={(e) => setPenaltyFilter(e.target.value as PenaltyType | 'all')}
                    className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                  >
                    <option value="all">全部处罚</option>
                    <option value="warning">警告</option>
                    <option value="suspend">暂停使用</option>
                    <option value="ban">永久封禁</option>
                  </select>
                </div>

                <div className="flex-1 lg:max-w-sm relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索用户、违规描述..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="text-sm text-slate-500 lg:ml-auto">
                  共 <span className="font-bold text-slate-700">{filteredViolations.length}</span> 条记录
                </div>
              </div>
            </div>

            {/* ========== 违规记录表格 ========== */}
            <div className="overflow-x-auto -mx-5">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium whitespace-nowrap">时间</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">用户信息</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">违规类型</th>
                    <th className="px-5 py-3 font-medium">违规描述</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">证据</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">处罚</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredViolations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                        <FileWarning className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>暂无违规记录</p>
                      </td>
                    </tr>
                  ) : (
                    filteredViolations.map((violation) => {
                      const user = findUserById(violation.userId);
                      const typeBadge = getTypeBadge(violation.type);
                      const penaltyBadge = getPenaltyBadge(violation.penalty, violation.suspendDays);
                      const isOwner = user?.role === UserRoleEnum.OWNER;
                      const violationCount = getUserViolationCount(violation.userId);
                      const isBanned3x = isOwner && isBanned3xFake(violation.userId);

                      return (
                        <tr
                          key={violation.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          {/* 时间 */}
                          <td className="px-5 py-4">
                            <div className="text-sm text-slate-700 whitespace-nowrap">
                              {formatDate(violation.createdAt)}
                            </div>
                            <div className="text-xs text-slate-400">
                              {(() => {
                                const d = new Date(violation.createdAt);
                                return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                              })()}
                            </div>
                          </td>

                          {/* 用户信息 */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={user?.avatar}
                                  alt={user?.nickname}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                                {user?.banned && (
                                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-white">
                                    <Ban className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-slate-800">
                                    {user?.nickname || '未知'}
                                  </span>
                                  <Badge
                                    variant={isOwner ? 'info' : 'default'}
                                    size="sm"
                                    showIcon={false}
                                  >
                                    {isOwner ? '业主' : '驾驶员'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-slate-400">
                                    {user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                                  </span>
                                  {violationCount > 0 && (
                                    <span
                                      className={cn(
                                        'text-xs px-1.5 py-0.5 rounded-md font-semibold',
                                        violationCount >= 3
                                          ? 'bg-red-100 text-red-600'
                                          : 'bg-amber-100 text-amber-600'
                                      )}
                                    >
                                      违规{violationCount}次
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 违规类型 */}
                          <td className="px-5 py-4">
                            <Badge variant={typeBadge.variant} size="md">
                              {typeBadge.label}
                            </Badge>
                          </td>

                          {/* 违规描述 */}
                          <td className="px-5 py-4 max-w-xs">
                            <p className="text-sm text-slate-700 line-clamp-2">
                              {violation.description}
                            </p>
                          </td>

                          {/* 证据 */}
                          <td className="px-5 py-4">
                            {violation.evidence.length > 0 ? (
                              <div className="flex -space-x-2">
                                {violation.evidence.slice(0, 3).map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:z-10 hover:scale-110 transition-all"
                                  >
                                    <img
                                      src={img}
                                      alt={`证据${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                                {violation.evidence.length > 3 && (
                                  <div className="w-8 h-8 rounded-lg bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                    +{violation.evidence.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">无</span>
                            )}
                          </td>

                          {/* 处罚 */}
                          <td className="px-5 py-4">
                            <Badge variant={penaltyBadge.variant} size="md">
                              {penaltyBadge.label}
                            </Badge>
                          </td>

                          {/* 操作 */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                              >
                                详情
                              </Button>
                              {isBanned3x ? (
                                <Badge variant="danger" size="sm">
                                  <Ban className="w-3 h-3 mr-1" />
                                  已封号
                                </Badge>
                              ) : (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  loading={loading}
                                  leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                                  onClick={() => {
                                    setPenaltyModal({ open: true, violation });
                                    setSelectedPenalty('warning');
                                    setSuspendDaysInput(7);
                                  }}
                                >
                                  处罚
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      {/* ========== 新增违规弹窗 ========== */}
      <Modal
        open={addModal}
        title="新增违规记录"
        size="xl"
        onClose={() => setAddModal(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              loading={loading}
              disabled={!newViolation.userId || !newViolation.description.trim()}
              onClick={handleAddViolation}
            >
              提交记录
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* 搜索用户 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              选择违规用户 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索用户昵称、手机号或ID..."
                value={newViolation.userSearch}
                onChange={(e) =>
                  setNewViolation({ ...newViolation, userSearch: e.target.value, userId: '' })
                }
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
            {searchedUsers.length > 0 && (
              <div className="mt-2 p-2 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
                {searchedUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() =>
                      setNewViolation({
                        ...newViolation,
                        userId: u.id,
                        userSearch: u.nickname,
                      })
                    }
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left',
                      newViolation.userId === u.id
                        ? 'bg-brand-50 ring-2 ring-brand-200'
                        : 'hover:bg-slate-50'
                    )}
                  >
                    <img
                      src={u.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{u.nickname}</span>
                        <Badge
                          variant={u.role === UserRoleEnum.OWNER ? 'info' : 'default'}
                          size="sm"
                          showIcon={false}
                        >
                          {u.role === UserRoleEnum.OWNER ? '业主' : '驾驶员'}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400">
                        {u.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                      </div>
                    </div>
                    {newViolation.userId === u.id && (
                      <CheckCircle2 className="w-5 h-5 text-brand-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 违规类型 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              违规类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['fake_listing', 'overstay', 'payment_default', 'abuse'] as ViolationType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewViolation({ ...newViolation, type: t })}
                  className={cn(
                    'p-3 rounded-xl border-2 text-sm font-medium transition-all',
                    newViolation.type === t
                      ? t === 'fake_listing' || t === 'abuse'
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : t === 'overstay'
                          ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {getViolationTypeText(t)}
                </button>
              ))}
            </div>
          </div>

          {/* 违规描述 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileWarning className="w-4 h-4 inline mr-1" />
              违规描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newViolation.description}
              onChange={(e) => setNewViolation({ ...newViolation, description: e.target.value })}
              rows={3}
              placeholder="请详细描述违规行为..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          {/* 处罚方式 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <ShieldAlert className="w-4 h-4 inline mr-1" />
              处罚方式
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(['warning', 'suspend', 'ban'] as PenaltyType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewViolation({ ...newViolation, penalty: p })}
                  className={cn(
                    'p-3 rounded-xl border-2 text-sm font-medium transition-all',
                    newViolation.penalty === p
                      ? p === 'warning'
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : p === 'suspend'
                          ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-red-400 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {p === 'warning' ? '警告' : p === 'suspend' ? '暂停使用' : '永久封禁'}
                </button>
              ))}
            </div>
            {newViolation.penalty === 'suspend' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">暂停天数</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={newViolation.suspendDays}
                  onChange={(e) =>
                    setNewViolation({ ...newViolation, suspendDays: parseInt(e.target.value) || 7 })
                  }
                  className="w-32 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
                <span className="ml-2 text-xs text-slate-400">天</span>
              </div>
            )}
          </div>

          {/* 证据上传 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              证据图片（可选）
            </label>
            <div className="flex flex-wrap gap-2">
              {newViolation.evidence.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() =>
                      setNewViolation({
                        ...newViolation,
                        evidence: newViolation.evidence.filter((_, i) => i !== idx),
                      })
                    }
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setNewViolation({
                    ...newViolation,
                    evidence: [
                      ...newViolation.evidence,
                      `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=300`,
                    ],
                  })
                }
                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
              >
                <Plus className="w-5 h-5 mb-1" />
                <span className="text-[10px]">添加图片</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========== 处罚弹窗 ========== */}
      <Modal
        open={penaltyModal.open}
        title="执行处罚"
        size="lg"
        onClose={() => setPenaltyModal({ open: false, violation: null })}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPenaltyModal({ open: false, violation: null })}>
              取消
            </Button>
            <Button
              variant={selectedPenalty === 'ban' ? 'danger' : 'primary'}
              loading={loading}
              onClick={() =>
                setConfirmModal({
                  open: true,
                  penalty: selectedPenalty,
                  suspendDays: selectedPenalty === 'suspend' ? suspendDaysInput : undefined,
                })
              }
            >
              确认处罚
            </Button>
          </div>
        }
      >
        {penaltyModal.violation && (
          <div className="space-y-5">
            {/* 违规摘要 */}
            {(() => {
              const user = findUserById(penaltyModal.violation.userId);
              const typeBadge = getTypeBadge(penaltyModal.violation.type);
              const vCount = getUserViolationCount(penaltyModal.violation.userId);
              return (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <img
                          src={user?.avatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border-2 border-white"
                        />
                        <span className="font-semibold text-slate-800">{user?.nickname}</span>
                        <Badge variant={typeBadge.variant} size="sm">
                          {typeBadge.label}
                        </Badge>
                        {vCount > 0 && (
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-md font-semibold',
                              vCount >= 3
                                ? 'bg-red-100 text-red-600'
                                : 'bg-amber-100 text-amber-700'
                            )}
                          >
                            第{vCount}次违规
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-amber-900/80 line-clamp-2">
                        {penaltyModal.violation.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 选择处罚 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                选择处罚方式 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2.5">
                <button
                  onClick={() => setSelectedPenalty('warning')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
                    selectedPenalty === 'warning'
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      selectedPenalty === 'warning' ? 'bg-blue-500' : 'bg-blue-100'
                    )}
                  >
                    <AlertCircle
                      className={cn('w-5 h-5', selectedPenalty === 'warning' ? 'text-white' : 'text-blue-500')}
                    />
                  </div>
                  <div className="flex-1">
                    <div className={cn('font-semibold', selectedPenalty === 'warning' ? 'text-blue-800' : 'text-slate-800')}>
                      口头警告
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">适用于首次轻微违规，提醒用户注意</div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPenalty('suspend')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
                    selectedPenalty === 'suspend'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      selectedPenalty === 'suspend' ? 'bg-amber-500' : 'bg-amber-100'
                    )}
                  >
                    <Clock
                      className={cn('w-5 h-5', selectedPenalty === 'suspend' ? 'text-white' : 'text-amber-500')}
                    />
                  </div>
                  <div className="flex-1">
                    <div className={cn('font-semibold', selectedPenalty === 'suspend' ? 'text-amber-800' : 'text-slate-800')}>
                      暂停使用
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">暂停账号使用一段时间，期满自动恢复</div>
                  </div>
                </button>

                {selectedPenalty === 'suspend' && (
                  <div className="ml-14">
                    <label className="block text-xs text-slate-500 mb-1.5">暂停天数</label>
                    <div className="flex items-center gap-2">
                      {[7, 14, 30].map((d) => (
                        <button
                          key={d}
                          onClick={() => setSuspendDaysInput(d)}
                          className={cn(
                            'h-9 px-4 rounded-lg text-sm font-medium transition-all border-2',
                            suspendDaysInput === d
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                          )}
                        >
                          {d}天
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        value={suspendDaysInput}
                        onChange={(e) => setSuspendDaysInput(parseInt(e.target.value) || 7)}
                        className="w-20 h-9 px-3 rounded-lg border-2 border-slate-200 bg-white text-sm focus:outline-none focus:border-amber-400 transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedPenalty('ban')}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left',
                    selectedPenalty === 'ban'
                      ? 'border-red-400 bg-red-50 ring-4 ring-red-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      selectedPenalty === 'ban' ? 'bg-red-500' : 'bg-red-100'
                    )}
                  >
                    <Ban
                      className={cn('w-5 h-5', selectedPenalty === 'ban' ? 'text-white' : 'text-red-500')}
                    />
                  </div>
                  <div className="flex-1">
                    <div className={cn('font-semibold', selectedPenalty === 'ban' ? 'text-red-800' : 'text-slate-800')}>
                      永久封号
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">严重违规行为，永久封禁账号无法恢复</div>
                  </div>
                  {selectedPenalty === 'ban' && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {selectedPenalty === 'ban' && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-semibold mb-0.5">重要提示</p>
                  <p className="text-red-700/80">永久封号后用户将无法登录，所有进行中的订单将被处理，此操作不可逆，请谨慎选择。</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========== 处罚二次确认 ========== */}
      <Modal
        open={confirmModal.open}
        title="二次确认"
        size="sm"
        onClose={() => setConfirmModal({ open: false, penalty: 'warning' })}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmModal({ open: false, penalty: 'warning' })}>
              取消
            </Button>
            <Button
              variant={confirmModal.penalty === 'ban' ? 'danger' : 'primary'}
              loading={loading}
              onClick={handleConfirmPenalty}
            >
              确认执行
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div
            className={cn(
              'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
              confirmModal.penalty === 'ban'
                ? 'bg-red-100'
                : confirmModal.penalty === 'suspend'
                  ? 'bg-amber-100'
                  : 'bg-blue-100'
            )}
          >
            <ShieldAlert
              className={cn(
                'w-8 h-8',
                confirmModal.penalty === 'ban'
                  ? 'text-red-600'
                  : confirmModal.penalty === 'suspend'
                    ? 'text-amber-600'
                    : 'text-blue-600'
              )}
            />
          </div>
          <p className="text-base font-semibold text-slate-800 mb-1">
            确认执行{getPenaltyText(confirmModal.penalty, confirmModal.suspendDays)}？
          </p>
          <p className="text-sm text-slate-500">
            {confirmModal.penalty === 'ban'
              ? '此操作将永久封禁用户账号，无法撤销'
              : confirmModal.penalty === 'suspend'
                ? `用户账号将被暂停使用${confirmModal.suspendDays}天`
                : '将向用户发送警告通知'}
          </p>
        </div>
      </Modal>
    </div>
  );
}
