import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productsService, suppliersService, movementsService,
  alertsService, inventoryService, logsService, usersService,
  clientesService, nfService,
} from '@/services';

// Products
export const useProducts = (search?: string) =>
  useQuery({ queryKey: ['products', search], queryFn: () => productsService.findAll(search) });
export const useProduct = (id: string) =>
  useQuery({ queryKey: ['product', id], queryFn: () => productsService.findOne(id), enabled: !!id });
export const useProductStats = () =>
  useQuery({ queryKey: ['products-stats'], queryFn: productsService.getStats });
export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: productsService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }) });
};
export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

// Suppliers
export const useSuppliers = () =>
  useQuery({ queryKey: ['suppliers'], queryFn: suppliersService.findAll });
export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: suppliersService.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }) });
};

// Movements
export const useMovements = (params?: any) =>
  useQuery({ queryKey: ['movements', params], queryFn: () => movementsService.findAll(params) });
export const useResumoHoje = () =>
  useQuery({ queryKey: ['resumo-hoje'], queryFn: movementsService.getResumoHoje, refetchInterval: 30000 });
export const useCreateMovement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: movementsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['products-stats'] });
      qc.invalidateQueries({ queryKey: ['resumo-hoje'] });
    },
  });
};

// Alerts
export const useAlerts = (status?: string) =>
  useQuery({ queryKey: ['alerts', status], queryFn: () => alertsService.findAll(status), refetchInterval: 60000 });
export const useAlertsResumo = () =>
  useQuery({ queryKey: ['alerts-resumo'], queryFn: alertsService.getResumo, refetchInterval: 60000 });

// Inventory
export const useInventoryAtivo = () =>
  useQuery({ queryKey: ['inventory-ativo'], queryFn: inventoryService.getAtivo, refetchInterval: 15000 });
export const useInventoryHistorico = () =>
  useQuery({ queryKey: ['inventory-historico'], queryFn: inventoryService.getHistorico });
export const useInventory = (id: string) =>
  useQuery({ queryKey: ['inventory', id], queryFn: () => inventoryService.findOne(id), enabled: !!id });
export const useIniciarInventario = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: inventoryService.iniciar, onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }) });
};
export const useFinalizarInventario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: any[] }) => inventoryService.finalizar(id, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
};
export const useAtualizarItemInventario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, itemId, data }: { inventoryId: string; itemId: string; data: any }) =>
      inventoryService.atualizarItem(inventoryId, itemId, data),
    
    // --- OPTIMISTIC UPDATE ---
    onMutate: async ({ inventoryId, itemId, data }) => {
      await qc.cancelQueries({ queryKey: ['inventory-ativo'] });
      const previous = qc.getQueryData<any>(['inventory-ativo']);

      qc.setQueryData(['inventory-ativo'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item: any) => 
            item.id === itemId 
              ? { 
                  ...item, 
                  conferido: data.quantidadeContada > 0 || data.conferido === true,
                  quantidadeContada: data.quantidadeContada 
                } 
              : item
          )
        };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) qc.setQueryData(['inventory-ativo'], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['inventory-ativo'] });
    }
  });
};

// Logs
export const useLogs = (params?: any) =>
  useQuery({ queryKey: ['logs', params], queryFn: () => logsService.findAll(params) });

// Users
export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: usersService.findAll });

// Clientes
export const useClientes = () =>
  useQuery({ queryKey: ['clientes'], queryFn: clientesService.findAll });

// NF
export const useNFs = (params?: { clienteId?: string; status?: string }) =>
  useQuery({ queryKey: ['nfs', params], queryFn: () => nfService.findAll(params) });
export const useNF = (id: string) =>
  useQuery({ queryKey: ['nf', id], queryFn: () => nfService.findOne(id), enabled: !!id });
export const useCreateNF = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nfService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nfs'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
export const useBaixarNF = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items?: any[] }) => nfService.baixar(id, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nfs'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['alerts-resumo'] });
      qc.invalidateQueries({ queryKey: ['products-stats'] });
      qc.invalidateQueries({ queryKey: ['resumo-hoje'] });
    },
  });
};
