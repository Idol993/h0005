import {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
  useMemo,
} from 'react';
import { Toast } from './Toast';

/**
 * Toast通知系统 - 全局Context
 * 提供success/error/warning/info四种方法
 * 支持自动消失（3秒）
 */

/** Toast类型枚举 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Toast数据项接口 */
export interface ToastItem {
  /** 唯一标识 */
  id: string;
  /** Toast类型 */
  type: ToastType;
  /** 主消息 */
  message: string;
  /** 描述信息（可选） */
  description?: string;
  /** 持续时间（毫秒），0表示不自动关闭 */
  duration?: number;
}

/** Toast方法参数接口 */
interface ToastOptions {
  /** 主消息 */
  message: string;
  /** 描述信息（可选） */
  description?: string;
  /** 持续时间（毫秒），默认3000 */
  duration?: number;
}

/** Toast Context接口 */
interface ToastContextValue {
  /** 显示成功提示 */
  success: (options: ToastOptions | string) => void;
  /** 显示错误提示 */
  error: (options: ToastOptions | string) => void;
  /** 显示警告提示 */
  warning: (options: ToastOptions | string) => void;
  /** 显示信息提示 */
  info: (options: ToastOptions | string) => void;
  /** 关闭指定Toast */
  dismiss: (id: string) => void;
  /** 关闭所有Toast */
  dismissAll: () => void;
}

/** 创建Toast Context */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** 生成唯一ID */
const generateId = () =>
  `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/** Toast Provider组件属性接口 */
interface ToastProviderProps {
  /** 子组件 */
  children: ReactNode;
  /** Toast显示位置 */
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

/** 位置样式映射 */
const positionStyles = {
  'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 sm:top-6',
  'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6',
};

/**
 * Toast Provider组件
 * 需要在应用根组件中包裹，以提供全局Toast功能
 */
export function ToastProvider({
  children,
  position = 'top-right',
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /** 添加Toast */
  const addToast = useCallback((type: ToastType, options: ToastOptions | string) => {
    const opts: ToastOptions =
      typeof options === 'string' ? { message: options } : options;
    const newToast: ToastItem = {
      id: generateId(),
      type,
      message: opts.message,
      description: opts.description,
      duration: opts.duration ?? 3000,
    };
    setToasts((prev) => [...prev, newToast]);
    return newToast.id;
  }, []);

  /** 关闭指定Toast */
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /** 关闭所有Toast */
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  /** Toast方法 */
  const toastMethods = useMemo<ToastContextValue>(
    () => ({
      success: (opts) => addToast('success', opts),
      error: (opts) => addToast('error', opts),
      warning: (opts) => addToast('warning', opts),
      info: (opts) => addToast('info', opts),
      dismiss,
      dismissAll,
    }),
    [addToast, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}

      {/* Toast容器 */}
      <div
        className={`fixed z-[200] flex flex-col gap-3 pointer-events-none ${positionStyles[position]}`}
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast Hook
 * 在组件中使用此Hook获取Toast方法
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
