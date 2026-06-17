import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { users, findUserByPhone, findUserById } from '../data/users';
import {
  getStorage,
  setStorage,
  removeStorage,
  setToken,
  getToken,
  removeToken,
  encryptToken,
} from '../utils/storage';
import { generateId } from '../utils/format';

interface AuthState {
  user: User | null;
  token: string;
  loading: boolean;
  login: (phone: string, code: string, role: UserRole) => Promise<User | null>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateProfile: (data: Partial<User>) => void;
  verifyIdentity: (realName: string, idCard: string) => Promise<boolean>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: '',
  loading: false,

  login: async (phone: string, code: string, role: UserRole) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));

    let matchedUser = findUserByPhone(phone);

    if (!matchedUser) {
      matchedUser = {
        id: role === 'driver' ? 'd' + generateId() : role === 'owner' ? 'o' + generateId() : 'a' + generateId(),
        phone,
        nickname: '用户' + phone.slice(-4),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + phone,
        role,
        verified: false,
        violations: 0,
        banned: false,
        createdAt: new Date().toISOString(),
      };
    }

    if (matchedUser.role !== role && matchedUser.role !== 'admin') {
      set({ loading: false });
      return null;
    }

    if (matchedUser.banned) {
      set({ loading: false });
      return null;
    }

    const token = encryptToken(matchedUser.id + ':' + Date.now());
    setToken(token);
    setStorage('auth_user', matchedUser);

    set({ user: matchedUser, token, loading: false });
    return matchedUser;
  },

  logout: () => {
    removeToken();
    removeStorage('auth_user');
    set({ user: null, token: '' });
  },

  updateUser: (data: Partial<User>) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, ...data };
    setStorage('auth_user', updated);
    set({ user: updated });
  },

  updateProfile: (data: Partial<User>) => {
    get().updateUser(data);
  },

  verifyIdentity: async (realName: string, idCard: string) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    const { user, updateUser } = get();
    if (!user) {
      set({ loading: false });
      return false;
    }
    updateUser({ verified: true, realName, idCard });
    set({ loading: false });
    return true;
  },

  checkAuth: () => {
    const token = getToken();
    const savedUser = getStorage<User | null>('auth_user', null);
    if (token && savedUser) {
      const freshUser = findUserById(savedUser.id) || savedUser;
      if (freshUser.banned) {
        removeToken();
        removeStorage('auth_user');
        set({ token: '', user: null });
        return;
      }
      set({ token, user: freshUser });
    }
  },
}));
