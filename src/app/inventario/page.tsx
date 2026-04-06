'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageLoading } from '@/components/ui';
import { InventarioModal } from '@/components/modals';
import { useInventoryAtivo, useInventoryHistorico, useAtualizarItemInventario, useFinalizarInventario } from '@/hooks';
import { reportsService } from '@/services';
import { formatDateTime, cn } from '@/lib/utils';
import { CheckSquare, Square, ClipboardCheck, History, FileDown, Calendar } from 'lucide-react';

export default function InventarioPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: inventarioAtivo, isLoading } = useInventoryAtivo();
  const { data: historico = [] } = useInventoryHistorico();
  const atualizarItem = useAtualizarItemInventario();
  const finalizar = useFinalizarInventario();

  const [lastSelected, setLastSelected] = useState<Record<string, boolean>>({});

  const handleToggleItem = async (itemId: string, checked: boolean, quantidadeSistema: number) => {
    if (!inventarioAtivo) return;
    
    if (checked) {
      setLastSelected(prev => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setLastSelected(prev => ({ ...prev, [itemId]: false }));
      }, 1500);
    }

    await atualizarItem.mutateAsync({
      inventoryId: inventarioAtivo.id,
      itemId,
      data: { quantidadeContada: checked ? quantidadeSistema : 0 },
    });
  };

  const handleFinalizar = async () => {
    if (!inventarioAtivo) return;
    const itemsConferidos = inventarioAtivo.items.filter((i) => i.conferido);
    
    if (itemsConferidos.length === 0) {
      alert('Nenhum item foi conferido. Marque pelo menos um produto para finalizar.');
      return;
    }

    if (!confirm(`Confirmar finalização do inventário com ${itemsConferidos.length} de ${inventarioAtivo.items.length} itens verificados?`)) return;
    
    await finalizar.mutateAsync({
      id: inventarioAtivo.id,
      items: itemsConferidos.map((i) => ({
        productId: i.productId,
        quantidadeContada: i.quantidadeContada,
        quantidadeSistema: i.quantidadeSistema,
        observacao: i.observacao,
      })),
    });
  };

  const handlePdfInventario = async (id: string) => {
    try {
      const blob = await reportsService.pdfInventario(id);
      reportsService.download(blob, `inventario-${id}.pdf`);
    } catch { alert('Erro ao gerar PDF'); }
  };

  const handleExcelInventario = async (id: string) => {
    try {
      const blob = await reportsService.excelInventario(id);
      reportsService.download(blob, `inventario-${id}.xlsx`);
    } catch { alert('Erro ao gerar Excel'); }
  };

  const conferidos = inventarioAtivo?.items.filter((i) => i.conferido).length ?? 0;
  const total = inventarioAtivo?.items.length ?? 0;
  const pct = total > 0 ? Math.round((conferidos / total) * 100) : 0;

  const getDuration = (start: string | Date, end: string | Date | null) => {
    if (!end) return '-';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = Math.floor((e - s) / 60000); // minutos
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventário Semanal</h1>
            <p className="text-slate-500 mt-1">Controle de perdas, ganhos e integridade do estoque</p>
          </div>
          {!inventarioAtivo && (
            <Button variant="primary" onClick={() => setModalOpen(true)} className="h-11 px-6 premium-gradient shadow-lg">
              <ClipboardCheck size={18} className="mr-2" /> Iniciar Novo Inventário
            </Button>
          )}
        </div>

        {isLoading && <PageLoading />}

        {/* Inventário ativo */}
        {inventarioAtivo && (
          <div className="flex flex-col gap-6 fade-in">
            <div className="glass-dark p-6 rounded-3xl border border-blue-500/20 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                  <div className="flex items-start gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg animate-pulse ring-4 ring-blue-500/20">
                        <ClipboardCheck size={28} />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-white font-display">Inventário em Execução</h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1 text-blue-200/80 text-[11px] font-mono-custom tracking-wide">
                           <span className="flex items-center gap-1.5"><strong className="text-white">Responsável:</strong> {inventarioAtivo.responsavel}</span>
                           <span className="flex items-center gap-1.5"><strong className="text-white">Matrícula:</strong> {inventarioAtivo.matricula}</span>
                           <span className="flex items-center gap-1.5 whitespace-nowrap"><strong className="text-white">Iniciado:</strong> {formatDateTime(inventarioAtivo.iniciadoEm)}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[280px] w-full md:w-auto">
                     <div className="w-full">
                        <div className="flex justify-between items-end mb-1.5">
                           <p className="text-white font-bold text-xl">{pct}% <span className="text-blue-300 text-xs font-normal">concluído</span></p>
                           <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{conferidos} de {total} itens</p>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden border border-white/5 p-[1px]">
                           <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ width: `${pct}%` }} />
                        </div>
                     </div>
                     <Button variant="success" onClick={handleFinalizar} loading={finalizar.isPending} className="w-full md:w-auto h-11 px-8 bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20 font-bold tracking-wide">
                        Finalizar e Consolidar
                     </Button>
                  </div>
               </div>
            </div>

            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 px-5 md:px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                   <Calendar size={18} className="text-blue-600" />
                   Lista de Conferência
                </CardTitle>
                <Badge variant="blue" className="rounded-lg px-4 py-1.5 bg-blue-600 text-white border-none shadow-sm">{conferidos}/{total} VERIFICADOS</Badge>
              </CardHeader>
              <div className="divide-y divide-slate-100 px-2 md:px-4 py-2">
                {inventarioAtivo.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 md:gap-4 px-3 md:px-5 py-4 rounded-2xl transition-all duration-300 border-2",
                      item.conferido 
                        ? 'bg-blue-600/10 border-blue-200/50 shadow-sm' 
                        : 'border-transparent hover:bg-slate-50'
                    )}
                  >
                    <button
                      onClick={() => handleToggleItem(item.id, !item.conferido, item.quantidadeSistema)}
                      className={cn(
                        "w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-all border-2 flex-shrink-0",
                        item.conferido 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 scale-110' 
                          : 'border-slate-300 text-transparent hover:border-blue-500 bg-white'
                      )}
                    >
                      <CheckSquare size={16} className={cn("transition-transform", item.conferido ? 'scale-100' : 'scale-50')} />
                    </button>
                    <div className="flex-1 min-w-0 relative">
                      <p className={cn("text-[13px] md:text-[15px] font-bold transition-all truncate", item.conferido ? 'text-blue-900 line-through decoration-blue-300 opacity-60' : 'text-slate-900')}>
                        {item.product.nome}
                      </p>
                      <p className={cn("text-[9px] md:text-[10px] font-bold uppercase tracking-widest font-mono-custom truncate", item.conferido ? 'text-blue-400' : 'text-slate-400')}>
                        {item.product.codigo}
                      </p>

                      {lastSelected[item.id] && (
                        <span className="absolute left-0 -top-1 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-lg">
                          Selecionado!
                        </span>
                      )}
                    </div>
                    <div className="text-right min-w-[70px] md:min-w-[90px]">
                      <p className={cn("text-[13px] md:text-[15px] font-bold font-mono-custom", item.conferido ? 'text-blue-800' : 'text-slate-800')}>
                        {item.quantidadeSistema} <span className="text-[9px] md:text-[10px] text-slate-400 font-normal uppercase">{item.product.unidade}</span>
                      </p>
                      <p className="text-[8px] md:text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Estoque</p>
                    </div>
                    {item.conferido && (
                      <div className="min-w-[40px] md:min-w-[80px] flex justify-center">
                        <Badge variant={item.divergencia < 0 ? 'red' : item.divergencia > 0 ? 'amber' : 'green'} className="rounded-lg font-bold px-2 md:px-3 py-1 ring-2 ring-white">
                          {item.divergencia === 0 ? 'OK' : `${item.divergencia > 0 ? '+' : ''}${item.divergencia}`}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Histórico */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <History size={20} className="text-slate-400" />
             <h2 className="text-xl font-bold text-slate-800 font-display">Histórico de Fechamentos</h2>
          </div>
          <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    {['Início / Fim', 'Duração', 'Responsável', 'Audit.', 'Exportação'].map((h) => (
                      <th key={h} className="px-5 md:px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono-custom whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historico.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 md:px-8 py-5">
                        <div className="flex flex-col min-w-[140px]">
                           <span className="text-[13px] font-bold text-slate-700 font-mono-custom">
                              {new Date(inv.iniciadoEm).toLocaleDateString('pt-BR')} 
                              <span className="text-slate-300 font-normal ml-1">às {new Date(inv.iniciadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                           </span>
                           {inv.finalizadoEm && (
                             <span className="text-[11px] text-emerald-600 font-medium whitespace-nowrap">
                                Finalizado às {new Date(inv.finalizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                             </span>
                           )}
                        </div>
                      </td>
                      <td className="px-5 md:px-8 py-5 text-[12px] font-bold text-slate-500 font-mono-custom whitespace-nowrap">
                        {getDuration(inv.iniciadoEm || new Date(), inv.finalizadoEm ?? null)}
                      </td>
                      <td className="px-5 md:px-8 py-5 text-[14px] font-bold text-slate-900 whitespace-nowrap">{inv.responsavel}</td>
                      <td className="px-5 md:px-8 py-5">
                         <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 whitespace-nowrap">
                            {inv._count?.items ?? 0} Prod.
                         </span>
                      </td>
                      <td className="px-5 md:px-8 py-5">
                        <div className="flex items-center gap-2 min-w-[120px]">
                           <Button size="sm" variant="secondary" onClick={() => handlePdfInventario(inv.id)} title="Baixar PDF" className="rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 group-hover:shadow-sm px-2 md:px-3">
                             <FileDown size={14} className="mr-1 md:mr-1.5" /> PDF
                           </Button>
                           <Button size="sm" variant="secondary" onClick={() => handleExcelInventario(inv.id)} title="Baixar Excel" className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 group-hover:shadow-sm px-2 md:px-3">
                             <FileDown size={14} className="mr-1 md:mr-1.5" /> XLS
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {historico.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center">
                        <History size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-[15px] font-bold text-slate-900">Sem histórico acumulado</p>
                        <p className="text-sm text-slate-400 mt-1">Os inventários finalizados aparecerão aqui.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <InventarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </DashboardLayout>
  );
}
