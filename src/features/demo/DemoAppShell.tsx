'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, BookOpen, Bot, Bookmark, Code2, LayoutDashboard, LogOut, Search, Trophy, User, Zap } from 'lucide-react';
import { useAuthStore } from '@/store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/ide', label: 'Code IDE', icon: Code2 },
  { href: '/ai', label: 'AI Coach', icon: Bot },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/quiz/history', label: 'Quiz Attempts', icon: BookOpen },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
];

export function DemoAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, mounted, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f7f4ee] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-black/20 border-t-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#111111]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-black/10 bg-white/85 backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-black/10 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-black text-white">
            <Zap size={18} />
          </span>
          <span className="text-lg font-semibold tracking-tight">ThreadLearn</span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active ? 'bg-black text-white' : 'text-black/60 hover:bg-black/[0.05] hover:text-black'
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-black/10 p-4">
          <div className="rounded-lg bg-[#d9f99d] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">Demo mode</p>
            <p className="mt-1 text-sm font-medium">Mock account is active. BE can be wired after the presentation.</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f7f4ee]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-black text-white">
                <Zap size={16} />
              </span>
              <span className="font-semibold">ThreadLearn</span>
            </Link>
            <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/45 md:flex">
              <Search size={16} />
              Search lessons, courses, race conditions...
            </div>
            <button className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white">
              <Bell size={17} />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-black/45">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.replace('/');
              }}
              className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-black/60 hover:text-black"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
