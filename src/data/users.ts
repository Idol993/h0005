import type { User } from '../types';
import { UserRole } from '../types';
import { getStorage, setStorage } from '../utils/storage';

const USERS_PATCH_KEY = 'parking_app_users_patch';

interface UserPatch {
  id?: string;
  banned?: boolean;
  violations?: number;
  verified?: boolean;
  realName?: string;
  idCard?: string;
}

function loadUsersPatch(): Record<string, UserPatch> {
  return getStorage<Record<string, UserPatch>>(USERS_PATCH_KEY, {});
}

function saveUsersPatch(patch: Record<string, UserPatch>) {
  setStorage(USERS_PATCH_KEY, patch);
}

export function applyUserPatch(user: User): User {
  const patch = loadUsersPatch()[user.id];
  if (!patch) return user;
  return { ...user, ...patch };
}

/**
 * 全局修改某个用户属性（并持久化）
 */
export function patchUser(id: string, changes: UserPatch): void {
  const allPatch = loadUsersPatch();
  allPatch[id] = { ...(allPatch[id] || {}), ...changes };
  saveUsersPatch(allPatch);

  /** 同步修改 users 数组中的引用，让内存中的查询也立即生效 */
  const idx = users.findIndex((u) => u.id === id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...changes };
  }
}

/**
 * 驾驶员用户数据（5人）
 */
const drivers: User[] = [
  {
    id: 'd001',
    phone: '13800138001',
    nickname: '张小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangxiaoming',
    role: UserRole.DRIVER,
    realName: '张明',
    idCard: '110101199001011234',
    verified: true,
    violations: 0,
    banned: false,
    createdAt: '2025-03-15T10:30:00Z',
  },
  {
    id: 'd002',
    phone: '13800138002',
    nickname: '李小红',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lixiaohong',
    role: UserRole.DRIVER,
    realName: '李红',
    idCard: '110101199203152345',
    verified: true,
    violations: 1,
    banned: false,
    createdAt: '2025-04-02T14:20:00Z',
  },
  {
    id: 'd003',
    phone: '13800138003',
    nickname: '王小虎',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaohu',
    role: UserRole.DRIVER,
    realName: '王虎',
    idCard: '310101198805203456',
    verified: true,
    violations: 0,
    banned: false,
    createdAt: '2025-04-18T09:15:00Z',
  },
  {
    id: 'd004',
    phone: '13800138004',
    nickname: '赵小伟',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoxiaowei',
    role: UserRole.DRIVER,
    realName: '赵伟',
    idCard: '440101199508104567',
    verified: true,
    violations: 2,
    banned: false,
    createdAt: '2025-05-05T16:45:00Z',
  },
  {
    id: 'd005',
    phone: '13800138005',
    nickname: '刘小芳',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuxiaofang',
    role: UserRole.DRIVER,
    verified: false,
    violations: 0,
    banned: false,
    createdAt: '2025-06-10T11:00:00Z',
  },
];

/**
 * 业主用户数据（5人）
 */
const owners: User[] = [
  {
    id: 'o001',
    phone: '13900139001',
    nickname: '陈大发',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chendafa',
    role: UserRole.OWNER,
    realName: '陈发',
    idCard: '110101197812105678',
    verified: true,
    violations: 0,
    banned: false,
    createdAt: '2025-01-20T08:00:00Z',
    bankInfo: {
      bankHolder: '陈发',
      bankName: '中国工商银行',
      bankAccount: '6222020000000001234',
      bankBranch: '北京朝阳支行',
    },
  },
  {
    id: 'o002',
    phone: '13900139002',
    nickname: '孙美丽',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunmeili',
    role: UserRole.OWNER,
    realName: '孙丽',
    idCard: '310101198509256789',
    verified: true,
    violations: 1,
    banned: false,
    createdAt: '2025-02-10T13:30:00Z',
    bankInfo: {
      bankHolder: '孙丽',
      bankName: '中国建设银行',
      bankAccount: '6227000000000002345',
      bankBranch: '上海浦东支行',
    },
  },
  {
    id: 'o003',
    phone: '13900139003',
    nickname: '周建国',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujianguo',
    role: UserRole.OWNER,
    realName: '周国',
    idCard: '440101197206157890',
    verified: true,
    violations: 0,
    banned: false,
    createdAt: '2025-02-28T15:20:00Z',
    bankInfo: {
      bankHolder: '周国',
      bankName: '中国农业银行',
      bankAccount: '6228480000000003456',
      bankBranch: '广州天河支行',
    },
  },
  {
    id: 'o004',
    phone: '13900139004',
    nickname: '吴俊杰',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wujunjie',
    role: UserRole.OWNER,
    realName: '吴杰',
    idCard: '330101198011088901',
    verified: true,
    violations: 0,
    banned: false,
    createdAt: '2025-03-25T10:10:00Z',
    bankInfo: {
      bankHolder: '吴杰',
      bankName: '招商银行',
      bankAccount: '6225880000000004567',
      bankBranch: '杭州西湖支行',
    },
  },
  {
    id: 'o005',
    phone: '13900139005',
    nickname: '郑女士',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengnvshi',
    role: UserRole.OWNER,
    verified: false,
    violations: 0,
    banned: false,
    createdAt: '2025-06-01T19:45:00Z',
  },
];

/**
 * 管理员用户数据（2人）
 */
const admins: User[] = [
  {
    id: 'a001',
    phone: '18600186001',
    nickname: '超级管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin01',
    role: UserRole.ADMIN,
    realName: '管超',
    idCard: '110101198001019999',
    verified: true,
    violations: 0,
    banned: false,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'a002',
    phone: '18600186002',
    nickname: '运营管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin02',
    role: UserRole.ADMIN,
    realName: '管运',
    idCard: '110101198505058888',
    verified: true,
    violations: 0,
    banned: false,
    createdAt: '2025-01-15T09:00:00Z',
  },
];

/**
 * 全部用户数据
 */
export const users: User[] = [...drivers, ...owners, ...admins].map(applyUserPatch);

/**
 * 驾驶员用户列表
 */
export const driverUsers: User[] = users.filter(u => u.role === UserRole.DRIVER);

/**
 * 业主用户列表
 */
export const ownerUsers: User[] = users.filter(u => u.role === UserRole.OWNER);

/**
 * 管理员用户列表
 */
export const adminUsers: User[] = users.filter(u => u.role === UserRole.ADMIN);

/**
 * 根据ID查找用户
 */
export function findUserById(id: string): User | undefined {
  const found = users.find((u) => u.id === id);
  if (!found) return undefined;
  return applyUserPatch(found);
}

/**
 * 根据手机号查找用户
 */
export function findUserByPhone(phone: string): User | undefined {
  const found = users.find((u) => u.phone === phone);
  if (!found) return undefined;
  return applyUserPatch(found);
}

/**
 * 获取业主名称（用于展示）
 */
export function getOwnerName(ownerId: string): string {
  const owner = findUserById(ownerId);
  return owner ? owner.nickname : '未知业主';
}

/**
 * 获取驾驶员名称（用于展示）
 */
export function getDriverName(driverId: string): string {
  const driver = findUserById(driverId);
  return driver ? driver.nickname : '未知用户';
}
