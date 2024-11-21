import { NextResponse } from "next/server";
import { get_db_connection } from "../../../config/db_config";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get("carId");

    const conn = await get_db_connection();
    const result = await conn.query(
      `
      SELECT 
        cu.update_timestamp,
        c.make,
        c.model,
        cu.update_type,
        cu.previous_value,
        cu.new_value,
        cu.kilometers_driven,
        ROUND(cu.fuel_cost_for_update::numeric, 2) as fuel_cost,
        ROUND(cu.fuel_price_at_update::numeric, 2) as fuel_price,
        c.kilometers,
        c.summer_tire_km,
        c.winter_tire_km,
        cu.kilometers_driven as tire_kilometers,
        c.tire_type
      FROM car_updates cu
      JOIN cars c ON c.id = cu.car_id
      WHERE c.id = $1
      ORDER BY cu.update_timestamp DESC
    `,
      [carId]
    );

    await conn.end();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching car updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch car updates" },
      { status: 500 }
    );
  }
}
