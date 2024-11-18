// src/app/config/db_config.js
import pg from "pg";

export async function get_db_connection() {
  const client = new pg.Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}
