"use client";
// src/app/fuelprices.js
import { useState, useEffect } from "react";
import "./fuelprices.css";

function FuelPrices() {
  const [prices, setPrices] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/fuel");
      if (!response.ok) {
        throw new Error("Failed to fetch fuel prices");
      }
      const data = await response.json();
      setPrices(data);
      setLastUpdated(new Date(data.created_at).toLocaleString());
    } catch (error) {
      console.error("Error fetching fuel prices:", error);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Fetch prices every hour
    const interval = setInterval(fetchPrices, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (!prices) {
    return <div className="fuel-prices-loading">Loading fuel prices...</div>;
  }

  return (
    <div className="fuel-prices-container">
      <h2 className="fuel-prices-title">Current Fuel Prices</h2>
      <div className="fuel-prices-grid">
        <div className="fuel-price-card">
          <h3>95 Octane</h3>
          <p className="price">{Number(prices.price_95)?.toFixed(2)} RSD</p>
        </div>
        <div className="fuel-price-card">
          <h3>Diesel</h3>
          <p className="price">{Number(prices.price_diesel)?.toFixed(2)} RSD</p>
        </div>
        <div className="fuel-price-card">
          <h3>LPG</h3>
          <p className="price">{Number(prices.price_lpg)?.toFixed(2)} RSD</p>
        </div>
      </div>
      <p className="last-updated">Last updated: {lastUpdated}</p>
    </div>
  );
}

export default FuelPrices;
