import { NextResponse } from "next/server";
import { get_db_connection } from "../../config/db_config";

export async function GET() {
  try {
    const conn = await get_db_connection();
    const result = await conn.query(
      "SELECT * FROM cars ORDER BY created_at DESC"
    );
    const cars = result.rows;
    await conn.end();

    return NextResponse.json(cars);
  } catch (error) {
    console.error("Error fetching cars:", error);
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { make, model, year, kilometers, lastServiced } = body;

    const conn = await get_db_connection();
    const query = `
            INSERT INTO cars (make, model, year, kilometers, last_serviced)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `;

    const result = await conn.query(query, [
      make,
      model,
      year,
      kilometers,
      lastServiced,
    ]);
    const newCarId = result.rows[0].id;
    await conn.end();

    return NextResponse.json(
      {
        message: "Car created successfully",
        id: newCarId,
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
// Add this to src/app/api/cars/route.js alongside GET and POST
// src/app/api/cars/route.js
// src/app/api/cars/route.js
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, kilometers, lastServiced } = body;

    const conn = await get_db_connection();

    let setClause = [];
    let values = [];
    let paramCount = 1;

    if (kilometers !== undefined) {
      setClause.push(
        `kilometers = $${paramCount}, kilometers_updated_at = CURRENT_TIMESTAMP`
      );
      values.push(kilometers);
      paramCount++;
    }

    if (lastServiced !== undefined) {
      setClause.push(`last_serviced = $${paramCount}`);
      values.push(lastServiced);
      paramCount++;
    }

    values.push(id);

    const query = `
      UPDATE cars 
      SET ${setClause.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *, kilometers_updated_at;
    `;

    const result = await conn.query(query, values);
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
