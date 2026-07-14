'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, BarChart2, CheckCircle, Activity, TrendingUp } from 'lucide-react';
import { adminService } from '../../services';
import { Card, Skeleton } from '../../components/shared';

const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <Card className="p-4">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      {icon}
    </div>
    <p className="text-2xl font-mono font-bold text-ink">{value}</p>
    <p className="text-xs text-ink-muted font-mono mt-0.5">{label}</p>
    {sub && <p className="text-xs text-emerald-400 font-mono mt-1">{sub}</p>}
  </Card>
);

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
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <BarChart2 size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="font-mono font-bold text-2xl text-ink">Admin Dashboard</h1>
          <p className="text-ink-faint font-mono text-sm">Platform analytics & management</p>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatTile icon={<Users size={18} className="text-blue-400" />} label="Total students" value={(stats?.totalStudents ?? 0).toLocaleString()} color="bg-blue-500/10" />
          <StatTile icon={<BookOpen size={18} className="text-violet-400" />} label="Total courses" value={stats?.totalCourses ?? 0} color="bg-violet-500/10" />
          <StatTile icon={<Activity size={18} className="text-emerald-400" />} label="Enrollments" value={(stats?.totalEnrollments ?? 0).toLocaleString()} color="bg-emerald-500/10" />
          <StatTile icon={<CheckCircle size={18} className="text-amber-400" />} label="Quiz attempts" value={(stats?.totalQuizAttempts ?? 0).toLocaleString()} color="bg-amber-500/10" />
          <StatTile
            icon={<TrendingUp size={18} className="text-emerald-400" />}
            label="Course completion rate"
            value={`${((stats?.courseCompletionRate ?? 0) * 100).toFixed(1)}%`}
            color="bg-emerald-500/10"
          />
          <StatTile
            icon={<CheckCircle size={18} className="text-violet-400" />}
            label="Quiz pass rate"
            value={`${((stats?.quizPassRate ?? 0) * 100).toFixed(1)}%`}
            color="bg-violet-500/10"
          />
        </div>
      )}

      {/* Recent users */}
      <div>
        <h2 className="font-mono font-semibold text-ink/80 text-sm mb-3">Recent users</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  {['Name', 'Email', 'Role', 'Plan', 'Joined'].map((h) => (
                    <th key={h} className="text-left text-xs text-ink-faint font-mono px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6">
                      <Skeleton className="h-4 rounded" count={5} />
                    </td>
                  </tr>
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-ink-faint font-mono text-center">
                      No recent users found
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => {
                    const userId = u._id ?? u.id ?? u.email;
                    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');
                    const userName = u.name || fullName || u.email;
                    const planType = u.planType ?? 'FREE';

                    return (
                      <tr key={userId} className="border-b border-white/[0.03] hover:bg-black/[0.03] transition-colors">
                        <td className="px-4 py-2.5 text-sm text-ink/80 font-mono">{userName}</td>
                        <td className="px-4 py-2.5 text-sm text-ink-muted font-mono">{u.email}</td>
                        <td className="px-4 py-2.5">
                          <span className={`badge-${u.role === 'ADMIN' ? 'purple' : 'gray'} text-xs font-mono px-2 py-0.5 rounded-full border ${u.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-300 border-violet-500/20' : 'bg-black/[0.04] text-ink-muted border-black/10'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${planType === 'PREMIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-black/[0.04] text-ink-faint border-black/10'}`}>
                            {planType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-ink-faint font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
