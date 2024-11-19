"use client";
import { useState, useEffect } from "react";
import Cars from "./cars";
import CreateCar from "./createcar";
import FuelPrices from "./fuelprices";
import UsageStatistics from "./UsageStatistics";

function Page() {
  const [cars, setCars] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(null); // Add error state

  const fetchCars = async () => {
    try {
      const response = await fetch("/api/cars");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to fetch cars");
      }
      const data = await response.json();
      setCars(data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error fetching cars:", error);
      setError(error.message);
      setCars([]); // Reset cars on error
    }
  };

  useEffect(() => {
    fetchCars();

    const intervalId = setInterval(fetchCars, 300000);

    return () => clearInterval(intervalId);
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create car");
      }

      setRefreshTrigger((prev) => prev + 1);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error creating car:", error);
      setError(error.message);
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
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <FuelPrices />
      <UsageStatistics />
      <CreateCar onCarCreated={handleCarCreated} />
      <Cars cars={cars} onUpdate={handleRefresh} />
    </main>
  );
}

export default Page;
