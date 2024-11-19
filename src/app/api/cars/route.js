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
    const { id, kilometers } = await request.json();
    const conn = await get_db_connection();

    // First get the car's current data
    const carResult = await conn.query(
      `
      SELECT fuel_type, fuel_economy
      FROM cars
      WHERE id = $1
    `,
      [id]
    );

    // Get current fuel prices
    const fuelResult = await conn.query(`
      SELECT price_95, price_diesel, price_lpg
      FROM fuel_prices
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    const car = carResult.rows[0];
    const fuelPrices = fuelResult.rows[0];

    // Get the appropriate fuel price based on fuel type
    let fuelPrice;
    switch (car.fuel_type.toLowerCase()) {
      case "95":
        fuelPrice = fuelPrices.price_95;
        break;
      case "diesel":
        fuelPrice = fuelPrices.price_diesel;
        break;
      case "lpg":
        fuelPrice = fuelPrices.price_lpg;
        break;
      default:
        fuelPrice = fuelPrices.price_95;
    }

    // Update car with new kilometers and calculate monthly fuel cost
    const query = `
      UPDATE cars 
      SET 
        kilometers = $1,
        kilometers_updated_at = CURRENT_TIMESTAMP,
        monthly_fuel_cost = (
          ($1 - initial_kilometers)::float / 
          GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - kilometers_updated_at)) / (30 * 24 * 60 * 60))
        ) * ($2::float / 100) * $3::float
      WHERE id = $4
      RETURNING *,
        CASE 
          WHEN kilometers_updated_at IS NOT NULL THEN
            (kilometers - initial_kilometers)::float / 
            GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - kilometers_updated_at)) / (30 * 24 * 60 * 60))
          ELSE NULL
        END as monthly_usage;
    `;

    const result = await conn.query(query, [
      kilometers,
      car.fuel_economy,
      fuelPrice,
      id,
    ]);

    await conn.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
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
