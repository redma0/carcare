import { useState, useEffect } from "react";
import "./CarImage.css";

const CarImage = ({ carId, isAuthenticated, isOpen, onClose }) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      if (!carId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/cars/image/${carId}`);
        const data = await response.json();

        if (!mounted) return;

        if (response.ok && data.imageUrl) {
          setImage(data.imageUrl);
        } else {
          setError(data.error || "No image available");
          setImage(null);
        }
      } catch (error) {
        if (mounted) {
          setError("Failed to load image");
          setImage(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [carId]);

  const handleImageUpload = async (e) => {
    if (!isAuthenticated) {
      alert("Please login to upload images");
      return;
    }

    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setPreviewUrl(URL.createObjectURL(file));
      setIsLoading(true);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("carId", carId);

      try {
        const response = await fetch("/api/cars/image", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload image");
        }

        if (data.success && data.imageUrl) {
          setImage(data.imageUrl);
          setError(null);
          setShowUpload(false);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        setError(error.message || "Failed to upload image");
      } finally {
        setIsLoading(false);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="image-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Car Image</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="car-image-container">
          {isLoading ? (
            <div className="image-placeholder">Loading...</div>
          ) : error ? (
            <div className="image-placeholder">{error}</div>
          ) : (
            <img
              src={previewUrl || image || "/placeholder-car.png"}
              alt="Car"
              className="car-image"
              onError={(e) => {
                e.target.src = "/placeholder-car.png";
              }}
            />
          )}

          {isAuthenticated && !image && !showUpload && (
            <button className="upload-btn" onClick={() => setShowUpload(true)}>
              Add Image
            </button>
          )}

          {isAuthenticated && showUpload && (
            <label className="image-upload-label">
              Choose File
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="image-upload-input"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarImage;
