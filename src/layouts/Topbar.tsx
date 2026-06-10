import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, LogOut, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '../store';
import { Avatar, Badge } from '../components/shared';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, sidebarCollapsed } = useUIStore();
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-14 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl transition-all duration-200 ${
        sidebarCollapsed ? 'left-14' : 'left-56'
      }`}
    >
      {/* Search */}
      <div className="relative flex items-center gap-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchValue.trim()) {
                router.push(`/courses?search=${encodeURIComponent(searchValue)}`);
              }
            }}
            placeholder="Search courses..."
            className="h-8 bg-white/[0.04] border border-white/[0.07] text-gray-300 placeholder-gray-700 rounded-lg pl-8 pr-10 text-xs font-mono w-60 outline-none focus:border-violet-500/30 focus:bg-white/[0.06] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-gray-700">
            <Command size={10} />
            <span className="text-[10px]">K</span>
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* XP display */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 mr-2">
            <span className="text-violet-400 text-xs font-mono">Lv.</span>
            <span className="text-violet-300 text-xs font-mono font-semibold">1</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => router.push('/notifications')}
          className="relative p-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-10 z-20 w-52 bg-[#111118] border border-white/[0.08] rounded-xl panel-shadow py-1 animate-fade-in">
                <div className="px-3 py-2.5 border-b border-white/[0.06]">
                  <p className="text-xs text-gray-200 font-mono font-medium truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-gray-600 font-mono truncate">
                    {user?.email}
                  </p>
                  <div className="mt-1">
                    <Badge color={user?.planType === 'PREMIUM' ? 'amber' : 'gray'}>
                      {user?.planType}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 font-mono transition-colors"
                >
                  Profile settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 font-mono transition-colors flex items-center gap-2"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
