'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card, CardHeader, CardTitle, Badge, Button, PageLoading,
  Modal, ModalBody, ModalFooter, Input, Select, Textarea,
} from '@/components/ui';
import { useProducts, useClientes, useSuppliers, useCreateProduct, useUpdateProduct } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { Search, Plus, BoxesIcon, Filter, Layers, MoreHorizontal } from 'lucide-react';

const schema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  modelo: z.string().optional(),
  descricao: z.string().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  quantidade: z.coerce.number().min(0, 'Mínimo 0'),
  quantidadeMinima: z.coerce.number().min(0, 'Mínimo 0'),
  clienteId: z.string().optional(),
  supplierId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function ProdutosPage() {
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; product?: Product }>({ open: false });
  const { data: products = [], isLoading } = useProducts(search);
  const { data: clientes = [] } = useClientes();
  const { data: suppliers = [] } = useSuppliers();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const isEdit = !!modal.product;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const filtered = products.filter((p) =>
    !clienteFilter || (p as any).clienteId === clienteFilter,
  );

  const openEdit = (p: Product) => {
    reset({
      codigo: p.codigo, nome: p.nome, modelo: (p as any).modelo ?? '-',
      descricao: p.descricao ?? '', unidade: p.unidade,
      quantidade: p.quantidade, quantidadeMinima: p.quantidadeMinima,
      clienteId: p.clienteId ?? '', supplierId: p.supplierId ?? '',
    });
    setModal({ open: true, product: p });
  };

  const openCreate = () => {
    reset({ codigo: '', nome: '', modelo: '-', descricao: '', unidade: 'un', quantidade: 0, quantidadeMinima: 0, clienteId: '', supplierId: '' });
    setModal({ open: true });
  };

  const onSubmit = async (data: Form) => {
    try {
      if (isEdit) await updateProduct.mutateAsync({ id: modal.product!.id, data });
      else await createProduct.mutateAsync(data);
      setModal({ open: false });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar produto');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 p-1 md:p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Catálogo de <span className="text-indigo-600">Produtos</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-lg">
              Gerencie seus ativos com precisão cirúrgica. Monitore níveis de estoque e automatize reposições.
            </p>
          </div>
          <Button variant="primary" onClick={openCreate} className="h-12 px-8 premium-gradient shadow-xl shadow-indigo-200 group">
            <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" /> 
            <span className="font-bold">Novo Produto</span>
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="glass p-5 rounded-3xl border border-white/40 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px] group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium" 
              placeholder="Buscar por código ou nome..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl group focus-within:border-indigo-500 transition-all">
              <Filter size={16} className="text-slate-400" />
              <select 
                className="bg-transparent outline-none text-sm text-slate-600 font-bold min-w-[180px] cursor-pointer" 
                value={clienteFilter} 
                onChange={(e) => setClienteFilter(e.target.value)}
              >
                <option value="">Todos os Clientes</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            
            <div className="h-10 w-[1px] bg-slate-200 hidden lg:block mx-2" />
            
            <div className="flex items-center gap-2">
              <Badge variant="blue" className="h-10 px-4 rounded-xl flex items-center gap-2 border-blue-100/50">
                <Layers size={14} />
                <span className="font-bold">{filtered.length} Ativos</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-64 bg-white/30 rounded-3xl animate-pulse border border-white/50 shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => {
              const status = p.quantidade === 0 ? 'critico' : p.quantidade <= p.quantidadeMinima ? 'alerta' : 'ok';
              return (
                <div key={p.id} className="group bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-indigo-500/15 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                  {/* Decorative background circle */}
                  <div className={cn(
                    "absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity",
                    status === 'critico' ? 'bg-rose-600' : status === 'alerta' ? 'bg-amber-600' : 'bg-emerald-600'
                  )} />

                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase font-mono-custom opacity-70">
                        {p.codigo}
                      </p>
                      <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-tight">
                        {p.nome}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                        Modelo: <span className="text-slate-800">{(p as any).modelo || '-'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <div className={cn(
                      'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 flex items-center gap-1.5',
                      status === 'critico' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      status === 'alerta' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-green-50 text-green-600 border-green-100'
                    )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        status === 'critico' ? 'bg-rose-600' : status === 'alerta' ? 'bg-amber-600' : 'bg-green-600'
                      )} />
                      {status === 'critico' ? 'Esgotado' : status === 'alerta' ? 'Reposição' : 'Disponível'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto mb-6">
                    <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 transition-colors group-hover:bg-white">
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter mb-1">Qtd Atual</p>
                      <p className={cn(
                        "text-2xl font-black font-mono-custom",
                        status === 'critico' ? 'text-rose-600' : status === 'alerta' ? 'text-amber-600' : 'text-slate-900'
                      )}>
                        {p.quantidade}<span className="text-[11px] font-bold text-slate-400 ml-1 uppercase">{p.unidade}</span>
                      </p>
                    </div>
                    <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 transition-colors group-hover:bg-white">
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter mb-1">Mínimo</p>
                      <p className="text-2xl font-black text-slate-700 font-mono-custom">
                        {p.quantidadeMinima}<span className="text-[11px] font-bold text-slate-400 ml-1 uppercase">{p.unidade}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div className="flex-1 min-w-0">
                       {(p as any).cliente ? (
                         <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                               {(p as any).cliente.nome.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-600 truncate">{(p as any).cliente.nome}</span>
                         </div>
                       ) : (
                         <span className="text-[10px] font-bold text-slate-300 uppercase">Sem Vínculo</span>
                       )}
                    </div>
                    <button 
                      onClick={() => openEdit(p)} 
                      className="p-2.5 rounded-2xl bg-slate-900 text-white hover:bg-indigo-600 transition-all duration-300 shadow-lg shadow-slate-200"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className="py-24 text-center glass rounded-[3rem] border border-dashed border-slate-300/60 max-w-3xl mx-auto w-full">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BoxesIcon size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Resultado não encontrado</h3>
            <p className="text-slate-500 mt-2">Tente ajustar seus filtros para encontrar o que procura.</p>
          </div>
        )}
      </div>

      {/* ─── Modal Section ────────────────────────────────────────────────── */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={isEdit ? 'Editar Ativo' : 'Novo Ativo'} width="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-5 p-2">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Código Único" placeholder="EX: PRD-001" error={errors.codigo?.message} {...register('codigo')} disabled={isEdit} />
              <Input label="Unidade de Medida" placeholder="un, kg, lt..." error={errors.unidade?.message} {...register('unidade')} />
            </div>
            <Input label="Nome Descritivo" placeholder="Nome comercial do produto" error={errors.nome?.message} {...register('nome')} />
            <Input label="Modelo / Referência" placeholder="Ex: Kicks, Frontier, Componente X" {...register('modelo')} />
            <Textarea label="Descrição Detalhada (opcional)" rows={3} placeholder="Notas técnicas ou observações..." {...register('descricao')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Qtd em Estoque" type="number" min={0} {...register('quantidade')} />
              <Input label="Estoque de Segurança (Mínimo)" type="number" min={0} {...register('quantidadeMinima')} />
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="h-[1px] bg-slate-100" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Vínculos & Origem</p>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Proprietário / Cliente" {...register('clienteId')}>
                  <option value="">Sem vínculo específico</option>
                  {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
                <Select label="Fornecedor Principal" {...register('supplierId')}>
                  <option value="">Selecione o Fornecedor</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="bg-slate-50/50 p-6 rounded-b-[2rem]">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false })} className="px-6 rounded-xl">Cancelar</Button>
            <Button type="submit" variant="primary" loading={createProduct.isPending || updateProduct.isPending} className="px-8 premium-gradient rounded-xl shadow-lg">
              {isEdit ? 'Atualizar Dados' : 'Cadastrar Ativo'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

