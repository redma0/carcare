"use client";
// src/app/UsageStatistics.js
import { useState, useEffect } from "react";
import "./usagestatistics.css";

function UsageStatistics() {
  const [statistics, setStatistics] = useState(null);
  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/statistics");
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // Fetch statistics every hour
    const interval = setInterval(fetchStatistics, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (!statistics) {
    return <div className="statistics-loading">Loading statistics...</div>;
  }

  return (
    <div className="statistics-container">
      <h2 className="statistics-title">Usage Statistics</h2>
      <div className="statistics-grid">
        <div className="statistics-card">
          <h3>{currentMonth} Distance</h3>
          <p className="stat-value">
            {Number(statistics.monthly_kilometers)?.toLocaleString()} km
          </p>
        </div>
        <div className="statistics-card">
          <h3>{currentMonth} Cost</h3>
          <p className="stat-value cost">
            {Number(statistics.monthly_cost)?.toLocaleString()} RSD
          </p>
        </div>
        <div className="statistics-card">
          <h3>Yearly Distance</h3>
          <p className="stat-value">
            {Number(statistics.yearly_kilometers)?.toLocaleString()} km
          </p>
        </div>
        <div className="statistics-card">
          <h3>Yearly Cost</h3>
          <p className="stat-value cost">
            {Number(statistics.yearly_cost)?.toLocaleString()} RSD
          </p>
        </div>
      </div>
    </div>
  );
}

export default UsageStatistics;
