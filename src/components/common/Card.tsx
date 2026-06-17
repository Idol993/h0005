import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 通用卡片组件
 * 可选header/footer
 * 可选hover效果
 * 支持各种圆角和阴影
 */

/** 圆角尺寸类型 */
type CardRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

/** 阴影尺寸类型 */
type CardShadow = 'none' | 'sm' | 'md' | 'lg' | 'card' | 'card-hover';

/** 卡片组件属性接口 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 卡片头部内容 */
  header?: ReactNode;
  /** 卡片底部内容 */
  footer?: ReactNode;
  /** 是否启用hover效果 */
  hoverable?: boolean;
  /** 圆角尺寸 */
  radius?: CardRadius;
  /** 阴影尺寸 */
  shadowSize?: CardShadow;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 卡片主体内容 */
  children?: ReactNode;
}

/** 圆角样式映射 */
const radiusStyles: Record<CardRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

/** 阴影样式映射 */
const shadowStyles: Record<CardShadow, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  card: 'shadow-card',
  'card-hover': 'shadow-card-hover',
};

export function Card({
  className,
  header,
  footer,
  hoverable = false,
  radius = '2xl',
  shadowSize = 'card',
  bordered = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white transition-all duration-300 overflow-hidden',
        radiusStyles[radius],
        shadowStyles[shadowSize],
        bordered && 'border border-slate-200/60',
        hoverable && 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50">
          {header}
        </div>
      )}
      {children && <div className="p-5">{children}</div>}
      {footer && (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
