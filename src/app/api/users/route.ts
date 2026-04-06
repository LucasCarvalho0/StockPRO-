import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, badRequest, serverError, hasRole } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR')) return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const users = await prisma.user.findMany({
      select: { id: true, nome: true, matricula: true, email: true, role: true, ativo: true, createdAt: true },
      orderBy: { nome: 'asc' },
    });

    return Response.json(users);
  } catch (e) {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'ADMINISTRADOR')) return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const { matricula, nome, email, senha, role } = await req.json();
    if (!matricula || !nome || !email || !senha) return badRequest('Campos obrigatórios: matricula, nome, email, senha');

    const existing = await prisma.user.findFirst({ where: { OR: [{ matricula }, { email }] } });
    if (existing) return Response.json({ message: 'Matrícula ou e-mail já cadastrado' }, { status: 409 });

    const senhaHash = await bcrypt.hash(senha, 10);
    const newUser = await prisma.user.create({
      data: { matricula, nome, email, senha: senhaHash, role: role ?? 'ESTOQUISTA' },
      select: { id: true, nome: true, matricula: true, email: true, role: true },
    });

    await registrarLog({ action: 'USUARIO_CRIADO', descricao: `Usuário ${nome} (${matricula}) criado`, entidade: 'User', entidadeId: newUser.id, userId: user.id });

    return Response.json(newUser, { status: 201 });
  } catch (e) {
    return serverError();
  }
}
