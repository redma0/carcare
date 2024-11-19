"use client";
import React, { useState } from "react";
import "./createcar.css";

function CreateCar({ onCarCreated }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
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
    });
    setIsOpen(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="create-car-container">
      <button className="toggle-form-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Close Form" : "Add New Car"}
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="create-car-form">
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleChange}
            placeholder="Make"
            required
          />
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="Model"
            required
          />
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            placeholder="Year"
            required
          />
          <input
            type="number"
            name="kilometers"
            value={formData.kilometers}
            onChange={handleChange}
            placeholder="Kilometers"
            required
          />
          <div className="form-group">
            <label>Last Oil Change (km)</label>
            <input
              type="number"
              name="lastOilChange"
              value={formData.lastOilChange}
              onChange={handleChange}
              placeholder="Kilometers at Last Oil Change"
              required
            />
          </div>
          <div className="form-group">
            <label>Last Service</label>
            <input
              type="date"
              name="lastServiced"
              value={formData.lastServiced}
              onChange={handleChange}
              required
            />
          </div>
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
          <div className="form-group">
            <label>Registration Expiration</label>
            <input
              type="date"
              name="registrationExpires"
              value={formData.registrationExpires}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">Add Car</button>
        </form>
      )}
    </div>
  );
}

export default CreateCar;
