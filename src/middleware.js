import { NextResponse } from "next/server";

export function middleware(request) {
  // Allow direct access to files in the uploads directory
  if (request.nextUrl.pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/uploads/:path*"],
};
