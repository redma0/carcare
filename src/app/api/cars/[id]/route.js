import { NextResponse } from "next/server";
import { get_db_connection } from "../../../config/db_config";

export async function PUT(request, { params }) {
  const conn = await get_db_connection();
  try {
    const { id } = params;
    const updates = await request.json();

    // Define allowed fields for updates
    const allowedFields = [
      "kilometers",
      "last_serviced",
      "registration_expires",
      "last_oil_change",
      "tire_type",
      "summer_tire_km",
      "winter_tire_km",
    ];

    // Filter out any fields that aren't in allowedFields
    const validUpdates = {};
    const changelog = [];
    const timestamp = new Date().toISOString();

    // Get current values for changelog
    const currentValues = await conn.query("SELECT * FROM cars WHERE id = $1", [
      id,
    ]);
    const currentCar = currentValues.rows[0];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;

        // Add to changelog if value has changed
        if (currentCar[key] !== value) {
          changelog.push({
            field: key,
            old_value: currentCar[key],
            new_value: value,
            timestamp: timestamp,
          });
        }
      }
    }

    // If there are no valid updates, return error
    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Create SET clause for SQL query
    const setClause = Object.entries(validUpdates)
      .map(([key, _], index) => `${key} = $${index + 1}`)
      .join(", ");

    // Update car details
    const result = await conn.query(
      `UPDATE cars SET ${setClause} WHERE id = $${
        Object.keys(validUpdates).length + 1
      } RETURNING *`,
      [...Object.values(validUpdates), id]
    );

    // Insert changelog entries
    if (changelog.length > 0) {
      const changelogValues = changelog
        .map(
          (entry) => `(
          ${id},
          '${entry.field}',
          '${entry.old_value}',
          '${entry.new_value}',
          '${entry.timestamp}'
        )`
        )
        .join(", ");

      await conn.query(`
        INSERT INTO car_changelog 
        (car_id, field_name, old_value, new_value, changed_at)
        VALUES ${changelogValues}
      `);
    }

    return NextResponse.json({
      message: "Car updated successfully",
      car: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
      { status: 500 }
    );
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

export async function GET(request, { params }) {
  const conn = await get_db_connection();
  try {
    const { id } = params;
    const result = await conn.query("SELECT * FROM cars WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching car:", error);
    return NextResponse.json({ error: "Failed to fetch car" }, { status: 500 });
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

export async function DELETE(request, { params }) {
  const conn = await get_db_connection();
  try {
    const { id } = params;

    // Delete car and related changelog entries
    await conn.query("BEGIN");
    await conn.query("DELETE FROM car_changelog WHERE car_id = $1", [id]);
    const result = await conn.query(
      "DELETE FROM cars WHERE id = $1 RETURNING *",
      [id]
    );
    await conn.query("COMMIT");

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Car deleted successfully",
      car: result.rows[0],
    });
  } catch (error) {
    await conn.query("ROLLBACK");
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    );
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
