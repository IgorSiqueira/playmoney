import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export async function proxy(req: NextRequest) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;

  const publicPaths = ["/", "/login", "/register"];
  const isPublic = publicPaths.includes(pathname);
  const isApiAuth = pathname.startsWith("/api/auth");
  const isMaintenance = pathname.startsWith("/api/maintenance");
  const isLoggedIn = !!session?.user;

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isLoggedIn && !isPublic && !isApiAuth && !isMaintenance) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
