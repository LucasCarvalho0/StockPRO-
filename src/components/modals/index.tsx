'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalBody, ModalFooter, Button, Input, Select, Textarea, InfoBanner } from '@/components/ui';
import { useCreateMovement, useProducts, useCreateProduct, useUpdateProduct, useSuppliers, useIniciarInventario, useCreateSupplier } from '@/hooks';
import { suppliersService, usersService } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
import type { Product, MovementType, Supplier } from '@/types';

// ─── Movement Modal ────────────────────────────────────────────────────────────
const movSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  quantidade: z.coerce.number().min(1, 'Mínimo 1'),
  notaFiscal: z.string().optional(),
  observacao: z.string().optional(),
});
type MovForm = z.infer<typeof movSchema>;

export function MovementModal({ open, onClose, type, preSelectedProductId }: { open: boolean; onClose: () => void; type: MovementType; preSelectedProductId?: string }) {
  const { data: products = [] } = useProducts();
  const createMovement = useCreateMovement();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MovForm>({ resolver: zodResolver(movSchema), defaultValues: { productId: preSelectedProductId ?? '' } });

  const onSubmit = async (data: MovForm) => {
    try { await createMovement.mutateAsync({ ...data, type }); reset(); onClose(); }
    catch (err: any) { alert(err?.response?.data?.message ?? 'Erro ao registrar movimentação'); }
  };

  return (
    <Modal open={open} onClose={onClose} title={type === 'ENTRADA' ? 'Registrar Entrada (NF)' : 'Registrar Saída'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <Select label="Produto" error={errors.productId?.message} {...register('productId')}>
            <option value="">Selecione...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.codigo} — {p.nome} (Estoque: {p.quantidade} {p.unidade})</option>)}
          </Select>
          <Input label="Quantidade" type="number" min={1} error={errors.quantidade?.message} {...register('quantidade')} />
          {type === 'ENTRADA' && <Input label="Nota Fiscal" placeholder="NF-XXXXX" {...register('notaFiscal')} />}
          <Textarea label="Observações (opcional)" rows={2} {...register('observacao')} />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={createMovement.isPending}>Confirmar {type === 'ENTRADA' ? 'Entrada' : 'Saída'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Product Modal ─────────────────────────────────────────────────────────────
const prodSchema = z.object({
  codigo: z.string().min(1), nome: z.string().min(1), descricao: z.string().optional(),
  unidade: z.string().min(1), quantidade: z.coerce.number().min(0),
  quantidadeMinima: z.coerce.number().min(0), supplierId: z.string().min(1, 'Selecione fornecedor'),
});
type ProdForm = z.infer<typeof prodSchema>;

export function ProductModal({ open, onClose, product }: { open: boolean; onClose: () => void; product?: Product }) {
  const { data: suppliers = [] } = useSuppliers();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = !!product;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProdForm>({ resolver: zodResolver(prodSchema) });

  useEffect(() => {
    if (product) reset({ codigo: product.codigo, nome: product.nome, descricao: product.descricao ?? '', unidade: product.unidade, quantidade: product.quantidade, quantidadeMinima: product.quantidadeMinima, supplierId: product.supplierId });
    else reset({ codigo: '', nome: '', descricao: '', unidade: 'un', quantidade: 0, quantidadeMinima: 0, supplierId: '' });
  }, [product, open]);

  const onSubmit = async (data: ProdForm) => {
    try {
      if (isEdit) await updateProduct.mutateAsync({ id: product!.id, data });
      else await createProduct.mutateAsync(data);
      onClose();
    } catch (err: any) { alert(err?.response?.data?.message ?? 'Erro ao salvar'); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Produto' : 'Novo Produto'} width="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código" placeholder="EST-001" error={errors.codigo?.message} {...register('codigo')} disabled={isEdit} />
            <Input label="Unidade" placeholder="un / kg / l" error={errors.unidade?.message} {...register('unidade')} />
          </div>
          <Input label="Nome do Produto" error={errors.nome?.message} {...register('nome')} />
          <Textarea label="Descrição (opcional)" rows={2} {...register('descricao')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantidade" type="number" min={0} error={errors.quantidade?.message} {...register('quantidade')} />
            <Input label="Qtd Mínima" type="number" min={0} error={errors.quantidadeMinima?.message} {...register('quantidadeMinima')} />
          </div>
          <Select label="Fornecedor" error={errors.supplierId?.message} {...register('supplierId')}>
            <option value="">Selecione...</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={createProduct.isPending || updateProduct.isPending}>{isEdit ? 'Salvar' : 'Cadastrar'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Inventario Modal ──────────────────────────────────────────────────────────
const invSchema = z.object({ responsavel: z.string().min(2), matricula: z.string().min(1) });
type InvForm = z.infer<typeof invSchema>;

export function InventarioModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const iniciar = useIniciarInventario();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvForm>({ resolver: zodResolver(invSchema) });

  const onSubmit = async (data: InvForm) => {
    try { await iniciar.mutateAsync(data); reset(); onSuccess(); }
    catch (err: any) { alert(err?.response?.data?.message ?? 'Erro ao iniciar inventário'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Iniciar Inventário Semanal">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <InfoBanner type="info">Apenas um inventário pode estar ativo por vez. O registro é permanente e imutável.</InfoBanner>
          <Input label="Nome do Responsável" placeholder="Nome completo" error={errors.responsavel?.message} {...register('responsavel')} />
          <Input label="Matrícula" placeholder="Ex: 4821" error={errors.matricula?.message} {...register('matricula')} />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={iniciar.isPending}>Iniciar Inventário</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Supplier Modal ────────────────────────────────────────────────────────────
const supSchema = z.object({
  nome: z.string().min(1), cnpj: z.string().optional(),
  email: z.string().email('Inválido').optional().or(z.literal('')),
  telefone: z.string().optional(), contato: z.string().optional(),
});
type SupForm = z.infer<typeof supSchema>;

export function SupplierModal({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier?: Supplier }) {
  const qc = useQueryClient();
  const createSupplier = useCreateSupplier();
  const isEdit = !!supplier;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupForm>({ resolver: zodResolver(supSchema) });

  useEffect(() => {
    if (supplier) reset({ nome: supplier.nome, cnpj: supplier.cnpj ?? '', email: supplier.email ?? '', telefone: supplier.telefone ?? '', contato: supplier.contato ?? '' });
    else reset({ nome: '', cnpj: '', email: '', telefone: '', contato: '' });
  }, [supplier, open]);

  const onSubmit = async (data: SupForm) => {
    try {
      if (isEdit) { await suppliersService.update(supplier!.id, data); qc.invalidateQueries({ queryKey: ['suppliers'] }); }
      else await createSupplier.mutateAsync(data);
      onClose();
    } catch (err: any) { alert(err?.response?.data?.message ?? 'Erro ao salvar fornecedor'); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'} width="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <Input label="Razão Social / Nome" error={errors.nome?.message} {...register('nome')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CNPJ" placeholder="00.000.000/0001-00" {...register('cnpj')} />
            <Input label="Telefone" {...register('telefone')} />
          </div>
          <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Nome do Contato" {...register('contato')} />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={createSupplier.isPending}>{isEdit ? 'Salvar' : 'Cadastrar'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── User Modal ────────────────────────────────────────────────────────────────
const userSchema = z.object({
  matricula: z.string().min(1), nome: z.string().min(2),
  email: z.string().email(), senha: z.string().min(6),
  role: z.enum(['ESTOQUISTA', 'LIDER', 'ADMINISTRADOR']),
});
type UserForm = z.infer<typeof userSchema>;

export function UserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: { role: 'ESTOQUISTA' } });

  const onSubmit = async (data: UserForm) => {
    try { await usersService.create(data); qc.invalidateQueries({ queryKey: ['users'] }); reset(); onClose(); }
    catch (err: any) { alert(err?.response?.data?.message ?? 'Erro ao criar usuário'); }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Novo Usuário">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Matrícula" error={errors.matricula?.message} {...register('matricula')} />
            <Select label="Perfil" error={errors.role?.message} {...register('role')}>
              <option value="ESTOQUISTA">Estoquista</option>
              <option value="LIDER">Líder</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </Select>
          </div>
          <Input label="Nome Completo" error={errors.nome?.message} {...register('nome')} />
          <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Senha inicial" type="password" error={errors.senha?.message} {...register('senha')} />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>Criar Usuário</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
