'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card, CardHeader, CardTitle, Badge, Button,
  PageHeader, PageLoading, Modal, ModalBody, ModalFooter,
  Input, Select, Textarea, InfoBanner,
} from '@/components/ui';
import { useNFs, useCreateNF, useBaixarNF, useClientes, useProducts } from '@/hooks';
import { formatDateTime, cn } from '@/lib/utils';
import { Plus, Trash2, FileDown, CheckCircle, AlertCircle, Clock, Search, Filter, FileText, ArrowRight } from 'lucide-react';

const nfSchema = z.object({
  numero: z.string().min(1, 'Número obrigatório'),
  clienteId: z.string().min(1, 'Selecione um cliente'),
  observacao: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Selecione um produto'),
    quantidade: z.coerce.number().min(1, 'Mínimo 1'),
    observacao: z.string().optional(),
  })).min(1, 'Adicione ao menos um item'),
});

type NfForm = z.infer<typeof nfSchema>;

const statusConfig = {
  ABERTA: { label: 'Em Aberto', variant: 'blue' as const, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  PARCIAL: { label: 'Baixa Parcial', variant: 'amber' as const, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  BAIXADA: { label: 'Concluída', variant: 'green' as const, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
};

export default function NfPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedNf, setSelectedNf] = useState<any>(null);
  const [baixaOpen, setBaixaOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [baixaItems, setBaixaItems] = useState<Record<string, number>>({});

  const { data: nfs = [], isLoading } = useNFs({
    status: filterStatus || undefined,
    clienteId: filterCliente || undefined,
  });
  const { data: clientes = [] } = useClientes();
  const { data: products = [] } = useProducts();
  const createNF = useCreateNF();
  const baixarNF = useBaixarNF();

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<NfForm>({
    resolver: zodResolver(nfSchema),
    defaultValues: { numero: '', clienteId: '', items: [{ productId: '', quantidade: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchClienteId = watch('clienteId');

  const productsForCliente = watchClienteId
    ? products.filter((p) => p.clienteId === watchClienteId || !p.clienteId)
    : products;

  const onSubmit = async (data: NfForm) => {
    try {
      await createNF.mutateAsync(data);
      reset();
      setCreateOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao criar NF');
    }
  };

  const openBaixa = (nf: any) => {
    setSelectedNf(nf);
    const init: Record<string, number> = {};
    nf.items.forEach((i: any) => {
      init[i.id] = i.quantidade - i.quantidadeBaixada;
    });
    setBaixaItems(init);
    setBaixaOpen(true);
  };

  const handleBaixar = async () => {
    if (!selectedNf) return;
    try {
      const items = Object.entries(baixaItems)
        .filter(([, qty]) => qty > 0)
        .map(([nfItemId, quantidadeBaixar]) => ({ nfItemId, quantidadeBaixar }));

      await baixarNF.mutateAsync({ id: selectedNf.id, items });
      setBaixaOpen(false);
      setSelectedNf(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao realizar baixa');
    }
  };

  const getProductStock = (productId: string) =>
    products.find((p) => p.id === productId)?.quantidade ?? 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 p-1 md:p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Notas <span className="text-blue-600">Fiscais</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-lg">
              Rastreabilidade total de saídas. Monitore e processe baixas de estoque com eficiência e segurança.
            </p>
          </div>
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="h-12 px-8 premium-gradient shadow-xl shadow-blue-200 group">
            <Plus size={20} className="mr-2 group-hover:scale-125 transition-transform" /> 
            <span className="font-bold">Emitir Nova NF</span>
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="glass p-5 rounded-3xl border border-white/40 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl group focus-within:border-blue-500 transition-all">
              <Filter size={16} className="text-slate-400" />
              <select
                className="bg-transparent outline-none text-sm text-slate-600 font-bold min-w-[160px] cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os Status</option>
                <option value="ABERTA">Em Aberto</option>
                <option value="PARCIAL">Baixa Parcial</option>
                <option value="BAIXADA">Concluída</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl group focus-within:border-blue-500 transition-all flex-1 max-w-md">
              <Search size={16} className="text-slate-400" />
              <select
                className="bg-transparent outline-none text-sm text-slate-600 font-bold w-full cursor-pointer"
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
              >
                <option value="">Filtrar por Cliente</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-slate-200 hidden lg:block mx-1" />
          <span className="text-sm font-bold text-slate-400 font-mono-custom px-4 uppercase">{nfs.length} DOCUMENTO(S)</span>
        </div>

        {/* NF Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/30 rounded-3xl animate-pulse border border-white/50 shadow-sm" />)}
          </div>
        ) : nfs.length === 0 ? (
          <div className="py-24 text-center glass rounded-[3rem] border border-dashed border-slate-300/60 max-w-3xl mx-auto w-full">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileDown size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Cofre Vazio</h3>
            <p className="text-slate-500 mt-2">Nenhuma nota fiscal encontrada nos critérios selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {nfs.map((nf: any) => {
              const cfg = statusConfig[nf.status as keyof typeof statusConfig];
              const totalItens = nf.items.reduce((s: number, i: any) => s + i.quantidade, 0);
              const totalBaixado = nf.items.reduce((s: number, i: any) => s + i.quantidadeBaixada, 0);
              const pctBaixado = totalItens > 0 ? Math.round((totalBaixado / totalItens) * 100) : 0;
              const Icon = cfg.icon;

              return (
                <div key={nf.id} className="group bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-3xl p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("p-2.5 rounded-2xl", cfg.bg)}>
                          <FileText size={20} className={cfg.color} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight font-display">
                            NOTA FISCAL <span className="text-blue-600">{nf.numero}</span>
                          </h3>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono-custom">
                            Emitida em {formatDateTime(nf.dataEmissao)} • Por {nf.user.nome}
                          </p>
                        </div>
                        <div className={cn(
                          'ml-auto md:ml-0 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 flex items-center gap-1.5',
                          nf.status === 'BAIXADA' ? 'bg-green-50 text-green-600 border-green-100' :
                          nf.status === 'PARCIAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-blue-50 text-blue-600 border-blue-100'
                        )}>
                          <Icon size={12} />
                          {cfg.label}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center gap-6 mt-4">
                        <div className="min-w-[200px]">
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter mb-1">Destinatário</p>
                            <p className="text-sm font-extrabold text-slate-700 truncate">{nf.cliente.nome}</p>
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1.5">
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">Fluxo de Saída</p>
                            <span className="text-[10px] font-black text-slate-900 font-mono-custom">{pctBaixado}% CONCLUÍDO</span>
                          </div>
                          <div className="h-3 w-full rounded-full overflow-hidden bg-slate-100 p-0.5 border border-slate-200/50">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000 premium-gradient shadow-sm shadow-blue-100",
                                pctBaixado === 100 ? 'from-green-400 to-green-600' : 
                                pctBaixado > 0 ? 'from-amber-400 to-amber-600 shadow-amber-100' : 'from-blue-400 to-blue-600'
                              )}
                              style={{ width: `${pctBaixado}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-right hidden lg:block">
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter mb-1">Volumes</p>
                            <p className="text-sm font-black text-slate-900 font-mono-custom">{totalBaixado} / {totalItens} <span className="text-[10px] text-slate-400 uppercase">un</span></p>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {nf.items.slice(0, 5).map((item: any) => (
                          <div key={item.id} className={cn(
                            "px-3 py-1 rounded-xl text-[10px] font-bold border border-dashed transition-colors",
                            item.quantidadeBaixada >= item.quantidade ? "bg-green-50/50 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-500"
                          )}>
                             {item.product.nome} • {item.quantidadeBaixada}/{item.quantidade}
                          </div>
                        ))}
                        {nf.items.length > 5 && (
                          <div className="px-3 py-1 rounded-xl text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-400">
                             +{nf.items.length - 5} itens
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {nf.status !== 'BAIXADA' ? (
                        <Button 
                          variant="primary" 
                          className="h-14 px-6 rounded-2xl shadow-lg hover:shadow-blue-500/20 premium-gradient group"
                          onClick={() => openBaixa(nf)}
                        >
                          <span className="font-bold">Baixar Ativos</span>
                          <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      ) : (
                        <div className="h-14 px-6 rounded-2xl bg-green-50 text-green-600 border-2 border-green-100 flex items-center gap-2 font-black text-sm">
                           <CheckCircle size={18} />
                           DOCUMENTO FINALIZADO
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal: Criar NF ─────────────────────────────────────────────────── */}
      <Modal open={createOpen} onClose={() => { reset(); setCreateOpen(false); }} title="Emissão de Documento Fiscal" width="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Identificador da NF"
                placeholder="Número da Nota"
                error={errors.numero?.message}
                {...register('numero')}
              />
              <Select
                label="Entidade (Cliente)"
                error={errors.clienteId?.message}
                {...register('clienteId')}
              >
                <option value="">Vincular a um cliente...</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </div>

            <Textarea label="Notas de Saída (opcional)" rows={2} placeholder="Justificativa ou instruções de entrega..." {...register('observacao')} />

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Composição da Carga</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-xl h-8 px-4 font-bold text-[11px]"
                  onClick={() => append({ productId: '', quantidade: 1 })}
                >
                  <Plus size={12} className="mr-1" /> Adicionar Item
                </Button>
              </div>

              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-2 scrollbar-premium">
                {fields.map((field, index) => {
                  const watchProductId = watch(`items.${index}.productId`);
                  const stock = getProductStock(watchProductId);
                  return (
                    <div key={field.id} className="group flex items-start gap-3 p-4 bg-slate-50/50 hover:bg-white border-2 border-slate-100 hover:border-blue-100 rounded-2xl transition-all">
                      <div className="flex-1 space-y-1">
                        <select
                          className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold text-slate-700"
                          {...register(`items.${index}.productId`)}
                        >
                          <option value="">Selecionar Ativo...</option>
                          {productsForCliente.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              [{p.codigo}] {p.nome} — Stock: {p.quantidade} {p.unidade}
                            </option>
                          ))}
                        </select>
                        <div className="flex justify-between items-center px-1">
                          {errors.items?.[index]?.productId && (
                             <p className="text-[10px] text-red-600 font-bold">{errors.items[index]?.productId?.message}</p>
                          )}
                          {watchProductId && (
                            <p className="text-[10px] text-slate-400 font-bold ml-auto uppercase tracking-tighter">
                              Estoque Local: <span className={cn("font-black", stock === 0 ? "text-red-600" : "text-green-600")}>{stock} un</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min={1}
                          className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-black text-center"
                          {...register(`items.${index}.quantidade`)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2.5 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                        disabled={fields.length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50 flex gap-3 italic">
               <AlertCircle size={18} className="text-blue-600 flex-shrink-0" />
               <p className="text-[11px] text-blue-700 font-medium">
                 A emissão gera o documento, mas a reserva de estoque só é oficializada após o processamento da "Baixa de Ativos".
               </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" className="px-6 rounded-xl" onClick={() => { reset(); setCreateOpen(false); }}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="px-10 premium-gradient rounded-xl shadow-lg" loading={createNF.isPending}>
              Registrar Documento
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── Modal: Baixar NF ────────────────────────────────────────────────── */}
      {selectedNf && (
        <Modal
          open={baixaOpen}
          onClose={() => { setBaixaOpen(false); setSelectedNf(null); }}
          title={`Processamento de Baixa — NF ${selectedNf.numero}`}
          width="max-w-xl"
        >
          <ModalBody className="flex flex-col gap-6">
            <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100/50 flex gap-3">
               <InfoBanner type="warning">
                 Verifique fisicamente a saída dos itens antes de confirmar. Esta ação é irreversível e atualizará o estoque em tempo real.
               </InfoBanner>
            </div>

            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
              {selectedNf.items.map((item: any) => {
                const pendente = item.quantidade - item.quantidadeBaixada;
                const isFullyBaixado = pendente <= 0;
                const stockAtual = products.find((p: any) => p.id === item.productId)?.quantidade ?? item.product.quantidade;
                const qtdBaixar = baixaItems[item.id] ?? 0;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group p-4 rounded-3xl border-2 transition-all",
                      isFullyBaixado ? 'bg-green-50 border-green-100 opacity-60' : 'bg-white border-slate-100 hover:border-blue-200'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                             <div className={cn("w-2 h-2 rounded-full", isFullyBaixado ? "bg-green-500" : "bg-amber-500")} />
                             <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{item.product.nome}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono-custom">
                          [{item.product.codigo}] • Stock: {stockAtual} | Pendente: <span className="text-blue-600">{pendente}</span>
                        </p>
                      </div>
                      
                      {!isFullyBaixado && (
                        <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                <input
                                  type="number"
                                  min={0}
                                  max={Math.min(pendente, stockAtual)}
                                  value={qtdBaixar}
                                  onChange={(e) =>
                                    setBaixaItems((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                                  }
                                  className="w-16 bg-transparent text-center font-black text-blue-600 outline-none"
                                />
                                <button
                                  type="button"
                                  className="px-2 py-0.5 bg-blue-600 text-[10px] font-black text-white rounded-lg hover:bg-slate-900 transition-colors"
                                  onClick={() =>
                                    setBaixaItems((prev) => ({
                                      ...prev,
                                      [item.id]: Math.min(pendente, stockAtual),
                                    }))
                                  }
                                >
                                  MAX
                                </button>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400">Total NF: {item.quantidade} un</p>
                        </div>
                      )}
                      
                      {isFullyBaixado && (
                         <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase">
                            <CheckCircle size={14} /> Concluído
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" className="px-6 rounded-xl" onClick={() => { setBaixaOpen(false); setSelectedNf(null); }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="px-10 premium-gradient rounded-xl shadow-lg"
              loading={baixarNF.isPending}
              onClick={handleBaixar}
              disabled={Object.values(baixaItems).every((v) => v === 0)}
            >
              Confirmar Processamento
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </DashboardLayout>
  );
}
