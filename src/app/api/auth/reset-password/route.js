import { NextResponse } from "next/server";
import { get_db_connection } from "../../../config/db_config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  let conn;
  try {
    const { token, newPassword } = await request.json();

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    conn = await get_db_connection();
    await conn.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashedPassword,
      decoded.userId,
    ]);

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}
