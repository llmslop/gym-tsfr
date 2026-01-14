import { NextRequest, NextResponse } from "next/server";
import { authClient } from "./lib/auth-client";

export async function proxy(req: NextRequest) {
  const { data: session, error } = await authClient.getSession({
    fetchOptions: {
      headers: req.headers,
    },
  });

  if (error === null && session !== null) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*"],
};
