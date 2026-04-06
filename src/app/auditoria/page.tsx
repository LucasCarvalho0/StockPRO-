'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, Badge, PageHeader, PageLoading } from '@/components/ui';
import { useLogs } from '@/hooks';
import { formatDateTime } from '@/lib/utils';

const actionColors: Record<string, 'green' | 'red' | 'blue' | 'amber' | 'gray'> = {
  LOGIN: 'gray', LOGOUT: 'gray',
  ENTRADA_REGISTRADA: 'green', PRODUTO_CRIADO: 'green', FORNECEDOR_CRIADO: 'green', USUARIO_CRIADO: 'blue',
  SAIDA_REGISTRADA: 'red',
  INVENTARIO_INICIADO: 'blue', INVENTARIO_FINALIZADO: 'blue',
  ALERTA_GERADO: 'amber',
  PRODUTO_EDITADO: 'gray', USUARIO_EDITADO: 'gray', FORNECEDOR_EDITADO: 'gray',
};

const actionOptions = [
  { value: '', label: 'Todas as ações' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'ENTRADA_REGISTRADA', label: 'Entradas' },
  { value: 'SAIDA_REGISTRADA', label: 'Saídas' },
  { value: 'INVENTARIO_INICIADO', label: 'Inventário Iniciado' },
  { value: 'INVENTARIO_FINALIZADO', label: 'Inventário Finalizado' },
  { value: 'ALERTA_GERADO', label: 'Alertas Gerados' },
  { value: 'PRODUTO_CRIADO', label: 'Produto Criado' },
  { value: 'PRODUTO_EDITADO', label: 'Produto Editado' },
  { value: 'USUARIO_CRIADO', label: 'Usuário Criado' },
  { value: 'FORNECEDOR_CRIADO', label: 'Fornecedor Criado' },
];

export default function AuditoriaPage() {
  const [actionFilter, setActionFilter] = useState('');
  const { data: logs = [], isLoading } = useLogs({ action: actionFilter || undefined });

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col gap-5">
        <PageHeader
          title="Auditoria e Logs"
          subtitle="Rastreabilidade total de ações do sistema"
          actions={<Badge variant="gray">Registros imutáveis</Badge>}
        />

        <Card>
          <CardHeader>
            <select
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-400 text-slate-600"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {actionOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Badge variant="blue">{logs.length} registros</Badge>
          </CardHeader>

          {isLoading ? (
            <PageLoading />
          ) : (
            <div className="divide-y divide-slate-50">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-[11px] text-slate-400 flex-shrink-0 w-32 pt-0.5 font-mono-custom">
                    {formatDateTime(log.createdAt)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-600">
                      {log.user && (
                        <strong className="text-slate-800 font-medium">{log.user.nome}</strong>
                      )}{' '}
                      {log.descricao}
                    </p>
                    {log.ipAddress && (
                      <p className="text-[10px] text-slate-300 mt-0.5 font-mono-custom">IP: {log.ipAddress}</p>
                    )}
                  </div>
                  <Badge variant={actionColors[log.action] ?? 'gray'} className="flex-shrink-0">
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="py-12 text-center text-[13px] text-slate-400">Nenhum log encontrado</div>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
