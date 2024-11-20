"use client";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./createcar.css";

function CreateCar({ onCarCreated, isAuthenticated, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    kilometers: "",
    lastServiced: "",
    fuelType: "diesel",
    fuelEconomy: "",
    registrationExpires: "",
    lastOilChange: "",
    licensePlate: "",
    vin: "",
  });
  const canAddCar = isAuthenticated && user?.isAdmin === true;
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString("en-GB") : "";
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please login to add a car");
      return;
    }

    // Check for duplicate VIN
    const vinExists = await checkDuplicateVIN(formData.vin);
    if (vinExists) {
      alert("This VIN already exists. Please enter a unique VIN.");
      return;
    }

    try {
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          initial_kilometers: formData.kilometers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create car");
      }

      onCarCreated(formData);
      setFormData({
        make: "",
        model: "",
        year: "",
        kilometers: "",
        lastServiced: "",
        fuelType: "diesel",
        fuelEconomy: "",
        registrationExpires: "",
        lastOilChange: "",
        licensePlate: "",
        vin: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating car:", error);
      alert("Failed to create car. Please try again.");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleToggleForm = () => {
    if (!canAddCar) {
      alert("Only administrators can add new cars");
      return;
    }
    setIsOpen(!isOpen);
  };

  const checkDuplicateVIN = async (vin) => {
    try {
      const response = await fetch(`/api/cars?vin=${vin}`); // Adjust the endpoint as necessary
      if (!response.ok) {
        throw new Error("Failed to check VIN");
      }
      const data = await response.json();
      return data.exists; // Assuming your API returns { exists: true/false }
    } catch (error) {
      console.error("Error checking VIN:", error);
      return false; // Default to false if there's an error
    }
  };

  return (
    <div className="create-car-container">
      <button
        className={`toggle-form-btn ${!canAddCar ? "disabled" : ""}`}
        onClick={handleToggleForm}
        disabled={!canAddCar}
      >
        {isOpen ? "Close Form" : "Add New Car"}
      </button>

      {isOpen && isAuthenticated && (
        <form onSubmit={handleSubmit} className="create-car-form">
          <div className="form-group">
            <label>Make</label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              placeholder="Make"
              required
            />
          </div>

          <div className="form-group">
            <label>Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Model"
              required
            />
          </div>
          <div className="form-group">
            <label>License Plate</label>
            <input
              type="text"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              placeholder="License Plate"
              required
            />
          </div>

          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              placeholder="Year"
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>

          <div className="form-group">
            <label>Current Kilometers</label>
            <input
              type="number"
              name="kilometers"
              value={formData.kilometers}
              onChange={handleChange}
              placeholder="Kilometers"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Last Oil Change (km)</label>
            <input
              type="number"
              name="lastOilChange"
              value={formData.lastOilChange}
              onChange={handleChange}
              placeholder="Kilometers at Last Oil Change"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Last Service Date</label>
            <DatePicker
              selected={
                formData.lastServiced ? new Date(formData.lastServiced) : null
              }
              onChange={(date) => {
                setFormData({
                  ...formData,
                  lastServiced: date ? date.toISOString().split("T")[0] : "",
                });
              }}
              dateFormat="dd/MM/yyyy"
              className="date-input"
              placeholderText="Select date"
              required
            />
          </div>

          <div className="form-group">
            <label>Fuel Type</label>
            <select
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              required
              className="fuel-select"
            >
              <option value="diesel">Diesel</option>
              <option value="95">95 Octane</option>
              <option value="lpg">LPG</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fuel Economy (L/100km)</label>
            <div className="economy-input-group">
              <input
                type="number"
                name="fuelEconomy"
                value={formData.fuelEconomy}
                onChange={handleChange}
                placeholder="Fuel Economy"
                step="0.1"
                min="0"
                required
              />
              <span className="economy-unit"></span>
            </div>
          </div>

          <div className="form-group">
            <label>Registration Expiration Date</label>
            <DatePicker
              selected={
                formData.registrationExpires
                  ? new Date(formData.registrationExpires)
                  : null
              }
              onChange={(date) => {
                setFormData({
                  ...formData,
                  registrationExpires: date
                    ? date.toISOString().split("T")[0]
                    : "",
                });
              }}
              dateFormat="dd/MM/yyyy"
              className="date-input"
              placeholderText="Select date"
              required
            />
          </div>
          <div className="form-group">
            <label>VIN Number</label>
            <input
              type="text"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              placeholder="Vehicle Identification Number"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Add Car
          </button>
        </form>
      )}
    </div>
  );
}

export default CreateCar;
