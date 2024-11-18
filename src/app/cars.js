"use client";
import { useState } from "react";
import "./cars.css";

function Cars({ cars, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const handleDeleteClick = (car) => {
    setDeleteConfirm(car);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch("/api/cars", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: deleteConfirm.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete car");
      }

      setDeleteConfirm(null);
      onUpdate();
    } catch (error) {
      console.error("Error deleting car:", error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="cars-container">
      {deleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Delete Car</h3>
            <p>
              Are you sure you want to delete the {deleteConfirm.make}{" "}
              {deleteConfirm.model}?
            </p>
            <div className="modal-buttons">
              <button onClick={handleDeleteConfirm} className="delete-btn">
                Delete
              </button>
              <button onClick={handleDeleteCancel} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {cars.map((car) => {
        const serviceStatus = calculateServiceDue(car.last_serviced);

        return (
          <div key={car.id} className="car-card">
            <div className="car-card-header">
              <h3>
                {car.make} {car.model}
              </h3>
              <button
                onClick={() => handleDeleteClick(car)}
                className="delete-car-btn"
              >
                ×
              </button>
            </div>

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
                {car.monthly_usage !== null && (
                  <p className="monthly-usage">
                    Average: {Math.round(car.monthly_usage)} km/month
                  </p>
                )}
              </div>

              <div className="car-detail-item">
                <p>
                  Fuel Type:{" "}
                  <span className="fuel-type">
                    {car.fuel_type.charAt(0).toUpperCase() +
                      car.fuel_type.slice(1)}
                  </span>
                </p>
              </div>

              <div className="car-detail-item">
                <p>
                  Fuel Economy:{" "}
                  <span className="fuel-economy">
                    {car.fuel_economy} L/100km
                  </span>
                </p>
              </div>

              {car.monthly_fuel_cost && (
                <div className="car-detail-item">
                  <p>
                    Monthly Fuel Cost:{" "}
                    <span className="monthly-cost">
                      {Number(car.monthly_fuel_cost).toLocaleString("sr-RS", {
                        style: "currency",
                        currency: "RSD",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </p>
                </div>
              )}

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
