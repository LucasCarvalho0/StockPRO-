import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, notFound, serverError } from '@/lib/auth';
import { verificarAlerta, registrarLog } from '@/lib/helpers';

/**
 * PATCH /api/nf/[id]/baixar
 *
 * Realiza a baixa (saída de estoque) dos itens da NF do cliente.
 * Suporta baixa total ou parcial por item.
 *
 * Body: { items: [{ nfItemId, quantidadeBaixar }] }
 * Se body.items não for enviado, baixa TODOS os itens com saldo pendente.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const nf = await prisma.notaFiscalCliente.findUnique({
      where: { id: params.id },
      include: {
        cliente: { select: { nome: true } },
        items: { include: { product: true } },
      },
    });

    if (!nf) return notFound('NF não encontrada');
    if (nf.status === 'BAIXADA')
      return badRequest('Esta NF já foi totalmente baixada');

    const body = await req.json().catch(() => ({}));
    const itemsRequest: { nfItemId: string; quantidadeBaixar: number }[] = body.items ?? [];

    // Se não enviou items específicos → baixa tudo que está pendente
    const itensParaBaixar =
      itemsRequest.length > 0
        ? itemsRequest
        : nf.items.map((i) => ({
            nfItemId: i.id,
            quantidadeBaixar: i.quantidade - i.quantidadeBaixada,
          }));

    // Valida estoque antes de iniciar a transação
    for (const req of itensParaBaixar) {
      if (req.quantidadeBaixar <= 0) continue;
      const nfItem = nf.items.find((i) => i.id === req.nfItemId);
      if (!nfItem) return badRequest(`Item ${req.nfItemId} não pertence a esta NF`);

      const pendente = nfItem.quantidade - nfItem.quantidadeBaixada;
      if (req.quantidadeBaixar > pendente)
        return badRequest(
          `Quantidade a baixar (${req.quantidadeBaixar}) maior que o pendente (${pendente}) para "${nfItem.product.nome}"`,
        );
      if (nfItem.product.quantidade < req.quantidadeBaixar)
        return badRequest(
          `Estoque insuficiente para "${nfItem.product.nome}". Disponível: ${nfItem.product.quantidade} ${nfItem.product.unidade}, necessário: ${req.quantidadeBaixar}`,
        );
    }

    // Executa a baixa em transação atômica
    const movements: { productId: string; quantidade: number }[] = [];

    await prisma.$transaction(async (tx) => {
      for (const req of itensParaBaixar) {
        if (req.quantidadeBaixar <= 0) continue;

        const nfItem = nf.items.find((i) => i.id === req.nfItemId)!;

        // Atualiza item da NF
        const novaBaixada = nfItem.quantidadeBaixada + req.quantidadeBaixar;
        await tx.nfItem.update({
          where: { id: nfItem.id },
          data: { quantidadeBaixada: novaBaixada },
        });

        // Deduz do estoque
        await tx.product.update({
          where: { id: nfItem.productId },
          data: { quantidade: { decrement: req.quantidadeBaixar } },
        });

        // Registra movimento de saída vinculado à NF
        await tx.movement.create({
          data: {
            type: 'SAIDA',
            quantidade: req.quantidadeBaixar,
            productId: nfItem.productId,
            userId: user.id,
            nfId: nf.id,
            notaFiscal: nf.numero,
            observacao: `Baixa NF ${nf.numero} - ${nf.cliente.nome}`,
          },
        });

        movements.push({ productId: nfItem.productId, quantidade: req.quantidadeBaixar });
      }

      // Verifica se todos os itens foram totalmente baixados
      const todosItens = await tx.nfItem.findMany({ where: { nfId: nf.id } });
      const todosBaixados = todosItens.every((i) => i.quantidadeBaixada >= i.quantidade);
      const algumBaixado = todosItens.some((i) => i.quantidadeBaixada > 0);

      const novoStatus = todosBaixados ? 'BAIXADA' : algumBaixado ? 'PARCIAL' : 'ABERTA';

      await tx.notaFiscalCliente.update({
        where: { id: nf.id },
        data: {
          status: novoStatus,
          dataBaixa: todosBaixados ? new Date() : undefined,
        },
      });
    });

    // Verifica alertas para cada produto movimentado (fora da transação)
    for (const m of movements) {
      await verificarAlerta(m.productId);
    }

    await registrarLog({
      action: 'NF_BAIXADA',
      descricao: `Baixa na NF ${nf.numero} (${nf.cliente.nome}) — ${movements.length} item(ns) baixado(s)`,
      entidade: 'NotaFiscalCliente',
      entidadeId: nf.id,
      userId: user.id,
    });

    // Retorna a NF atualizada
    const updated = await prisma.notaFiscalCliente.findUnique({
      where: { id: params.id },
      include: {
        cliente: { select: { id: true, nome: true } },
        user: { select: { id: true, nome: true, matricula: true } },
        items: {
          include: {
            product: { select: { id: true, codigo: true, nome: true, modelo: true, unidade: true, quantidade: true } },
          },
        },
      },
    });

    return Response.json(updated);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
