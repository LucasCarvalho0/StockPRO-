import { prisma } from './prisma';

export async function verificarAlerta(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.ativo) return;

  const alertaAtivo = await prisma.alert.findFirst({ where: { productId, status: 'ATIVO' } });
  // Alerta se estiver abaixo do mínimo OU categoricamente ESGOTADO (quantidade <= 0)
  const estaBaixo = product.quantidade <= product.quantidadeMinima || product.quantidade <= 0;

  if (estaBaixo && !alertaAtivo) {
    await prisma.alert.create({
      data: { 
        productId, 
        quantidadeAtual: product.quantidade, 
        quantidadeMinima: product.quantidadeMinima,
        tipo: 'ESTOQUE_BAIXO',
        status: 'ATIVO'
      },
    });
  } else if (!estaBaixo && alertaAtivo) {
    await prisma.alert.update({
      where: { id: alertaAtivo.id },
      data: { status: 'RESOLVIDO', resolvidoEm: new Date() },
    });
  } else if (estaBaixo && alertaAtivo) {
    await prisma.alert.update({
      where: { id: alertaAtivo.id },
      data: { quantidadeAtual: product.quantidade },
    });
  }
}

export async function registrarLog(data: {
  action: any;
  descricao: string;
  entidade?: string;
  entidadeId?: string;
  ipAddress?: string;
  userId?: string;
}) {
  return prisma.log.create({ data });
}
