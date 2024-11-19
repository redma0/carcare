"use client";
import { useState, useEffect } from "react";
import Cars from "./cars";
import CreateCar from "./createcar";
import FuelPrices from "./fuelprices";
import UsageStatistics from "./UsageStatistics";

function Page() {
  const [cars, setCars] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Fetch cars data
  useEffect(() => {
    fetchCars();

    // Set up interval for periodic updates (every 5 minutes)
    const intervalId = setInterval(fetchCars, 300000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshTrigger]); // Only re-run if refreshTrigger changes

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

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-black">
        Car Care Management
      </h1>
      <FuelPrices />
      <UsageStatistics />
      <CreateCar onCarCreated={handleCarCreated} />
      <Cars cars={cars} onUpdate={handleRefresh} />
    </main>
  );
}

export default Page;
