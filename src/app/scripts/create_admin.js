const bcrypt = require("bcryptjs");
const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function createAdmin() {
  const adminUsername = "admin";
  const adminPassword = "iloveajvar";

  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    await client.connect();

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Check if admin exists
    const checkResult = await client.query(
      "SELECT * FROM users WHERE username = $1",
      ["admin"]
    );

    if (checkResult.rows.length > 0) {
      // Update existing admin password
      await client.query(
        "UPDATE users SET password_hash = $1 WHERE username = $2",
        [hashedPassword, "admin"]
      );
      console.log("Admin password updated successfully");
    } else {
      // Create new admin user
      await client.query(
        `INSERT INTO users (username, password_hash, is_admin) 
         VALUES ($1, $2, true)`,
        ["admin", hashedPassword]
      );
      console.log("Admin user created successfully");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

createAdmin();
