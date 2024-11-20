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
      registrationExpires,
      lastOilChange,
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
        fuel_economy,
        registration_expires,
        last_oil_change
      )
      VALUES ($1, $2, $3, $4, $5, NULL, $4, $6, $7, $8, $9)
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
      registrationExpires,
      lastOilChange,
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
        registration_expires,
        last_oil_change,
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
  const conn = await get_db_connection();
  try {
    const { id, kilometers, lastServiced, registrationExpires, lastOilChange } =
      await request.json();

    // Start transaction
    await conn.query("BEGIN");

    // Get current car data
    const currentCarData = await conn.query(
      `SELECT kilometers, last_serviced, registration_expires, last_oil_change, fuel_type, fuel_economy 
       FROM cars WHERE id = $1`,
      [id]
    );
    const currentCar = currentCarData.rows[0];

    // Get current fuel prices
    const fuelResult = await conn.query(`
      SELECT price_95, price_diesel, price_lpg
      FROM fuel_prices
      ORDER BY timestamp DESC
      LIMIT 1
    `);
    const fuelPrices = fuelResult.rows[0];

    // Determine fuel price
    let fuelPrice;
    switch (currentCar.fuel_type.toLowerCase()) {
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

    if (kilometers) {
      // Calculate values for car_updates
      const kilometersDriven = kilometers - currentCar.kilometers;
      const fuelCostForUpdate =
        (kilometersDriven / 100) * currentCar.fuel_economy * fuelPrice;

      // Update car
      const updateResult = await conn.query(
        `
        UPDATE cars 
        SET kilometers = $1,
            kilometers_updated_at = CURRENT_TIMESTAMP,
            monthly_fuel_cost = (
              ($1 - initial_kilometers)::float / 
              GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - kilometers_updated_at)) / (30 * 24 * 60 * 60))
            ) * ($2::float / 100) * $3::float
        WHERE id = $4
        RETURNING *`,
        [kilometers, currentCar.fuel_economy, fuelPrice, id]
      );

      // Log update in car_updates
      await conn.query(
        `
        INSERT INTO car_updates (
          car_id,
          update_type,
          previous_value,
          new_value,
          kilometers_driven,
          fuel_cost_for_update,
          fuel_price_at_update,
          update_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          id,
          "kilometers",
          currentCar.kilometers,
          kilometers,
          kilometersDriven,
          fuelCostForUpdate,
          fuelPrice,
        ]
      );
    } else if (lastServiced) {
      // Update car service date
      const updateResult = await conn.query(
        `
        UPDATE cars 
        SET last_serviced = $1
        WHERE id = $2
        RETURNING *`,
        [lastServiced, id]
      );

      // Log service update
      await conn.query(
        `
        INSERT INTO car_updates (
          car_id,
          update_type,
          previous_value,
          new_value,
          update_timestamp
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [id, "service", currentCar.last_serviced, lastServiced]
      );
    } else if (registrationExpires) {
      // Update registration expiration date
      const updateResult = await conn.query(
        `
        UPDATE cars 
        SET registration_expires = $1
        WHERE id = $2
        RETURNING *`,
        [registrationExpires, id]
      );

      // Log registration update
      await conn.query(
        `
        INSERT INTO car_updates (
          car_id,
          update_type,
          previous_value,
          new_value,
          update_timestamp
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [
          id,
          "registration",
          currentCar.registration_expires,
          registrationExpires,
        ]
      );
    } else if (lastOilChange) {
      // Update oil change kilometer reading
      const updateResult = await conn.query(
        `
        UPDATE cars 
        SET last_oil_change = $1
        WHERE id = $2
        RETURNING *`,
        [lastOilChange, id]
      );

      // Log oil change update
      await conn.query(
        `
        INSERT INTO car_updates (
          car_id,
          update_type,
          previous_value,
          new_value,
          update_timestamp
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [id, "oil_change", currentCar.last_oil_change, lastOilChange]
      );
    }

    // Commit transaction
    await conn.query("COMMIT");

    // Get updated car data with all fields including monthly usage calculation
    const result = await conn.query(
      `
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
        registration_expires,
        CASE 
          WHEN kilometers_updated_at IS NOT NULL THEN
            (kilometers - initial_kilometers)::float / 
            GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - kilometers_updated_at)) / (30 * 24 * 60 * 60))
          ELSE NULL
        END as monthly_usage
      FROM cars 
      WHERE id = $1`,
      [id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    // Rollback on error
    await conn.query("ROLLBACK");
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
      { status: 500 }
    );
  } finally {
    await conn.end();
  }
}

async function DELETE(request) {
  const conn = await get_db_connection();
  try {
    const { id } = await request.json();

    // Start a transaction
    await conn.query("BEGIN");

    // First delete related car_updates
    await conn.query("DELETE FROM car_updates WHERE car_id = $1", [id]);

    // Then delete the car
    const result = await conn.query(
      `
      DELETE FROM cars 
      WHERE id = $1 
      RETURNING *;
    `,
      [id]
    );

    if (result.rows.length === 0) {
      await conn.query("ROLLBACK");
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // Commit the transaction
    await conn.query("COMMIT");

    return NextResponse.json(
      { message: "Car deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Rollback in case of error
    await conn.query("ROLLBACK");
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Failed to delete car: " + error.message },
      { status: 500 }
    );
  } finally {
    await conn.end();
  }
}

export { DELETE };
