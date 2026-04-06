import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard, Package, AlertTriangle, ClipboardList,
  FileText, ScrollText, Boxes, Truck, Users, LogOut,
  FileDown, Building2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useAlertsResumo } from '@/hooks';
import { getDescricaoTurno } from '@/lib/shifts';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'principal' },
  { href: '/estoque', label: 'Estoque', icon: Package, section: 'principal' },
  { href: '/alertas', label: 'Alertas', icon: AlertTriangle, section: 'principal', badge: true },
  { href: '/nf', label: 'NF de Clientes', icon: FileDown, section: 'operacoes' },
  { href: '/inventario', label: 'Inventário', icon: ClipboardList, section: 'operacoes' },
  { href: '/relatorios', label: 'Relatórios', icon: FileText, section: 'operacoes' },
  { href: '/auditoria', label: 'Auditoria', icon: ScrollText, section: 'operacoes', roles: ['LIDER', 'ADMINISTRADOR'] },
  { href: '/produtos', label: 'Produtos', icon: Boxes, section: 'cadastros' },
  { href: '/clientes', label: 'Clientes', icon: Building2, section: 'cadastros' },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck, section: 'cadastros' },
  { href: '/usuarios', label: 'Usuários', icon: Users, section: 'cadastros', roles: ['ADMINISTRADOR'] },
];

const sections: Record<string, string> = { principal: 'Principal', operacoes: 'Operações', cadastros: 'Cadastros' };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { data: resumo } = useAlertsResumo();

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  const handleLogout = () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      clearAuth();
      router.push('/login');
    }
  };

  const grouped = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (item.roles && !item.roles.includes(user?.role ?? '')) return acc;
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const roleColors: Record<string, string> = {
    ADMINISTRADOR: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    LIDER: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    ESTOQUISTA: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={cn(
          'fixed inset-y-0 left-0 lg:static h-screen flex flex-col transition-all duration-300 ease-in-out z-50',
          isSidebarCollapsed ? 'w-[70px]' : 'w-[260px]',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )} 
        style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
      {/* Brand & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Package className="text-white" size={18} />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">StockPRO</span>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto">
            <Package className="text-white" size={20} />
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-500 transition-colors z-50"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto scrollbar-hide px-3 space-y-8">
        {Object.entries(sections).map(([key, label]) => {
          if (!grouped[key]?.length) return null;
          return (
            <div key={key} className="space-y-1">
              {!isSidebarCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 font-display">
                  {label}
                </p>
              )}
              {grouped[key].map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    title={isSidebarCollapsed ? item.label : ''}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                      isActive 
                        ? 'bg-indigo-600/10 text-indigo-400 font-medium' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    )}
                  >
                    <Icon size={isSidebarCollapsed ? 20 : 18} className={cn('flex-shrink-0 transition-transform duration-200', isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100')} />
                    {!isSidebarCollapsed && <span className="text-[13.5px] truncate">{item.label}</span>}
                    
                    {item.badge && resumo && resumo.ativos > 0 && (
                      <span className={cn(
                        'bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full',
                        isSidebarCollapsed ? 'absolute top-1 right-1 w-4 h-4' : 'ml-auto px-1.5 py-0.5'
                      )}>
                        {resumo.ativos}
                      </span>
                    )}
                    
                    {isActive && !isSidebarCollapsed && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-l-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Profile Card */}
      <div className={cn('p-4 border-t border-white/5 bg-slate-900/40 mt-auto', isSidebarCollapsed ? 'items-center' : '')}>
        {!isSidebarCollapsed ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className={cn(
                'px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase border w-fit font-display',
                roleColors[user?.role ?? 'ESTOQUISTA'] || roleColors.ESTOQUISTA
              )}>
                {getDescricaoTurno(user?.role ?? '', (user as any)?.shift ?? 'FORA_DE_TURNO')}
              </div>
              <div className="space-y-0.5">
                <p className="text-[14px] font-bold text-white tracking-tight leading-tight">{user?.nome}</p>
                <p className="text-[11px] text-slate-500 font-mono-custom">Mat. {user?.matricula}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20"
            >
              <LogOut size={14} /> Sair do sistema
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-400/20">
              {user?.nome?.substring(0, 2).toUpperCase()}
            </div>
            <button 
              onClick={handleLogout}
              title="Sair do sistema"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
