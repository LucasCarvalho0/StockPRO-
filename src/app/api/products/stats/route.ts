import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const [total, alertas, totalMovimentos] = await Promise.all([
      prisma.product.count({ where: { ativo: true } }),
      prisma.alert.count({ where: { status: 'ATIVO' } }),
      prisma.movement.count(),
    ]);

    return Response.json({ total, alertas, totalMovimentos });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
