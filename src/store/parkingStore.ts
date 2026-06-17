import { create } from 'zustand';
import type { ParkingSpot, ParkingStatus, TimeSlot } from '../types';
import {
  parkings as initialParkings,
  findParkingById,
  findParkingsByOwner,
} from '../data/parkings';
import { generateId } from '../utils/format';
import { useAuthStore } from './authStore';

interface SearchParams {
  keyword?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  facilities?: string[];
  status?: ParkingStatus;
}

interface ParkingState {
  parkings: ParkingSpot[];
  selectedParking: ParkingSpot | null;
  loading: boolean;
  searchParams: SearchParams;
  loadParkings: () => Promise<void>;
  searchParkings: (params: SearchParams) => Promise<ParkingSpot[]>;
  getParkingById: (id: string) => ParkingSpot | undefined;
  publishParking: (data: Omit<ParkingSpot, 'id' | 'createdAt' | 'status' | 'avgRating' | 'totalBookings' | 'ownerId'>) => Promise<ParkingSpot>;
  updateParking: (id: string, data: Partial<ParkingSpot>) => Promise<void>;
  auditParking: (id: string, status: ParkingStatus, reason?: string) => Promise<void>;
}

export const useParkingStore = create<ParkingState>((set, get) => ({
  parkings: [...initialParkings],
  selectedParking: null,
  loading: false,
  searchParams: {},

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
}));
