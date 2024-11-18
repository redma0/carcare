// src/app/cars.js
"use client";
import { useState, useEffect } from "react";

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch("/api/cars");
      if (!response.ok) {
        throw new Error("Failed to fetch cars");
      }
      const data = await response.json();
      setCars(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-black">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-black">Your Cars</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cars.length === 0 ? (
          <p className="text-black">No cars found.</p>
        ) : (
          cars.map((car) => (
            <div key={car.id} className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-black">
                {car.make} {car.model}
              </h3>
              <div className="mt-2 text-gray-700">
                <p>Year: {car.year}</p>
                <p>Kilometers: {car.kilometers}</p>
                <p>
                  Last Serviced:{" "}
                  {new Date(car.last_serviced).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
