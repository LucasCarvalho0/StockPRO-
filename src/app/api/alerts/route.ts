import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const status = req.nextUrl.searchParams.get('status') ?? undefined;

    const alerts = await prisma.alert.findMany({
      where: { ...(status && { status: status as any }) },
      include: {
        product: {
          select: { id: true, codigo: true, nome: true, unidade: true, supplier: { select: { nome: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(alerts);
  } catch (e) {
    return serverError();
  }
}
