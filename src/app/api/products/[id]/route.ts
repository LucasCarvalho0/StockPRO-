import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, notFound, serverError, hasRole } from '@/lib/auth';
import { verificarAlerta, registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        cliente: true,
        alerts: { where: { status: 'ATIVO' } },
        movements: { orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { nome: true } } } },
      },
    });
    if (!product || !product.ativo) return notFound('Produto não encontrado');
    return Response.json(product);
  } catch (e) {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR'))
      return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const body = await req.json();

    if (body._action === 'deactivate') {
      const product = await prisma.product.update({ where: { id: params.id }, data: { ativo: false } });
      await registrarLog({ action: 'PRODUTO_EDITADO', descricao: `Produto "${product.nome}" desativado`, entidade: 'Product', entidadeId: params.id, userId: user.id });
      return Response.json({ message: 'Produto desativado' });
    }

    const { _action, ...data } = body;
    const product = await prisma.product.update({
      where: { id: params.id },
      data,
      include: {
        supplier: { select: { id: true, nome: true } },
        cliente: { select: { id: true, nome: true } },
      },
    });

    await registrarLog({ action: 'PRODUTO_EDITADO', descricao: `Produto "${product.nome}" atualizado`, entidade: 'Product', entidadeId: params.id, userId: user.id });
    await verificarAlerta(params.id);
    return Response.json(product);
  } catch (e) {
    return serverError();
  }
}
