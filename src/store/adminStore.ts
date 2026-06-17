import { create } from 'zustand';
import type {
  ViolationRecord,
  Dispute,
  WithdrawalRecord,
  DashboardStats,
  DisputeStatus,
  WithdrawalStatus,
  ViolationType,
  PenaltyType,
} from '../types';
import {
  violationRecords as initialViolations,
  disputes as initialDisputes,
  withdrawalRecords as initialWithdrawals,
  dashboardStats as initialStats,
} from '../data/adminData';
import { users, findUserById } from '../data/users';
import { generateId } from '../utils/format';

interface AddViolationParams {
  userId: string;
  type: ViolationType;
  description: string;
  penalty: PenaltyType;
  suspendDays?: number;
  evidence?: string[];
}

interface AdminState {
  violations: ViolationRecord[];
  disputes: Dispute[];
  withdrawals: WithdrawalRecord[];
  dashboardStats: DashboardStats;
  loading: boolean;
  loadAll: () => Promise<void>;
  processDispute: (
    disputeId: string,
    status: DisputeStatus,
    result?: string
  ) => Promise<void>;
  addViolation: (params: AddViolationParams) => Promise<ViolationRecord>;
  processWithdrawal: (
    withdrawalId: string,
    status: WithdrawalStatus,
    rejectReason?: string
  ) => Promise<void>;
  toggleUserBan: (userId: string, banned: boolean) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  violations: [...initialViolations],
  disputes: [...initialDisputes],
  withdrawals: [...initialWithdrawals],
  dashboardStats: { ...initialStats },
  loading: false,

  loadAll: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({
      violations: [...initialViolations],
      disputes: [...initialDisputes],
      withdrawals: [...initialWithdrawals],
      dashboardStats: { ...initialStats },
      loading: false,
    });
  },

  processDispute: async (disputeId: string, status: DisputeStatus, result?: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => ({
      disputes: state.disputes.map((d) =>
        d.id === disputeId ? { ...d, status, result } : d
      ),
      dashboardStats: {
        ...state.dashboardStats,
        openDisputes: Math.max(
          0,
          state.dashboardStats.openDisputes - (status !== 'open' && status !== 'processing' ? 1 : 0)
        ),
      },
      loading: false,
    }));
  },

  addViolation: async (params: AddViolationParams) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newViolation: ViolationRecord = {
      id: 'v' + generateId(),
      userId: params.userId,
      type: params.type,
      description: params.description,
      evidence: params.evidence || [],
      penalty: params.penalty,
      suspendDays: params.suspendDays,
      createdAt: new Date().toISOString(),
    };

    let autoBanned = false;
    if (params.type === 'fake_listing') {
      const existingFakeCount = get().violations.filter(
        (v) => v.userId === params.userId && v.type === 'fake_listing'
      ).length;
      if (existingFakeCount + 1 >= 3) {
        autoBanned = true;
        const targetUser = findUserById(params.userId);
        if (targetUser) {
          targetUser.banned = true;
          targetUser.violations = existingFakeCount + 1;
        }
        const { useAuthStore } = await import('./authStore');
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id === params.userId) {
          useAuthStore.getState().updateUser({ banned: true, violations: existingFakeCount + 1 });
        }
      }
    }

    if (params.penalty === 'ban') {
      const targetUser = findUserById(params.userId);
      if (targetUser) {
        targetUser.banned = true;
      }
      const { useAuthStore } = await import('./authStore');
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.id === params.userId) {
        useAuthStore.getState().updateUser({ banned: true });
      }
    }

    set((state) => ({
      violations: [newViolation, ...state.violations],
      loading: false,
    }));

    if (autoBanned) {
      await get().toggleUserBan(params.userId, true);
    }

    return newViolation;
  },

  processWithdrawal: async (
    withdrawalId: string,
    status: WithdrawalStatus,
    rejectReason?: string
  ) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    set((state) => {
      const wasPending = state.withdrawals.find((w) => w.id === withdrawalId)?.status === 'pending';
      return {
        withdrawals: state.withdrawals.map((w) =>
          w.id === withdrawalId
            ? {
                ...w,
                status,
                rejectReason,
                processedAt:
                  status === 'completed' || status === 'approved' || status === 'rejected'
                    ? new Date().toISOString()
                    : w.processedAt,
              }
            : w
        ),
        dashboardStats: {
          ...state.dashboardStats,
          pendingWithdrawals: Math.max(
            0,
            state.dashboardStats.pendingWithdrawals - (wasPending && status !== 'pending' ? 1 : 0)
          ),
        },
        loading: false,
      };
    });
  },

  toggleUserBan: async (userId: string, banned: boolean) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    const user = findUserById(userId);
    if (user) {
      user.banned = banned;
    }

    set({ loading: false });
  },
}));
