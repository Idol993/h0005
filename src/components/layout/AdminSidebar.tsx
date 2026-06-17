import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ShieldCheck,
  FileWarning,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

/**
 * 管理员端侧边栏导航组件
 * 风格深色，与业主端区分开
 * 包含菜单项：数据看板/车位审核/纠纷处理/违规管理/用户管理
 * 支持收缩/展开功能
 */

/** 导航菜单项配置 */
const menuItems = [
  {
    key: 'dashboard',
    label: '数据看板',
    icon: BarChart3,
    path: '/admin/dashboard',
  },
  {
    key: 'audit',
    label: '车位审核',
    icon: ShieldCheck,
    path: '/admin/audit',
  },
  {
    key: 'disputes',
    label: '纠纷处理',
    icon: FileWarning,
    path: '/admin/disputes',
  },
  {
    key: 'violations',
    label: '违规管理',
    icon: AlertTriangle,
    path: '/admin/violations',
  },
  {
    key: 'users',
    label: '用户管理',
    icon: Users,
    path: '/admin/users',
  },
];

export function AdminSidebar() {
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
        'h-screen sticky top-0 flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 transition-all duration-300 shrink-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-700/50">
        <Link to="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">智泊管理</span>
              <span className="text-xs text-slate-400">Admin Console</span>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
                active
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-500" />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform group-hover:scale-110',
                  active && 'text-indigo-300'
                )}
              />
              {!collapsed && (
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 收缩/展开按钮 */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
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
      <div className="border-t border-slate-700/50 p-3">
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <div className="relative">
            <img
              src={user?.avatar}
              alt={user?.nickname}
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/50 shrink-0"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-800" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.nickname}
              </p>
              <p className="text-xs text-slate-400 truncate">管理员</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors mt-2',
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

export default AdminSidebar;
