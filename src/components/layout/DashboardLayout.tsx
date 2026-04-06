'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { isSidebarCollapsed } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Enquanto não hidratou ou não está autenticado, não renderiza nada (proteção anti-flash)
  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
