import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 分页组件
 * 支持首页/末页跳转、上一页/下一页、页码快速选择
 * 显示总条数和当前页信息
 */

/** 分页组件属性接口 */
export interface PaginationProps {
  /** 当前页码（从1开始） */
  current: number;
  /** 每页显示条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
  /** 页码变化回调 */
  onChange: (page: number) => void;
  /** 显示的页码数量（不含首尾和省略号） */
  showPages?: number;
  /** 是否显示首尾跳转按钮 */
  showJump?: boolean;
  /** 是否显示总条数信息 */
  showTotal?: boolean;
  /** 是否显示每页条数选择器（预留） */
  showSizeChanger?: boolean;
  /** 容器类名 */
  className?: string;
}

export function Pagination({
  current,
  pageSize,
  total,
  onChange,
  showPages = 5,
  showJump = true,
  showTotal = true,
  className,
}: PaginationProps) {
  /** 计算总页数 */
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /** 生成页码数组（带省略号） */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const half = Math.floor(showPages / 2);

    let start = Math.max(1, current - half);
    let end = Math.min(totalPages, start + showPages - 1);
    start = Math.max(1, end - showPages + 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('ellipsis');
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  /** 跳转到指定页 */
  const goTo = (page: number) => {
    const target = Math.max(1, Math.min(totalPages, page));
    if (target !== current) {
      onChange(target);
    }
  };

  /** 计算当前显示的数据范围 */
  const startItem = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-2',
        className
      )}
    >
      {/* 总条数信息 */}
      {showTotal && (
        <div className="text-sm text-slate-500 order-2 sm:order-1">
          共 <span className="font-semibold text-slate-700">{total}</span> 条，
          第 <span className="font-semibold text-slate-700">{startItem}</span>-
          <span className="font-semibold text-slate-700">{endItem}</span> 条
        </div>
      )}

      {/* 分页按钮组 */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* 首页按钮 */}
        {showJump && (
          <button
            onClick={() => goTo(1)}
            disabled={current === 1}
            className={cn(
              'p-2 rounded-lg transition-colors',
              current === 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100 hover:text-brand-600'
            )}
            title="首页"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* 上一页按钮 */}
        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            current === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100 hover:text-brand-600'
          )}
          title="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 页码按钮 */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((page, index) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goTo(page)}
                className={cn(
                  'w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200',
                  page === current
                    ? 'bg-gradient-brand text-white shadow-glow-brand'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-brand-600'
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* 下一页按钮 */}
        <button
          onClick={() => goTo(current + 1)}
          disabled={current === totalPages}
          className={cn(
            'p-2 rounded-lg transition-colors',
            current === totalPages
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100 hover:text-brand-600'
          )}
          title="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 末页按钮 */}
        {showJump && (
          <button
            onClick={() => goTo(totalPages)}
            disabled={current === totalPages}
            className={cn(
              'p-2 rounded-lg transition-colors',
              current === totalPages
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100 hover:text-brand-600'
            )}
            title="末页"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Pagination;
