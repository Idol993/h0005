import { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastType, ToastItem } from './ToastContext';

/**
 * 单个Toast通知组件
 * 显示成功/错误/警告/信息四种类型
 * 自动消失（3秒）
 */

/** Toast组件属性接口 */
export interface ToastProps {
  /** Toast数据项 */
  toast: ToastItem;
  /** 关闭Toast回调 */
  onClose: (id: string) => void;
}

/** 图标组件映射 */
const IconMap: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/** 样式配置映射 */
const styleMap: Record<ToastType, { bg: string; border: string; icon: string; progress: string }> = {
  success: {
    bg: 'bg-white',
    border: 'border-l-4 border-emerald-500',
    icon: 'text-emerald-500',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-white',
    border: 'border-l-4 border-red-500',
    icon: 'text-red-500',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-white',
    border: 'border-l-4 border-amber-500',
    icon: 'text-amber-500',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-white',
    border: 'border-l-4 border-blue-500',
    icon: 'text-blue-500',
    progress: 'bg-blue-500',
  },
};

export function Toast({ toast, onClose }: ToastProps) {
  const { id, type, message, description, duration = 3000 } = toast;
  const Icon = IconMap[type];
  const styles = styleMap[type];

  /** 自动关闭定时器 */
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        'relative w-full max-w-sm rounded-xl shadow-lg overflow-hidden animate-slide-down',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-3 p-4 pr-10">
        {/* 图标 */}
        <div className="shrink-0 pt-0.5">
          <Icon className={cn('w-5 h-5', styles.icon)} />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{message}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={() => onClose(id)}
          className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 进度条 */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
          <div
            className={cn('h-full', styles.progress)}
            style={{
              animation: `toastProgress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Toast;
