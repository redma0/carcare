// src/app/api/cars/route.js
import { NextResponse } from "next/server";
import { get_db_connection } from "../../config/db_config";
import { exec } from "child_process";
import { promisify } from "util";
import { data } from "autoprefixer";

const execAsync = promisify(exec);

export async function POST(request) {
  const conn = await get_db_connection();
  try {
    const data = await request.json();

    // Calculate initial tire kilometers based on current tire type and last tire change
    const tireType = data.tireType.toLowerCase();
    const initialTireKm = data.lastTireChange
      ? parseInt(data.kilometers) - parseInt(data.lastTireChange)
      : 0;

    // Set both tire types' initial values
    const summerTireKm = tireType === "summer" ? initialTireKm : 0;
    const winterTireKm = tireType === "winter" ? initialTireKm : 0;

    const result = await conn.query(
      `INSERT INTO cars (
        make, model, year, kilometers, initial_kilometers,
        last_serviced, fuel_type, fuel_economy,
        registration_expires, last_oil_change,
        license_plate, vin, tire_type,
        summer_tire_km, winter_tire_km,
        kilometers_updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP) 
      RETURNING *`,
      [
        data.make,
        data.model,
        data.year,
        parseInt(data.kilometers),
        parseInt(data.kilometers), // initial_kilometers
        data.lastServiced,
        data.fuelType,
        parseFloat(data.fuelEconomy),
        data.registrationExpires,
        parseInt(data.lastOilChange),
        data.licensePlate,
        data.vin,
        tireType,
        summerTireKm,
        winterTireKm,
      ]
    );

    await conn.end();
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error details:", error);
    if (conn) {
      await conn.end();
    }
    return NextResponse.json(
      { error: `Failed to create car: ${error.message}` },
      { status: 500 }
    );
  }
}

// src/app/api/cars/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin");

  // Check for duplicate VIN
  if (vin) {
    try {
      const conn = await get_db_connection();
      const result = await conn.query(
        `SELECT COUNT(*) FROM cars WHERE vin = $1`,
        [vin]
      );

      await conn.end();
      return NextResponse.json({ exists: result.rows[0].count > 0 });
    } catch (error) {
      console.error("Database error details:", error.message);
      return NextResponse.json(
        { error: "Failed to check VIN", details: error.message },
        { status: 500 }
      );
    }
  }

  // Existing code to fetch all cars
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
        license_plate,
        vin,
        tire_type,
        summer_tire_km,
        winter_tire_km,
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
    const {
      id,
      kilometers,
      lastServiced,
      registrationExpires,
      lastOilChange,
      tireType,
      field,
      value,
    } = await request.json();

    // Start transaction
    await conn.query("BEGIN");

    // Get current car data
    const currentCarData = await conn.query(
      `SELECT kilometers, last_serviced, registration_expires, last_oil_change, 
       fuel_type, fuel_economy, tire_type 
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

      // Update car kilometers and current tire type kilometers
      const updateResult = await conn.query(
        `UPDATE cars 
         SET kilometers = $1,
         ${currentCar.tire_type}_tire_km = COALESCE(${currentCar.tire_type}_tire_km, 0) + $2,
         kilometers_updated_at = CURRENT_TIMESTAMP,
         monthly_fuel_cost = (
           ($1 - initial_kilometers)::float / 
           GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - kilometers_updated_at)) / (30 * 24 * 60 * 60))
         ) * ($3::float / 100) * $4::float
         WHERE id = $5
         RETURNING *`,
        [kilometers, kilometersDriven, currentCar.fuel_economy, fuelPrice, id]
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

    if (tireType) {
      const previousTireType = currentCar.tire_type;

      // Update tire type without resetting kilometers
      await conn.query(
        `UPDATE cars 
         SET tire_type = $1,
         kilometers_updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [tireType, id]
      );

      // Log tire type update
      await conn.query(
        `INSERT INTO car_updates (
          car_id,
          update_type,
          previous_value,
          new_value,
          update_timestamp
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [id, "tire_type", previousTireType, tireType]
      );
    } else if (field === "summerTireKm" || field === "winterTireKm") {
      const tireField =
        field === "summerTireKm" ? "summer_tire_km" : "winter_tire_km";

      // Update the specified tire kilometers
      await conn.query(
        `UPDATE cars 
         SET ${tireField} = $1
         WHERE id = $2
         RETURNING *`,
        [value, id]
      );

      // Log tire kilometer update
      await conn.query(
        `INSERT INTO car_updates (
          car_id,
          update_type,
          previous_value,
          new_value,
          update_timestamp
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [id, field, currentCar[tireField], value]
      );
    }

    // Commit transaction
    await conn.query("COMMIT");

    // Get updated car data with all fields including monthly usage calculation
    const result = await conn.query(
      `SELECT 
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
        tire_type,
        license_plate,
        vin,
        summer_tire_km,
        winter_tire_km,
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
