import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError, hasRole } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'ADMINISTRADOR')) return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const updated = await prisma.user.update({ where: { id: params.id }, data: { ativo: false } });
    await registrarLog({ action: 'USUARIO_EDITADO', descricao: `Usuário ${updated.nome} desativado`, entidade: 'User', entidadeId: params.id, userId: user.id });

    return Response.json({ message: 'Usuário desativado' });
  } catch (e) {
    return serverError();
  }
}
