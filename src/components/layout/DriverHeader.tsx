import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Car,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Package,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

/**
 * 驾驶员端顶部导航栏组件
 * 包含 Logo、搜索入口、进行中订单入口、消息通知、用户头像下拉菜单
 * 支持响应式设计，移动端菜单折叠
 */
export function DriverHeader() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hasNewMessage] = useState(true);

  /** 处理退出登录 */
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo 区域 */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-brand bg-clip-text text-transparent">
              智泊
            </span>
          </Link>
        </div>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex items-center gap-6">
          {/* 搜索入口 */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm transition-colors w-64"
            onClick={() => navigate('/search')}
          >
            <Search className="w-4 h-4" />
            <span>搜索附近车位...</span>
          </button>
        </nav>

        {/* 右侧操作区 - 桌面端 */}
        <div className="hidden md:flex items-center gap-3">
          {/* 进行中订单入口 */}
          <button
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => navigate('/driver/orders?status=active')}
            title="进行中订单"
          >
            <Package className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              1
            </span>
          </button>

          {/* 消息通知 */}
          <button
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => navigate('/driver/messages')}
            title="消息通知"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {hasNewMessage && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse-soft" />
            )}
          </button>

          {/* 用户头像下拉菜单 */}
          <div className="relative">
            <button
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <img
                src={user?.avatar}
                alt={user?.nickname}
                className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
              />
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-500 transition-transform',
                  userMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* 下拉菜单 */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card border border-slate-100 py-2 animate-slide-down">
                {/* 用户信息 */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-slate-800">{user?.nickname}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.phone}</p>
                </div>

                {/* 菜单项 */}
                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      navigate('/driver/profile');
                      setUserMenuOpen(false);
                    }}
                  >
                    <User className="w-4 h-4" />
                    个人中心
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      navigate('/driver/orders');
                      setUserMenuOpen(false);
                    }}
                  >
                    <Package className="w-4 h-4" />
                    我的订单
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      navigate('/driver/settings');
                      setUserMenuOpen(false);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    账号设置
                  </button>
                </div>

                {/* 退出登录 */}
                <div className="border-t border-slate-100 pt-1">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 移动端菜单按钮 */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-slate-700" />
          ) : (
            <Menu className="w-6 h-6 text-slate-700" />
          )}
        </button>
      </div>

      {/* 移动端折叠菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white animate-slide-down">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {/* 搜索入口 */}
            <button
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm w-full transition-colors"
              onClick={() => {
                navigate('/search');
                setMobileMenuOpen(false);
              }}
            >
              <Search className="w-4 h-4" />
              <span>搜索附近车位...</span>
            </button>

            {/* 菜单项 */}
            <button
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 w-full transition-colors"
              onClick={() => {
                navigate('/driver/orders?status=active');
                setMobileMenuOpen(false);
              }}
            >
              <Package className="w-5 h-5 text-brand-500" />
              <span className="flex-1 text-left">进行中订单</span>
              <span className="w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center">
                1
              </span>
            </button>

            <button
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 w-full transition-colors"
              onClick={() => {
                navigate('/driver/messages');
                setMobileMenuOpen(false);
              }}
            >
              <Bell className="w-5 h-5 text-brand-500" />
              <span className="flex-1 text-left">消息通知</span>
              {hasNewMessage && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <button
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 w-full transition-colors"
              onClick={() => {
                navigate('/driver/profile');
                setMobileMenuOpen(false);
              }}
            >
              <img
                src={user?.avatar}
                alt={user?.nickname}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="flex-1 text-left">{user?.nickname}</span>
            </button>

            <button
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 w-full transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default DriverHeader;
