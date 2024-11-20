import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    const token = request.cookies.get("auth_token");

    if (!token) {
      return NextResponse.json({ isAuthenticated: false, user: null });
    }

    try {
      const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
      return NextResponse.json({
        isAuthenticated: true,
        user: {
          id: decoded.userId,
          isAdmin: decoded.isAdmin,
        },
      });
    } catch (error) {
      return NextResponse.json({ isAuthenticated: false, user: null });
    }
  } catch (error) {
    console.error("Auth status check failed:", error);
    return NextResponse.json(
      { error: "Failed to check authentication status" },
      { status: 500 }
    );
  }
}
