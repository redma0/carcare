import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { get_db_connection } from "../../../config/db_config";

async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const carId = formData.get("carId");

    if (!image || !carId) {
      return NextResponse.json(
        { error: "Image and carId are required" },
        { status: 400 }
      );
    }

    const uploadDir = await ensureUploadDir();
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `car_${carId}_${Date.now()}${path.extname(image.name)}`;
    const filepath = path.join(uploadDir, filename);
    const relativeUrl = `/uploads/${filename}`;

    await writeFile(filepath, buffer);

    const conn = await get_db_connection();
    await conn.query("UPDATE cars SET image_url = $1 WHERE id = $2", [
      relativeUrl,
      carId,
    ]);
    await conn.end();

    return NextResponse.json({
      success: true,
      imageUrl: relativeUrl,
    });
  } catch (error) {
    console.error("Error handling image upload:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
