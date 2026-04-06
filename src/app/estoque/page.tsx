'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, Button, PageHeader, QtyBar, PageLoading } from '@/components/ui';
import { MovementModal, ProductModal } from '@/components/modals';
import { useProducts, useClientes } from '@/hooks';
import type { Product, MovementType } from '@/types';
import { Search, Plus } from 'lucide-react';

export default function EstoquePage() {
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [movModal, setMovModal] = useState<{ open: boolean; type: MovementType; productId?: string }>({ open: false, type: 'ENTRADA' });
  const [prodModal, setProdModal] = useState<{ open: boolean; product?: Product }>({ open: false });

  const { data: products = [], isLoading } = useProducts(search);
  const { data: clientes = [] } = useClientes();

  const filtered = products.filter((p) => {
    if (clienteFilter && p.clienteId !== clienteFilter) return false;
    if (!statusFilter) return true;
    if (statusFilter === 'critical') return p.quantidade <= p.quantidadeMinima;
    if (statusFilter === 'alert') return p.quantidade <= p.quantidadeMinima * 1.5 && p.quantidade > p.quantidadeMinima;
    return p.quantidade > p.quantidadeMinima * 1.5;
  });

  const getStatusBadge = (p: Product) => {
    if (p.quantidade === 0) return <Badge variant="red">Zerado</Badge>;
    if (p.quantidadeMinima > 0 && p.quantidade <= p.quantidadeMinima) return <Badge variant="red">Crítico</Badge>;
    if (p.quantidadeMinima > 0 && p.quantidade <= p.quantidadeMinima * 1.5) return <Badge variant="amber">Atenção</Badge>;
    return <Badge variant="green">Normal</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col gap-5">
        <PageHeader
          title="Controle de Estoque"
          subtitle={`${filtered.length} produtos · Base VPC`}
          actions={
            <>
              <Button variant="success" onClick={() => setMovModal({ open: true, type: 'ENTRADA' })}>
                <Plus size={14} /> Entrada (NF)
              </Button>
              <Button variant="danger" onClick={() => setMovModal({ open: true, type: 'SAIDA' })}>
                − Saída
              </Button>
              <Button variant="primary" onClick={() => setProdModal({ open: true })}>
                <Plus size={14} /> Novo Produto
              </Button>
            </>
          }
        />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-700 w-44"
                  placeholder="Código ou produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-600 w-44"
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
              >
                <option value="">Todos os clientes</option>
                {clientes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <select
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="ok">Normal</option>
                <option value="alert">Atenção</option>
                <option value="critical">Crítico / Zerado</option>
              </select>
            </div>
            <Badge variant="gray">{filtered.length} itens</Badge>
          </CardHeader>

          {isLoading ? (
            <PageLoading />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Código', 'Produto', 'Modelo', 'Cliente', 'Quantidade', 'Mín.', 'Status', 'Ações'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono-custom whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-[11px] text-slate-400 font-mono-custom whitespace-nowrap">{p.codigo}</td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-800">{p.nome}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-500">{(p as any).modelo || '-'}</td>
                      <td className="px-4 py-3">
                        {(p as any).cliente && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-mono-custom bg-blue-50 text-blue-700 border border-blue-100">
                            {(p as any).cliente.nome}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 w-36">
                        <QtyBar value={p.quantidade} min={p.quantidadeMinima} max={Math.max(p.quantidade, p.quantidadeMinima || 1) * 2} />
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-400 font-mono-custom">{p.quantidadeMinima}</td>
                      <td className="px-4 py-3">{getStatusBadge(p)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="success" onClick={() => setMovModal({ open: true, type: 'ENTRADA', productId: p.id })}>+</Button>
                          <Button size="sm" variant="danger" onClick={() => setMovModal({ open: true, type: 'SAIDA', productId: p.id })}>−</Button>
                          <Button size="sm" variant="secondary" onClick={() => setProdModal({ open: true, product: p })}>Ed.</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-[13px] text-slate-400">Nenhum produto encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <MovementModal
        open={movModal.open}
        onClose={() => setMovModal({ open: false, type: 'ENTRADA' })}
        type={movModal.type}
        preSelectedProductId={movModal.productId}
      />
      <ProductModal
        open={prodModal.open}
        onClose={() => setProdModal({ open: false })}
        product={prodModal.product}
      />
    </DashboardLayout>
  );
}
