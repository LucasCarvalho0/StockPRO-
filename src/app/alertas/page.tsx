'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageLoading, InfoBanner } from '@/components/ui';
import { MovementModal } from '@/components/modals';
import { useAlerts, useAlertsResumo } from '@/hooks';
import { formatDateTime } from '@/lib/utils';
import { AlertCircle, CheckCircle2, History, PackageSearch, ArrowRightCircle } from 'lucide-react';

export default function AlertasPage() {
  const { data: alertsAtivos = [], isLoading } = useAlerts('ATIVO');
  const { data: alertsResolvidos = [] } = useAlerts('RESOLVIDO');
  const { data: resumo } = useAlertsResumo();
  const [movModal, setMovModal] = useState<{ open: boolean; productId?: string }>({ open: false });
  const [tab, setTab] = useState<'ativos' | 'resolvidos'>('ativos');

  const lista = tab === 'ativos' ? alertsAtivos : alertsResolvidos;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Monitor de Alertas</h1>
            <p className="text-slate-500 mt-1">Status crítico de estoque e divergências de inventário semanal</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="red" className="px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-red-200">
               {resumo?.ativos ?? 0} Ativos
            </Badge>
          </div>
        </div>

        <InfoBanner type="info" className="border-indigo-100 bg-indigo-50/50 text-indigo-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Os alertas são gerados automaticamente para manter a integridade do seu estoque.</span>
          </div>
        </InfoBanner>

        <div className="flex gap-1 p-1 bg-slate-200/50 rounded-2xl w-fit border border-slate-200/40">
          <button
            onClick={() => setTab('ativos')}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
              tab === 'ativos' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertCircle size={16} /> Ativos
          </button>
          <button
            onClick={() => setTab('resolvidos')}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
              tab === 'resolvidos' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle2 size={16} /> Resolvidos
          </button>
        </div>

        {isLoading ? (
          <PageLoading />
        ) : (
          <div className="grid grid-cols-1 gap-4">
             {lista.map((alert) => {
               const isDivergencia = (alert as any).tipo === 'DIVERGENCIA_INVENTARIO';
               const isZerado = alert.quantidadeAtual === 0;
               
               return (
                <div
                  key={alert.id}
                  className={`group bg-white border border-slate-200/70 rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    tab === 'resolvidos' ? 'bg-emerald-400' :
                    isDivergencia ? 'bg-indigo-500' :
                    isZerado ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
                        tab === 'resolvidos' ? 'bg-emerald-50 text-emerald-600' :
                        isDivergencia ? 'bg-indigo-50 text-indigo-600' :
                        isZerado ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {isDivergencia ? <PackageSearch size={24} /> : <AlertCircle size={24} />}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                           <h3 className="text-lg font-bold text-slate-900 leading-none">{alert.product.nome}</h3>
                           <Badge variant={isDivergencia ? 'blue' : isZerado ? 'red' : 'amber'} className="text-[9px] uppercase font-bold tracking-tighter">
                             {isDivergencia ? 'Divergência Inventário' : 'Estoque Baixo'}
                           </Badge>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono-custom">
                          COD: {alert.product.codigo} · {alert.product.modelo}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                           <div className="flex items-center gap-1.5 text-slate-500">
                              <History size={12} className="opacity-50" />
                              <span>Detectado em {formatDateTime(alert.createdAt)}</span>
                           </div>
                           {alert.resolvidoEm && (
                             <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                               <CheckCircle2 size={12} />
                               <span>Resolvido em {formatDateTime(alert.resolvidoEm)}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 md:border-l border-slate-100 md:pl-10 h-full">
                       <div className="flex flex-col items-end">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Status Atual</p>
                          <p className={`text-xl font-bold font-mono-custom ${
                            tab === 'resolvidos' ? 'text-emerald-600' :
                            isZerado ? 'text-rose-600' : 'text-slate-800'
                          }`}>
                            {alert.quantidadeAtual} <span className="text-[10px] text-slate-400">{alert.product.unidade}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 -mt-1 font-medium italic">
                            Referência: {alert.quantidadeMinima} {alert.product.unidade}
                          </p>
                       </div>

                       {tab === 'ativos' && (
                         <Button 
                           onClick={() => setMovModal({ open: true, productId: alert.productId })} 
                           className={`h-11 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all text-white ${
                             isDivergencia ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 
                             isZerado ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 
                             'bg-amber-600 hover:bg-amber-700 shadow-amber-100'
                           }`}
                         >
                           <ArrowRightCircle size={18} /> Resolvendo
                         </Button>
                       )}
                    </div>
                  </div>
                </div>
               );
             })}

             {lista.length === 0 && (
                <Card className="py-24 text-center flex flex-col items-center gap-4 bg-slate-50/50 border-dashed">
                   <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100">
                      <CheckCircle2 size={40} />
                   </div>
                   <div>
                     <p className="text-xl font-bold text-slate-900">
                        {tab === 'ativos' ? 'Céu Limpo! Nenhum alerta ativo.' : 'Histórico de alertas vazio.'}
                     </p>
                     <p className="text-slate-500 mt-1 max-w-[320px] mx-auto text-sm">
                        {tab === 'ativos' ? 'Todos os produtos estão com níveis saudáveis e processados corretamente.' : 'Nenhum alerta foi resolvido no sistema ainda.'}
                     </p>
                   </div>
                </Card>
             )}
          </div>
        )}
      </div>

      <MovementModal
        open={movModal.open}
        onClose={() => setMovModal({ open: false })}
        type="ENTRADA"
        preSelectedProductId={movModal.productId}
      />
    </DashboardLayout>
  );
}
