import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart2,
  Bell,
  BookOpen,
  CheckCircle,
  Code2,
  FileText,
  GraduationCap,
  Lock,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { adminService } from '../../services';
import { extractApiError } from '../../services/apiClient';
import type { AdminDashboardStatisticsResponse, MonthlyStatistic } from '../../types';
import { Button, Card, EmptyState, Skeleton } from '../../components/shared';

type StatCard = {
  id: keyof AdminDashboardStatisticsResponse | string;
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'percent' | 'score';
};

type MonthlyChart = {
  id: keyof AdminDashboardStatisticsResponse;
  title: string;
  description: string;
  data?: MonthlyStatistic[];
};

const formatNumber = (value?: number) => (value ?? 0).toLocaleString();

const formatPercent = (value?: number) => {
  const normalized = value === undefined ? 0 : value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
};

const formatScore = (value?: number) =>
  value === undefined ? '0' : value.toFixed(value % 1 === 0 ? 0 : 1);

const formatValue = (card: StatCard) => {
  if (card.format === 'percent') return formatPercent(card.value);
  if (card.format === 'score') return formatScore(card.value);
  return formatNumber(card.value);
};

const formatMonthLabel = (month: string) => {
  const date = new Date(month);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const normalizeMonthlyData = (data?: MonthlyStatistic[]) =>
  Array.isArray(data)
    ? data
        .filter((item) => item?.month)
        .map((item) => ({
          month: item.month,
          count: Number.isFinite(Number(item.count)) ? Number(item.count) : 0,
        }))
    : [];

const StatTile: React.FC<StatCard> = (card) => (
  <Card className="p-4">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
      {card.icon}
    </div>
    <p className="text-2xl font-mono font-bold text-gray-100">{formatValue(card)}</p>
    <p className="text-xs text-gray-500 font-mono mt-0.5">{card.label}</p>
  </Card>
);

const MonthlyBarChart: React.FC<MonthlyChart> = ({ title, description, data }) => {
  const rows = normalizeMonthlyData(data);
  const max = Math.max(...rows.map((item) => item.count), 0);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-mono font-semibold text-gray-300 text-sm">{title}</h2>
          <p className="text-xs text-gray-600 font-mono mt-1">{description}</p>
        </div>
        <BarChart2 size={16} className="text-violet-400 shrink-0" />
      </div>

      {rows.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-xs text-gray-600 font-mono">
          No monthly data returned
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((item) => {
            const width = max > 0 ? Math.max((item.count / max) * 100, 4) : 0;

            return (
              <div key={`${title}-${item.month}`} className="grid grid-cols-[76px_1fr_56px] items-center gap-3">
                <span className="text-xs text-gray-500 font-mono truncate">
                  {formatMonthLabel(item.month)}
                </span>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-mono text-right">
                  {formatNumber(item.count)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export const AdminDashboardPage: React.FC = () => {
  const {
    data: stats,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-dashboard-statistics'],
    queryFn: adminService.getDashboardStatistics,
  });

  const coreStats: StatCard[] = [
    {
      id: 'totalUsers',
      label: 'Total users',
      value: stats?.totalUsers,
      icon: <Users size={18} className="text-blue-400" />,
      color: 'bg-blue-500/10',
    },
    {
      id: 'totalStudents',
      label: 'Total students',
      value: stats?.totalStudents,
      icon: <GraduationCap size={18} className="text-violet-400" />,
      color: 'bg-violet-500/10',
    },
    {
      id: 'totalAdmins',
      label: 'Total admins',
      value: stats?.totalAdmins,
      icon: <Shield size={18} className="text-cyan-400" />,
      color: 'bg-cyan-500/10',
    },
    {
      id: 'activeStudents',
      label: 'Active students',
      value: stats?.activeStudents,
      icon: <UserCheck size={18} className="text-emerald-400" />,
      color: 'bg-emerald-500/10',
    },
    {
      id: 'lockedStudents',
      label: 'Locked students',
      value: stats?.lockedStudents,
      icon: <Lock size={18} className="text-rose-400" />,
      color: 'bg-rose-500/10',
    },
    {
      id: 'verifiedUsers',
      label: 'Verified users',
      value: stats?.verifiedUsers,
      icon: <CheckCircle size={18} className="text-emerald-400" />,
      color: 'bg-emerald-500/10',
    },
    {
      id: 'unverifiedUsers',
      label: 'Unverified users',
      value: stats?.unverifiedUsers,
      icon: <Activity size={18} className="text-amber-400" />,
      color: 'bg-amber-500/10',
    },
    {
      id: 'newUsersThisMonth',
      label: 'New users this month',
      value: stats?.newUsersThisMonth,
      icon: <UserPlus size={18} className="text-fuchsia-400" />,
      color: 'bg-fuchsia-500/10',
    },
    {
      id: 'totalCourses',
      label: 'Total courses',
      value: stats?.totalCourses,
      icon: <BookOpen size={18} className="text-violet-400" />,
      color: 'bg-violet-500/10',
    },
    {
      id: 'totalLessons',
      label: 'Total lessons',
      value: stats?.totalLessons,
      icon: <FileText size={18} className="text-sky-400" />,
      color: 'bg-sky-500/10',
    },
    {
      id: 'totalEnrollments',
      label: 'Total enrollments',
      value: stats?.totalEnrollments,
      icon: <TrendingUp size={18} className="text-emerald-400" />,
      color: 'bg-emerald-500/10',
    },
    {
      id: 'totalQuizAttempts',
      label: 'Quiz attempts',
      value: stats?.totalQuizAttempts,
      icon: <CheckCircle size={18} className="text-amber-400" />,
      color: 'bg-amber-500/10',
    },
  ];

  const optionalStats = ([
    {
      id: 'totalAiRequests',
      label: 'AI requests',
      value: stats?.totalAiRequests,
      icon: <Sparkles size={18} className="text-purple-400" />,
      color: 'bg-purple-500/10',
    },
    {
      id: 'totalCodeExecutions',
      label: 'Code executions',
      value: stats?.totalCodeExecutions,
      icon: <Code2 size={18} className="text-cyan-400" />,
      color: 'bg-cyan-500/10',
    },
    {
      id: 'totalNotifications',
      label: 'Notifications',
      value: stats?.totalNotifications,
      icon: <Bell size={18} className="text-amber-400" />,
      color: 'bg-amber-500/10',
    },
    {
      id: 'completedLessons',
      label: 'Completed lessons',
      value: stats?.completedLessons,
      icon: <FileText size={18} className="text-emerald-400" />,
      color: 'bg-emerald-500/10',
    },
    {
      id: 'averageQuizScore',
      label: 'Average quiz score',
      value: stats?.averageQuizScore,
      icon: <Activity size={18} className="text-blue-400" />,
      color: 'bg-blue-500/10',
      format: 'score',
    },
    {
      id: 'quizPassRate',
      label: 'Quiz pass rate',
      value: stats?.quizPassRate,
      icon: <CheckCircle size={18} className="text-violet-400" />,
      color: 'bg-violet-500/10',
      format: 'percent',
    },
    {
      id: 'activeUsersThisMonth',
      label: 'Active users this month',
      value: stats?.activeUsersThisMonth,
      icon: <Users size={18} className="text-emerald-400" />,
      color: 'bg-emerald-500/10',
    },
  ] satisfies StatCard[]).filter((card) => card.value !== undefined);

  const monthlyCharts = ([
    {
      id: 'newUsersByMonth',
      title: 'New Users By Month',
      description: 'Monthly account creation trend',
      data: stats?.newUsersByMonth,
    },
    {
      id: 'enrollmentsByMonth',
      title: 'Enrollments By Month',
      description: 'Monthly enrollment activity',
      data: stats?.enrollmentsByMonth,
    },
    {
      id: 'quizAttemptsByMonth',
      title: 'Quiz Attempts By Month',
      description: 'Monthly quiz engagement',
      data: stats?.quizAttemptsByMonth,
    },
    {
      id: 'coursesCreatedByMonth',
      title: 'Courses Created By Month',
      description: 'Monthly course publishing volume',
      data: stats?.coursesCreatedByMonth,
    },
    {
      id: 'lessonsCreatedByMonth',
      title: 'Lessons Created By Month',
      description: 'Monthly lesson creation volume',
      data: stats?.lessonsCreatedByMonth,
    },
  ] satisfies MonthlyChart[]).filter((chart) => Array.isArray(chart.data));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <BarChart2 size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-2xl text-gray-100">Admin Dashboard</h1>
            <p className="text-gray-600 font-mono text-sm">Platform statistics and trends</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()} loading={isFetching && !isLoading}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {isError && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
          <p className="text-sm text-rose-300 font-mono">{extractApiError(error)}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[...Array(12)].map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !stats ? (
        <Card>
          <EmptyState
            icon={<BarChart2 size={32} />}
            title="No dashboard statistics"
            description="The statistics endpoint did not return dashboard data."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw size={14} />
                Try again
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="font-mono font-semibold text-gray-300 text-sm">Core statistics</h2>
              <p className="text-xs text-gray-600 font-mono mt-1">DEV 1 account and learning totals</p>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {coreStats.map((card) => (
                <StatTile key={card.id} {...card} />
              ))}
            </div>
          </section>

          {optionalStats.length > 0 && (
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="font-mono font-semibold text-gray-300 text-sm">Additional signals</h2>
                <p className="text-xs text-gray-600 font-mono mt-1">Optional metrics returned by the API</p>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {optionalStats.map((card) => (
                  <StatTile key={card.id} {...card} />
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="font-mono font-semibold text-gray-300 text-sm">Monthly trends</h2>
              <p className="text-xs text-gray-600 font-mono mt-1">Responsive bar charts for monthly arrays returned by backend</p>
            </div>
            {monthlyCharts.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<BarChart2 size={32} />}
                  title="No monthly charts available"
                  description="No monthly trend arrays were returned by the statistics endpoint."
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {monthlyCharts.map((chart) => (
                  <MonthlyBarChart key={chart.id} {...chart} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
