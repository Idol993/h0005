import { create } from 'zustand';
import type { ParkingSpot, ParkingStatus, TimeSlot } from '../types';
import {
  parkings as initialParkings,
  findParkingById,
  findParkingsByOwner,
} from '../data/parkings';
import { generateId } from '../utils/format';
import { useAuthStore } from './authStore';
import { getStorage, setStorage } from '../utils/storage';
import { useOrderStore } from './orderStore';

const CLOSED_SLOTS_KEY = 'parking_app_closed_slots';

function loadPersistedClosedSlots(): Record<string, ClosedSlot[]> {
  return getStorage<Record<string, ClosedSlot[]>>(CLOSED_SLOTS_KEY, {});
}

function persistClosedSlots(slots: Record<string, ClosedSlot[]>) {
  setStorage(CLOSED_SLOTS_KEY, slots);
}

interface SearchParams {
  keyword?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  facilities?: string[];
  status?: ParkingStatus;
}

interface ClosedSlot {
  date: string;
  startHour: number;
  endHour: number;
}

interface ParkingState {
  parkings: ParkingSpot[];
  selectedParking: ParkingSpot | null;
  loading: boolean;
  searchParams: SearchParams;
  closedSlots: Record<string, ClosedSlot[]>;
  loadParkings: () => Promise<void>;
  searchParkings: (params: SearchParams) => Promise<ParkingSpot[]>;
  getParkingById: (id: string) => ParkingSpot | undefined;
  publishParking: (data: Omit<ParkingSpot, 'id' | 'createdAt' | 'status' | 'avgRating' | 'totalBookings' | 'ownerId'>) => Promise<ParkingSpot>;
  updateParking: (id: string, data: Partial<ParkingSpot>) => Promise<void>;
  auditParking: (id: string, status: ParkingStatus, reason?: string) => Promise<void>;
  closeSlot: (parkingId: string, slot: ClosedSlot) => void;
  reopenSlot: (parkingId: string, slot: ClosedSlot) => void;
  isSlotClosed: (parkingId: string, date: string, hour: number) => boolean;
  checkTimeAvailability: (
    parkingId: string,
    start: string | Date,
    end: string | Date,
    excludeOrderId?: string
  ) => { available: boolean; reason?: string };
}

