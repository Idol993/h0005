import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 数据统计卡片组件
 * 包含图标、数值、变化率、趋势方向箭头
 * 带渐变边框效果
 */

/** 趋势方向类型 */
type TrendDirection = 'up' | 'down' | 'none';

/** 渐变主题类型 */
type GradientTheme = 'blue' | 'orange' | 'green' | 'purple' | 'pink';

/** 渐变配置映射 */
const gradientMap: Record<GradientTheme, { border: string; iconBg: string; icon: string }> = {
  blue: {
    border: 'from-blue-400 via-indigo-500 to-brand-500',
    iconBg: 'from-blue-500 to-indigo-600',
    icon: 'text-blue-500',
  },
  orange: {
    border: 'from-amber-400 via-orange-500 to-accent-500',
    iconBg: 'from-orange-400 to-accent-600',
    icon: 'text-accent-500',
  },
  green: {
    border: 'from-emerald-400 via-green-500 to-teal-500',
    iconBg: 'from-emerald-500 to-green-600',
    icon: 'text-emerald-500',
  },
  purple: {
    border: 'from-purple-400 via-violet-500 to-indigo-500',
    iconBg: 'from-purple-500 to-violet-600',
    icon: 'text-purple-500',
  },
  pink: {
    border: 'from-pink-400 via-rose-500 to-red-400',
    iconBg: 'from-pink-500 to-rose-600',
    icon: 'text-pink-500',
  },
};

/** 数据统计卡片属性接口 */
export interface StatCardProps {
  /** 统计卡片标题 */
  title: string;
  /** 数值 */
  value: string | number;
  /** 数值前缀（如¥、$） */
  prefix?: string;
  /** 数值后缀（如%、个） */
  suffix?: string;
  /** 变化率（如 "+12.5%"、"-3.2%"） */
  changeRate?: string;
  /** 趋势方向 */
  trend?: TrendDirection;
  /** 趋势描述（如"较昨日"、"较上月"） */
  trendLabel?: string;
  /** 图标组件 */
  icon?: ReactNode;
  /** 渐变主题 */
  theme?: GradientTheme;
  /** 容器类名 */
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  prefix,
  suffix,
  changeRate,
  trend = 'none',
  trendLabel = '较昨日',
  icon,
  theme = 'blue',
  className,
  onClick,
}: StatCardProps) {
  const gradients = gradientMap[theme];

  /** 趋势颜色 */
  const trendColor =
    trend === 'up'
      ? 'text-emerald-600 bg-emerald-50'
      : trend === 'down'
      ? 'text-red-600 bg-red-50'
      : 'text-slate-500 bg-slate-100';

  return (
    <div
      className={cn(
        'relative group rounded-2xl p-[1.5px] bg-gradient-to-br transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        gradients.border,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* 卡片内容 */}
      <div className="h-full rounded-[calc(1rem-1.5px)] bg-white p-5">
        {/* 头部：标题和图标 */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm text-slate-500 font-medium">{title}</span>
          <div
            className={cn(
              'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md',
              gradients.iconBg
            )}
          >
            <div className="text-white">{icon}</div>
          </div>
        </div>

        {/* 数值 */}
        <div className="flex items-baseline gap-1 mb-3">
          {prefix && (
            <span className="text-lg font-medium text-slate-500">{prefix}</span>
          )}
          <span className="text-3xl font-bold text-slate-800 tracking-tight tabular-nums">
            {value.toLocaleString()}
          </span>
          {suffix && (
            <span className="text-sm font-medium text-slate-500 ml-1">
              {suffix}
            </span>
          )}
        </div>

        {/* 趋势区域 */}
        {changeRate && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold',
                trendColor
              )}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {changeRate}
            </span>
            <span className="text-xs text-slate-400">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
