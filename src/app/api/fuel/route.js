// src/app/api/fuel/route.js
import { NextResponse } from "next/server";
import { get_db_connection } from "../../config/db_config";

export async function GET() {
  try {
    const conn = await get_db_connection();
    const result = await conn.query(`
      SELECT 
        CAST(price_95 AS FLOAT) as price_95,
        CAST(price_diesel AS FLOAT) as price_diesel,
        CAST(price_lpg AS FLOAT) as price_lpg,
        timestamp as created_at
      FROM fuel_prices 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No fuel prices found" },
        { status: 404 }
      );
    }

    const fuelPrices = result.rows[0];
    await conn.end();

    return NextResponse.json(fuelPrices);
  } catch (error) {
    console.error("Error fetching fuel prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch fuel prices" },
      { status: 500 }
    );
  }
}
