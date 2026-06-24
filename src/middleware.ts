import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase-server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/checkin") ||
    path.startsWith("/admin");

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ELIMINAMOS LA CONSULTA AL PERFIL AQUÍ
  // El control de rol (admin vs user) debe hacerse en la página (page.tsx)
  // o en un layout, no en el middleware.

  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/checkin/:path*", "/admin/:path*"],
};
