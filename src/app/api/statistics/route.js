// src/app/api/statistics/route.js
import { NextResponse } from "next/server";

import { get_db_connection } from "../../config/db_config";
export async function GET() {
  let conn;
  try {
    conn = await get_db_connection();

    // Get year and month totals
    const result = await conn.query(`
      WITH monthly_stats AS (
        SELECT 
          SUM(CASE 
            WHEN EXTRACT(YEAR FROM update_timestamp) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM update_timestamp) = EXTRACT(MONTH FROM CURRENT_DATE)
            THEN kilometers_driven 
            ELSE 0 
          END) as month_km,
          SUM(CASE 
            WHEN EXTRACT(YEAR FROM update_timestamp) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM update_timestamp) = EXTRACT(MONTH FROM CURRENT_DATE)
            THEN fuel_cost_for_update 
            ELSE 0 
          END) as month_cost,
          SUM(CASE 
            WHEN EXTRACT(YEAR FROM update_timestamp) = EXTRACT(YEAR FROM CURRENT_DATE)
            THEN kilometers_driven 
            ELSE 0 
          END) as year_km,
          SUM(CASE 
            WHEN EXTRACT(YEAR FROM update_timestamp) = EXTRACT(YEAR FROM CURRENT_DATE)
            THEN fuel_cost_for_update 
            ELSE 0 
          END) as year_cost
        FROM car_updates
      )
      SELECT 
        COALESCE(month_km, 0) as month_km,
        COALESCE(month_cost, 0) as month_cost,
        COALESCE(year_km, 0) as year_km,
        COALESCE(year_cost, 0) as year_cost
      FROM monthly_stats;
    `);

    const stats = result.rows[0];

    return NextResponse.json({
      monthTotal: {
        kilometers: parseInt(stats.month_km) || 0,
        cost: parseFloat(stats.month_cost) || 0,
      },
      yearTotal: {
        kilometers: parseInt(stats.year_km) || 0,
        cost: parseFloat(stats.year_cost) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
