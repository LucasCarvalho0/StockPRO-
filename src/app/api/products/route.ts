import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, serverError, hasRole } from '@/lib/auth';
import { verificarAlerta, registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const search = req.nextUrl.searchParams.get('search') ?? undefined;
    const clienteId = req.nextUrl.searchParams.get('clienteId') ?? undefined;

    const products = await prisma.product.findMany({
      where: {
        ativo: true,
        ...(clienteId && { clienteId }),
        ...(search && {
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { codigo: { contains: search, mode: 'insensitive' } },
            { modelo: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        supplier: { select: { id: true, nome: true } },
        cliente: { select: { id: true, nome: true } },
        alerts: { where: { status: 'ATIVO' }, select: { id: true, status: true } },
      },
      orderBy: [{ cliente: { nome: 'asc' } }, { nome: 'asc' }],
    });

    return Response.json(products);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR'))
      return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const body = await req.json();
    const { codigo, nome, modelo, descricao, unidade, quantidade, quantidadeMinima, supplierId, clienteId } = body;

    if (!codigo || !nome) return badRequest('Campos obrigatórios: codigo, nome');

    const existing = await prisma.product.findUnique({ where: { codigo } });
    if (existing) return Response.json({ message: 'Código já cadastrado' }, { status: 409 });

    const product = await prisma.product.create({
      data: { codigo, nome, modelo: modelo ?? '-', descricao, unidade: unidade ?? 'un', quantidade: quantidade ?? 0, quantidadeMinima: quantidadeMinima ?? 0, supplierId, clienteId },
      include: {
        supplier: { select: { id: true, nome: true } },
        cliente: { select: { id: true, nome: true } },
      },
    });

    await registrarLog({ action: 'PRODUTO_CRIADO', descricao: `Produto "${nome}" (${codigo}) cadastrado`, entidade: 'Product', entidadeId: product.id, userId: user.id });
    await verificarAlerta(product.id);

    return Response.json(product, { status: 201 });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
