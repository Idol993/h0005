import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Receipt,
  Wallet,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

/**
 * 业主端侧边栏导航组件
 * 包含 Logo区域、导航菜单项、当前路由高亮、底部用户信息和退出登录
 * 支持收缩/展开功能
 */

/** 导航菜单项配置 */
const menuItems = [
  {
    key: 'dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    path: '/owner/dashboard',
  },
  {
    key: 'parking',
    label: '车位管理',
    icon: MapPin,
    path: '/owner/parking',
  },
  {
    key: 'publish',
    label: '发布车位',
    icon: PlusCircle,
    path: '/owner/publish',
  },
  {
    key: 'records',
    label: '出租记录',
    icon: Receipt,
    path: '/owner/records',
  },
  {
    key: 'finance',
    label: '财务中心',
    icon: Wallet,
    path: '/owner/finance',
  },
];

export function OwnerSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  /** 处理退出登录 */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /** 判断当前路由是否激活 */
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-gradient-to-b from-white to-slate-50 border-r border-slate-200 transition-all duration-300 shrink-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
        <Link to="/owner/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold bg-gradient-brand bg-clip-text text-transparent">
                智泊业主
              </span>
              <span className="text-xs text-slate-400">Parking Owner</span>
            </div>
          )}
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                active
                  ? 'bg-gradient-brand text-white shadow-glow-brand'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-brand-600'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform group-hover:scale-110')}
              />
              {!collapsed && (
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              )}
              {!collapsed && active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 收缩/展开按钮 */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition-colors"
          title={collapsed ? '展开菜单' : '收缩菜单'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">收缩菜单</span>
            </>
          )}
        </button>
      </div>

      {/* 底部用户信息和退出登录 */}
      <div className="border-t border-slate-200 p-3 bg-white/50 backdrop-blur">
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <img
            src={user?.avatar}
            alt={user?.nickname}
            className="w-10 h-10 rounded-full object-cover border-2 border-brand-200 shrink-0"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.nickname}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.phone}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? '退出登录' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">退出登录</span>}
        </button>
      </div>
    </aside>
  );
}

export default OwnerSidebar;
