import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  MapPin,
  ShoppingCart,
  DollarSign,
  Trophy,
  TrendingUp,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Crown,
  Medal,
  Award,
  ChevronDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
} from 'recharts';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useAdminStore } from '@/store/adminStore';
import { useParkingStore } from '@/store/parkingStore';
import { useOrderStore } from '@/store/orderStore';
import { parkings } from '@/data/parkings';
import { users, findUserById, getOwnerName } from '@/data/users';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';

/**
 * 管理员数据看板页面
 * 包含核心指标、区域热力图、高峰时段分析、收入排行榜、实时动态
 */
export default function AdminDashboardPage() {
  const { dashboardStats } = useAdminStore();
  const { parkings: parkingList } = useParkingStore();
  const { orders } = useOrderStore();

  /** 高峰时段分析切换：近7天 */
  const [peakDays, setPeakDays] = useState<7>(7);
  /** 排行榜当前Tab */
  const [rankTab, setRankTab] = useState<'owner' | 'district' | 'parking'>('owner');
  /** 实时动态模拟滚动 */
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'order' | 'parking' | 'alert' | 'dispute'; text: string; time: string }>>([]);

  /** ========== 核心指标计算 ========== */
  const metrics = useMemo(() => {
    const totalUsers = dashboardStats.totalUsers;
    const totalParkings = dashboardStats.totalParkings;
    const todayOrders = dashboardStats.todayOrders;
    const todayRevenue = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalUsers,
      totalParkings,
      todayOrders,
      todayRevenue,
    };
  }, [dashboardStats, orders]);

  /** ========== 区域空置率热力图数据 ========== */
  const districtHeatmap = useMemo(() => {
    const districts = [
      { name: '朝阳区', total: 120, used: 78 },
      { name: '海淀区', total: 95, used: 52 },
      { name: '浦东新区', total: 150, used: 110 },
      { name: '静安区', total: 80, used: 35 },
      { name: '天河区', total: 110, used: 88 },
      { name: '南山区', total: 130, used: 95 },
      { name: '西湖区', total: 70, used: 28 },
      { name: '锦江区', total: 65, used: 42 },
    ];

    return districts.map((d) => ({
      ...d,
      vacancyRate: ((d.total - d.used) / d.total) * 100,
    }));
  }, []);

  /** 根据空置率返回颜色（绿-黄-红渐变，空置率越低颜色越红） */
  const getHeatmapColor = (vacancyRate: number) => {
    if (vacancyRate >= 50) return 'bg-emerald-500 hover:bg-emerald-600';
    if (vacancyRate >= 30) return 'bg-lime-500 hover:bg-lime-600';
    if (vacancyRate >= 20) return 'bg-yellow-500 hover:bg-yellow-600';
    if (vacancyRate >= 10) return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  /** 根据空置率返回文字颜色 */
  const getHeatmapTextColor = (vacancyRate: number) => {
    if (vacancyRate >= 50) return 'text-emerald-50';
    if (vacancyRate >= 30) return 'text-lime-50';
    if (vacancyRate >= 20) return 'text-yellow-50';
    if (vacancyRate >= 10) return 'text-orange-50';
    return 'text-red-50';
  };

  /** ========== 高峰时段分析数据 ========== */
  const peakHourData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map((h) => ({
      hour: `${h}:00`,
      orders: Math.floor(Math.random() * 80 + 10 + (h >= 7 && h <= 9 ? 60 : h >= 17 && h <= 20 ? 70 : 0)),
      occupancy: Math.floor(Math.random() * 40 + 20 + (h >= 7 && h <= 9 ? 30 : h >= 17 && h <= 20 ? 35 : 0)),
    }));
  }, [peakDays]);

  /** ========== 收入排行榜数据 ========== */
  const rankData = useMemo(() => {
    const ownerRank = users
      .filter((u) => u.role === 'owner')
      .map((u) => ({
        id: u.id,
        name: u.nickname,
        avatar: u.avatar,
        amount: Math.floor(Math.random() * 50000 + 10000),
        orders: Math.floor(Math.random() * 500 + 50),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const districtRank = [
      { name: '浦东新区', amount: 85600, parkings: 45 },
      { name: '朝阳区', amount: 72300, parkings: 38 },
      { name: '南山区', amount: 68900, parkings: 42 },
      { name: '天河区', amount: 54200, parkings: 35 },
      { name: '海淀区', amount: 42800, parkings: 28 },
    ];

    const parkingRank = parkingList
      .filter((p) => p.status === 'approved')
      .map((p) => ({
        id: p.id,
        name: p.title,
        district: p.district,
        amount: Math.floor(Math.random() * 30000 + 5000),
        bookings: p.totalBookings,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { ownerRank, districtRank, parkingRank };
  }, [parkingList]);

  /** ========== 实时动态数据 ========== */
  useEffect(() => {
    const initialNotifications = [
      { id: 'n1', type: 'order' as const, text: '新订单：张小明 预订了 国贸CBD地下固定车位', time: '刚刚' },
      { id: 'n2', type: 'parking' as const, text: '新车位发布：静安寺商务楼地下车位 待审核', time: '2分钟前' },
      { id: 'n3', type: 'alert' as const, text: '超时警报：订单o20250617003 已超时45分钟', time: '5分钟前' },
      { id: 'n4', type: 'dispute' as const, text: '纠纷提交：李小红 发起多收费争议工单', time: '8分钟前' },
      { id: 'n5', type: 'order' as const, text: '新订单：王小虎 预订了 陆家嘴金融中心车位', time: '12分钟前' },
      { id: 'n6', type: 'parking' as const, text: '新车位发布：深圳南山科技园车位 待审核', time: '15分钟前' },
      { id: 'n7', type: 'alert' as const, text: '超时警报：订单o20250617001 已超时1小时20分', time: '20分钟前' },
      { id: 'n8', type: 'dispute' as const, text: '纠纷提交：赵小伟 发起车位质量问题工单', time: '25分钟前' },
    ];
    setNotifications(initialNotifications);
  }, []);

  /** 通知图标映射 */
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-emerald-500" />;
      case 'parking':
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'dispute':
        return <FileText className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  /** 通知背景色映射 */
  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-emerald-50 border-emerald-200';
      case 'parking':
        return 'bg-blue-50 border-blue-200';
      case 'alert':
        return 'bg-amber-50 border-amber-200';
      case 'dispute':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  /** 奖杯图标渲染（前三名） */
  const renderTrophy = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400 fill-slate-300" />;
    if (index === 2) return <Award className="w-5 h-5 text-orange-600 fill-orange-400" />;
    return <span className="w-5 h-5 inline-flex items-center justify-center text-sm font-bold text-slate-400">{index + 1}</span>;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 深色侧边栏 */}
      <AdminSidebar />

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 space-y-6">
          {/* ========== 顶部标题 ========== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">运营数据看板</h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                最后更新：{formatDateTime(new Date())}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success" size="md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                系统运行正常
              </Badge>
            </div>
          </div>

          {/* ========== 核心指标卡片 ========== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="总用户数"
              value={metrics.totalUsers}
              suffix="人"
              icon={<Users className="w-5 h-5" />}
              theme="blue"
              changeRate="+18.6%"
              trend="up"
              trendLabel="较上周"
            />
            <StatCard
              title="总车位"
              value={metrics.totalParkings}
              suffix="个"
              icon={<MapPin className="w-5 h-5" />}
              theme="green"
              changeRate="+12.3%"
              trend="up"
              trendLabel="较上周"
            />
            <StatCard
              title="今日订单"
              value={metrics.todayOrders}
              suffix="单"
              icon={<ShoppingCart className="w-5 h-5" />}
              theme="orange"
              changeRate="+25.7%"
              trend="up"
              trendLabel="较昨日"
            />
            <StatCard
              title="今日总营收"
              value={metrics.todayRevenue.toFixed(2)}
              prefix="¥"
              icon={<DollarSign className="w-5 h-5" />}
              theme="purple"
              changeRate="+32.1%"
              trend="up"
              trendLabel="较昨日"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* ========== 区域空置率热力图 ========== */}
            <Card
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">区域空置率热力图</h3>
                      <p className="text-xs text-slate-400">色块深浅表示空置率，绿色空置高红色紧张</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block w-3 h-3 rounded bg-emerald-500" />
                    <span>宽松</span>
                    <span className="mx-1">-</span>
                    <span className="inline-block w-3 h-3 rounded bg-yellow-500" />
                    <span>适中</span>
                    <span className="mx-1">-</span>
                    <span className="inline-block w-3 h-3 rounded bg-red-500" />
                    <span>紧张</span>
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {districtHeatmap.map((district, index) => (
                  <div
                    key={index}
                    className={cn(
                      'relative group rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden',
                      getHeatmapColor(district.vacancyRate)
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    <div className={cn('relative z-10', getHeatmapTextColor(district.vacancyRate))}>
                      <div className="text-sm font-bold mb-1 truncate">{district.name}</div>
                      <div className="text-2xl font-bold tabular-nums mb-1">
                        {district.vacancyRate.toFixed(0)}%
                      </div>
                      <div className="text-xs opacity-80">空置率</div>
                    </div>
                    {/* 悬停提示 */}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-slate-900/95 p-3 rounded-t-2xl z-20">
                      <div className="text-xs text-white space-y-1">
                        <div className="font-semibold text-white">{district.name}</div>
                        <div className="text-slate-300">空置率：{district.vacancyRate.toFixed(1)}%</div>
                        <div className="text-slate-300">
                          在用车位：{district.used} / 总车位：{district.total}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ========== 高峰时段分析 ========== */}
            <Card
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">高峰时段分析</h3>
                      <p className="text-xs text-slate-400">24小时订单量与车位占用率趋势</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setPeakDays(7)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                        peakDays === 7
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      近7天
                    </button>
                  </div>
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={peakHourData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      orientation="left"
                    />
                    <YAxis
                      yAxisId="right"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      orientation="right"
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 8px 32px rgba(30, 58, 95, 0.15)',
                        padding: '12px 16px',
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="orders"
                      name="订单量"
                      fill="url(#colorOrders)"
                      stroke="#6366f1"
                      strokeWidth={1}
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="occupancy"
                      name="占用率(%)"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#f97316' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ========== 收入排行榜 ========== */}
            <Card
              className="xl:col-span-2"
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">收入排行榜</h3>
                      <p className="text-xs text-slate-400">本月累计收入排名</p>
                    </div>
                  </div>
                </div>
              }
            >
              {/* Tab切换 */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4 w-fit">
                {[
                  { key: 'owner', label: '业主TOP10' },
                  { key: 'district', label: '区域TOP5' },
                  { key: 'parking', label: '车位TOP5' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setRankTab(tab.key as typeof rankTab)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                      rankTab === tab.key
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 表格内容 */}
              <div className="overflow-x-auto -mx-5 -mt-2">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="px-5 py-3 font-medium w-12">排名</th>
                      <th className="px-5 py-3 font-medium">
                        {rankTab === 'owner' ? '业主信息' : rankTab === 'district' ? '区域' : '车位信息'}
                      </th>
                      <th className="px-5 py-3 font-medium text-right">累计收入</th>
                      <th className="px-5 py-3 font-medium text-right">
                        {rankTab === 'district' ? '车位数量' : '订单/预订'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankTab === 'owner' &&
                      rankData.ownerRank.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5">{renderTrophy(index)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.avatar}
                                alt={item.name}
                                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                              />
                              <div>
                                <div className="font-medium text-slate-800">{item.name}</div>
                                <div className="text-xs text-slate-400">认证业主</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="text-base font-bold text-accent-600 tabular-nums">
                              {formatCurrency(item.amount)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Badge variant="info" size="sm" showIcon={false}>
                              {item.orders} 单
                            </Badge>
                          </td>
                        </tr>
                      ))}

                    {rankTab === 'district' &&
                      rankData.districtRank.map((item, index) => (
                        <tr
                          key={item.name}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5">{renderTrophy(index)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4 text-white" />
                              </div>
                              <div className="font-medium text-slate-800">{item.name}</div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="text-base font-bold text-accent-600 tabular-nums">
                              {formatCurrency(item.amount)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Badge variant="info" size="sm" showIcon={false}>
                              {item.parkings} 个
                            </Badge>
                          </td>
                        </tr>
                      ))}

                    {rankTab === 'parking' &&
                      rankData.parkingRank.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5">{renderTrophy(index)}</td>
                          <td className="px-5 py-3.5">
                            <div>
                              <div className="font-medium text-slate-800 truncate max-w-xs">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {item.district}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="text-base font-bold text-accent-600 tabular-nums">
                              {formatCurrency(item.amount)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Badge variant="info" size="sm" showIcon={false}>
                              {item.bookings} 次
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ========== 实时动态 ========== */}
            <Card
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">实时动态</h3>
                      <p className="text-xs text-slate-400">平台最新动态通知</p>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {notifications.length}
                    </span>
                  </div>
                </div>
              }
            >
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm',
                      getNotificationBg(notif.type)
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-relaxed">{notif.text}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
