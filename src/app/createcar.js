"use client";
import { useState } from "react";

export default function CreateCar() {
  const [carData, setCarData] = useState({
    make: "",
    model: "",
    year: "",
    kilometers: "",
    lastServiced: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carData),
      });

      if (response.ok) {
        // Clear form after successful submission
        setCarData({
          make: "",
          model: "",
          year: "",
          kilometers: "",
          lastServiced: "",
        });
        alert("Car added successfully!");
      }
    } catch (error) {
      console.error("Error adding car:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCarData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6">Add New Car</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Make:</label>
          <input
            type="text"
            name="make"
            value={carData.make}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Model:</label>
          <input
            type="text"
            name="model"
            value={carData.model}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Year:</label>
          <input
            type="number"
            name="year"
            value={carData.year}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Kilometers:</label>
          <input
            type="number"
            name="kilometers"
            value={carData.kilometers}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Last Serviced:</label>
          <input
            type="date"
            name="lastServiced"
            value={carData.lastServiced}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Car
        </button>
      </form>
    </div>
  );
}
