import { NextResponse } from "next/server";
import { get_db_connection } from "../../../config/db_config";
import jwt from "jsonwebtoken";

export async function POST(request) {
  let conn;
  try {
    const { email } = await request.json();
    conn = await get_db_connection();

    // Check if user exists
    const result = await conn.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "If an account exists, a reset email will be sent." },
        { status: 200 }
      );
    }

    const user = result.rows[0];
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // In a real application, you would send an email here
    console.log("Reset token:", resetToken);

    return NextResponse.json(
      { message: "If an account exists, a reset email will be sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process reset request" },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}
