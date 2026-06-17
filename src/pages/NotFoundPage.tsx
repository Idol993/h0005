import { Link, useLocation } from 'react-router-dom';
import { Home, Car, MapPin, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4">
      <div className="text-center max-w-lg animate-fade-in-up">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-accent-400 opacity-10 blur-3xl rounded-full" />
          <div className="relative">
            <h1 className="text-[120px] md:text-[160px] font-black gradient-text-brand leading-none">
              404
            </h1>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-800 flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning-500" />
            页面迷路了
          </h2>
          <p className="text-gray-500">
            您访问的路径 <code className="px-2 py-1 bg-brand-50 rounded text-brand-600 text-sm">{location.pathname}</code> 不存在
          </p>
          <p className="text-gray-400 text-sm">可能已被移除或链接错误，请返回首页继续探索</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-brand text-white rounded-xl hover:shadow-glow-brand hover:-translate-y-0.5 transition-all duration-300 font-medium"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-brand-200 text-brand-600 rounded-xl hover:bg-brand-50 hover:border-brand-400 transition-all duration-300 font-medium"
          >
            <MapPin className="w-5 h-5" />
            搜索车位
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white rounded-2xl shadow-card border border-brand-100/50">
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
            <Car className="w-4 h-4" />
            快速导航
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/order/active" className="px-4 py-2 bg-accent-50 text-accent-600 rounded-lg text-sm hover:bg-accent-100 transition-colors">
              我的订单
            </Link>
            <Link to="/orders" className="px-4 py-2 bg-success-500/10 text-success-600 rounded-lg text-sm hover:bg-success-500/20 transition-colors">
              历史记录
            </Link>
            <Link to="/driver/profile" className="px-4 py-2 bg-brand-50 text-brand-600 rounded-lg text-sm hover:bg-brand-100 transition-colors">
              个人中心
            </Link>
            <Link to="/login" className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              切换角色
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
