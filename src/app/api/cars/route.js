// src/app/api/cars/route.js
// src/app/api/cars/route.js
import { NextResponse } from "next/server";
import { get_db_connection } from "../../config/db_config";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      make,
      model,
      year,
      kilometers,
      lastServiced,
      fuelType,
      fuelEconomy,
    } = body;

    const conn = await get_db_connection();
    const query = `
      INSERT INTO cars (
        make, 
        model, 
        year, 
        kilometers, 
        last_serviced,
        kilometers_updated_at,
        initial_kilometers,
        fuel_type,
        fuel_economy
      )
      VALUES ($1, $2, $3, $4, $5, NULL, $4, $6, $7)
      RETURNING *,
        CASE 
          WHEN kilometers_updated_at IS NOT NULL THEN
            (kilometers - initial_kilometers)::float / 
            GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - kilometers_updated_at)) / (30 * 24 * 60 * 60))
          ELSE NULL
        END as monthly_usage;
    `;

    const result = await conn.query(query, [
      make,
      model,
      year,
      kilometers,
      lastServiced,
      fuelType,
      fuelEconomy,
    ]);
    const newCar = result.rows[0];
    await conn.end();

    return NextResponse.json(
      {
        message: "Car created successfully",
        car: newCar,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating car:", error);
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 }
    );
  }
}

// src/app/api/cars/route.js

// src/app/api/cars/route.js
export async function GET() {
  try {
    const conn = await get_db_connection();
    const result = await conn.query(`
      SELECT 
        id,
        make, 
        model,
        year,
        kilometers,
        last_serviced,
        kilometers_updated_at,
        created_at,
        initial_kilometers,
        fuel_type,
        fuel_economy,
        monthly_fuel_cost,
        CASE 
          WHEN kilometers_updated_at IS NOT NULL THEN
            CAST((kilometers - initial_kilometers)::float / 
            GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - kilometers_updated_at)) / (30 * 24 * 60 * 60))
            AS DECIMAL(10,2))
          ELSE NULL
        END as monthly_usage
      FROM cars 
      ORDER BY created_at DESC
    `);

    const cars = result.rows;
    await conn.end();

    return NextResponse.json(cars);
  } catch (error) {
    console.error("Database error details:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch cars", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, kilometers, lastServiced } = body;

    const conn = await get_db_connection();
    let updateClause = [];
    let values = [];
    let paramCount = 1;

    if (kilometers !== undefined) {
      updateClause.push(`
        kilometers = $${paramCount},
        kilometers_updated_at = CURRENT_TIMESTAMP
      `);
      values.push(kilometers);
      paramCount++;
    }

    if (lastServiced !== undefined) {
      updateClause.push(`last_serviced = $${paramCount}`);
      values.push(lastServiced);
      paramCount++;
    }

    values.push(id);

    const query = `
      UPDATE cars 
      SET ${updateClause.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *,
        CASE 
          WHEN kilometers_updated_at IS NOT NULL THEN
            CAST((kilometers - initial_kilometers)::float / 
            GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - kilometers_updated_at)) / (30 * 24 * 60 * 60))
            AS DECIMAL(10,2))
          ELSE NULL
        END as monthly_usage;
    `;

    const result = await conn.query(query, values);
    await conn.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // If kilometers were updated, run the calculation script
    if (kilometers !== undefined) {
      try {
        // Run the Python script
        const { stdout, stderr } = await execAsync(
          "python3 src/app/calculate_fuel_costs.py"
        );
        console.log("Calculation output:", stdout);
        if (stderr) {
          console.error("Calculation errors:", stderr);
        }
      } catch (error) {
        console.error("Failed to run calculations:", error);
      }
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
      { status: 500 }
    );
  }
}
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const conn = await get_db_connection();
    const query = `
      DELETE FROM cars 
      WHERE id = $1 
      RETURNING *;
    `;

    const result = await conn.query(query, [id]);
    await conn.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Car deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    );
  }
}
