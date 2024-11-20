"use client";

import { useState, useEffect } from "react";
import Login from "./login";
import "./cars.css";

function Cars({ cars, onUpdate }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showChangelog, setShowChangelog] = useState(null);
  const [changelog, setChangelog] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
    }
  };

  const renderAuthButton = () => {
    return (
      <button
        onClick={() =>
          isAuthenticated ? handleLogout() : setShowLoginModal(true)
        }
        className="auth-btn"
      >
        {isAuthenticated ? "Logout" : "Login"}
      </button>
    );
  };

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
  const canEdit = () => {
    return isAuthenticated;
  };
  const canAddRemove = () => {
    return isAuthenticated && user?.isAdmin;
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const fetchChangelog = async (carId) => {
    try {
      const response = await fetch(`/api/cars/update?carId=${carId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch changelog");
      }
      const data = await response.json();
      setChangelog(data);
      setShowChangelog(carId);
    } catch (error) {
      console.error("Error fetching changelog:", error);
    }
  };

  const handleEdit = (car, field) => {
    if (!canEdit()) {
      alert("Please login to edit");
      return;
    }
    setEditingId(car.id);
    setEditField(field);
    setEditValue(
      field === "kilometers"
        ? car.kilometers
        : field === "lastServiced"
        ? car.last_serviced
        : field === "registrationExpires"
        ? car.registration_expires
        : car.last_oil_change
    );
  };

  const handleSave = async (id) => {
    if (!canEdit()) {
      alert("Please login to save");
      return;
    }
    try {
      const updateData = {
        id: id,
        [editField === "registrationExpires"
          ? "registrationExpires"
          : editField === "lastOilChange"
          ? "lastOilChange"
          : editField]:
          editField === "kilometers" || editField === "lastOilChange"
            ? parseInt(editValue)
            : editValue,
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
    if (!canEdit()) {
      alert("Please login to delete");
      return;
    }
    setDeleteConfirm(car);
  };

  const handleDeleteConfirm = async () => {
    if (!canEdit()) {
      alert("Please login to delete");
      return;
    }
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
  const calculateRegistrationDue = (registrationExpires) => {
    const expiryDate = new Date(registrationExpires);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24)
    );

    return {
      daysLeft: daysUntilExpiry,
      expiryDate: expiryDate.toLocaleDateString(),
      isExpired: daysUntilExpiry < 0,
    };
  };

  const calculateOilChangeDue = (lastOilChangeKm, currentKm) => {
    const oilChangeInterval = 15000;
    const lastOilChange = lastOilChangeKm || 0;

    const kmSinceOilChange = currentKm - lastOilChangeKm;
    const kmUntilOilChange = oilChangeInterval - kmSinceOilChange;

    return {
      kmLeft: kmUntilOilChange,
      nextOilChangeKm: lastOilChangeKm + oilChangeInterval,
      isOverdue: kmUntilOilChange < 0,
    };
  };

  return (
    <div>
      <div className="auth-section">{renderAuthButton()}</div>

      {showLoginModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <Login
              onSuccess={() => {
                setIsAuthenticated(true);
                setShowLoginModal(false);
              }}
              onClose={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {cars.map((car) => {
          const serviceStatus = calculateServiceDue(car.last_serviced);
          const registrationStatus = calculateRegistrationDue(
            car.registration_expires
          );
          const oilChangeStatus = calculateOilChangeDue(
            car.last_oil_change,
            car.kilometers
          );

          return (
            <div key={car.id} className="bg-white p-4 rounded-lg shadow">
              <div className="value-box">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">
                    {car.make} {car.model}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchChangelog(car.id)}
                      className="changelog-btn"
                    >
                      History
                    </button>
                    {canAddRemove() && (
                      <button
                        onClick={() => handleDeleteClick(car)}
                        className="delete-car-btn"
                      >
                        ×
                      </button>
                    )}
                  </div>
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
                        {isAuthenticated && (
                          <button
                            onClick={() => handleEdit(car, "kilometers")}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                        )}
                      </span>
                    )}
                    {car.monthly_usage !== null && (
                      <span className="text-sm text-gray-500">
                        {new Date().toLocaleString("default", {
                          month: "long",
                        })}
                        : {Math.round(car.monthly_usage)} km/month
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
                  <div
                    className={`flex flex-col ${
                      oilChangeStatus.kmLeft > 5000
                        ? "text-success"
                        : oilChangeStatus.kmLeft > 1000
                        ? "text-warning"
                        : "text-danger"
                    }`}
                  >
                    <span className="text-gray-600">Oil Change</span>
                    {editingId === car.id && editField === "lastOilChange" ? (
                      <span className="edit-field">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="edit-input"
                          placeholder="Kilometers at Oil Change"
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
                        Last changed at:{" "}
                        {car.last_oil_change
                          ? car.last_oil_change.toLocaleString()
                          : "0"}{" "}
                        km
                        {isAuthenticated && (
                          <button
                            onClick={() => handleEdit(car, "lastOilChange")}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                        )}
                      </span>
                    )}
                    <span>
                      Next at:{" "}
                      {oilChangeStatus.nextOilChangeKm.toLocaleString()} km
                    </span>
                    <span className="text-sm">
                      {oilChangeStatus.isOverdue
                        ? `Overdue by ${Math.abs(oilChangeStatus.kmLeft)} km`
                        : `${oilChangeStatus.kmLeft} km remaining`}
                    </span>
                  </div>
                </div>

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
                        {isAuthenticated && (
                          <button
                            onClick={() => handleEdit(car, "lastServiced")}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                        )}
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

                <div className="value-box">
                  <div
                    className={`flex flex-col ${
                      registrationStatus.daysLeft > 90
                        ? "text-success"
                        : registrationStatus.daysLeft > 30
                        ? "text-warning"
                        : "text-danger"
                    }`}
                  >
                    <span className="text-gray-600">Registration Expires</span>
                    {editingId === car.id &&
                    editField === "registrationExpires" ? (
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
                        {registrationStatus.expiryDate}
                        {isAuthenticated && (
                          <button
                            onClick={() =>
                              handleEdit(car, "registrationExpires")
                            }
                            className="edit-btn"
                          >
                            Edit
                          </button>
                        )}
                      </span>
                    )}
                    <span className="text-sm">
                      {registrationStatus.isExpired
                        ? `Expired ${Math.abs(
                            registrationStatus.daysLeft
                          )} days ago`
                        : `${registrationStatus.daysLeft} days remaining`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

      {showChangelog && (
        <div className="modal-backdrop">
          <div className="modal-content changelog-modal">
            <div className="changelog-header">
              <h3>Update History</h3>
              <button
                onClick={() => setShowChangelog(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="changelog-content">
              {changelog.map((update, index) => (
                <div key={index} className="changelog-item">
                  <div className="changelog-date">
                    {new Date(update.update_timestamp).toLocaleString()}
                  </div>
                  <div className="changelog-type">
                    {update.update_type === "kilometers" ? (
                      <>
                        <p>
                          Kilometers updated from {update.previous_value} to{" "}
                          {update.new_value}
                        </p>
                        <p>Distance driven: {update.kilometers_driven} km</p>
                        <p>Fuel cost: {update.fuel_cost} RSD</p>
                        <p>Fuel price: {update.fuel_price} RSD/L</p>
                      </>
                    ) : update.update_type === "service" ? (
                      <p>
                        Service date updated from{" "}
                        {new Date(update.previous_value).toLocaleDateString()}{" "}
                        to {new Date(update.new_value).toLocaleDateString()}
                      </p>
                    ) : update.update_type === "registration" ? (
                      <p>
                        Registration date updated from{" "}
                        {new Date(update.previous_value).toLocaleDateString()}{" "}
                        to {new Date(update.new_value).toLocaleDateString()}
                      </p>
                    ) : update.update_type === "oil_change" ? (
                      <p>
                        Oil change updated from {update.previous_value} km to{" "}
                        {update.new_value} km
                      </p>
                    ) : (
                      <p>Unknown update type</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cars;
