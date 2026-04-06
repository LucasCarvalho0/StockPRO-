'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card, CardHeader, CardTitle, Badge, Button,
  Modal, ModalBody, ModalFooter, Input,
} from '@/components/ui';
import { useClientes } from '@/hooks';
import { clientesService } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2 } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  contato: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; cliente?: any }>({ open: false });
  const { data: clientes = [], isLoading } = useClientes();
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const sorted = [...clientes].sort((a, b) => a.nome.localeCompare(b.nome));

  const filtered = sorted.filter((c: any) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.cnpj && c.cnpj.includes(search)),
  );

  const onSubmit = async (data: Form) => {
    try {
      if (modal.cliente) {
        await clientesService.update(modal.cliente.id, data);
      } else {
        await clientesService.create(data);
      }
      qc.invalidateQueries({ queryKey: ['clientes'] });
      reset();
      setModal({ open: false });
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erro ao salvar cliente');
    }
  };

  const openEdit = (c: any) => {
    reset({ nome: c.nome, cnpj: c.cnpj ?? '', email: c.email ?? '', telefone: c.telefone ?? '', contato: c.contato ?? '' });
    setModal({ open: true, cliente: c });
  };

  const openCreate = () => {
    reset({ nome: '', cnpj: '', email: '', telefone: '', contato: '' });
    setModal({ open: true });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Clientes</h1>
            <p className="text-slate-500 mt-1">Produtos vinculados e histórico de parceiros corporativos</p>
          </div>
          <Button variant="primary" onClick={openCreate} className="h-11 px-6 premium-gradient shadow-lg shadow-indigo-200">
            <Plus size={18} className="mr-2" /> Novo Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1 h-fit sticky top-8">
            <CardHeader className="border-b border-slate-100/50 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Filtrar</CardTitle>
            </CardHeader>
            <div className="p-5 space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Nome ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Resultados</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{filtered.length}</p>
              </div>
            </div>
          </Card>

          <div className="md:col-span-3 space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                  <Building2 size={32} />
                </div>
                <p className="text-[16px] font-bold text-slate-900">Nenhum cliente encontrado</p>
                <p className="text-sm text-slate-400 mt-1">Tente ajustar sua busca ou cadastrar um novo cliente</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filtered.map((c: any) => (
                  <div key={c.id} className="group bg-white border border-slate-200/60 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl premium-gradient flex items-center justify-center text-white font-bold text-lg shadow-inner">
                          {c.nome.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.nome}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono-custom">{c.cnpj || 'SEM CNPJ'}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-xs text-slate-500">{c.contato || 'Contato ñ informado'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 md:border-l border-slate-100 md:pl-8">
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Produtos</p>
                          <p className="text-lg font-bold text-slate-800">{c._count?.products ?? 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Notas Fiscais</p>
                          <p className="text-lg font-bold text-slate-800">{c._count?.nfs ?? 0}</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(c)} className="rounded-xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200">
                          Editar
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-6 text-xs text-slate-400">
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="hover:text-blue-600 cursor-default">{c.email}</span>
                        </div>
                      )}
                      {c.telephone && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="font-mono-custom">{c.telefone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={modal.open}
        onClose={() => { reset(); setModal({ open: false }); }}
        title={modal.cliente ? 'Editar Cliente' : 'Novo Cliente'}
        width="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-4">
            <Input label="Nome / Razão Social" placeholder="Ex: NISSAN" error={errors.nome?.message} {...register('nome')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="CNPJ" placeholder="00.000.000/0001-00" {...register('cnpj')} />
              <Input label="Telefone" placeholder="(41) 9999-9999" {...register('telefone')} />
            </div>
            <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Nome do Contato" placeholder="Nome do responsável" {...register('contato')} />
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => { reset(); setModal({ open: false }); }}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {modal.cliente ? 'Salvar' : 'Cadastrar'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
