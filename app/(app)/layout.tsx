'use client';

import { DemoAppShell } from '@/features/demo/DemoAppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <DemoAppShell>{children}</DemoAppShell>;
}
