import { HTMLAttributes, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 状态徽章组件
 * 支持状态颜色：success/warning/danger/info/default
 * 显示订单、车位等状态文本
 */

/** 状态类型 */
export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'ghost';

/** 徽章尺寸类型 */
type BadgeSize = 'sm' | 'md';

/** 徽章组件属性接口 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** 状态变体 */
  variant?: BadgeVariant;
  /** 是否显示状态图标 */
  showIcon?: boolean;
  /** 徽章尺寸 */
  size?: BadgeSize;
  /** 是否填充背景（false时为描边样式） */
  filled?: boolean;
  /** 徽章内容 */
  children?: ReactNode;
}

/** 状态变体样式映射（填充样式） */
const filledVariantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  default: 'bg-slate-50 text-slate-700 border-slate-200',
  ghost: 'bg-slate-100 text-slate-600 border-slate-200',
};

/** 状态变体样式映射（描边样式） */
const outlineVariantStyles: Record<BadgeVariant, string> = {
  success: 'text-emerald-600 border-emerald-300 bg-white',
  warning: 'text-amber-600 border-amber-300 bg-white',
  danger: 'text-red-600 border-red-300 bg-white',
  info: 'text-blue-600 border-blue-300 bg-white',
  default: 'text-slate-600 border-slate-300 bg-white',
  ghost: 'text-slate-600 border-slate-300 bg-slate-50',
};

/** 图标组件映射 */
const IconMap: Record<BadgeVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  default: Circle,
  ghost: Circle,
};

/** 尺寸样式映射 */
const sizeStyles: Record<BadgeSize, { container: string; icon: string }> = {
  sm: {
    container: 'h-5 px-2 text-xs gap-1 rounded-md',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'h-6 px-2.5 text-xs gap-1.5 rounded-lg',
    icon: 'w-3.5 h-3.5',
  },
};

export function Badge({
  className,
  variant = 'default',
  showIcon = true,
  size = 'md',
  filled = true,
  children,
  ...props
}: BadgeProps) {
  const Icon = IconMap[variant];
  const variantStyle = filled
    ? filledVariantStyles[variant]
    : outlineVariantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border whitespace-nowrap',
        variantStyle,
        sizeStyles[size].container,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={cn(sizeStyles[size].icon, 'shrink-0')} />}
      {children}
    </span>
  );
}

export default Badge;
