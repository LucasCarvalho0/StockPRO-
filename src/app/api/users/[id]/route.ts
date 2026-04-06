import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, notFound, serverError, hasRole } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'ADMINISTRADOR')) return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const body = await req.json();

    if (body.senha) body.senha = await bcrypt.hash(body.senha, 10);

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: body,
      select: { id: true, nome: true, matricula: true, email: true, role: true, ativo: true },
    });

    await registrarLog({ action: 'USUARIO_EDITADO', descricao: `Usuário ${updated.nome} atualizado`, entidade: 'User', entidadeId: params.id, userId: user.id });

    return Response.json(updated);
  } catch (e) {
    return serverError();
  }
}
