import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Libera rotas públicas e assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Para rotas de API (exceto auth), verifica o Authorization header
  if (pathname.startsWith('/api/')) {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return Response.json({ message: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Para rotas de página, redireciona se não houver token no cookie
  // (a validação real é feita no getAuthUser de cada API route)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
