import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 通用按钮组件
 * variants: primary(蓝渐变)/secondary/accent(橙)/outline/ghost/danger
 * sizes: sm/md/lg
 * 支持 loading状态、disabled状态
 * 传递原生button属性
 */

/** 按钮变体类型 */
type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';

/** 按钮尺寸类型 */
type ButtonSize = 'sm' | 'md' | 'lg';

/** 按钮组件属性接口 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体样式 */
  variant?: ButtonVariant;
  /** 按钮尺寸 */
  size?: ButtonSize;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 按钮左侧图标 */
  leftIcon?: ReactNode;
  /** 按钮右侧图标 */
  rightIcon?: ReactNode;
}

/** 按钮变体样式映射 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-brand text-white shadow-glow-brand hover:shadow-lg hover:brightness-110 active:brightness-95',
  secondary:
    'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-900 shadow-md',
  accent:
    'bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-glow-accent hover:brightness-110 active:brightness-95',
  outline:
    'border-2 border-brand-500 text-brand-600 bg-transparent hover:bg-brand-50 active:bg-brand-100',
  ghost:
    'text-slate-700 bg-transparent hover:bg-slate-100 active:bg-slate-200',
  danger:
    'bg-gradient-to-br from-red-500 to-red-600 text-white hover:brightness-110 active:brightness-95 shadow-md shadow-red-500/30',
};

/** 按钮尺寸样式映射 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-7 text-base rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          loading && 'pointer-events-none',
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        )}
        {!loading && leftIcon && (
          <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
