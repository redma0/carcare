// src/app/login.js
"use client";
import { useState } from "react";

export default function Login({ onSuccess, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isRegistering) {
        // Handle registration
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Registration failed");
        }

        setIsRegistering(false);
        setError("Registration successful! Please log in.");
      } else if (isResetting) {
        // Handle password reset
        const response = await fetch("/api/auth/reset-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Password reset failed");
        }

        setError("Password reset email sent!");
        setIsResetting(false);
      } else {
        // Handle login
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }

        onSuccess();
        window.location.reload();
      }
    } catch (error) {
      setError(error.message);
      console.error("Error:", error);
    }
  };

  return (
    <div className="login-form">
      <div className="flex justify-between items-center mb-4">
        <h2>
          {isRegistering
            ? "Register"
            : isResetting
            ? "Reset Password"
            : "Login"}
        </h2>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Username field - shown for login and register */}
        {!isResetting && (
          <div className="mb-4">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        )}

        {/* Email field - shown for register and reset */}
        {(isRegistering || isResetting) && (
          <div className="mb-4">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        )}

        {/* Password field - shown for login and register */}
        {!isResetting && (
          <div className="mb-4">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {isRegistering
            ? "Register"
            : isResetting
            ? "Reset Password"
            : "Login"}
        </button>

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setIsResetting(false);
              setError("");
              setUsername("");
              setPassword("");
              setEmail("");
            }}
            className="text-blue-500 hover:underline"
          >
            {isRegistering ? "Back to Login" : "Register"}
          </button>

          {!isRegistering && (
            <button
              type="button"
              onClick={() => {
                setIsResetting(!isResetting);
                setIsRegistering(false);
                setError("");
                setUsername("");
                setPassword("");
                setEmail("");
              }}
              className="text-blue-500 hover:underline"
            >
              {isResetting ? "Back to Login" : "Reset Password"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
