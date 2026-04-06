import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, badRequest, unauthorized, serverError } from '@/lib/auth';
import { registrarLog } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const { matricula, senha } = await req.json();
    console.log(`[AUTH] Tentativa de login: Matrícula ${matricula}`);

    if (!matricula || !senha) return badRequest('Matrícula e senha são obrigatórios');

    const user = await prisma.user.findUnique({ where: { matricula } });
    if (!user) {
      console.log(`[AUTH] Falha: Usuário ${matricula} não encontrado`);
      return unauthorized();
    }
    
    if (!user.ativo) {
      console.log(`[AUTH] Falha: Usuário ${matricula} está inativo`);
      return unauthorized();
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      console.log(`[AUTH] Falha: Senha incorreta para ${matricula}`);
      return unauthorized();
    }

    console.log(`[AUTH] Sucesso: Usuário ${user.nome} autenticado`);
    const token = signToken({ sub: user.id, matricula: user.matricula, nome: user.nome, role: user.role });

    try {
      await registrarLog({
        action: 'LOGIN',
        descricao: `Usuário ${user.nome} realizou login`,
        userId: user.id,
        ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      });
    } catch (logError) {
      console.error('Erro ao registrar log de login:', logError);
    }

    return Response.json({
      access_token: token,
      user: { id: user.id, nome: user.nome, matricula: user.matricula, email: user.email, role: user.role },
    });
  } catch (e: any) {
    console.error('API_AUTH_ERROR:', e);
    return serverError('Erro interno no servidor de autenticação');
  }
}
