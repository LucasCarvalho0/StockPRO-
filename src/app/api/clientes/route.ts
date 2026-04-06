import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError, hasRole } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const clientes = await prisma.cliente.findMany({
      where: { ativo: true },
      include: {
        _count: { select: { products: true, nfs: true } },
      },
      orderBy: { nome: 'asc' },
    });

    return Response.json(clientes);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR'))
      return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const body = await req.json();
    const { nome, cnpj, email, telefone, contato } = body;

    if (!nome) return Response.json({ message: 'Nome é obrigatório' }, { status: 400 });

    const existing = await prisma.cliente.findUnique({ where: { nome } });
    if (existing) return Response.json({ message: 'Cliente já cadastrado' }, { status: 409 });

    const cliente = await prisma.cliente.create({
      data: { nome, cnpj, email, telefone, contato },
    });

    await registrarLog({
      action: 'CLIENTE_CRIADO',
      descricao: `Cliente "${nome}" cadastrado`,
      entidade: 'Cliente',
      entidadeId: cliente.id,
      userId: user.id,
    });

    return Response.json(cliente, { status: 201 });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
