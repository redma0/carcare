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
