import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, serverError } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { searchParams } = req.nextUrl;
    const clienteId = searchParams.get('clienteId') ?? undefined;
    const status = searchParams.get('status') ?? undefined;

    const nfs = await prisma.notaFiscalCliente.findMany({
      where: {
        ...(clienteId && { clienteId }),
        ...(status && { status: status as any }),
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true, matricula: true } },
        items: {
          include: {
            product: { select: { id: true, codigo: true, nome: true, modelo: true, unidade: true, quantidade: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(nfs);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { numero, clienteId, observacao, items } = await req.json();

    if (!numero) return badRequest('Número da NF é obrigatório');
    if (!clienteId) return badRequest('Cliente é obrigatório');
    if (!items || items.length === 0) return badRequest('Adicione ao menos um item');

    // Valida se todos os produtos existem e têm estoque
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.ativo)
        return Response.json({ message: `Produto não encontrado: ${item.productId}` }, { status: 404 });
      if (product.quantidade < item.quantidade)
        return badRequest(
          `Estoque insuficiente para "${product.nome}". Disponível: ${product.quantidade} ${product.unidade}`,
        );
    }

    const nf = await prisma.notaFiscalCliente.create({
      data: {
        numero,
        clienteId,
        userId: user.id,
        observacao,
        status: 'ABERTA',
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            quantidade: i.quantidade,
            quantidadeBaixada: 0,
            observacao: i.observacao,
          })),
        },
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        items: {
          include: {
            product: { select: { id: true, codigo: true, nome: true, modelo: true, unidade: true } },
          },
        },
      },
    });

    await registrarLog({
      action: 'NF_EMITIDA',
      descricao: `NF ${numero} emitida para ${nf.cliente.nome} com ${items.length} item(ns)`,
      entidade: 'NotaFiscalCliente',
      entidadeId: nf.id,
      userId: user.id,
    });

    return Response.json(nf, { status: 201 });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
