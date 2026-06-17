import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  EyeOff,
  X,
  Check,
} from 'lucide-react';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useParkingStore } from '@/store/parkingStore';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDates(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

type CellStatus = 'free' | 'booked' | 'paused';

interface SelectedCell {
  date: string;
  hour: number;
}

export default function OwnerParkingCalendarPage() {
  const { user } = useAuthStore();
  const { parkings, closedSlots, closeSlot, reopenSlot } = useParkingStore();
  const { orders } = useOrderStore();

  const ownerId = user?.id || 'o001';
  const ownerParkings = parkings.filter((p) => p.ownerId === ownerId);

  const [selectedParkingId, setSelectedParkingId] = useState<string>(
    ownerParkings.length > 0 ? ownerParkings[0].id : ''
  );
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const weekDates = useMemo(() => getWeekDates(), []);

  const bookedMap = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    if (!selectedParkingId) return map;
    orders.forEach((order) => {
      if (order.parkingId !== selectedParkingId) return;
      if (order.status !== 'paid' && order.status !== 'active') return;
      const start = new Date(order.scheduledStart);
      const end = new Date(order.scheduledEnd);
      const dateStr = formatDateStr(start);
      if (!map[dateStr]) map[dateStr] = new Set();
      for (let h = start.getHours(); h < end.getHours(); h++) {
        map[dateStr].add(h);
      }
    });
    return map;
  }, [orders, selectedParkingId]);

  const pausedMap = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    if (!selectedParkingId) return map;
    const slots = closedSlots[selectedParkingId] || [];
    slots.forEach((slot) => {
      if (!map[slot.date]) map[slot.date] = new Set();
      for (let h = slot.startHour; h < slot.endHour; h++) {
        map[slot.date].add(h);
      }
    });
    return map;
  }, [closedSlots, selectedParkingId]);

  const getCellStatus = (dateStr: string, hour: number): CellStatus => {
    if (pausedMap[dateStr]?.has(hour)) return 'paused';
    if (bookedMap[dateStr]?.has(hour)) return 'booked';
    return 'free';
  };

  const handleCellClick = (dateStr: string, hour: number) => {
    const status = getCellStatus(dateStr, hour);
    if (status === 'booked') return;
    if (selectedCell?.date === dateStr && selectedCell?.hour === hour) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ date: dateStr, hour });
    }
  };

  const handleCloseSlot = () => {
    if (!selectedCell || !selectedParkingId) return;
    closeSlot(selectedParkingId, {
      date: selectedCell.date,
      startHour: selectedCell.hour,
      endHour: selectedCell.hour + 1,
    });
    setSelectedCell(null);
  };

  const handleReopenSlot = () => {
    if (!selectedCell || !selectedParkingId) return;
    reopenSlot(selectedParkingId, {
      date: selectedCell.date,
      startHour: selectedCell.hour,
      endHour: selectedCell.hour + 1,
    });
    setSelectedCell(null);
  };

  const selectedParking = ownerParkings.find((p) => p.id === selectedParkingId);

  const cellStyles: Record<CellStatus, string> = {
    free: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    booked: 'bg-blue-50 border-blue-200 cursor-default',
    paused: 'bg-slate-100 hover:bg-slate-200 border-slate-300',
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <OwnerSidebar />

      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">车位日历</h1>
                <p className="text-sm text-slate-400">查看和管理车位可用时段</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              <select
                value={selectedParkingId}
                onChange={(e) => {
                  setSelectedParkingId(e.target.value);
                  setSelectedCell(null);
                }}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {ownerParkings.length === 0 && (
                  <option value="">暂无车位</option>
                )}
                {ownerParkings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} - {formatCurrency(p.hourlyRate)}/小时
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
                <span className="text-slate-600">空闲</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
                <span className="text-slate-600">已预约</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-200 border border-slate-400" />
                <span className="text-slate-600">已暂停</span>
              </div>
            </div>
          </div>

          {selectedParking && (
            <Card radius="2xl" shadowSize="card" bordered>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white w-20 px-2 py-3 text-xs font-medium text-slate-400 border-b border-r border-slate-100">
                        <Clock className="w-4 h-4 mx-auto text-slate-400" />
                      </th>
                      {weekDates.map((date, i) => {
                        const isToday = formatDateStr(date) === formatDateStr(new Date());
                        return (
                          <th
                            key={i}
                            className={cn(
                              'px-2 py-3 text-center border-b border-slate-100 min-w-[100px]',
                              isToday && 'bg-brand-50/50'
                            )}
                          >
                            <div
                              className={cn(
                                'text-xs font-medium',
                                isToday ? 'text-brand-600' : 'text-slate-400'
                              )}
                            >
                              周{WEEK_DAYS[date.getDay()]}
                            </div>
                            <div
                              className={cn(
                                'text-sm font-bold mt-0.5',
                                isToday ? 'text-brand-600' : 'text-slate-700'
                              )}
                            >
                              {date.getMonth() + 1}/{date.getDate()}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: TOTAL_HOURS }, (_, idx) => {
                      const hour = START_HOUR + idx;
                      return (
                        <tr key={hour}>
                          <td className="sticky left-0 z-10 bg-white px-2 py-1 text-xs text-slate-400 text-center border-r border-slate-100 font-mono h-10">
                            {String(hour).padStart(2, '0')}:00
                          </td>
                          {weekDates.map((date, dayIdx) => {
                            const dateStr = formatDateStr(date);
                            const status = getCellStatus(dateStr, hour);
                            const isSelected =
                              selectedCell?.date === dateStr && selectedCell?.hour === hour;
                            const isPast =
                              new Date() > new Date(dateStr + 'T' + String(hour).padStart(2, '0') + ':00');

                            return (
                              <td
                                key={dayIdx}
                                className="p-0.5 border border-slate-50"
                              >
                                <div
                                  onClick={() => !isPast && handleCellClick(dateStr, hour)}
                                  className={cn(
                                    'h-10 rounded-lg border transition-all duration-150 flex items-center justify-center text-xs font-medium relative',
                                    cellStyles[status],
                                    isPast && 'opacity-40 cursor-not-allowed',
                                    !isPast && status !== 'booked' && 'cursor-pointer',
                                    isSelected && 'ring-2 ring-brand-500 ring-offset-1',
                                    status === 'free' && !isPast && 'text-emerald-600',
                                    status === 'booked' && 'text-blue-600',
                                    status === 'paused' && !isPast && 'text-slate-500'
                                  )}
                                >
                                  {status === 'booked' && <span className="text-[10px]">预约</span>}
                                  {status === 'paused' && !isPast && <EyeOff className="w-3 h-3" />}
                                  {status === 'free' && !isPast && <Eye className="w-3 h-3 opacity-50" />}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!selectedParking && ownerParkings.length === 0 && (
            <Card>
              <div className="py-16 text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <h3 className="text-lg font-semibold text-slate-500 mb-2">暂无车位</h3>
                <p className="text-sm text-slate-400">请先发布车位后再查看日历</p>
              </div>
            </Card>
          )}

          {selectedCell && (
            <Card radius="xl" shadowSize="card" bordered>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      getCellStatus(selectedCell.date, selectedCell.hour) === 'free'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {getCellStatus(selectedCell.date, selectedCell.hour) === 'free' ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {selectedCell.date} {String(selectedCell.hour).padStart(2, '0')}:00 - {String(selectedCell.hour + 1).padStart(2, '0')}:00
                    </div>
                    <div className="text-sm text-slate-400">
                      {getCellStatus(selectedCell.date, selectedCell.hour) === 'free'
                        ? '该时段当前空闲'
                        : '该时段已暂停'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getCellStatus(selectedCell.date, selectedCell.hour) === 'free' && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<EyeOff className="w-4 h-4" />}
                      onClick={handleCloseSlot}
                    >
                      暂停该时段
                    </Button>
                  )}
                  {getCellStatus(selectedCell.date, selectedCell.hour) === 'paused' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={handleReopenSlot}
                    >
                      重新开放
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCell(null)}
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    取消
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {selectedParking && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card radius="xl" shadowSize="sm" bordered>
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">车位单价</div>
                  <div className="text-2xl font-bold text-brand-600">
                    {formatCurrency(selectedParking.hourlyRate)}
                    <span className="text-sm font-normal text-slate-400">/小时</span>
                  </div>
                </div>
              </Card>
              <Card radius="xl" shadowSize="sm" bordered>
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">今日预约</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(() => {
                      const todayStr = formatDateStr(new Date());
                      return bookedMap[todayStr]?.size || 0;
                    })()}
                    <span className="text-sm font-normal text-slate-400"> 个时段</span>
                  </div>
                </div>
              </Card>
              <Card radius="xl" shadowSize="sm" bordered>
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">已暂停</div>
                  <div className="text-2xl font-bold text-slate-500">
                    {(() => {
                      const todayStr = formatDateStr(new Date());
                      return pausedMap[todayStr]?.size || 0;
                    })()}
                    <span className="text-sm font-normal text-slate-400"> 个时段</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
