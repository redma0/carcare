"use client";

import { useState, useEffect } from "react";
import Login from "./login";
import "./cars.css";
import CarImage from "./components/CarImage";

function Cars({ cars, onUpdate }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showChangelog, setShowChangelog] = useState(null);
  const [changelog, setChangelog] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedCarImage, setSelectedCarImage] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (showChangelog) {
      fetchChangelog(showChangelog);
    }
  }, [cars]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB");
  };
  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
      setUser(data.user); // Store the user data
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUser(null);
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
    const lastServiced = new Date(lastServicedDate); // Keep as Date object
    const nextService = new Date(lastServiced); // Keep as Date object
    nextService.setFullYear(nextService.getFullYear() + 1);

    const today = new Date(); // Keep as Date object
    const daysUntilService = Math.ceil(
      (nextService - today) / (1000 * 60 * 60 * 24)
    );

    return {
      daysLeft: daysUntilService,
      nextServiceDate: formatDate(nextService), // Format only when displaying
      isOverdue: daysUntilService < 0,
    };
  };
  const canEdit = () => {
    return isAuthenticated;
  };
  const canAddRemove = () => {
    console.log("User state:", user);
    const hasPermission = isAuthenticated && user?.isAdmin === true;
    console.log("Has admin permission:", hasPermission);
    return hasPermission;
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

  const handleEdit = (id, field, currentValue) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Only allow tire km editing for admins
    if (
      (field === "summerTireKm" || field === "winterTireKm") &&
      !user?.isAdmin
    ) {
      alert("Only administrators can edit tire kilometers directly");
      return;
    }

    setEditingId(id);
    setEditField(field);
    setEditValue(currentValue?.toString() || "");
  };

  const checkTireSeasonWarning = (tireType) => {
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-based
    return (
      (tireType === "summer" && currentMonth >= 10) || // October or later
      (tireType === "winter" && currentMonth >= 3 && currentMonth < 10) // March to September
    );
  };

  const calculateTireKilometers = (car) => {
    return {
      summerKm: car.summer_tire_km || 0,
      winterKm: car.winter_tire_km || 0,
    };
  };

  const handleSave = async (id, field, value) => {
    if (!canEdit()) {
      alert("Please login to save");
      return;
    }

    const currentCar = cars.find((car) => car.id === id);
    if (!currentCar) return;

    try {
      let updateData = {
        id: id,
      };

      // Set the correct field in updateData
      switch (field) {
        case "kilometers":
          updateData.kilometers = parseInt(value);
          break;
        case "lastServiced":
          updateData.lastServiced = value;
          break;
        case "registrationExpires":
          updateData.registrationExpires = value;
          break;
        case "lastOilChange":
          updateData.lastOilChange = parseInt(value);
          break;
        case "tireType":
          updateData.tireType = value.toLowerCase();
          break;
        case "resetTires":
          updateData.field = "resetTires";
          updateData.tireType = value; // "summer" or "winter"
          break;
        case "summerTireKm":
          if (!user?.isAdmin) return;
          updateData.field = "summerTireKm";
          updateData.value = parseInt(value);
          break;
        case "winterTireKm":
          if (!user?.isAdmin) return;
          updateData.field = "winterTireKm";
          updateData.value = parseInt(value);
          break;
        default:
          console.error("Unknown field:", field);
          return;
      }

      const response = await fetch("/api/cars", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${field}`);
      }

      // Reset edit state
      setEditingId(null);
      setEditField(null);
      setEditValue("");

      // Force refresh of car data
      await onUpdate();

      // Refresh changelog if it's open
      if (showChangelog === id) {
        await fetchChangelog(id);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
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
    if (!canAddRemove()) {
      alert("Only administrators can delete cars");
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

      const data = await response.json(); // Make sure to await the JSON parsing

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete car");
      }

      console.log("Delete successful:", data.message);
      setDeleteConfirm(null);
      onUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Failed to delete car: ${error.message}`);
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
      expiryDate: formatDate(expiryDate),
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
            <div key={car.id} className="car-card">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold">{car.make}</h3>
                  <h4 className="text-md">{car.model}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary ml-14">
                    {car.license_plate}
                  </span>
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

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCards((prev) => ({
                    ...prev,
                    [car.id]: !prev[car.id],
                  }));
                }}
                className="w-full mt-2 text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center"
              >
                {expandedCards[car.id] ? "Show Less ▼" : "Show More ▶"}
              </button>

              {expandedCards[car.id] && (
                <div className="mt-4 space-y-3 border-t pt-4">
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
                              onClick={() =>
                                handleSave(car.id, editField, editValue)
                              }
                              className="save-btn"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {car.kilometers}
                          {isAuthenticated && (
                            <button
                              onClick={() =>
                                handleEdit(car.id, "kilometers", car.kilometers)
                              }
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
                          {Number(car.monthly_fuel_cost).toLocaleString(
                            "sr-RS",
                            {
                              style: "currency",
                              currency: "RSD",
                              maximumFractionDigits: 0,
                            }
                          )}
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
                              onClick={() =>
                                handleSave(car.id, editField, editValue)
                              }
                              className="save-btn"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="cancel-btn"
                            >
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
                              onClick={() =>
                                handleEdit(
                                  car.id,
                                  "lastOilChange",
                                  car.last_oil_change
                                )
                              }
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
                              onClick={() =>
                                handleSave(car.id, editField, editValue)
                              }
                              className="save-btn"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {formatDate(car.last_serviced)}
                          {isAuthenticated && (
                            <button
                              onClick={() =>
                                handleEdit(
                                  car.id,
                                  "lastServiced",
                                  car.last_serviced
                                )
                              }
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
                          ? `Overdue by ${Math.abs(
                              serviceStatus.daysLeft
                            )} days`
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
                      <span className="text-gray-600">
                        Registration Expires
                      </span>
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
                              onClick={() =>
                                handleSave(car.id, editField, editValue)
                              }
                              className="save-btn"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="cancel-btn"
                            >
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
                                handleEdit(
                                  car.id,
                                  "registrationExpires",
                                  car.registration_expires
                                )
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
                    <div className="mt-4 text-sm text-gray-400">
                      VIN: {car.vin}
                    </div>
                  </div>

                  <div className="car-image-section">
                    <button
                      onClick={() => setSelectedCarImage(car.id)}
                      className={`image-btn ${
                        car.image_url ? "view-btn" : "add-btn"
                      }`}
                    >
                      {car.image_url ? "View Image" : "Add Image"}
                    </button>
                  </div>

                  <div className="value-box">
                    <div
                      className={`flex flex-col ${
                        checkTireSeasonWarning(car.tire_type)
                          ? "text-danger"
                          : ""
                      }`}
                    >
                      <span className="text-gray-600">Tire Type</span>
                      {editingId === car.id && editField === "tireType" ? (
                        <span className="edit-field">
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="edit-input"
                          >
                            <option value="summer">Summer</option>
                            <option value="winter">Winter</option>
                          </select>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() =>
                                handleSave(car.id, editField, editValue)
                              }
                              className="save-btn"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-2">
                            {car.tire_type
                              ? car.tire_type.charAt(0).toUpperCase() +
                                car.tire_type.slice(1)
                              : "Not set"}
                            {isAuthenticated && (
                              <button
                                onClick={() =>
                                  handleEdit(car.id, "tireType", car.tire_type)
                                }
                                className="edit-btn"
                              >
                                Edit
                              </button>
                            )}
                          </span>
                          {checkTireSeasonWarning(car.tire_type) && (
                            <span className="text-sm text-danger">
                              Time to change to{" "}
                              {car.tire_type === "summer" ? "winter" : "summer"}{" "}
                              tires
                            </span>
                          )}
                          <div className="text-sm mt-1">
                            <div className="flex justify-between items-center">
                              <div>
                                Summer Tires:{" "}
                                {editingId === car.id &&
                                editField === "summerTireKm" ? (
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    onBlur={() =>
                                      handleSave(
                                        car.id,
                                        "summerTireKm",
                                        editValue
                                      )
                                    }
                                    onKeyPress={(e) =>
                                      e.key === "Enter" &&
                                      handleSave(
                                        car.id,
                                        "summerTireKm",
                                        editValue
                                      )
                                    }
                                    className="w-20 px-1 border rounded"
                                  />
                                ) : (
                                  <span
                                    onClick={() =>
                                      user?.isAdmin &&
                                      handleEdit(
                                        car.id,
                                        "summerTireKm",
                                        car.summer_tire_km
                                      )
                                    }
                                    className={
                                      user?.isAdmin
                                        ? "cursor-pointer hover:underline"
                                        : ""
                                    }
                                  >
                                    {car.summer_tire_km || 0} km
                                  </span>
                                )}
                              </div>
                              {isAuthenticated && (
                                <button
                                  onClick={() =>
                                    handleSave(car.id, "resetTires", "summer")
                                  }
                                  className="reset-btn text-xs"
                                >
                                  Reset
                                </button>
                              )}
                            </div>

                            <div className="flex justify-between items-center">
                              <div>
                                Winter Tires:{" "}
                                {editingId === car.id &&
                                editField === "winterTireKm" ? (
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    onBlur={() =>
                                      handleSave(
                                        car.id,
                                        "winterTireKm",
                                        editValue
                                      )
                                    }
                                    onKeyPress={(e) =>
                                      e.key === "Enter" &&
                                      handleSave(
                                        car.id,
                                        "winterTireKm",
                                        editValue
                                      )
                                    }
                                    className="w-20 px-1 border rounded"
                                  />
                                ) : (
                                  <span
                                    onClick={() =>
                                      user?.isAdmin &&
                                      handleEdit(
                                        car.id,
                                        "winterTireKm",
                                        car.winter_tire_km
                                      )
                                    }
                                    className={
                                      user?.isAdmin
                                        ? "cursor-pointer hover:underline"
                                        : ""
                                    }
                                  >
                                    {car.winter_tire_km || 0} km
                                  </span>
                                )}
                              </div>
                              {isAuthenticated && (
                                <button
                                  onClick={() =>
                                    handleSave(car.id, "resetTires", "winter")
                                  }
                                  className="reset-btn text-xs"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                    {formatDate(update.update_timestamp)}
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
                        {formatDate(update.previous_value)} to{" "}
                        {formatDate(update.new_value)}
                      </p>
                    ) : update.update_type === "registration" ? (
                      <p>
                        Registration date updated from{" "}
                        {formatDate(update.previous_value)} to{" "}
                        {formatDate(update.new_value)}
                      </p>
                    ) : update.update_type === "oil_change" ? (
                      <p>
                        Oil change updated from {update.previous_value} km to{" "}
                        {update.new_value} km
                      </p>
                    ) : update.update_type === "tire_type" ? (
                      <>
                        <p>
                          Tire type changed from{" "}
                          {update.previous_value || "Not set"} to{" "}
                          {update.new_value}
                        </p>
                        <p>
                          Distance driven on previous tires:{" "}
                          {update.kilometers_driven || 0} km
                        </p>
                        <p>Current odometer: {update.kilometers} km</p>
                      </>
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

      {selectedCarImage && (
        <CarImage
          carId={selectedCarImage}
          isAuthenticated={isAuthenticated}
          isOpen={!!selectedCarImage}
          onClose={() => setSelectedCarImage(null)}
        />
      )}
    </div>
  );
}

export default Cars;
