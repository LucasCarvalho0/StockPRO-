'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, Card, CardHeader, CardTitle, Badge, PageHeader, PageLoading } from '@/components/ui';
import { useProductStats, useAlertsResumo, useResumoHoje, useMovements, useAlerts, useInventoryHistorico, useSuppliers } from '@/hooks';
import { formatDateTime, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Package, AlertTriangle, Activity, Calendar, Truck, TrendingUp, History } from 'lucide-react';

const weeklyData = [
  { sem: 'S01', entradas: 48, saidas: 22 }, { sem: 'S02', entradas: 60, saidas: 35 },
  { sem: 'S03', entradas: 38, saidas: 18 }, { sem: 'S04', entradas: 72, saidas: 40 },
  { sem: 'S05', entradas: 55, saidas: 30 }, { sem: 'S06', entradas: 48, saidas: 24 },
];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useProductStats();
  const { data: alertsResumo } = useAlertsResumo();
  const { data: resumoHoje } = useResumoHoje();
  const { data: movements = [] } = useMovements();
  const { data: alertsAtivos = [] } = useAlerts('ATIVO');
  const { data: historico = [] } = useInventoryHistorico();
  const { data: suppliers = [] } = useSuppliers();
  const ultimoInv = historico[0];

  const isLoading = statsLoading;

  if (isLoading) return <DashboardLayout><div className="p-6"><PageLoading /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col gap-8 fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Executivo</h1>
              <p className="text-slate-500 mt-1 font-mono-custom text-[11px] uppercase tracking-wider">
                 {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} · Monitoramento de Ativos em Tempo Real
              </p>
           </div>
           <div className="flex items-center gap-3">
              <Badge variant="blue" className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border-blue-100 font-bold">
                 Sessão Ativa: {new Date().getHours() < 12 ? 'Matutino' : 'Vespertino'}
              </Badge>
           </div>
        </div>

        {/* Grade de Métricas Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            label="Total de Produtos" 
            value={stats?.total ?? 0} 
            sub={`${stats?.alertas ?? 0} com estoque critico`} 
            accent="#4f46e5" 
            icon={Package}
          />
          <StatCard 
            label="Alertas Ativos" 
            value={alertsResumo?.ativos ?? 0} 
            sub="Requer reposição imediata" 
            accent="#ef4444" 
            icon={AlertTriangle}
            valueClass="text-3xl font-bold text-red-600"
          />
          <StatCard 
            label="Movimentos Hoje" 
            value={resumoHoje?.total ?? 0} 
            sub={`${resumoHoje?.entradas ?? 0} ent · ${resumoHoje?.saidas ?? 0} saí`} 
            accent="#f59e0b" 
            icon={Activity}
            valueClass="text-3xl font-bold text-amber-600 font-display" 
          />
          <StatCard 
            label="Fornecedores" 
            value={suppliers.length} 
            sub="Parceiros cadastrados" 
            accent="#10b981" 
            icon={Truck}
            valueClass="text-3xl font-bold text-emerald-600"
          />
          <StatCard 
            label="Último Inventário" 
            value={ultimoInv ? new Date(ultimoInv.finalizadoEm!).toLocaleDateString('pt-BR') : '—'} 
            sub={ultimoInv ? `Resp: ${ultimoInv.responsavel}` : 'Nenhum registro'} 
            accent="#6366f1" 
            icon={Calendar}
            valueClass="text-[17px] font-bold text-indigo-700 mt-2 mb-1" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Tendências */}
          <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 py-5">
               <div className="flex items-center gap-2">
                 <TrendingUp size={18} className="text-blue-600" />
                 <CardTitle className="text-[15px] font-bold">Fluxo Semanal de Materiais</CardTitle>
               </div>
               <Badge variant="blue" className="rounded-lg">Últimas 6 semanas</Badge>
            </CardHeader>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} barGap={4}>
                  <XAxis dataKey="sem" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="entradas" name="Entradas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-4 justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-600" /> Entradas</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500" /> Saídas</span>
              </div>
            </div>
          </Card>

          {/* Feed de Alertas Críticos */}
          <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 py-5">
              <div className="flex items-center gap-2">
                 <AlertTriangle size={18} className="text-red-500" />
                 <CardTitle className="text-[15px] font-bold">Prioridades para Reposição</CardTitle>
              </div>
              <Badge variant="red">{alertsAtivos.length}</Badge>
            </CardHeader>
            <div className="divide-y divide-slate-50">
              {alertsAtivos.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs ring-2 ring-white">
                    {Math.round((a.quantidadeAtual / a.quantidadeMinima) * 100)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate group-hover:text-red-600 transition-colors">{a.product.nome}</p>
                    <p className="text-[10px] text-slate-400 font-mono-custom mt-0.5">Qtd: <span className="text-red-600 font-bold">{a.quantidadeAtual}</span> / Mín: {a.quantidadeMinima}</p>
                  </div>
                  <div className="text-right">
                     <Badge variant="red" className="rounded-full px-2 text-[8px]">Crítico</Badge>
                  </div>
                </div>
              ))}
              {alertsAtivos.length === 0 && (
                <div className="px-6 py-16 text-center text-[13px] text-slate-400">
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp size={24} />
                   </div>
                   Estoque saudável em todos os itens
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Tabela de Movimentações Recentes */}
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 py-5">
             <div className="flex items-center gap-2">
                <History size={18} className="text-slate-600" />
                <CardTitle className="text-[15px] font-bold">Monitor de Tráfego de Mercadorias</CardTitle>
             </div>
             <Badge variant="gray">Tempo Real</Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-50 bg-slate-50/30">
                {['Produto','Operação','Volume','Responsável','Timestamp','Doc. Ref'].map((h) => (
                  <th key={h} className="text-left px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono-custom">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {movements.slice(0, 7).map((m) => (
                  <tr key={m.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-8 py-5">
                       <p className="text-[13px] font-bold text-slate-800">{m.product.nome}</p>
                       <p className="text-[10px] text-slate-400 font-mono-custom uppercase">{m.product.codigo}</p>
                    </td>
                    <td className="px-8 py-5">
                       <Badge variant={m.type === 'ENTRADA' ? 'green' : 'red'} className="rounded-lg px-3 py-1 scale-90">
                          {m.type}
                       </Badge>
                    </td>
                    <td className="px-8 py-5">
                       <span className={cn("text-[13px] font-bold font-mono-custom", m.type === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600')}>
                          {m.type === 'ENTRADA' ? '+' : '-'}{m.quantidade}
                       </span>
                       <span className="ml-1 text-[10px] text-slate-400 font-normal">{m.product.unidade}</span>
                    </td>
                    <td className="px-8 py-5 text-[13px] font-medium text-slate-600">{m.user.nome}</td>
                    <td className="px-8 py-5 text-[11px] text-slate-400 font-mono-custom">{formatDateTime(m.createdAt)}</td>
                    <td className="px-8 py-5">
                       <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          {m.notaFiscal ?? 'S/ REG'}
                       </span>
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && <tr><td colSpan={6} className="px-8 py-16 text-center text-[13px] text-slate-400">Nenhum registro de movimentação nas últimas horas.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

