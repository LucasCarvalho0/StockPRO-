import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, notFound, serverError } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const inventory = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { nome: true, matricula: true } },
        items: {
          include: { product: { select: { id: true, codigo: true, nome: true, unidade: true } } },
        },
      },
    });

    if (!inventory) return notFound('Inventário não encontrado');
    return Response.json(inventory);
  } catch (e) {
    return serverError();
  }
}
