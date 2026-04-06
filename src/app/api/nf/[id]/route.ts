import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, notFound, serverError } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const nf = await prisma.notaFiscalCliente.findUnique({
      where: { id: params.id },
      include: {
        cliente: { select: { id: true, nome: true, cnpj: true } },
        user: { select: { id: true, nome: true, matricula: true } },
        items: {
          include: {
            product: {
              select: { id: true, codigo: true, nome: true, modelo: true, unidade: true, quantidade: true },
            },
          },
        },
        movements: {
          include: { user: { select: { nome: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!nf) return notFound('NF não encontrada');
    return Response.json(nf);
  } catch (e) {
    return serverError();
  }
}
