import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, notFound, serverError } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const inventory = await prisma.inventory.findUnique({ where: { id: params.id } });
    if (!inventory) return notFound('Inventário não encontrado');
    if (inventory.status !== 'EM_ANDAMENTO') return badRequest('Inventário não está em andamento');

    const { items: rawItems } = await req.json();
    const items = (rawItems ?? []) as any[];

    await prisma.$transaction(async (tx) => {
      // OTIMIZAÇÃO: Carrega todos os itens do inventário de uma só vez para evitar loops de findFirst
      const existingItems = await tx.inventoryItem.findMany({
        where: { inventoryId: params.id }
      });

      const itemsMap = new Map(existingItems.map(i => [i.productId, i]));

      for (const item of items) {
        if (!item.productId) continue;
        
        const invItem = itemsMap.get(item.productId);
        if (!invItem) continue;

        const qContada = Math.floor(Number(item.quantidadeContada ?? 0));
        const divergencia = qContada - invItem.quantidadeSistema;
        
        await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: { 
            quantidadeContada: qContada, 
            divergencia, 
            conferido: true, 
            observacao: item.observacao ?? null
          },
        });

        if (qContada < invItem.quantidadeSistema) {
          const alertaAtivo = await tx.alert.findFirst({
            where: { productId: item.productId, status: 'ATIVO' }
          });

          if (!alertaAtivo) {
            await tx.alert.create({
              data: {
                tipo: 'DIVERGENCIA_INVENTARIO',
                productId: item.productId,
                quantidadeAtual: qContada,
                quantidadeMinima: invItem.quantidadeSistema,
                status: 'ATIVO',
              },
            });
          }
        }
      }

      await tx.inventory.update({
        where: { id: params.id },
        data: { status: 'CONCLUIDO', finalizadoEm: new Date() },
      });
    }, { timeout: 30000 }); // Aumenta timeout da transação para segurança

    await registrarLog({
      action: 'INVENTARIO_FINALIZADO',
      descricao: `Inventário finalizado por ${inventory.responsavel} (Mat. ${inventory.matricula}) - ${items.length} itens conferidos.`,
      entidade: 'Inventory',
      entidadeId: params.id,
      userId: user.id,
    });

    const updated = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: { select: { id: true, codigo: true, nome: true, unidade: true } } } } },
    });

    return Response.json(updated);
  } catch (e: any) {
    console.error('[API INVENTORY FINALIZAR ERROR]:', e);
    return Response.json({ 
      message: 'Erro interno ao finalizar inventário', 
      error: e.message || 'Sem mensagem adicional',
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
}
