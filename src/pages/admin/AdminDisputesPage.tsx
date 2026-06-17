import { useState, useMemo } from 'react';
import {
  FileWarning,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  ShoppingCart,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  DollarSign,
  Image,
  UserCheck,
  ShieldAlert,
  Send,
  Gavel,
  ArrowRightLeft,
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useAdminStore } from '@/store/adminStore';
import { useOrderStore } from '@/store/orderStore';
import { findUserById } from '@/data/users';
import { getDisputeTypeText, getDisputeStatusText } from '@/data/adminData';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Dispute, DisputeStatus, DisputeType } from '@/types';

/**
 * 纠纷处理工单页面
 * 包含工单统计、状态/类型筛选、工单列表、详情展开、裁定操作
 */
export default function AdminDisputesPage() {
  const { disputes, processDispute, loading } = useAdminStore();
  const { orders } = useOrderStore();

  /** 状态筛选 */
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');
  /** 类型筛选 */
  const [typeFilter, setTypeFilter] = useState<DisputeType | 'all'>('all');
  /** 搜索关键词 */
  const [searchKeyword, setSearchKeyword] = useState('');
  /** 展开详情的工单ID */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** 裁定弹窗 */
  const [rulingModal, setRulingModal] = useState<{ open: boolean; dispute: Dispute | null }>({
    open: false,
    dispute: null,
  });
  /** 裁定结果 */
  const [rulingSide, setRulingSide] = useState<'driver' | 'owner' | null>(null);
  const [rulingResult, setRulingResult] = useState('');
  const [partialRefund, setPartialRefund] = useState('');

  /** ========== 工单统计 ========== */
  const stats = useMemo(() => {
    const open = disputes.filter((d) => d.status === 'open').length;
    const processing = disputes.filter((d) => d.status === 'processing').length;
    const resolved = disputes.filter((d) => d.status === 'resolved').length;

    return {
      open,
      processing,
      resolved,
      total: disputes.length,
      avgDuration: '6.8 小时',
    };
  }, [disputes]);

  /** ========== 筛选后的工单列表 ========== */
  const filteredDisputes = useMemo(() => {
    let result = disputes;

    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((d) => d.type === typeFilter);
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter((d) => {
        const order = orders.find((o) => o.id === d.orderId);
        const complainant = findUserById(d.complainantId);
        const respondent = findUserById(d.respondentId);
        return (
          d.id.toLowerCase().includes(kw) ||
          d.orderId.toLowerCase().includes(kw) ||
          d.description.toLowerCase().includes(kw) ||
          order?.parkingTitle.toLowerCase().includes(kw) ||
          complainant?.nickname.toLowerCase().includes(kw) ||
          respondent?.nickname.toLowerCase().includes(kw)
        );
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [disputes, statusFilter, typeFilter, searchKeyword, orders]);

  /** ========== 状态Tab配置 ========== */
  const statusTabs: Array<{ key: DisputeStatus | 'all'; label: string; count: number; variant: 'warning' | 'info' | 'success' | 'default' | 'danger' }> = [
    { key: 'all', label: '全部', count: disputes.length, variant: 'info' },
    { key: 'open', label: '待处理', count: stats.open, variant: 'warning' },
    { key: 'processing', label: '处理中', count: stats.processing, variant: 'info' },
    { key: 'resolved', label: '已解决', count: stats.resolved, variant: 'success' },
  ];

  /** 类型筛选选项 */
  const typeOptions: Array<{ value: DisputeType | 'all'; label: string }> = [
    { value: 'all', label: '全部类型' },
    { value: 'quality', label: '车位质量问题' },
    { value: 'refund', label: '退款申请' },
    { value: 'overcharge', label: '多收费争议' },
    { value: 'other', label: '其他问题' },
  ];

  /** ========== 状态徽章配置 ========== */
  const getStatusBadge = (status: DisputeStatus) => {
    const map: Record<DisputeStatus, { variant: 'warning' | 'info' | 'success' | 'default'; label: string }> = {
      open: { variant: 'warning', label: '待处理' },
      processing: { variant: 'info', label: '处理中' },
      resolved: { variant: 'success', label: '已解决' },
      closed: { variant: 'default', label: '已关闭' },
    };
    return map[status];
  };

  /** ========== 提交裁定 ========== */
  const handleSubmitRuling = async () => {
    if (!rulingModal.dispute || !rulingSide) return;

    const sideText = rulingSide === 'driver' ? '支持驾驶员' : '支持业主';
    const refundText = partialRefund ? `，部分退款¥${partialRefund}` : '';
    const finalResult = `${sideText}${refundText}。处理说明：${rulingResult}`;

    await processDispute(rulingModal.dispute.id, 'resolved', finalResult);

    setRulingModal({ open: false, dispute: null });
    setRulingSide(null);
    setRulingResult('');
    setPartialRefund('');
  };

  /** 统计卡片渲染 */
  const StatItem = ({
    icon: Icon,
    label,
    value,
    color,
    iconBg,
  }: {
    icon: typeof FileWarning;
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
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">纠纷处理工单</h1>
            <p className="text-sm text-slate-500 mt-1">处理用户纠纷申诉，维护平台公平公正</p>
          </div>

          {/* ========== 工单统计条 ========== */}
          <Card className="bg-gradient-to-r from-slate-50 to-white">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatItem
                icon={AlertCircle}
                label="待处理"
                value={stats.open}
                color="text-amber-600"
                iconBg="bg-amber-100"
              />
              <StatItem
                icon={Clock}
                label="处理中"
                value={stats.processing}
                color="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatItem
                icon={CheckCircle2}
                label="已解决"
                value={stats.resolved}
                color="text-emerald-600"
                iconBg="bg-emerald-100"
              />
              <StatItem
                icon={FileWarning}
                label="平均处理时长"
                value={stats.avgDuration}
                color="text-indigo-600"
                iconBg="bg-indigo-100"
              />
            </div>
          </Card>

          {/* ========== 筛选区 ========== */}
          <Card>
            <div className="flex flex-col gap-4 mb-5">
              {/* 状态Tab */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto w-fit">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                      statusFilter === tab.key
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-semibold',
                        statusFilter === tab.key
                          ? 'bg-brand-50 text-brand-600'
                          : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* 类型筛选 + 搜索 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as DisputeType | 'all')}
                    className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 relative sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索工单ID、订单号、用户..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="text-sm text-slate-500">
                  共 <span className="font-bold text-slate-700">{filteredDisputes.length}</span> 条工单
                </div>
              </div>
            </div>

            {/* ========== 工单列表 ========== */}
            <div className="space-y-4">
              {filteredDisputes.length === 0 ? (
                <div className="py-16 text-center">
                  <FileWarning className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-400">暂无符合条件的纠纷工单</p>
                </div>
              ) : (
                filteredDisputes.map((dispute) => {
                  const badge = getStatusBadge(dispute.status);
                  const order = orders.find((o) => o.id === dispute.orderId);
                  const complainant = findUserById(dispute.complainantId);
                  const respondent = findUserById(dispute.respondentId);
                  const isExpanded = expandedId === dispute.id;

                  return (
                    <div
                      key={dispute.id}
                      className={cn(
                        'rounded-2xl border border-slate-200 bg-white transition-all overflow-hidden',
                        isExpanded ? 'shadow-md' : 'hover:border-slate-300 hover:shadow-sm'
                      )}
                    >
                      {/* 工单项头部 */}
                      <div className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* 左侧信息 */}
                          <div className="flex-1 min-w-0">
                            {/* 第一行：ID + 类型 + 状态 */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="px-3 py-1 rounded-lg bg-brand-50 text-brand-600 text-sm font-mono font-semibold">
                                #{dispute.id}
                              </span>
                              <Badge variant="info" size="md" showIcon={false}>
                                {getDisputeTypeText(dispute.type)}
                              </Badge>
                              <Badge variant={badge.variant} size="md">
                                {badge.label}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDateTime(dispute.createdAt)}
                              </div>
                            </div>

                            {/* 第二行：关联订单 */}
                            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-slate-50">
                              <ShoppingCart className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-sm text-slate-600">
                                订单号 <span className="font-mono font-medium text-slate-800">{dispute.orderId}</span>
                              </span>
                              {order && (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-sm text-slate-600 truncate">
                                    {order.parkingTitle}
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-sm font-semibold text-accent-600">
                                    {formatCurrency(order.totalAmount)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* 第三行：纠纷双方 */}
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <img
                                    src={complainant?.avatar}
                                    alt={complainant?.nickname}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-amber-200"
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-bold">
                                    申
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="text-slate-500">申诉人：</span>
                                  <span className="font-medium text-slate-800">
                                    {complainant?.nickname || '未知'}
                                  </span>
                                </div>
                              </div>

                              <ArrowRightLeft className="w-4 h-4 text-slate-300" />

                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <img
                                    src={respondent?.avatar}
                                    alt={respondent?.nickname}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold">
                                    被
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="text-slate-500">被申诉人：</span>
                                  <span className="font-medium text-slate-800">
                                    {respondent?.nickname || '未知'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 右侧操作 */}
                          <div className="flex lg:flex-col items-center lg:items-end gap-2 shrink-0">
                            {(dispute.status === 'open' || dispute.status === 'processing') && (
                              <Button
                                variant="primary"
                                size="sm"
                                loading={loading}
                                leftIcon={<Gavel className="w-4 h-4" />}
                                onClick={() => {
                                  setRulingModal({ open: true, dispute });
                                  setRulingSide(null);
                                  setRulingResult('');
                                  setPartialRefund('');
                                }}
                              >
                                立即裁定
                              </Button>
                            )}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-all"
                            >
                              {isExpanded ? '收起详情' : '查看详情'}
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
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-5">
                            {/* 纠纷描述 */}
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" />
                                纠纷描述
                              </div>
                              <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {dispute.description}
                                </p>
                              </div>
                            </div>

                            {/* 双方举证对比 */}
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                <Image className="w-3.5 h-3.5" />
                                双方举证（证据对比）
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* 申诉方举证 */}
                                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/50">
                                  <div className="flex items-center gap-2 mb-3">
                                    <img
                                      src={complainant?.avatar}
                                      alt=""
                                      className="w-7 h-7 rounded-full object-cover"
                                    />
                                    <span className="text-sm font-semibold text-amber-800">
                                      申诉人：{complainant?.nickname}
                                    </span>
                                  </div>
                                  {dispute.evidences.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      {dispute.evidences.map((img, idx) => (
                                        <div
                                          key={idx}
                                          className="aspect-square rounded-lg overflow-hidden border-2 border-white shadow cursor-pointer hover:scale-105 transition-transform"
                                        >
                                          <img
                                            src={img}
                                            alt={`证据${idx + 1}`}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-amber-700/60 italic">未上传图片证据</p>
                                  )}
                                  <div className="mt-2 text-xs text-amber-700/80">
                                    共 {dispute.evidences.length} 张图片
                                  </div>
                                </div>

                                {/* 被申诉方举证（模拟） */}
                                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/50">
                                  <div className="flex items-center gap-2 mb-3">
                                    <img
                                      src={respondent?.avatar}
                                      alt=""
                                      className="w-7 h-7 rounded-full object-cover"
                                    />
                                    <span className="text-sm font-semibold text-blue-800">
                                      被申诉人：{respondent?.nickname}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="p-2.5 rounded-lg bg-white/80 border border-blue-100">
                                      <p className="text-xs text-blue-700">
                                        已提交书面说明，承认部分问题，愿意协商解决。
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-blue-700/80">
                                    文字说明 1 条
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 处理记录时间线 */}
                            <div>
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                处理记录时间线
                              </div>
                              <div className="relative pl-6">
                                <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-emerald-400 via-blue-400 to-slate-200" />

                                <div className="relative pb-4">
                                  <div className="absolute -left-[18px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow" />
                                  <div className="text-sm">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-semibold text-slate-800">工单创建</span>
                                      <span className="text-xs text-slate-400">
                                        {formatDateTime(dispute.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-slate-600">用户提交纠纷申诉，系统自动生成工单</p>
                                  </div>
                                </div>

                                {dispute.status !== 'open' && (
                                  <div className="relative pb-4">
                                    <div className="absolute -left-[18px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow" />
                                    <div className="text-sm">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-semibold text-slate-800">管理员受理</span>
                                        <span className="text-xs text-slate-400">
                                          {formatDateTime(new Date(Date.now() - 3600000))}
                                        </span>
                                      </div>
                                      <p className="text-slate-600">管理员已开始审核，正在核实双方证据</p>
                                    </div>
                                  </div>
                                )}

                                {dispute.result && (
                                  <div className="relative">
                                    <div className="absolute -left-[18px] top-1 w-4 h-4 rounded-full bg-purple-500 border-4 border-white shadow" />
                                    <div className="text-sm">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-semibold text-slate-800">处理完成</span>
                                        <span className="text-xs text-slate-400">
                                          {formatDateTime(new Date())}
                                        </span>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                                        <p className="text-slate-700 text-sm">{dispute.result}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 处理结果 */}
                            {(dispute.status === 'resolved' || dispute.status === 'closed') && dispute.result && (
                              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-emerald-800 mb-1">处理结果</h4>
                                    <p className="text-sm text-emerald-700/90 leading-relaxed">
                                      {dispute.result}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
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

      {/* ========== 裁定弹窗 ========== */}
      <Modal
        open={rulingModal.open}
        title="纠纷裁定"
        size="xl"
        onClose={() => setRulingModal({ open: false, dispute: null })}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setRulingModal({ open: false, dispute: null })}
            >
              取消
            </Button>
            <Button
              variant="primary"
              loading={loading}
              disabled={!rulingSide || !rulingResult.trim()}
              leftIcon={<Send className="w-4 h-4" />}
              onClick={handleSubmitRuling}
            >
              提交裁定
            </Button>
          </div>
        }
      >
        {rulingModal.dispute && (
          <div className="space-y-5">
            {/* 纠纷摘要 */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Gavel className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-indigo-700">
                      #{rulingModal.dispute.id}
                    </span>
                    <Badge variant="info" size="sm" showIcon={false}>
                      {getDisputeTypeText(rulingModal.dispute.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-indigo-900/80 line-clamp-2">
                    {rulingModal.dispute.description}
                  </p>
                </div>
              </div>
            </div>

            {/* 双方信息 */}
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const complainant = findUserById(rulingModal.dispute.complainantId);
                const respondent = findUserById(rulingModal.dispute.respondentId);
                return (
                  <>
                    <button
                      onClick={() => setRulingSide('driver')}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-left',
                        rulingSide === 'driver'
                          ? 'border-amber-400 bg-amber-50 shadow-md ring-4 ring-amber-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={complainant?.avatar}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                        />
                        <div>
                          <div className="font-semibold text-slate-800">
                            {complainant?.nickname}
                          </div>
                          <div className="text-xs text-amber-600 font-medium">申诉方（驾驶员）</div>
                        </div>
                      </div>
                      {rulingSide === 'driver' && (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-amber-700">
                          <ThumbsUp className="w-4 h-4" />
                          已选择支持此用户
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => setRulingSide('owner')}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-left',
                        rulingSide === 'owner'
                          ? 'border-blue-400 bg-blue-50 shadow-md ring-4 ring-blue-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={respondent?.avatar}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                        />
                        <div>
                          <div className="font-semibold text-slate-800">
                            {respondent?.nickname}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">被申诉方（业主）</div>
                        </div>
                      </div>
                      {rulingSide === 'owner' && (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-blue-700">
                          <ThumbsUp className="w-4 h-4" />
                          已选择支持此用户
                        </div>
                      )}
                    </button>
                  </>
                );
              })()}
            </div>

            {/* 部分退款金额 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                部分退款金额（元，可选）
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">¥</span>
                <input
                  type="number"
                  value={partialRefund}
                  onChange={(e) => setPartialRefund(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 h-12 rounded-xl border border-slate-200 bg-white text-lg font-semibold tabular-nums placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                填写退款金额后将从订单金额中扣除相应部分退还给申诉方
              </p>
            </div>

            {/* 处理结果说明 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <ShieldAlert className="w-4 h-4 inline mr-1" />
                处理结果说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rulingResult}
                onChange={(e) => setRulingResult(e.target.value)}
                rows={4}
                placeholder="请详细填写处理依据和结果说明，该内容将展示给纠纷双方..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
              />
            </div>

            {/* 提示 */}
            {!rulingSide && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                请先选择支持的一方，然后填写处理结果说明
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
