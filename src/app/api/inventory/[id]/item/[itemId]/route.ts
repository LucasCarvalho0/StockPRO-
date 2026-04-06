import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, notFound, badRequest, serverError } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const inventory = await prisma.inventory.findUnique({ where: { id: params.id } });
    if (!inventory) return notFound('Inventário não encontrado');
    if (inventory.status !== 'EM_ANDAMENTO') return badRequest('Inventário não está em andamento');

    const { quantidadeContada, observacao } = await req.json();

    const item = await prisma.inventoryItem.findUnique({ where: { id: params.itemId } });
    if (!item) return notFound('Item não encontrado');

    const divergencia = quantidadeContada - item.quantidadeSistema;

    const updated = await prisma.inventoryItem.update({
      where: { id: params.itemId },
      data: { quantidadeContada, divergencia, conferido: true, observacao },
    });

    return Response.json(updated);
  } catch (e) {
    return serverError();
  }
}
