import { NextResponse } from "next/server";
import { get_db_connection } from "../../../config/db_config";
import bcrypt from "bcryptjs";

export async function POST(request) {
  let conn;
  try {
    const { username, password, email } = await request.json();
    conn = await get_db_connection();

    // Check if username already exists
    const checkResult = await conn.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await conn.query(
      `INSERT INTO users (username, password_hash, email, is_admin) 
         VALUES ($1, $2, $3, false) RETURNING id, username, email`,
      [username, hashedPassword, email]
    );

    return NextResponse.json(
      { message: "User created successfully", user: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}
