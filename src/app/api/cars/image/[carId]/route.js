import { NextResponse } from "next/server";
import { get_db_connection } from "../../../../config/db_config";

export async function GET(request, { params }) {
  const carId = params.carId;
  const conn = await get_db_connection();

  try {
    const result = await conn.query(
      "SELECT image_url FROM cars WHERE id = $1",
      [carId]
    );

    const imageUrl = result.rows[0]?.image_url;
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error fetching car image:", error);
    return NextResponse.json(
      { error: "Failed to fetch car image" },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}
