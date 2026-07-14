'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, BarChart2, CheckCircle, Activity, TrendingUp } from 'lucide-react';
import { adminService } from '../../services';
import { Skeleton } from '../../components/shared';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}> = ({ icon, label, value, sub }) => (
  <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f7f4ee] text-ink">
      {icon}
    </div>
    <p className="text-3xl font-light tracking-tight text-ink">{value}</p>
    <p className="mt-1 text-sm text-black/55">{label}</p>
    {sub ? <p className="mt-1 text-xs text-emerald-700">{sub}</p> : null}
  </div>
);

/** PR8 optional polish — admin analytics shell in demo light language. */
export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', 1],
    queryFn: () => adminService.listUsers(1, 10),
  });
  const recentUsers = usersData?.items ?? [];

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <div className="flex flex-wrap items-center gap-2">
          <DemoPill tone="pink">Admin</DemoPill>
          <BarChart2 size={18} className="text-black/45" />
        </div>
        <DemoDisplayTitle>Admin dashboard</DemoDisplayTitle>
        <DemoMuted>Platform analytics and recent student activity.</DemoMuted>
      </DemoHeroWhite>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatTile
            icon={<Users size={18} />}
            label="Total students"
            value={(stats?.totalStudents ?? 0).toLocaleString()}
          />
          <StatTile icon={<BookOpen size={18} />} label="Total courses" value={stats?.totalCourses ?? 0} />
          <StatTile
            icon={<Activity size={18} />}
            label="Enrollments"
            value={(stats?.totalEnrollments ?? 0).toLocaleString()}
          />
          <StatTile
            icon={<CheckCircle size={18} />}
            label="Quiz attempts"
            value={(stats?.totalQuizAttempts ?? 0).toLocaleString()}
          />
          <StatTile
            icon={<TrendingUp size={18} />}
            label="Course completion rate"
            value={`${((stats?.courseCompletionRate ?? 0) * 100).toFixed(1)}%`}
          />
          <StatTile
            icon={<CheckCircle size={18} />}
            label="Quiz pass rate"
            value={`${((stats?.quizPassRate ?? 0) * 100).toFixed(1)}%`}
          />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">Recent users</h2>
        <DemoWhitePanel>
          {usersLoading ? (
            <div className="p-4">
              <Skeleton className="h-10 rounded-lg" count={5} />
            </div>
          ) : recentUsers.length === 0 ? (
            <p className="p-6 text-sm text-black/50">No recent users.</p>
          ) : (
            <div className="divide-y divide-black/10">
              {recentUsers.map((user) => (
                <div
                  key={user._id ?? user.id ?? user.email}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                    <p className="truncate text-xs text-black/50">{user.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f7f4ee] px-2.5 py-0.5 text-[11px] font-medium text-black/60">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DemoWhitePanel>
      </div>
    </DemoPageRoot>
  );
};
