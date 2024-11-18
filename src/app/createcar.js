// CreateCar.js
"use client";
import React, { useState } from "react";
import "./CreateCar.css";

function CreateCar({ onCarCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    kilometers: "",
    lastServiced: "",
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
          <input
            type="date"
            name="lastServiced"
            value={formData.lastServiced}
            onChange={handleChange}
            placeholder="Last Serviced Date"
            required
          />
          <button type="submit">Add Car</button>
        </form>
      )}
    </div>
  );
}

export default CreateCar;
