import { NextResponse } from "next/server";
import { get_db_connection } from "../../config/db_config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const conn = await get_db_connection();

    const result = await conn.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    await conn.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get("auth_token");

    if (!token) {
      return NextResponse.json({ isAuthenticated: false });
    }

    // Verify the token
    try {
      jwt.verify(token.value, process.env.JWT_SECRET);
      return NextResponse.json({ isAuthenticated: true });
    } catch (error) {
      return NextResponse.json({ isAuthenticated: false });
    }
  } catch (error) {
    console.error("Auth status check failed:", error);
    return NextResponse.json(
      { error: "Failed to check authentication status" },
      { status: 500 }
    );
  }
}
