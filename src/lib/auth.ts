import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'stockpro-secret-2026';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

export interface JwtPayload {
  sub: string;
  matricula: string;
  nome: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookie = req.cookies.get('stockpro_token')?.value;
  return cookie ?? null;
}

export async function getAuthUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.ativo) return null;
  return user;
}

export function unauthorized() {
  return Response.json({ message: 'Não autorizado' }, { status: 401 });
}

export function forbidden() {
  return Response.json({ message: 'Acesso negado' }, { status: 403 });
}

export function badRequest(message: string) {
  return Response.json({ message }, { status: 400 });
}

export function notFound(message = 'Não encontrado') {
  return Response.json({ message }, { status: 404 });
}

export function serverError(message = 'Erro interno do servidor') {
  return Response.json({ message }, { status: 500 });
}

export function hasRole(userRole: string, ...roles: string[]): boolean {
  return roles.includes(userRole);
}
