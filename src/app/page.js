"use client";
import { useState, useEffect } from "react";
import Cars from "./cars";
import CreateCar from "./createcar";
import UsageStatistics from "./UsageStatistics";
import FuelPrices from "./fuelprices";

export default function Page() {
  const [cars, setCars] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Add authentication check
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
    }
  };

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

  useEffect(() => {
    fetchCars();
  }, []);

  const handleCarCreated = async (newCar) => {
    await fetchCars();
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <FuelPrices></FuelPrices>
      <UsageStatistics />
      <CreateCar
        onCarCreated={handleCarCreated}
        isAuthenticated={isAuthenticated}
      />
      <Cars
        cars={cars}
        onUpdate={fetchCars}
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
      />
    </main>
  );
}
