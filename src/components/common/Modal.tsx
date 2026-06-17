import { ReactNode, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/**
 * 通用模态框组件
 * 包含标题、内容、底部按钮区域
 * 支持关闭按钮、点击遮罩关闭、ESC关闭
 */

/** 模态框尺寸类型 */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/** 模态框组件属性接口 */
export interface ModalProps {
  /** 控制模态框显示/隐藏 */
  open: boolean;
  /** 模态框标题 */
  title?: ReactNode;
  /** 模态框内容 */
  children?: ReactNode;
  /** 底部操作区域内容 */
  footer?: ReactNode;
  /** 模态框尺寸 */
  size?: ModalSize;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 是否允许点击遮罩关闭 */
  maskClosable?: boolean;
  /** 是否允许ESC键关闭 */
  escClosable?: boolean;
  /** 关闭事件回调 */
  onClose: () => void;
  /** 容器类名 */
  className?: string;
}

/** 模态框尺寸样式映射 */
const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-5xl max-h-[90vh]',
};

export function Modal({
  open,
  title,
  children,
  footer,
  size = 'md',
  showClose = true,
  maskClosable = true,
  escClosable = true,
  onClose,
  className,
}: ModalProps) {
  /** 处理ESC键关闭 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escClosable && open) {
        onClose();
      }
    },
    [escClosable, open, onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  /** 默认底部按钮 */
  const defaultFooter = (
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={onClose}>
        取消
      </Button>
      <Button variant="primary" onClick={onClose}>
        确定
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div
        className={cn(
          'absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in',
        )}
        onClick={maskClosable ? onClose : undefined}
      />

      {/* 模态框内容 */}
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl flex flex-col animate-fade-in-up',
          sizeStyles[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题区域 */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            {title ? (
              <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            ) : (
              <div />
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 px-6 py-5 overflow-y-auto">
          {children}
        </div>

        {/* 底部按钮区域 */}
        {(footer !== undefined || defaultFooter) && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 rounded-b-2xl">
            {footer === undefined ? defaultFooter : footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
