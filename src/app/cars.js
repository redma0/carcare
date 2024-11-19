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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
          <div key={car.id} className="bg-white p-4 rounded-lg shadow">
            <div className="value-box">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">
                  {car.make} {car.model}
                </h3>
                <button
                  onClick={() => handleDeleteClick(car)}
                  className="delete-car-btn"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="value-box">
                <div className="flex flex-col">
                  <span className="text-gray-600">Year</span>
                  <span>{car.year}</span>
                </div>
              </div>

              <div className="value-box">
                <div className="flex flex-col">
                  <span className="text-gray-600">Kilometers</span>
                  {editingId === car.id && editField === "kilometers" ? (
                    <span className="edit-field">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="edit-input"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSave(car.id)}
                          className="save-btn"
                        >
                          Save
                        </button>
                        <button onClick={handleCancel} className="cancel-btn">
                          Cancel
                        </button>
                      </div>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {car.kilometers}
                      <button
                        onClick={() => handleEdit(car, "kilometers")}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                    </span>
                  )}
                  {car.monthly_usage !== null && (
                    <span className="text-sm text-gray-500">
                      {new Date().toLocaleString("default", { month: "long" })}:{" "}
                      {Math.round(car.monthly_usage)} km/month
                    </span>
                  )}
                </div>
              </div>

              <div className="value-box">
                <div className="flex flex-col">
                  <span className="text-gray-600">Fuel Type</span>
                  <span>
                    {car.fuel_type.charAt(0).toUpperCase() +
                      car.fuel_type.slice(1)}
                  </span>
                </div>
              </div>

              <div className="value-box">
                <div className="flex flex-col">
                  <span className="text-gray-600">Fuel Economy</span>
                  <span className="text-success">
                    {car.fuel_economy} L/100km
                  </span>
                </div>
              </div>

              {car.monthly_fuel_cost && (
                <div className="value-box">
                  <div className="flex flex-col">
                    <span className="text-gray-600">Monthly Fuel Cost</span>
                    <span className="text-danger">
                      {Number(car.monthly_fuel_cost).toLocaleString("sr-RS", {
                        style: "currency",
                        currency: "RSD",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              )}

              <div className="value-box">
                <div className="flex flex-col">
                  <span className="text-gray-600">Last Serviced</span>
                  {editingId === car.id && editField === "lastServiced" ? (
                    <span className="edit-field">
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="edit-input"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSave(car.id)}
                          className="save-btn"
                        >
                          Save
                        </button>
                        <button onClick={handleCancel} className="cancel-btn">
                          Cancel
                        </button>
                      </div>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {new Date(car.last_serviced).toLocaleDateString()}
                      <button
                        onClick={() => handleEdit(car, "lastServiced")}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div className="value-box">
                <div
                  className={`flex flex-col ${
                    serviceStatus.daysLeft > 90
                      ? "text-success"
                      : serviceStatus.daysLeft > 30
                      ? "text-warning"
                      : "text-danger"
                  }`}
                >
                  <span className="text-gray-600">Next Service</span>
                  <span>{serviceStatus.nextServiceDate}</span>
                  <span className="text-sm">
                    {serviceStatus.isOverdue
                      ? `Overdue by ${Math.abs(serviceStatus.daysLeft)} days`
                      : `${serviceStatus.daysLeft} days remaining`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Cars;
