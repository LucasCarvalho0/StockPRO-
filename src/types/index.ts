export type UserRole = 'ESTOQUISTA' | 'LIDER' | 'ADMINISTRADOR';
export type MovementType = 'ENTRADA' | 'SAIDA';
export type AlertStatus = 'ATIVO' | 'RESOLVIDO';
export type AlertType = 'ESTOQUE_BAIXO' | 'DIVERGENCIA_INVENTARIO';
export type InventoryStatus = 'EM_ANDAMENTO' | 'CONCLUIDO';

export interface User {
  id: string; matricula: string; nome: string; email: string;
  role: UserRole; ativo: boolean; createdAt: string; updatedAt: string;
}

export interface Supplier {
  id: string; nome: string; cnpj?: string; email?: string;
  telefone?: string; contato?: string; ativo: boolean;
  _count?: { products: number };
}

export interface Product {
  id: string; codigo: string; nome: string; modelo?: string; descricao?: string;
  unidade: string; quantidade: number; quantidadeMinima: number;
  supplierId?: string; supplier?: { id: string; nome: string };
  clienteId?: string; cliente?: { id: string; nome: string };
  ativo: boolean; alerts?: Alert[]; createdAt: string; updatedAt: string;
}

export interface Movement {
  id: string; type: MovementType; quantidade: number;
  notaFiscal?: string; observacao?: string;
  productId: string; product: { id: string; codigo: string; nome: string; unidade: string };
  userId: string; user: { id: string; nome: string; matricula: string };
  createdAt: string;
}

export interface Alert {
  id: string; tipo: AlertType; productId: string;
  product: { id: string; codigo: string; nome: string; modelo?: string; unidade: string; supplier?: { nome: string } };
  quantidadeAtual: number; quantidadeMinima: number;
  status: AlertStatus; resolvidoEm?: string; createdAt: string;
}

export interface InventoryItem {
  id: string; inventoryId: string; productId: string;
  product: { id: string; codigo: string; nome: string; unidade: string };
  quantidadeContada: number; quantidadeSistema: number;
  divergencia: number; conferido: boolean; observacao?: string;
}

export interface Inventory {
  id: string; responsavel: string; matricula: string;
  status: InventoryStatus; userId: string;
  user?: { nome: string; matricula: string };
  iniciadoEm: string; finalizadoEm?: string;
  items: InventoryItem[];
  _count?: { items: number };
}

export interface Log {
  id: string; action: string; descricao: string;
  entidade?: string; entidadeId?: string; ipAddress?: string;
  userId?: string; user?: { nome: string; matricula: string }; createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: Pick<User, 'id' | 'nome' | 'matricula' | 'email' | 'role'>;
}

export interface Cliente {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  contato?: string;
  ativo: boolean;
  _count?: { products: number; nfs: number };
}

export type NfStatus = 'ABERTA' | 'BAIXADA' | 'PARCIAL';

export interface NfItem {
  id: string;
  nfId: string;
  productId: string;
  product: Pick<Product, 'id' | 'codigo' | 'nome' | 'modelo' | 'unidade' | 'quantidade'>;
  quantidade: number;
  quantidadeBaixada: number;
  observacao?: string;
}

export interface NotaFiscalCliente {
  id: string;
  numero: string;
  clienteId: string;
  cliente: Pick<Cliente, 'id' | 'nome'>;
  userId: string;
  user: Pick<User, 'id' | 'nome' | 'matricula'>;
  status: NfStatus;
  observacao?: string;
  dataEmissao: string;
  dataBaixa?: string;
  createdAt: string;
  items: NfItem[];
}
