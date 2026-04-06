import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError, hasRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    if (!hasRole(user.role, 'LIDER', 'ADMINISTRADOR')) return Response.json({ message: 'Acesso negado' }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action') ?? undefined;
    const userId = searchParams.get('userId') ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;

    const logs = await prisma.log.findMany({
      where: {
        ...(action && { action: action as any }),
        ...(userId && { userId }),
        ...(startDate && endDate && { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }),
      },
      include: { user: { select: { nome: true, matricula: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return Response.json(logs);
  } catch (e) {
    return serverError();
  }
}
