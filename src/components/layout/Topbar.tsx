'use client';
import { Bell, Menu } from 'lucide-react';
import { useAlertsResumo } from '@/hooks';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { formatDate } from '@/lib/utils';

export function Topbar() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useUIStore();
  const { data: resumo } = useAlertsResumo();

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 flex-shrink-0"
      style={{ background: '#0a1628', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-4">
        {/* Hamburger Menu - Mobile Only */}
        <button 
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#2563eb' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9 8H7v-2h4v2zm6 0h-4v-2h4v2zM4 7V5a2 2 0 012-2h12a2 2 0 012 2v2H4z" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-bold text-white leading-tight font-display">StockPRO</p>
            <p className="text-[9px] tracking-widest uppercase font-mono-custom" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Sistema de Estoque Corporativo
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-mono-custom" style={{ color: 'rgba(255,255,255,0.35)' }}>{formatDate(new Date())}</span>
        {resumo && resumo.ativos > 0 && (
          <div className="relative">
            <Bell size={16} className="text-white/50" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
              {resumo.ativos}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium text-white"
            style={{ background: '#1a3460', border: '1px solid rgba(255,255,255,0.15)' }}>
            {user?.nome?.substring(0, 2).toUpperCase()}
          </div>
          <span className="hidden sm:block">{user?.nome}</span>
        </div>
      </div>
    </header>
  );
}
