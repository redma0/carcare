"use client";
// src/app/page.js
import { useState, useEffect } from "react";
import Cars from "./cars";
import CreateCar from "./createcar";

function Page() {
  const [cars, setCars] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch cars data
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch("/api/cars");
        if (!response.ok) {
          throw new Error("Failed to fetch cars");
        }
        const data = await response.json();
        setCars(data);
      } catch (error) {
        console.error("Error fetching cars:", error);
      }
    };

    fetchCars();
  }, [refreshTrigger]);

  const handleCarCreated = async (carData) => {
    try {
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carData),
      });

      if (!response.ok) {
        throw new Error("Failed to create car");
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error creating car:", error);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-black">
        Car Care Management
      </h1>
      <CreateCar onCarCreated={handleCarCreated} />
      <Cars
        cars={cars}
        onUpdate={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </main>
  );
}

export default Page;
