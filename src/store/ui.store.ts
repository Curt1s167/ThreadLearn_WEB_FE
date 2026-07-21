'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  /** Product is light-only; field retained for partialized migrate from v1 */
  theme: 'dark' | 'light';
  activeModal: string | null;
  modalData: unknown;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  openModal: (name: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Desktop keeps the navigation visible with CSS. Start mobile with the
      // drawer closed so it never covers lesson content on first paint.
      sidebarOpen: false,
      sidebarCollapsed: false,
      theme: 'light',
      activeModal: null,
      modalData: null,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleSidebarCollapse: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => {
        // Light-only product: always clear dark class
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('dark');
        }
        set({ theme: theme === 'dark' ? 'light' : theme });
      },
      openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'threadlearn-ui-v2',
      partialize: (state) => ({
        theme: 'light' as const,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
