import { NextResponse } from "next/server";
import { NOME_COOKIE } from "@/lib/admin-session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  response.cookies.delete({ name: NOME_COOKIE, path: "/admin" });
  return response;
}
