'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card, CardHeader, CardTitle, Badge, Button, PageLoading,
  Modal, ModalBody, ModalFooter, Input, Textarea,
} from '@/components/ui';
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from '@/hooks';
import type { Supplier } from '@/types';
import { Search, Plus, Truck, Building2, Phone, Mail, Globe, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  contato: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function FornecedoresPage() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; supplier?: Supplier }>({ open: false });
  const { data: suppliers = [], isLoading } = useSuppliers(search);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const isEdit = !!modal.supplier;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const openEdit = (s: Supplier) => {
    reset({
      nome: s.nome,
      contato: s.contato ?? '',
      telefone: s.telefone ?? '',
      email: s.email ?? '',
      endereco: (s as any).endereco ?? '',
    });
    setModal({ open: true, supplier: s });
  };

  const openCreate = () => {
    reset({ nome: '', contato: '', telefone: '', email: '', endereco: '' });
    setModal({ open: true });
  };

  const onSubmit = async (data: Form) => {
    try {
      if (isEdit) await updateSupplier.mutateAsync({ id: modal.supplier!.id, data });
      else await createSupplier.mutateAsync(data);
      setModal({ open: false });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar fornecedor');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 p-1 md:p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Gestão de <span className="text-blue-600">Fornecedores</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-lg">
              Centralize sua cadeia de suprimentos. Mantenha contatos atualizados e monitore parceiros logísticos.
            </p>
          </div>
          <Button variant="primary" onClick={openCreate} className="h-12 px-8 premium-gradient shadow-xl shadow-blue-200 group">
            <Plus size={20} className="mr-2 group-hover:rotate-180 transition-transform duration-500" /> 
            <span className="font-bold">Novo Fornecedor</span>
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="glass p-5 rounded-3xl border border-white/40 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px] group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
              placeholder="Buscar por nome, e-mail ou contato..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="h-10 w-[1px] bg-slate-200 hidden lg:block mx-1" />
          <Badge variant="blue" className="h-10 px-4 rounded-xl flex items-center gap-2 border-blue-100/50">
            <Truck size={14} />
            <span className="font-bold">{suppliers.length} Parceiros</span>
          </Badge>
        </div>

        {/* content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/30 rounded-3xl animate-pulse border border-white/50 shadow-sm" />)}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-24 text-center glass rounded-[3rem] border border-dashed border-slate-300/60 max-w-3xl mx-auto w-full">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Cadeia Vazia</h3>
            <p className="text-slate-500 mt-2">Nenhum fornecedor registrado no sistema.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((s) => (
              <div key={s.id} className="group bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 relative overflow-hidden">
                {/* Decorative Icon */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Building2 size={32} className="text-slate-100 group-hover:text-blue-50 transition-colors" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{s.nome}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">FORNECEDOR HOMOLOGADO</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                         <Mail size={18} />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">E-mail corporativo</p>
                         <p className="text-sm font-bold text-slate-700 truncate">{s.email || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                         <Phone size={18} />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Contato direto</p>
                         <p className="text-sm font-bold text-slate-700">{s.telefone || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">S</div>
                       <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">P</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEdit(s)}
                        className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-slate-200"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal Section ────────────────────────────────────────────────── */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={isEdit ? 'Atualizar Fornecedor' : 'Novo Cadastro de Parceiro'} width="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-5">
            <Input label="Nome da Empresa / Razão Social" placeholder="Ex: Logística Brasil S.A." error={errors.nome?.message} {...register('nome')} />
            
            <div className="grid grid-cols-2 gap-4">
               <Input label="Nome do Contato" placeholder="Nome do representante" {...register('contato')} />
               <Input label="Telefone / WhatsApp" placeholder="(00) 00000-0000" {...register('telefone')} />
            </div>
            
            <Input label="E-mail de Contato" type="email" placeholder="contato@empresa.com" error={errors.email?.message} {...register('email')} />
            <Textarea label="Endereço Completo (opcional)" rows={3} placeholder="Rua, Número, Bairro, Cidade - UF" {...register('endereco')} />
            
            <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50 flex gap-3 italic">
               <Globe size={18} className="text-blue-600 flex-shrink-0" />
               <p className="text-[11px] text-blue-700 font-medium">
                 Este parceiro ficará disponível para vínculo em novas entradas de estoque e notas fiscais.
               </p>
            </div>
          </ModalBody>
          <ModalFooter className="bg-slate-50/50 p-6 rounded-b-[2rem]">
            <Button type="button" variant="secondary" className="px-6 rounded-xl" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={createSupplier.isPending || updateSupplier.isPending} className="px-10 premium-gradient rounded-xl shadow-lg">
              {isEdit ? 'Salvar Alterações' : 'Finalizar Cadastro'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
