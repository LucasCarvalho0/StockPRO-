import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError, hasRole } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const suppliers = await prisma.supplier.findMany({
      where: { ativo: true },
      include: { _count: { select: { products: true } } },
      orderBy: { nome: 'asc' },
    });

    return Response.json(suppliers);
  } catch (e) {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR')) return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const body = await req.json();
    const supplier = await prisma.supplier.create({ data: body });
    await registrarLog({ action: 'FORNECEDOR_CRIADO', descricao: `Fornecedor "${supplier.nome}" cadastrado`, entidade: 'Supplier', entidadeId: supplier.id, userId: user.id });

    return Response.json(supplier, { status: 201 });
  } catch (e) {
    return serverError();
  }
}
