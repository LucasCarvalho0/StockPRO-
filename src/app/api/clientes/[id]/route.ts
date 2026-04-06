import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError, hasRole } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR'))
      return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const body = await req.json();
    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: body,
    });

    await registrarLog({
      action: 'CLIENTE_EDITADO',
      descricao: `Cliente "${cliente.nome}" atualizado`,
      entidade: 'Cliente',
      entidadeId: params.id,
      userId: user.id,
    });

    return Response.json(cliente);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
