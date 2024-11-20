"use client";
import React, { useState } from "react";
import "./createcar.css";

function CreateCar({ onCarCreated, isAuthenticated }) {
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
  });
  const canAddCar = isAuthenticated && userType === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please login to add a car");
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
    if (!isAuthenticated) {
      alert("Please login to add a car");
      return;
    }
    setIsOpen(!isOpen);
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
            <input
              type="date"
              name="lastServiced"
              value={formData.lastServiced}
              onChange={handleChange}
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
              <span className="economy-unit">L/100km</span>
            </div>
          </div>

          <div className="form-group">
            <label>Registration Expiration Date</label>
            <input
              type="date"
              name="registrationExpires"
              value={formData.registrationExpires}
              onChange={handleChange}
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
