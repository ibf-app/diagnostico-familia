import { NextResponse } from "next/server";
import { NOME_COOKIE } from "@/lib/admin-session";
import { SITE_URL } from "@/lib/site-url";

export async function POST() {
  const response = NextResponse.redirect(new URL("/admin/login", SITE_URL), { status: 303 });
  response.cookies.delete({ name: NOME_COOKIE, path: "/admin" });
  return response;
}
