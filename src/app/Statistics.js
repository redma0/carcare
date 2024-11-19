// src/app/Statistics.js
"use client";
import { useState, useEffect } from "react";
import "./statistics.css";

function Statistics() {
  const [stats, setStats] = useState({
    monthTotal: { kilometers: 0, cost: 0 },
    yearTotal: { kilometers: 0, cost: 0 },
  });

  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/statistics");
        if (!response.ok) {
          throw new Error("Failed to fetch statistics");
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="statistics-container">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Year Total ({currentYear})</h3>
          <div className="stat-details">
            <p>
              Spent:{" "}
              <span className="highlight-cost">
                {stats.yearTotal.cost.toLocaleString("sr-RS")} RSD
              </span>
            </p>
            <p>
              Distance:{" "}
              <span className="highlight">
                {stats.yearTotal.kilometers.toLocaleString()} km
              </span>
            </p>
          </div>
        </div>

        <div className="stat-card">
          <h3>Month Total ({currentMonth})</h3>
          <div className="stat-details">
            <p>
              Spent:{" "}
              <span className="highlight-cost">
                {stats.monthTotal.cost.toLocaleString("sr-RS")} RSD
              </span>
            </p>
            <p>
              Distance:{" "}
              <span className="highlight">
                {stats.monthTotal.kilometers.toLocaleString()} km
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