export const useParkingStore = create<ParkingState>((set, get) => ({
  parkings: [...initialParkings],
  selectedParking: null,
  loading: false,
  searchParams: {},
  closedSlots: loadPersistedClosedSlots(),

  loadParkings: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    set({ parkings: [...initialParkings], loading: false });
  },

  searchParkings: async (params: SearchParams) => {
    set({ loading: true, searchParams: params });
    await new Promise((resolve) => setTimeout(resolve, 200));

    let result = [...get().parkings];

    if (params.status) {
      result = result.filter((p) => p.status === params.status);
    } else {
      result = result.filter((p) => p.status === 'approved');
    }

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.address.toLowerCase().includes(kw) ||
          p.district.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw)
      );
    }

    if (params.district) {
      result = result.filter((p) => p.district === params.district);
    }

    if (params.minPrice !== undefined) {
      result = result.filter((p) => p.hourlyRate >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      result = result.filter((p) => p.hourlyRate <= params.maxPrice!);
    }

    if (params.facilities && params.facilities.length > 0) {
      result = result.filter((p) =>
        params.facilities!.every((f) => p.facilities.includes(f))
      );
    }

    set({ loading: false });
    return result;
  },

  getParkingById: (id: string) => {
    return findParkingById(id) || get().parkings.find((p) => p.id === id);
  },

  publishParking: async (data) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const user = useAuthStore.getState().user;
    const newParking: ParkingSpot = {
      ...data,
      id: 'p' + generateId(),
      ownerId: user?.id || 'o001',
      status: 'pending',
      avgRating: 0,
      totalBookings: 0,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      parkings: [newParking, ...state.parkings],
      loading: false,
    }));

    return newParking;
  },

  updateParking: async (id: string, data: Partial<ParkingSpot>) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      parkings: state.parkings.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
      selectedParking:
        state.selectedParking?.id === id
          ? { ...state.selectedParking, ...data }
          : state.selectedParking,
      loading: false,
    }));
  },

  auditParking: async (id: string, status: ParkingStatus, reason?: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      parkings: state.parkings.map((p) =>
        p.id === id
          ? { ...p, status, auditReason: reason }
          : p
      ),
      loading: false,
    }));
  },

  closeSlot: (parkingId: string, slot: ClosedSlot) => {
    set((state) => {
      const updated = {
        ...state.closedSlots,
        [parkingId]: [...(state.closedSlots[parkingId] || []), slot],
      };
      persistClosedSlots(updated);
      return { closedSlots: updated };
    });
  },

  reopenSlot: (parkingId: string, slot: ClosedSlot) => {
    set((state) => {
      const updated = {
        ...state.closedSlots,
        [parkingId]: (state.closedSlots[parkingId] || []).filter(
          (s) =>
            !(s.date === slot.date && s.startHour === slot.startHour && s.endHour === slot.endHour)
        ),
      };
      persistClosedSlots(updated);
      return { closedSlots: updated };
    });
  },

  isSlotClosed: (parkingId: string, date: string, hour: number) => {
    const slots = get().closedSlots[parkingId] || [];
    return slots.some((s) => s.date === date && hour >= s.startHour && hour < s.endHour);
  },

  checkTimeAvailability: (
    parkingId: string,
    start: string | Date,
    end: string | Date,
    excludeOrderId?: string
  ) => {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;

    if (startDate >= endDate) {
      return { available: false, reason: '开始时间必须早于结束时间' };
    }

    const parking = findParkingById(parkingId) || get().parkings.find((p) => p.id === parkingId);
    if (!parking) {
      return { available: false, reason: '车位不存在' };
    }

    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
    const sameDay = startDate.toDateString() === endDate.toDateString();

    if (!sameDay) {
      const startDayStart = 0;
      const startDayEnd = 24;
      const endDayStart = 0;
      const endDayEnd = endHour;
      /** 跨天简化检查：只要当天在可用时段内即可，这里简化为都检查 */
    }

    /** 1. 检查车位可用时段 */
    const availableSlots = parking.availableSlots || [];
    if (availableSlots.length > 0) {
      let fitsInSlot = false;
      for (const slot of availableSlots) {
        const slotStart = parseInt(slot.startTime.split(':')[0], 10) + parseInt(slot.startTime.split(':')[1] || '0', 10) / 60;
        const slotEnd = parseInt(slot.endTime.split(':')[0], 10) + parseInt(slot.endTime.split(':')[1] || '0', 10) / 60;
        if (startHour >= slotStart && endHour <= slotEnd) {
          fitsInSlot = true;
          break;
        }
      }
      if (!fitsInSlot) {
        return { available: false, reason: '该时段不在车位可用范围内' };
      }
    }

    /** 2. 检查业主关闭时段 */
    const dateStr = startDate.toISOString().slice(0, 10);
    const closedList = get().closedSlots[parkingId] || [];
    for (const closed of closedList) {
      if (closed.date !== dateStr) continue;
      if (startHour < closed.endHour && endHour > closed.startHour) {
        return { available: false, reason: '该时段已被业主临时关闭' };
      }
    }

    /** 3. 检查同车位其他订单冲突 */
    const orders = useOrderStore.getState().orders;
    const conflicting = orders.filter((o) => {
      if (o.parkingId !== parkingId) return false;
      if (excludeOrderId && o.id === excludeOrderId) return false;
      if (o.status !== 'paid' && o.status !== 'active' && o.status !== 'pending') return false;
      const oStart = new Date(o.scheduledStart);
      const oEnd = new Date(o.scheduledEnd);
      return startDate < oEnd && endDate > oStart;
    });

    if (conflicting.length > 0) {
      return { available: false, reason: '该时段已被其他订单占用' };
    }

    return { available: true };
  },
}));
