import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-brand">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-card-hover">
          <div className="w-16 h-16 bg-danger-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-7a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-800 mb-2">账号已被封禁</h2>
          <p className="text-gray-500 mb-4">您的账号因违规操作已被平台封禁，如有疑问请联系客服。</p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const redirectMap: Record<UserRole, string> = {
      [UserRole.DRIVER]: '/',
      [UserRole.OWNER]: '/owner/dashboard',
      [UserRole.ADMIN]: '/admin/dashboard',
    };
    return <Navigate to={redirectMap[user.role]} replace />;
  }

  return <>{children}</>;
}
