import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const [ativos, resolvidos] = await Promise.all([
      prisma.alert.count({ where: { status: 'ATIVO' } }),
      prisma.alert.count({ where: { status: 'RESOLVIDO' } }),
    ]);

    return Response.json({ ativos, resolvidos, total: ativos + resolvidos });
  } catch (e) {
    return serverError();
  }
}
