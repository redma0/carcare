import { NextResponse } from "next/server";
import { get_db_connection } from "../../config/db_config";

export async function GET() {
  try {
    const conn = await get_db_connection();
    const result = await conn.query(`
      WITH monthly_stats AS (
        SELECT 
          SUM(kilometers_driven) as monthly_kilometers,
          SUM(fuel_cost_for_update) as monthly_cost
        FROM car_updates
        WHERE update_timestamp >= DATE_TRUNC('month', CURRENT_DATE)
      ),
      yearly_stats AS (
        SELECT 
          SUM(kilometers_driven) as yearly_kilometers,
          SUM(fuel_cost_for_update) as yearly_cost
        FROM car_updates
        WHERE update_timestamp >= DATE_TRUNC('year', CURRENT_DATE)
      )
      SELECT 
        COALESCE(monthly_stats.monthly_kilometers, 0) as monthly_kilometers,
        COALESCE(monthly_stats.monthly_cost, 0) as monthly_cost,
        COALESCE(yearly_stats.yearly_kilometers, 0) as yearly_kilometers,
        COALESCE(yearly_stats.yearly_cost, 0) as yearly_cost
      FROM monthly_stats, yearly_stats
    `);

    const statistics = result.rows[0];
    await conn.end();

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
