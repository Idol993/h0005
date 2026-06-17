import { ReactNode } from 'react';
import { Inbox, Search, FileX, ShoppingBag, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/**
 * 空状态组件
 * 带图标和描述，支持多种预设类型和自定义图标
 */

/** 空状态预设类型 */
type EmptyType = 'default' | 'search' | 'data' | 'order' | 'message';

/** 图标组件映射 */
const IconMap = {
  default: Inbox,
  search: Search,
  data: FileX,
  order: ShoppingBag,
  message: MessageSquare,
};

/** 空状态组件属性接口 */
export interface EmptyStateProps {
  /** 预设空状态类型 */
  type?: EmptyType;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 主标题 */
  title?: string;
  /** 描述文本 */
  description?: string;
  /** 操作按钮文本 */
  actionText?: string;
  /** 操作按钮点击事件 */
  onAction?: () => void;
  /** 额外操作区内容 */
  extra?: ReactNode;
  /** 容器类名 */
  className?: string;
}

/** 预设文案映射 */
const presetText: Record<EmptyType, { title: string; description: string }> = {
  default: {
    title: '暂无数据',
    description: '当前没有可显示的内容，请稍后再来查看',
  },
  search: {
    title: '未找到匹配结果',
    description: '试试调整搜索关键词或筛选条件',
  },
  data: {
    title: '还没有任何记录',
    description: '完成相关操作后，记录会显示在这里',
  },
  order: {
    title: '暂无订单',
    description: '快去搜索附近的车位，开始您的停车之旅吧',
  },
  message: {
    title: '暂无消息',
    description: '有新消息时会第一时间通知您',
  },
};

export function EmptyState({
  type = 'default',
  icon,
  title,
  description,
  actionText,
  onAction,
  extra,
  className,
}: EmptyStateProps) {
  const Icon = IconMap[type];
  const texts = presetText[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {/* 图标区域 */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-brand-100/50 rounded-full blur-2xl scale-110" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-slate-50 flex items-center justify-center border border-slate-100">
          {icon ? (
            icon
          ) : (
            <Icon className="w-10 h-10 text-brand-400" strokeWidth={1.5} />
          )}
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {title ?? texts.title}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description ?? texts.description}
      </p>

      {/* 操作按钮 */}
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction} size="md">
          {actionText}
        </Button>
      )}

      {/* 额外操作区 */}
      {extra && <div className="mt-4">{extra}</div>}
    </div>
  );
}

export default EmptyState;
