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
import { calculateHours, calculateOvertime } from '../utils/time';

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
  getDriverOrders: (driverId?: string) => Order[];
  getOwnerOrders: (ownerId?: string) => Order[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [...initialOrders],
  activeOrder: null,
  loading: false,

  loadOrders: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    const user = useAuthStore.getState().user;
    let ordersList = [...initialOrders];
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

    set((state) => ({
      orders: [newOrder, ...state.orders],
      loading: false,
    }));

    return newOrder;
  },

  payOrder: async (orderId: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'paid' as OrderStatus, paymentTime: new Date().toISOString() }
          : o
      ),
      activeOrder:
        state.activeOrder?.id === orderId
          ? { ...state.activeOrder, status: 'paid' as OrderStatus, paymentTime: new Date().toISOString() }
          : state.activeOrder,
      loading: false,
    }));
  },

  enterParking: async (orderId: string, code: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    const order = findOrderById(orderId) || get().orders.find((o) => o.id === orderId);
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
    const overtimeHours = calculateOvertime(order.scheduledEnd, actualEnd);
    const parking = useParkingStore.getState().getParkingById(order.parkingId);
    const hourlyRate = parking?.hourlyRate || 10;
    const overtimeAmount = Math.round(overtimeHours * hourlyRate * 100) / 100;
    const totalAmount = order.baseAmount + overtimeAmount;

    set((state) => ({
      orders: state.orders.map((o) =>
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
      ),
      activeOrder: state.activeOrder?.id === orderId ? null : state.activeOrder,
      loading: false,
    }));
  },

  reviewOrder: async (orderId: string, rating: number, review?: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, rating, review } : o
      ),
      loading: false,
    }));
  },

  submitRating: async (orderId: string, rating: number, review?: string) => {
    await get().reviewOrder(orderId, rating, review);
  },

  submitDispute: async (orderId: string, reason: string, type: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'disputed' as OrderStatus, disputeReason: reason }
          : o
      ),
      loading: false,
    }));
  },

  cancelOrder: async (orderId: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o
      ),
      activeOrder:
        state.activeOrder?.id === orderId ? null : state.activeOrder,
      loading: false,
    }));
  },

  getDriverOrders: (driverId?: string) => {
    const user = useAuthStore.getState().user;
    const id = driverId || user?.id;
    if (!id) return [];
    const fromMock = findOrdersByDriver(id);
    if (fromMock.length > 0) return fromMock;
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
    const fromMock = findOrdersByOwner(id);
    if (fromMock.length > 0) return fromMock;
    return get()
      .orders.filter((o) => o.ownerId === id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },
}));
