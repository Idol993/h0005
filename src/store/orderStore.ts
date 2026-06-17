import { create } from 'zustand';
import type { Order, OrderStatus, PaymentMethod } from '../types';
import {
  orders as initialOrders,
  findOrdersByDriver,
  findOrdersByOwner,
  findOrderById,
} from '../data/orders';
import { generateId } from '../utils/format';
import { useAuthStore } from './authStore';
import { useParkingStore } from './parkingStore';
import { calculateHours, calculateOvertimeFee } from '../utils/time';
import { getStorage, setStorage } from '../utils/storage';

const STORAGE_KEY = 'parking_app_orders';

function loadPersistedOrders(): Order[] {
  const persisted = getStorage<Order[]>(STORAGE_KEY, []);
  if (persisted.length > 0) {
    return persisted;
  }
  return [...initialOrders];
}

function persistOrders(orders: Order[]) {
  setStorage(STORAGE_KEY, orders);
}

interface CreateOrderParams {
  parkingId: string;
  scheduledStart: string;
  scheduledEnd: string;
  paymentMethod: PaymentMethod;
}

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  loading: boolean;
  loadOrders: () => Promise<void>;
  createOrder: (params: CreateOrderParams) => Promise<Order>;
  payOrder: (orderId: string) => Promise<void>;
  enterParking: (orderId: string, code: string) => Promise<boolean>;
  exitParking: (orderId: string) => Promise<void>;
  reviewOrder: (orderId: string, rating: number, review?: string) => Promise<void>;
  submitRating: (orderId: string, rating: number, review?: string) => Promise<void>;
  submitDispute: (orderId: string, reason: string, type: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  rescheduleOrder: (orderId: string, newStart: string, newEnd: string) => Promise<boolean>;
  getDriverOrders: (driverId?: string) => Order[];
  getOwnerOrders: (ownerId?: string) => Order[];
  flagOrder: (orderId: string, flagged: boolean) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: loadPersistedOrders(),
  activeOrder: null,
  loading: false,

  loadOrders: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    const user = useAuthStore.getState().user;
    const ordersList = loadPersistedOrders();
    let active: Order | null = null;

    if (user) {
      if (user.role === 'driver') {
        active = ordersList.find(
          (o) => o.driverId === user.id && (o.status === 'active' || o.status === 'paid')
        ) || null;
      }
    }

    set({ orders: ordersList, activeOrder: active, loading: false });
  },

  createOrder: async (params: CreateOrderParams) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const user = useAuthStore.getState().user;
    const parking = useParkingStore.getState().getParkingById(params.parkingId);

    const scheduledHours = calculateHours(params.scheduledStart, params.scheduledEnd);
    let baseAmount = Math.round(scheduledHours * (parking?.hourlyRate || 10) * 100) / 100;
    if (parking?.dailyCap && parking.dailyCap > 0) {
      baseAmount = Math.min(baseAmount, parking.dailyCap);
    }

    const entryCode = String(Math.floor(100000 + Math.random() * 900000));

    const newOrder: Order = {
      id: 'o' + generateId(),
      parkingId: params.parkingId,
      parkingTitle: parking?.title || '车位',
      ownerId: parking?.ownerId || 'o001',
      driverId: user?.id || 'd001',
      scheduledStart: params.scheduledStart,
      scheduledEnd: params.scheduledEnd,
      scheduledHours,
      baseAmount,
      overtimeAmount: 0,
      totalAmount: baseAmount,
      preAuthAmount: Math.round(baseAmount * 1.2 * 100) / 100,
      entryCode,
      status: 'pending',
      paymentMethod: params.paymentMethod,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [newOrder, ...state.orders];
      persistOrders(updated);
      return { orders: updated, loading: false };
    });

    return newOrder;
  },

  payOrder: async (orderId: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'paid' as OrderStatus, paymentTime: new Date().toISOString() }
          : o
      );
      persistOrders(updated);
      const newActive = updated.find(o => o.id === orderId && (o.status === 'paid' || o.status === 'active')) || state.activeOrder;
      return {
        orders: updated,
        activeOrder: state.activeOrder?.id === orderId
          ? { ...state.activeOrder, status: 'paid' as OrderStatus, paymentTime: new Date().toISOString() }
          : newActive,
        loading: false,
      };
    });
  },

  enterParking: async (orderId: string, code: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    const order = get().orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'paid') {
      set({ loading: false });
      return false;
    }

    if (order.entryCode !== code) {
      set({ loading: false });
      return false;
    }

    const actualStart = new Date().toISOString();
    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'active' as OrderStatus, actualStart } : o
      );
      persistOrders(updated);
      const activeUpdated = updated.find((o) => o.id === orderId) || null;
      return { orders: updated, activeOrder: activeUpdated, loading: false };
    });

    return true;
  },

  exitParking: async (orderId: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const order = get().orders.find((o) => o.id === orderId);
    if (!order) {
      set({ loading: false });
      return;
    }

    const actualEnd = new Date().toISOString();
    const actualHours = calculateHours(order.scheduledStart, actualEnd);
    const parking = useParkingStore.getState().getParkingById(order.parkingId);
    const hourlyRate = parking?.hourlyRate || 10;
    const overtimeResult = calculateOvertimeFee(order.scheduledEnd, actualEnd, hourlyRate);
    const overtimeAmount = overtimeResult.overtimeFee;
    const overtimeHours = overtimeResult.overtimeHours;
    const totalAmount = order.baseAmount + overtimeAmount;

    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'completed' as OrderStatus,
              actualEnd,
              actualHours,
              overtimeHours,
              overtimeAmount,
              totalAmount,
            }
          : o
      );
      persistOrders(updated);
      return {
        orders: updated,
        activeOrder: state.activeOrder?.id === orderId ? null : state.activeOrder,
        loading: false,
      };
    });
  },

  reviewOrder: async (orderId: string, rating: number, review?: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId ? { ...o, rating, review } : o
      );
      persistOrders(updated);
      return { orders: updated, loading: false };
    });
  },

  submitRating: async (orderId: string, rating: number, review?: string) => {
    await get().reviewOrder(orderId, rating, review);
  },

  submitDispute: async (orderId: string, reason: string, type: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'disputed' as OrderStatus, disputeReason: reason }
          : o
      );
      persistOrders(updated);
      return { orders: updated, loading: false };
    });
  },

  cancelOrder: async (orderId: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o
      );
      persistOrders(updated);
      return {
        orders: updated,
        activeOrder: state.activeOrder?.id === orderId ? null : state.activeOrder,
        loading: false,
      };
    });
  },

  rescheduleOrder: async (orderId: string, newStart: string, newEnd: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const order = get().orders.find((o) => o.id === orderId);
    if (!order || (order.status !== 'pending' && order.status !== 'paid')) {
      set({ loading: false });
      return false;
    }
    if (order.rescheduled) {
      set({ loading: false });
      return false;
    }

    const parking = useParkingStore.getState().getParkingById(order.parkingId);
    const newHours = calculateHours(newStart, newEnd);
    let newBaseAmount = Math.round(newHours * (parking?.hourlyRate || 10) * 100) / 100;
    if (parking?.dailyCap && parking.dailyCap > 0) {
      newBaseAmount = Math.min(newBaseAmount, parking.dailyCap);
    }
    const newTotalAmount = newBaseAmount + order.overtimeAmount;
    const newPreAuth = Math.round(newTotalAmount * 1.2 * 100) / 100;

    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              scheduledStart: newStart,
              scheduledEnd: newEnd,
              scheduledHours: newHours,
              baseAmount: newBaseAmount,
              totalAmount: newTotalAmount,
              preAuthAmount: newPreAuth,
              rescheduled: true,
            }
          : o
      );
      persistOrders(updated);
      const activeUpdated = state.activeOrder?.id === orderId
        ? updated.find((o) => o.id === orderId) || null
        : state.activeOrder;
      return { orders: updated, activeOrder: activeUpdated, loading: false };
    });

    return true;
  },

  getDriverOrders: (driverId?: string) => {
    const user = useAuthStore.getState().user;
    const id = driverId || user?.id;
    if (!id) return [];
    return get()
      .orders.filter((o) => o.driverId === id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  getOwnerOrders: (ownerId?: string) => {
    const user = useAuthStore.getState().user;
    const id = ownerId || user?.id;
    if (!id) return [];
    return get()
      .orders.filter((o) => o.ownerId === id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  flagOrder: (orderId: string, flagged: boolean) => {
    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId ? { ...o, flagged } : o
      );
      persistOrders(updated);
      return { orders: updated };
    });
  },
}));
