import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Shield,
  Star,
  MapPin,
  CreditCard,
  Heart,
  MessageCircle,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  Upload,
  Sparkles,
  DollarSign,
  Car,
  Edit3,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DriverHeader } from '@/components/layout/DriverHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

/**
 * 驾驶员个人中心页面组件
 * 用户信息、实名认证、数据概览、功能入口、退出登录
 */
export default function DriverProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser, verifyIdentity, loading } = useAuthStore();
  const { getDriverOrders } = useOrderStore();

  /** 实名认证表单显示 */
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  /** 显示手机号 */
  const [showPhone, setShowPhone] = useState(false);
  /** 编辑昵称 */
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  /** 实名认证表单数据 */
  const [verifyForm, setVerifyForm] = useState({
    realName: '',
    idCard: '',
    idCardFront: '',
    idCardBack: '',
  });

  /** 统计数据 */
  const stats = useMemo(() => {
    if (!user) {
      return { totalOrders: 0, totalSpent: 0, avgRating: 0 };
    }
    const driverOrders = getDriverOrders(user.id);
    const completedOrders = driverOrders.filter(o => o.status === 'completed');
    const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const ratedOrders = completedOrders.filter(o => o.rating > 0);
    const avgRating = ratedOrders.length > 0
      ? Math.round((ratedOrders.reduce((sum, o) => sum + o.rating, 0) / ratedOrders.length) * 10) / 10
      : 0;

    return {
      totalOrders: driverOrders.length,
      totalSpent,
      avgRating,
    };
  }, [user, getDriverOrders]);

  /** 格式化手机号显示 */
  const formatPhone = (phone: string) => {
    if (!showPhone) {
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  };

  /** 开始编辑昵称 */
  const startEditNickname = () => {
    if (!user) return;
    setNicknameInput(user.nickname || user.phone);
    setIsEditingNickname(true);
  };

  /** 保存昵称 */
  const saveNickname = () => {
    if (!user || !nicknameInput.trim()) return;
    updateUser({ nickname: nicknameInput.trim() });
    setIsEditingNickname(false);
  };

  /** 提交实名认证 */
  const handleVerify = async () => {
    if (!verifyForm.realName || !verifyForm.idCard) return;
    await verifyIdentity(verifyForm.realName, verifyForm.idCard);
    setShowVerifyForm(false);
    setVerifyForm({ realName: '', idCard: '', idCardFront: '', idCardBack: '' });
  };

  /** 退出登录 */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /** 功能菜单配置 */
  const menuItems = [
    {
      icon: Heart,
      label: '我的收藏',
      description: '收藏的车位列表',
      color: 'from-rose-500 to-pink-500',
      onClick: () => {},
    },
    {
      icon: MapPin,
      label: '常用地址',
      description: '管理家和公司地址',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => {},
    },
    {
      icon: CreditCard,
      label: '支付方式',
      description: '管理支付银行卡',
      color: 'from-violet-500 to-purple-500',
      onClick: () => {},
    },
    {
      icon: MessageCircle,
      label: '消息通知',
      description: '订单和系统消息',
      color: 'from-emerald-500 to-teal-500',
      onClick: () => {},
    },
    {
      icon: HelpCircle,
      label: '帮助中心',
      description: '常见问题和客服',
      color: 'from-amber-500 to-orange-500',
      onClick: () => {},
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <DriverHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ========== 用户信息卡片 ========== */}
          <Card radius="3xl" className="overflow-hidden animate-fade-in-up">
            <div className="relative -mx-5 -mt-5 mb-0 p-6 md:p-8 text-white overflow-hidden">
              {/* 渐变背景 */}
              <div className="absolute inset-0 bg-gradient-brand" />
              <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay" />
              
              {/* 装饰光斑 */}
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent-400/25 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* 头像 */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="头像"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-white/80" />
                      )}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white text-brand-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 用户信息 */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    {/* 昵称编辑 */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      {isEditingNickname ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white placeholder-white/50 outline-none focus:border-white/60 text-lg font-bold w-40"
                            onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!text-white hover:!bg-white/15 !p-2"
                            onClick={saveNickname}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl md:text-3xl font-bold">{user.nickname || '用户' + user.phone.slice(-4)}</h2>
                          <button
                            onClick={startEditNickname}
                            className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-white/70" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* 手机号 */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                      <Phone className="w-4 h-4 text-white/70" />
                      <span className="text-white/90 font-mono tracking-wider">
                        {formatPhone(user.phone)}
                      </span>
                      <button
                        onClick={() => setShowPhone(!showPhone)}
                        className="p-1 rounded hover:bg-white/15 transition-colors"
                      >
                        {showPhone ? (
                          <EyeOff className="w-3.5 h-3.5 text-white/60" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-white/60" />
                        )}
                      </button>
                    </div>

                    {/* 认证状态 */}
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      {user.verified ? (
                        <Badge
                          variant="success"
                          size="md"
                          showIcon={false}
                          className="!bg-emerald-400/25 !text-white !border-white/30"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          已实名认证
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          size="md"
                          showIcon={false}
                          className="!bg-amber-400/25 !text-white !border-white/30 cursor-pointer"
                          onClick={() => setShowVerifyForm(true)}
                        >
                          <AlertCircle className="w-3.5 h-3.5 mr-1" />
                          未实名认证
                        </Badge>
                      )}
                      <Badge
                        variant="info"
                        size="md"
                        showIcon={false}
                        className="!bg-white/15 !text-white !border-white/25"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        驾驶员
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ========== 未认证时的实名表单提示 ========== */}
          {!user.verified && !showVerifyForm && (
            <Card
              radius="2xl"
              className="animate-fade-in-up cursor-pointer hover:shadow-lg transition-all"
              style={{ animationDelay: '0.05s' }}
              onClick={() => setShowVerifyForm(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 mb-1">完成实名认证</h3>
                  <p className="text-sm text-slate-500">
                    认证后可使用全部功能，享受更高预订额度
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
            </Card>
          )}

          {/* ========== 实名认证表单 ========== */}
          {showVerifyForm && (
            <Card radius="2xl" className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-500" />
                实名认证
              </h3>

              <div className="space-y-5">
                {/* 真实姓名 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    真实姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={verifyForm.realName}
                    onChange={(e) => setVerifyForm({ ...verifyForm, realName: e.target.value })}
                    placeholder="请输入身份证上的姓名"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>

                {/* 身份证号 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    身份证号码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={verifyForm.idCard}
                    onChange={(e) => setVerifyForm({ ...verifyForm, idCard: e.target.value })}
                    placeholder="请输入18位身份证号码"
                    maxLength={18}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all font-mono tracking-wider"
                  />
                </div>

                {/* 身份证照片上传 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    身份证照片（选填，用于快速审核）
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {['idCardFront', 'idCardBack'].map((field, idx) => (
                      <div
                        key={field}
                        className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer flex flex-col items-center justify-center text-slate-400"
                        onClick={() => setVerifyForm({ ...verifyForm, [field]: 'uploaded' })}
                      >
                        {verifyForm[field as keyof typeof verifyForm] ? (
                          <div className="flex flex-col items-center gap-1 text-brand-600">
                            <CheckCircle className="w-8 h-8" />
                            <span className="text-xs font-medium">已上传</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-1.5" />
                            <span className="text-xs font-medium">
                              {idx === 0 ? '身份证人像面' : '身份证国徽面'}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-700">
                      <p className="font-semibold mb-1">信息安全保障</p>
                      <p className="text-blue-600">
                        您的个人信息经过银行级加密存储，仅用于身份核验，不会泄露给任何第三方。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                    onClick={() => setShowVerifyForm(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={handleVerify}
                    loading={loading}
                    disabled={!verifyForm.realName || !verifyForm.idCard}
                  >
                    提交认证
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ========== 数据概览 ========== */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              数据概览
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<Car className="w-5 h-5" />}
                title="总订单数"
                value={stats.totalOrders.toString()}
                suffix="单"
                theme="blue"
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5" />}
                title="累计消费"
                value={formatCurrency(stats.totalSpent)}
                theme="orange"
              />
              <StatCard
                icon={<Star className="w-5 h-5" />}
                title="平均评分"
                value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '5.0'}
                suffix="分"
                theme="orange"
              />
            </div>
          </div>

          {/* ========== 功能入口 ========== */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              功能服务
            </h3>
            <Card radius="2xl" className="p-0 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {menuItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-4 p-4 md:p-5 hover:bg-slate-50 transition-colors text-left animate-fade-in-up"
                      style={{ animationDelay: `${0.05 * idx}s` }}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br',
                          item.color
                        )}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ========== 退出登录 ========== */}
          <div className="animate-fade-in-up pb-8" style={{ animationDelay: '0.2s' }}>
            <Button
              variant="outline"
              size="lg"
              className="w-full !border-red-200 !text-red-600 hover:!bg-red-50"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-5 h-5" />}
            >
              退出登录
            </Button>

            {/* 版本信息 */}
            <p className="text-center text-xs text-slate-400 mt-6">
              智慧停车平台 · 驾驶员端 v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
