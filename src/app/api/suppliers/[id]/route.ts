import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError, hasRole } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR')) return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const body = await req.json();
    const supplier = await prisma.supplier.update({ where: { id: params.id }, data: body });
    await registrarLog({ action: 'FORNECEDOR_EDITADO', descricao: `Fornecedor "${supplier.nome}" atualizado`, entidade: 'Supplier', entidadeId: params.id, userId: user.id });

    return Response.json(supplier);
  } catch (e) {
    return serverError();
  }
}
