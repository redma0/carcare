"use client";
// src/app/cars.js
import { useState } from "react";
import "./cars.css";

function Cars({ cars, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");

  const calculateServiceDue = (lastServicedDate) => {
    const oneYear = 365;
    const lastServiced = new Date(lastServicedDate);
    const nextService = new Date(lastServiced);
    nextService.setFullYear(nextService.getFullYear() + 1);

    const today = new Date();
    const daysUntilService = Math.ceil(
      (nextService - today) / (1000 * 60 * 60 * 24)
    );

    return {
      daysLeft: daysUntilService,
      nextServiceDate: nextService.toLocaleDateString(),
      isOverdue: daysUntilService < 0,
    };
  };

  const calculateMonthlyKilometers = (kilometers, kilometersUpdatedAt) => {
    if (!kilometersUpdatedAt) return "No data available";

    const updateDate = new Date(kilometersUpdatedAt);
    const today = new Date();
    const monthsDiff =
      (today.getFullYear() - updateDate.getFullYear()) * 12 +
      (today.getMonth() - updateDate.getMonth());

    if (monthsDiff < 1) return "Less than 1 month of data";

    const monthlyAverage = Math.round(kilometers / monthsDiff);
    return {
      average: monthlyAverage,
      months: monthsDiff,
    };
  };

  const handleEdit = (car, field) => {
    setEditingId(car.id);
    setEditField(field);
    setEditValue(field === "kilometers" ? car.kilometers : car.last_serviced);
  };

  const handleSave = async (id) => {
    try {
      const updateData = {
        id: id,
        [editField]:
          editField === "kilometers" ? parseInt(editValue) : editValue,
      };

      const response = await fetch("/api/cars", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${editField}`);
      }

      setEditingId(null);
      setEditField(null);
      onUpdate();
    } catch (error) {
      console.error(`Error updating ${editField}:`, error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditField(null);
    setEditValue("");
  };

  return (
    <div className="cars-container">
      {cars.map((car) => {
        const serviceStatus = calculateServiceDue(car.last_serviced);
        const monthlyKilometers = calculateMonthlyKilometers(
          car.kilometers,
          car.kilometers_updated_at
        );

        return (
          <div key={car.id} className="car-card">
            <h3>
              {car.make} {car.model}
            </h3>
            <div className="car-details">
              <p className="car-detail-item">Year: {car.year}</p>

              <div className="car-detail-item">
                <p>
                  Kilometers:{" "}
                  {editingId === car.id && editField === "kilometers" ? (
                    <span className="edit-field">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="edit-input"
                      />
                      <button
                        onClick={() => handleSave(car.id)}
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button onClick={handleCancel} className="cancel-btn">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <span>
                      {car.kilometers}{" "}
                      <button
                        onClick={() => handleEdit(car, "kilometers")}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                    </span>
                  )}
                </p>
                {typeof monthlyKilometers === "object" && (
                  <p className="monthly-average">
                    Average: {monthlyKilometers.average} km/month
                    <span className="data-period">
                      (over {monthlyKilometers.months} months)
                    </span>
                  </p>
                )}
              </div>

              <div className="car-detail-item">
                <p>
                  Last Serviced:{" "}
                  {editingId === car.id && editField === "lastServiced" ? (
                    <span className="edit-field">
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="edit-input"
                      />
                      <button
                        onClick={() => handleSave(car.id)}
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button onClick={handleCancel} className="cancel-btn">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <span>
                      {new Date(car.last_serviced).toLocaleDateString()}{" "}
                      <button
                        onClick={() => handleEdit(car, "lastServiced")}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                    </span>
                  )}
                </p>
              </div>

              <div
                className={`car-detail-item service-status ${
                  serviceStatus.isOverdue ? "overdue" : ""
                }`}
              >
                <p>Next Service:</p>
                <p className="service-date">{serviceStatus.nextServiceDate}</p>
                <p className="countdown">
                  {serviceStatus.isOverdue
                    ? `Overdue by ${Math.abs(serviceStatus.daysLeft)} days`
                    : `${serviceStatus.daysLeft} days remaining`}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Cars;
