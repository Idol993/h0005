import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Building2, Shield, MapPin, Send, Eye, EyeOff, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

/**
 * 登录注册页面组件
 * 支持三种角色切换：驾驶员 / 车位业主 / 平台管理员
 * 手机号 + 验证码登录
 * 品牌形象背景
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  /** 当前选中的角色 */
  const [role, setRole] = useState<UserRole>(UserRole.DRIVER);
  /** 手机号 */
  const [phone, setPhone] = useState('');
  /** 验证码 */
  const [code, setCode] = useState('');
  /** 是否显示验证码 */
  const [showCode, setShowCode] = useState(false);
  /** 验证码倒计时 */
  const [countdown, setCountdown] = useState(0);
  /** 错误信息 */
  const [error, setError] = useState('');
  /** 是否同意协议 */
  const [agreed, setAgreed] = useState(false);

  /** 角色选项配置 */
  const roleTabs = [
    { key: UserRole.DRIVER, label: '驾驶员', icon: Car, desc: '找车位停车' },
    { key: UserRole.OWNER, label: '车位业主', icon: Building2, desc: '出租车位' },
    { key: UserRole.ADMIN, label: '平台管理员', icon: Shield, desc: '运营管理' },
  ];

  /** 倒计时效果 */
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  /** 手机号校验 */
  const validatePhone = (value: string): boolean => {
    const phoneReg = /^1[3-9]\d{9}$/;
    return phoneReg.test(value);
  };

  /** 处理获取验证码 */
  const handleSendCode = () => {
    setError('');
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setCountdown(60);
  };

  /** 处理登录 */
  const handleLogin = async () => {
    setError('');
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    if (code !== '123456') {
      setError('验证码不正确（模拟验证码：123456）');
      return;
    }
    if (!agreed) {
      setError('请先同意用户协议和隐私政策');
      return;
    }

    const user = await login(phone, code, role);
    if (!user) {
      setError('登录失败，请重试');
      return;
    }

    /** 按角色跳转对应首页 */
    if (role === UserRole.DRIVER) {
      navigate('/');
    } else if (role === UserRole.OWNER) {
      navigate('/owner/dashboard');
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* ========== 左侧品牌形象区 ========== */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-brand overflow-hidden">
        {/* 噪点纹理叠加 */}
        <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay pointer-events-none" />
        
        {/* 装饰性渐变光斑 */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-glow-brand">
              <Car className="w-8 h-8" />
            </div>
            <span className="text-3xl font-bold tracking-tight">智泊</span>
          </div>

          {/* 主标语 */}
          <h1 className="text-5xl font-bold leading-tight mb-6 animate-fade-in-up">
            让每一个车位<br />创造价值
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-md leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            共享经济时代的智能停车解决方案，连接车位业主与驾驶员，
            让闲置车位产生收益，让找车位变得简单。
          </p>

          {/* 特性亮点 */}
          <div className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {[
              { icon: Shield, title: '安全保障', desc: '全程保险覆盖，24小时客服支持' },
              { icon: MapPin, title: '精准匹配', desc: '智能推荐附近最优车位' },
              { icon: Check, title: '价格透明', desc: '无隐藏费用，实时计价清晰可见' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 hover:bg-white/12 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-base">{item.title}</p>
                  <p className="text-sm text-white/70 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 底部统计数据 */}
          <div className="mt-auto pt-16 flex items-center gap-10 text-white/70 text-sm">
            <div>
              <p className="text-3xl font-bold text-white">10,000+</p>
              <p className="mt-1">覆盖车位</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-3xl font-bold text-white">50,000+</p>
              <p className="mt-1">注册用户</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="mt-1">用户好评</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 右侧登录表单区 ========== */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-16 bg-slate-50">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* 移动端Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">智泊</span>
          </div>

          {/* 欢迎文案 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">欢迎回来</h2>
            <p className="text-slate-500">请选择身份并登录</p>
          </div>

          {/* 角色切换Tab */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
            {roleTabs.map((tab) => {
              const active = role === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setRole(tab.key)}
                  className={cn(
                    'relative flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300',
                    'hover:bg-white/60',
                    active && 'bg-white shadow-md'
                  )}
                >
                  <tab.icon className={cn('w-5 h-5 mb-1 transition-colors', active ? 'text-brand-600' : 'text-slate-400')} />
                  <span className={cn('text-xs font-semibold transition-colors', active ? 'text-brand-600' : 'text-slate-500')}>
                    {tab.label}
                  </span>
                  <p className={cn('text-[10px mt-0.5 transition-colors hidden sm:block', active ? 'text-brand-500' : 'text-slate-400')}>
                    {tab.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* 手机号输入 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">手机号</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-medium">+86</span>
                <span className="mx-2 h-5 w-px bg-slate-200" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                  setError('');
                }}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full h-12 pl-20 pr-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 font-medium transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none"
              />
            </div>
          </div>

          {/* 验证码输入 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">验证码</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 font-medium transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={handleSendCode}
                disabled={countdown > 0}
                className={cn(
                  'h-12 px-5 rounded-xl font-medium text-sm shrink-0 transition-all',
                  countdown > 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-brand-50 text-brand-600 hover:bg-brand-100 active:bg-brand-200'
                )}
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm px-4 animate-fade-in">
              {error}
            </div>
          )}

          {/* 协议勾选 */}
          <div className="mb-6">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-2 cursor-pointer"
              />
              <span className="text-sm text-slate-500 leading-relaxed">
                我已阅读并同意
                <a href="#" className="text-brand-600 hover:underline">《用户协议》</a>
                和
                <a href="#" className="text-brand-600 hover:underline">《隐私政策》</a>
              </span>
            </label>
          </div>

          {/* 登录按钮 */}
          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleLogin}
            className="w-full"
            leftIcon={<Send className="w-5 h-5" />}
          >
            登录 / 注册
          </Button>

          {/* 模拟验证码提示 */}
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <p className="font-medium mb-1">💡 演示提示</p>
            <p className="text-amber-600">模拟验证码为 <span className="font-mono font-bold">123456</span>，任意手机号均可登录体验</p>
          </div>

          {/* 底部版权 */}
          <div className="mt-10 text-center text-xs text-slate-400">
            <p>© 2025 智泊科技 版权所有</p>
          </div>
        </div>
      </div>
    </div>
  );
}
