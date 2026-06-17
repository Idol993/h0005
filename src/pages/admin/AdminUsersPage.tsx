import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  Unlock,
  KeyRound,
  User,
  Calendar,
  Phone,
  ShieldCheck,
  AlertTriangle,
  X,
  ShoppingCart,
  DollarSign,
  FileWarning,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  BarChart3,
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useAdminStore } from '@/store/adminStore';
import { useOrderStore } from '@/store/orderStore';
import { useParkingStore } from '@/store/parkingStore';
import { users, findUserById } from '@/data/users';
import { findViolationsByUser, getViolationTypeText } from '@/data/adminData';
import { findParkingsByOwner } from '@/data/parkings';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { User as UserType, UserRole } from '@/types';
import { UserRole as UserRoleEnum } from '@/types';

/**
 * 用户管理列表页面
 * 包含角色Tab切换、搜索筛选、用户表格、详情弹窗、封禁/解封、重置密码
 */
export default function AdminUsersPage() {
  const { toggleUserBan, loading } = useAdminStore();
  const { orders } = useOrderStore();
  const { parkings } = useParkingStore();

  /** 角色Tab */
  const [roleTab, setRoleTab] = useState<UserRole | 'all'>('all');
  /** 实名认证筛选 */
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  /** 账号状态筛选 */
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'banned'>('all');
  /** 注册时间范围 */
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  /** 搜索关键词 */
  const [searchKeyword, setSearchKeyword] = useState('');

  /** 详情弹窗 */
  const [detailModal, setDetailModal] = useState<{ open: boolean; user: UserType | null }>({
    open: false,
    user: null,
  });
  /** 封禁确认弹窗 */
  const [banConfirmModal, setBanConfirmModal] = useState<{ open: boolean; user: UserType | null }>({
    open: false,
    user: null,
  });
  /** 重置密码弹窗 */
  const [resetPwdModal, setResetPwdModal] = useState<{ open: boolean; user: UserType | null; newPwd: string }>({
    open: false,
    user: null,
    newPwd: '',
  });

  /** ========== 筛选后的用户列表 ========== */
  const filteredUsers = useMemo(() => {
    let result = users;

    if (roleTab !== 'all') {
      result = result.filter((u) => u.role === roleTab);
    }

    if (verifiedFilter === 'verified') {
      result = result.filter((u) => u.verified);
    } else if (verifiedFilter === 'unverified') {
      result = result.filter((u) => !u.verified);
    }

    if (statusFilter === 'normal') {
      result = result.filter((u) => !u.banned);
    } else if (statusFilter === 'banned') {
      result = result.filter((u) => u.banned);
    }

    if (dateRange !== 'all') {
      const now = Date.now();
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const threshold = now - days * 24 * 60 * 60 * 1000;
      result = result.filter((u) => new Date(u.createdAt).getTime() >= threshold);
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (u) =>
          u.nickname.toLowerCase().includes(kw) ||
          u.phone.includes(kw) ||
          u.id.toLowerCase().includes(kw) ||
          u.realName?.toLowerCase().includes(kw)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users, roleTab, verifiedFilter, statusFilter, dateRange, searchKeyword]);

  /** ========== 角色Tab配置 ========== */
  const roleTabs = [
    { key: 'all' as const, label: '全部', count: users.length, icon: Users },
    { key: UserRoleEnum.DRIVER, label: '驾驶员', count: users.filter((u) => u.role === UserRoleEnum.DRIVER).length, icon: User },
    { key: UserRoleEnum.OWNER, label: '业主', count: users.filter((u) => u.role === UserRoleEnum.OWNER).length, icon: MapPin },
    { key: UserRoleEnum.ADMIN, label: '管理员', count: users.filter((u) => u.role === UserRoleEnum.ADMIN).length, icon: ShieldCheck },
  ];

  /** ========== 获取用户订单统计 ========== */
  const getUserOrderStats = (userId: string) => {
    if (users.find((u) => u.id === userId)?.role === UserRoleEnum.OWNER) {
      const ownerOrders = orders.filter((o) => o.ownerId === userId);
      return {
        total: ownerOrders.length,
        completed: ownerOrders.filter((o) => o.status === 'completed').length,
        revenue: ownerOrders.filter((o) => o.status === 'completed' || o.status === 'active').reduce((s, o) => s + o.totalAmount, 0),
      };
    } else {
      const driverOrders = orders.filter((o) => o.driverId === userId);
      return {
        total: driverOrders.length,
        completed: driverOrders.filter((o) => o.status === 'completed').length,
        spent: driverOrders.filter((o) => o.status === 'completed' || o.status === 'active').reduce((s, o) => s + o.totalAmount, 0),
      };
    }
  };

  /** ========== 角色显示名 ========== */
  const getRoleText = (role: UserRole) => {
    const map: Record<UserRole, string> = {
      [UserRoleEnum.DRIVER]: '驾驶员',
      [UserRoleEnum.OWNER]: '业主',
      [UserRoleEnum.ADMIN]: '管理员',
    };
    return map[role];
  };

  const getRoleBadgeVariant = (role: UserRole): 'info' | 'success' | 'warning' | 'default' => {
    const map: Record<UserRole, 'info' | 'success' | 'warning' | 'default'> = {
      [UserRoleEnum.DRIVER]: 'info',
      [UserRoleEnum.OWNER]: 'success',
      [UserRoleEnum.ADMIN]: 'warning',
    };
    return map[role];
  };

  /** ========== 执行封禁/解封 ========== */
  const handleToggleBan = async () => {
    if (!banConfirmModal.user) return;
    await toggleUserBan(banConfirmModal.user.id, !banConfirmModal.user.banned);
    const targetUser = users.find((u) => u.id === banConfirmModal.user?.id);
    if (targetUser) targetUser.banned = !banConfirmModal.user.banned;
    setBanConfirmModal({ open: false, user: null });
  };

  /** ========== 执行重置密码 ========== */
  const handleResetPwd = () => {
    setResetPwdModal({ open: false, user: null, newPwd: '' });
  };

  /** 生成随机密码 */
  const generateRandomPwd = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPwdModal({ ...resetPwdModal, newPwd: pwd });
  };

  /** ========== 手机号脱敏 ========== */
  const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 深色侧边栏 */}
      <AdminSidebar />

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 space-y-6">
          {/* ========== 页面标题 ========== */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">用户管理列表</h1>
            <p className="text-sm text-slate-500 mt-1">管理平台所有用户账号、权限及状态</p>
          </div>

          <Card>
            {/* ========== 角色Tab ========== */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto w-fit mb-5">
              {roleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setRoleTab(tab.key)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                      roleTab === tab.key
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-semibold',
                        roleTab === tab.key
                          ? 'bg-brand-50 text-brand-600'
                          : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ========== 筛选 + 搜索 ========== */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={verifiedFilter}
                    onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
                    className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                  >
                    <option value="all">全部认证状态</option>
                    <option value="verified">已认证</option>
                    <option value="unverified">未认证</option>
                  </select>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                >
                  <option value="all">全部账号状态</option>
                  <option value="normal">正常</option>
                  <option value="banned">封禁</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                  className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                >
                  <option value="all">全部注册时间</option>
                  <option value="7d">近7天</option>
                  <option value="30d">近30天</option>
                  <option value="90d">近90天</option>
                </select>
              </div>

              <div className="flex-1 lg:max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索昵称、手机号、真实姓名..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div className="text-sm text-slate-500 lg:ml-auto">
                共 <span className="font-bold text-slate-700">{filteredUsers.length}</span> 位用户
              </div>
            </div>

            {/* ========== 用户表格 ========== */}
            <div className="overflow-x-auto -mx-5">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium whitespace-nowrap">用户</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">手机号</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">角色</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">认证状态</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">违规次数</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">注册时间</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap">状态</th>
                    <th className="px-5 py-3 font-medium whitespace-nowrap text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>暂无符合条件的用户</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userViolations = findViolationsByUser(u.id);
                      const isOwnerHighRisk = u.role === UserRoleEnum.OWNER && userViolations.length >= 3;

                      return (
                        <tr
                          key={u.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          {/* 用户 */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={u.avatar}
                                  alt={u.nickname}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                                {u.banned && (
                                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-white">
                                    <Ban className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-800">{u.nickname}</div>
                                <div className="text-xs text-slate-400">ID: {u.id}</div>
                              </div>
                            </div>
                          </td>

                          {/* 手机号 */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {maskPhone(u.phone)}
                            </div>
                          </td>

                          {/* 角色 */}
                          <td className="px-5 py-4">
                            <Badge variant={getRoleBadgeVariant(u.role)} size="md" showIcon={false}>
                              {getRoleText(u.role)}
                            </Badge>
                          </td>

                          {/* 认证状态 */}
                          <td className="px-5 py-4">
                            {u.verified ? (
                              <Badge variant="success" size="md">
                                已实名认证
                              </Badge>
                            ) : (
                              <Badge variant="default" size="md" showIcon={false}>
                                未认证
                              </Badge>
                            )}
                          </td>

                          {/* 违规次数 */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'text-sm font-bold tabular-nums',
                                  userViolations.length >= 3
                                    ? 'text-red-600'
                                    : userViolations.length > 0
                                      ? 'text-amber-600'
                                      : 'text-slate-500'
                                )}
                              >
                                {userViolations.length}
                              </span>
                              {isOwnerHighRisk && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-bold">
                                  <AlertTriangle className="w-3 h-3" />
                                  高风险
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 注册时间 */}
                          <td className="px-5 py-4">
                            <div className="text-sm text-slate-700 whitespace-nowrap">
                              {formatDate(u.createdAt)}
                            </div>
                          </td>

                          {/* 状态 */}
                          <td className="px-5 py-4">
                            {u.banned ? (
                              <Badge variant="danger" size="md">
                                已封禁
                              </Badge>
                            ) : (
                              <Badge variant="success" size="md" showIcon={false}>
                                正常
                              </Badge>
                            )}
                          </td>

                          {/* 操作 */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                                onClick={() => setDetailModal({ open: true, user: u })}
                              >
                                详情
                              </Button>

                              {u.role !== UserRoleEnum.ADMIN && (
                                u.banned ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    loading={loading}
                                    leftIcon={<Unlock className="w-3.5 h-3.5" />}
                                    onClick={() => setBanConfirmModal({ open: true, user: u })}
                                    className={cn(
                                      '!text-emerald-600 !border-emerald-300 hover:!bg-emerald-50'
                                    )}
                                  >
                                    解封
                                  </Button>
                                ) : (
                                  <Button
                                    variant={isOwnerHighRisk ? 'danger' : 'outline'}
                                    size="sm"
                                    loading={loading}
                                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                                    onClick={() => setBanConfirmModal({ open: true, user: u })}
                                    className={cn(
                                      !isOwnerHighRisk && '!text-red-600 !border-red-300 hover:!bg-red-50'
                                    )}
                                  >
                                    {isOwnerHighRisk && (
                                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                                    )}
                                    封禁
                                  </Button>
                                )
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                                onClick={() => {
                                  setResetPwdModal({ open: true, user: u, newPwd: '' });
                                  generateRandomPwd();
                                }}
                              >
                                重置密码
                              </Button>
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

      {/* ========== 用户详情弹窗 ========== */}
      <Modal
        open={detailModal.open}
        title="用户详情"
        size="xl"
        onClose={() => setDetailModal({ open: false, user: null })}
      >
        {detailModal.user && (
          <div className="space-y-6">
            {(() => {
              const u = detailModal.user;
              const orderStats = getUserOrderStats(u.id);
              const userViolations = findViolationsByUser(u.id);
              const userParkings = u.role === UserRoleEnum.OWNER ? findParkingsByOwner(u.id) : [];

              return (
                <>
                  {/* 基础信息卡片 */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="relative">
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                        />
                        {u.banned && (
                          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-red-500 text-white text-xs font-bold shadow">
                            已封禁
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-xl font-bold text-slate-800">{u.nickname}</h3>
                          <Badge variant={getRoleBadgeVariant(u.role)} size="sm" showIcon={false}>
                            {getRoleText(u.role)}
                          </Badge>
                          {u.verified ? (
                            <Badge variant="success" size="sm">已实名认证</Badge>
                          ) : (
                            <Badge variant="default" size="sm" showIcon={false}>未认证</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {maskPhone(u.phone)}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(u.createdAt)}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <User className="w-4 h-4 text-slate-400" />
                            {u.realName || '未实名'}
                          </div>
                        </div>
                        {u.realName && (
                          <div className="mt-2 text-xs text-slate-500">
                            身份证：{u.idCard ? u.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : '-'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 订单统计 */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4" />
                      {u.role === UserRoleEnum.OWNER ? '经营统计' : '消费统计'}
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          总订单
                        </div>
                        <div className="text-2xl font-bold text-slate-800 tabular-nums">{orderStats.total}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已完成
                        </div>
                        <div className="text-2xl font-bold text-emerald-600 tabular-nums">{orderStats.completed}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {u.role === UserRoleEnum.OWNER ? '累计收入' : '累计消费'}
                        </div>
                        <div className="text-2xl font-bold text-accent-600 tabular-nums">
                          {formatCurrency(
                            u.role === UserRoleEnum.OWNER
                              ? (orderStats as { revenue: number }).revenue
                              : (orderStats as { spent: number }).spent
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 业主的车位列表 */}
                  {u.role === UserRoleEnum.OWNER && userParkings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        发布的车位（{userParkings.length}个）
                      </h4>
                      <div className="space-y-2">
                        {userParkings.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                              {p.images[0] && (
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {p.title}
                              </div>
                              <div className="text-xs text-slate-400 truncate">{p.address}</div>
                            </div>
                            <Badge
                              variant={
                                p.status === 'approved'
                                  ? 'success'
                                  : p.status === 'pending'
                                    ? 'warning'
                                    : p.status === 'rejected'
                                      ? 'danger'
                                      : 'default'
                              }
                              size="sm"
                              showIcon={false}
                            >
                              {p.status === 'approved' ? '已上架' : p.status === 'pending' ? '待审' : p.status === 'rejected' ? '驳回' : '下架'}
                            </Badge>
                          </div>
                        ))}
                        {userParkings.length > 3 && (
                          <div className="text-center">
                            <button className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1">
                              查看全部 {userParkings.length} 个车位
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 违规记录 */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                      <FileWarning className="w-4 h-4" />
                      违规记录（{userViolations.length}条）
                    </h4>
                    {userViolations.length === 0 ? (
                      <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 border-dashed text-center text-slate-400 text-sm">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                        该用户暂无违规记录，保持良好
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userViolations.slice(0, 3).map((v) => (
                          <div
                            key={v.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    v.type === 'fake_listing' || v.type === 'abuse' ? 'danger' : 'warning'
                                  }
                                  size="sm"
                                  showIcon={false}
                                >
                                  {getViolationTypeText(v.type)}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {formatDate(v.createdAt)}
                                </span>
                              </div>
                              <Badge
                                variant={v.penalty === 'ban' ? 'danger' : v.penalty === 'suspend' ? 'warning' : 'info'}
                                size="sm"
                                showIcon={false}
                              >
                                {v.penalty === 'warning' ? '警告' : v.penalty === 'suspend' ? `暂停${v.suspendDays}天` : '永久封禁'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{v.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* ========== 封禁/解封确认弹窗 ========== */}
      <Modal
        open={banConfirmModal.open}
        title={banConfirmModal.user?.banned ? '确认解封账号' : '确认封禁账号'}
        size="sm"
        onClose={() => setBanConfirmModal({ open: false, user: null })}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBanConfirmModal({ open: false, user: null })}>
              取消
            </Button>
            <Button
              variant={banConfirmModal.user?.banned ? 'primary' : 'danger'}
              loading={loading}
              onClick={handleToggleBan}
              leftIcon={banConfirmModal.user?.banned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
            >
              {banConfirmModal.user?.banned ? '确认解封' : '确认封禁'}
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div
            className={cn(
              'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
              banConfirmModal.user?.banned ? 'bg-emerald-100' : 'bg-red-100'
            )}
          >
            {banConfirmModal.user?.banned ? (
              <Unlock className="w-8 h-8 text-emerald-600" />
            ) : (
              <Ban className="w-8 h-8 text-red-600" />
            )}
          </div>
          <p className="text-base font-semibold text-slate-800 mb-1">
            {banConfirmModal.user?.banned ? '解封' : '封禁'}用户「{banConfirmModal.user?.nickname}」？
          </p>
          <p className="text-sm text-slate-500">
            {banConfirmModal.user?.banned
              ? '解封后该用户将恢复正常使用权限'
              : '封禁后该用户将无法登录和进行任何操作'}
          </p>
          {!banConfirmModal.user?.banned &&
            banConfirmModal.user?.role === UserRoleEnum.OWNER &&
            (findViolationsByUser(banConfirmModal.user.id).length >= 3) && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-semibold">高风险用户警告</p>
                  <p className="text-red-700/80">该业主累计违规{findViolationsByUser(banConfirmModal.user!.id).length}次，建议封禁处理</p>
                </div>
              </div>
            )}
        </div>
      </Modal>

      {/* ========== 重置密码弹窗 ========== */}
      <Modal
        open={resetPwdModal.open}
        title="重置用户密码"
        size="md"
        onClose={() => setResetPwdModal({ open: false, user: null, newPwd: '' })}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setResetPwdModal({ open: false, user: null, newPwd: '' })}>
              关闭
            </Button>
            <Button variant="primary" onClick={handleResetPwd}>
              复制密码并完成
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-blue-900">
                为用户 <span className="font-bold">{resetPwdModal.user?.nickname}</span> 重置密码
              </div>
              <div className="text-xs text-blue-700/70 mt-0.5">
                手机号 {resetPwdModal.user?.phone && maskPhone(resetPwdModal.user.phone)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">新密码</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={resetPwdModal.newPwd}
                  className="w-full px-4 h-12 rounded-xl border-2 border-brand-200 bg-brand-50 text-lg font-mono font-bold text-brand-800 tracking-wider select-all"
                />
              </div>
              <Button variant="outline" onClick={generateRandomPwd}>
                换一个
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              请将此密码告知用户，用户登录后可自行修改
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700">
              <p className="font-semibold">安全提示</p>
              <p className="text-amber-700/80 mt-0.5">请确保通过安全渠道将新密码传达给用户，建议用户登录后立即修改为个人密码</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
