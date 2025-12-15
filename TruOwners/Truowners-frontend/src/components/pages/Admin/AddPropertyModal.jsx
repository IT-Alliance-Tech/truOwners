import React, { useState, useEffect } from "react";
import { buildApiUrl } from "../../../config/api";
import { uploadFile, generateFileName } from "../../../config/supabase";
import {
  handleApiError,
  getErrorMessage,
  validateApiResponse,
} from "../../../utils/errorHandler";
import "../Owner/Owner.css";
import "../Auth/Auth.css";
import Compressor from "compressorjs";

const AddPropertyModal = ({
  onClose,
  onSuccess,
  token,
  mode = "create",
  property,
}) => {
  const isEdit = mode === "edit";

  const [ownerData, setOwnerData] = useState({
    email: "",
    name: "",
    phone: "",
    idProofType: "",
    idProofNumber: "",
    idProofImageUrl: "",
    electricityBill: "",
    electricityBillImageUrl: "",
  });

  const [propertyData, setPropertyData] = useState({
    title: "",
    description: "",
    location: {
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    },
    listingType: "rent",
    price: "",
    rent: "",
    deposit: "",
    propertyType: "apartment",
    bedrooms: "",
    bathrooms: "",
    area: "",
    amenities: [],
    images: [],
  });

  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState("");
  const [electricityBillFile, setElectricityBillFile] = useState(null);
  const [electricityBillPreview, setElectricityBillPreview] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownerExists, setOwnerExists] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(false);

  const amenitiesList = [
    "WiFi",
    "Parking",
    "Gym",
    "Swimming Pool",
    "Security",
    "Elevator",
    "Balcony",
    "Garden",
    "Furnished",
    "Air Conditioning",
    "Heating",
    "Laundry",
    "Pet Friendly",
    "Near Metro",
    "Shopping Mall",
    "Hospital",
  ];

  const idProofTypes = ["Aadhar", "Passport", "Driving License", "Voter ID"];

  const allowedTypes = {
    images: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    videos: ["video/mp4", "video/webm", "video/mov", "video/avi"],
  };

  // 🔹 Prefill when in edit mode
  useEffect(() => {
    if (!isEdit || !property) return;

    // Owner
    const owner = property.owner || {};

    setOwnerData({
      email: owner.email || owner.user?.email || "",
      name: owner.name || owner.user?.name || "",
      phone:
        owner.phone ||
        owner.user?.phone ||
        owner.mobile ||
        owner.user?.mobile ||
        "",
      idProofType:
        owner.idProofType ||
        owner.id_proof_type ||
        owner.user?.idProofType ||
        owner.user?.id_proof_type ||
        "",
      idProofNumber:
        owner.idProofNumber ||
        owner.id_proof_number ||
        owner.user?.idProofNumber ||
        owner.user?.id_proof_number ||
        "",
      idProofImageUrl:
        owner.idProofImageUrl ||
        owner.id_proof_image_url ||
        owner.id_proof_image ||
        owner.user?.idProofImageUrl ||
        owner.user?.id_proof_image_url ||
        owner.user?.id_proof_image ||
        "",
      electricityBill:
        owner.electricityBill ||
      
        owner.electricity_bill_number ||
        owner.user?.electricityBill ||
        
        "",
      electricityBillImageUrl:
        owner.electricityBillImageUrl ||
        owner.electricity_bill_image_url ||
        owner.user?.electricityBillImageUrl ||
        "",
    });

    // If property has an owner object (existing owner), mark as exists
    setOwnerExists(!!owner._id || !!owner.email);

    // Set previews immediately
    setIdProofPreview(
      owner.idProofImageUrl ||
      owner.id_proof_image_url ||
      owner.id_proof_image ||
      owner.user?.idProofImageUrl ||
      owner.user?.id_proof_image_url ||
      ""
    );

    setElectricityBillPreview(
      owner.electricityBillImageUrl ||
      owner.electricity_bill_image_url ||
      owner.user?.electricityBillImageUrl ||
      ""
    );

    // Property
    setPropertyData({
      title: property.title || "",
      description: property.description || "",
      location: {
        address: property.location?.address || "",
        city: property.location?.city || "",
        state: property.location?.state || "",
        country: property.location?.country || "",
        pincode: property.location?.pincode || "",
      },
      listingType: property.listingType || "rent",
      price: property.price || "",
      rent: property.rent || "",
      deposit: property.deposit || "",
      propertyType: property.propertyType || "apartment",
      bedrooms: property.bedrooms || "",
      bathrooms: property.bathrooms || "",
      area: property.area || "",
      amenities: property.amenities || [],
      images: property.images || [],
    });

    const existingImgs = (property.images || []).map((url, idx) => ({
      id: `existing-${idx}`,
      file: null,
      type: "image",
      url,
      name: url.split("/").pop(),
      existing: true,
    }));

    setMediaPreviews((prev) => {
      const freshUploads = prev.filter((p) => !p.existing);
      return [...existingImgs, ...freshUploads];
    });

    setMediaFiles([]);
  }, [isEdit, property]);

  const handleEmailBlur = async () => {
    if (isEdit) return;
    if (!ownerData.email || !ownerData.email.includes("@")) return;

    setCheckingOwner(true);
    setError("");
    try {
      const response = await fetch(
        buildApiUrl(`/admin/check-owner?email=${ownerData.email}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data.exists) {
          setOwnerExists(true);

          setOwnerData((prev) => ({
            ...prev,
            name: data.data.owner?.name || "",
            phone: data.data.owner?.phone || "",
            idProofType: data.data.owner?.idProofType || "",
            idProofNumber: data.data.owner?.idProofNumber || "",
            idProofImageUrl: data.data.owner?.idProofImageUrl || "",
            electricityBill: data.data.owner?.electricityBill || data.data.owner?.electricityBill || "",
            electricityBillImageUrl: data.data.owner?.electricityBillImageUrl || "",
          }));

          setIdProofPreview(data.data.owner?.idProofImageUrl || "");
          setElectricityBillPreview(data.data.owner?.electricityBillImageUrl || "");

          setError("✓ Owner found. Property will be linked to existing owner.");
        } else {
          setOwnerExists(false);

          setOwnerData((prev) => ({
            ...prev,
            name: "",
            phone: "",
            idProofType: "",
            idProofNumber: "",
            idProofImageUrl: "",
            electricityBill: "",
            electricityBillImageUrl: "",
          }));

          setIdProofPreview("");
          setElectricityBillPreview("");
          setError("");
        }
      }
    } catch (err) {
      console.error("Error checking owner:", err);
      setError("Failed to check owner. Please try again.");
    } finally {
      setCheckingOwner(false);
    }
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwnerData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    setPropertyData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setPropertyData((prev) => ({
      ...prev,
      location: { ...prev.location, [name]: value },
    }));
    if (error) setError("");
  };

  const handleAmenityToggle = (amenity) => {
    setPropertyData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleIdProofChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!allowedTypes.images.includes(file.type)) {
      setError("ID Proof must be an image file");
      return;
    }

    setIdProofFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setIdProofPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleElectricityBillChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!allowedTypes.images.includes(file.type)) {
      setError("Electricity Bill must be an image file");
      return;
    }

    setElectricityBillFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setElectricityBillPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file) => {
      const isImage = allowedTypes.images.includes(file.type);
      const isVideo = allowedTypes.videos.includes(file.type);

      if (!isImage && !isVideo) {
        setError(`${file.name}: Invalid file type`);
        return;
      }

      if (isImage) {
        new Compressor(file, {
          quality: 0.6,
          maxWidth: 1920,
          maxHeight: 1080,
          success(compressedFile) {
            addValidFile(compressedFile, "image");
          },
          error(err) {
            console.error("Compression failed:", err);
            setError(`${file.name}: Compression failed`);
          },
        });
      } else if (isVideo) {
        addValidFile(file, "video");
      }
    });

    e.target.value = "";
  };

  const addValidFile = (file, type) => {
    setMediaFiles((prev) => [...prev, file]);
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = {
        id: Date.now() + Math.random(),
        file,
        type,
        url: event.target.result,
        name: file.name,
      };
      setMediaPreviews((prev) => [...prev, preview]);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (id) => {
    const preview = mediaPreviews.find((p) => p.id === id);
    if (!preview) return;
    if (preview.existing) {
      setPropertyData((prev) => ({
        ...prev,
        images: (prev.images || []).filter((url) => url !== preview.url),
      }));
    } else {
      setMediaFiles((prevFiles) => prevFiles.filter((f) => f !== preview.file));
    }

    setMediaPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  const uploadAllMedia = async () => {
    if (mediaFiles.length === 0) return [];

    setUploadingMedia(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const fileName = generateFileName(
          file.name,
          propertyData.title || "property"
        );
        const uploadResult = await uploadFile(file, fileName);

        if (uploadResult.success) {
          uploadedUrls.push(uploadResult.url);
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Failed to upload property media");
      return [];
    } finally {
      setUploadingMedia(false);
    }
  };

  const validateForm = () => {
    if (!propertyData.title.trim()) {
      setError("Property title is required");
      return false;
    }
    if (
      !propertyData.location.address.trim() ||
      !propertyData.location.city.trim() ||
      !propertyData.location.state.trim() ||
      !propertyData.location.country.trim()
    ) {
      setError("Complete location information is required");
      return false;
    }

    // For commercial properties, area is required
    if (propertyData.listingType === "commercial") {
      if (!propertyData.area || propertyData.area <= 0) {
        setError("Area (sq ft) is required for commercial listings");
        return false;
      }
      if (!propertyData.price || propertyData.price <= 0) {
        setError("Valid commercial price is required");
        return false;
      }
    } else if (propertyData.listingType === "rent") {
      if (!propertyData.rent || propertyData.rent <= 0) {
        setError("Valid rent amount is required");
        return false;
      }
    } else {
      if (!propertyData.price || propertyData.price <= 0) {
        setError("Valid amount is required");
        return false;
      }
    }

    // Images validation
    if (!isEdit && mediaFiles.length === 0) {
      setError("At least one property image is required");
      return false;
    }

    if (
      isEdit &&
      mediaFiles.length === 0 &&
      (!propertyData.images || propertyData.images.length === 0)
    ) {
      setError("At least one property image is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Upload ID proof if new file selected
      let idProofUrl = ownerData.idProofImageUrl;
      if (idProofFile) {
        const idProofFileName = generateFileName(
          idProofFile.name,
          `idproof_${ownerData.email || "owner"}`
        );
        const idProofResult = await uploadFile(idProofFile, idProofFileName);
        if (!idProofResult.success) {
          throw new Error("Failed to upload ID proof");
        }
        idProofUrl = idProofResult.url;
      }

      // Upload electricity bill if new file selected
      let electricityBillUrl = ownerData.electricityBillImageUrl;
      if (electricityBillFile) {
        const electricityBillFileName = generateFileName(
          electricityBillFile.name,
          `electricitybill_${ownerData.email || "owner"}`
        );
        const electricityBillResult = await uploadFile(electricityBillFile, electricityBillFileName);
        if (!electricityBillResult.success) {
          throw new Error("Failed to upload electricity bill");
        }
        electricityBillUrl = electricityBillResult.url;
      }

      // Upload new media
      const mediaUrls = await uploadAllMedia();

      const finalImages = isEdit
        ? [...(propertyData.images || []), ...mediaUrls]
        : mediaUrls;

      const isCommercial = propertyData.listingType === "commercial";

      // Build property object conditionally
      const propertyPayload = {
        title: propertyData.title,
        description: propertyData.description,
        location: propertyData.location,
        listingType: propertyData.listingType,
        area: parseInt(propertyData.area) || 0,
        amenities: propertyData.amenities,
        images: finalImages,
      };

      // Add rent/deposit for rent type
      if (propertyData.listingType === 'rent') {
        propertyPayload.rent = parseInt(propertyData.rent) || 0;
        propertyPayload.deposit = parseInt(propertyData.deposit) || 0;
      } else {
        // Add price for sell/lease/commercial
        propertyPayload.price = parseInt(propertyData.price) || 0;
      }

      // Add property details only for non-commercial
      if (!isCommercial) {
        propertyPayload.propertyType = propertyData.propertyType || "apartment";
        propertyPayload.bedrooms = parseInt(propertyData.bedrooms) || 0;
        propertyPayload.bathrooms = parseInt(propertyData.bathrooms) || 0;
      }

      const ownerPayload = {
        email: ownerData.email,
        name: ownerData.name,
        phone: ownerData.phone,
        idProofType: ownerData.idProofType,
        idProofNumber: ownerData.idProofNumber,
        idProofImageUrl: idProofUrl,
      };

      // Add electricity bill only if provided
      if (ownerData.electricityBill) {
        ownerPayload.electricityBill = ownerData.electricityBill;
      }
      if (electricityBillUrl) {
        ownerPayload.electricityBillImageUrl = electricityBillUrl;
      }

      const payload = isEdit
        ? {
            property: propertyPayload,
            owner: ownerPayload,
          }
        : {
            owner: ownerPayload,
            property: propertyPayload,
          };

      const url = isEdit
        ? buildApiUrl(`/admin/properties/${property.id}`)
        : buildApiUrl("/admin/properties");

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
        validateApiResponse(data);
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error?.message || handleApiError(null, response));
      }

      if (data.success) {
        onSuccess && onSuccess(data.data);
        onClose();
      } else {
        throw new Error(getErrorMessage(data));
      }
    } catch (err) {
      console.error("Add/Edit property error:", err);
      setError(err.message || "Failed to save property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isCommercial = propertyData.listingType === "commercial";

  return (
    <div className="auth-overlay">
      <div className="auth-modal property-modal">
        <div className="auth-header">
          <h2>
            {isEdit ? "Edit Property Details" : "Add Property with Owner"}
          </h2>

          {!isEdit && <p>Create a new property and owner profile</p>}

          <button className="auth-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="auth-form property-form" onSubmit={handleSubmit}>
          {error && (
            <div
              className={error.startsWith("✓") ? "auth-success" : "auth-error"}
            >
              <span>{error.startsWith("✓") ? "✓" : "⚠️"}</span>
              <div style={{ whiteSpace: "pre-line" }}>{error}</div>
            </div>
          )}

          {/* Owner Details Section */}
          <div className="form-section">
            <h3 className="section-title">Owner Details</h3>
            <p className="section-subtitle">Enter owner information</p>

            <div className="form-group">
              <label htmlFor="email">Owner Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={ownerData.email}
                onChange={handleOwnerChange}
                onBlur={!isEdit ? handleEmailBlur : undefined}
                placeholder="owner@example.com"
                disabled={checkingOwner}
              />
              {checkingOwner && <small>Checking...</small>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Owner Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={ownerData.name}
                  onChange={handleOwnerChange}
                  placeholder="John Doe"
                  disabled={ownerExists && !isEdit}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Owner Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={ownerData.phone}
                  onChange={handleOwnerChange}
                  placeholder="+1234567890"
                  disabled={ownerExists && !isEdit}
                />
              </div>
            </div>

            {(isEdit || !ownerExists) && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="idProofType">ID Proof Type</label>
                    <select
                      id="idProofType"
                      name="idProofType"
                      value={ownerData.idProofType}
                      onChange={handleOwnerChange}
                      className="form-select"
                      disabled={ownerExists && !isEdit}
                    >
                      <option value="">Select ID Proof</option>
                      {idProofTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="idProofNumber">ID Proof Number</label>
                    <input
                      type="text"
                      id="idProofNumber"
                      name="idProofNumber"
                      value={ownerData.idProofNumber}
                      onChange={handleOwnerChange}
                      placeholder="1234-5678-9012"
                      disabled={ownerExists && !isEdit}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="idProof">ID Proof Image</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="idProof"
                      accept={allowedTypes.images.join(",")}
                      onChange={handleIdProofChange}
                      className="file-input"
                      disabled={ownerExists && !isEdit}
                    />
                    <label htmlFor="idProof" className="file-upload-label">
                      <div className="upload-icon">📄</div>
                      <div className="upload-text">
                        <strong>Click to upload ID Proof</strong>
                      </div>
                    </label>
                  </div>

                  {(idProofPreview || ownerData.idProofImageUrl) && (
                    <div className="media-previews-container">
                      <img
                        src={idProofPreview || ownerData.idProofImageUrl}
                        alt="ID Proof"
                        style={{ maxWidth: "200px", marginTop: "10px", cursor: "pointer" }}
                        onClick={() => {
                          const url = idProofPreview || ownerData.idProofImageUrl;
                          if (url) window.open(url, "_blank");
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Electricity Bill Number */}
                <div className="form-group">
                  <label htmlFor="electricityBill">Electricity Bill Number</label>
                  <input
                    type="text"
                    id="electricityBill"
                    name="electricityBill"
                    value={ownerData.electricityBill}
                    onChange={handleOwnerChange}
                    placeholder="EB-123456789"
                    disabled={ownerExists && !isEdit}
                  />
                </div>

                {/* Electricity Bill Image */}
                <div className="form-group">
                  <label htmlFor="electricityBillImage">Electricity Bill Image</label>

                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="electricityBillImage"
                      accept={allowedTypes.images.join(",")}
                      onChange={handleElectricityBillChange}
                      className="file-input"
                      disabled={ownerExists && !isEdit}
                    />
                    <label htmlFor="electricityBillImage" className="file-upload-label">
                      <div className="upload-icon">📄</div>
                      <div className="upload-text">
                        <strong>Click to upload Electricity Bill</strong>
                      </div>
                    </label>
                  </div>

                  {(electricityBillPreview || ownerData.electricityBillImageUrl) && (
                    <div className="media-previews-container">
                      <img
                        src={electricityBillPreview || ownerData.electricityBillImageUrl}
                        alt="Electricity Bill"
                        style={{ maxWidth: "200px", marginTop: "10px", cursor: "pointer" }}
                        onClick={() => {
                          const url = electricityBillPreview || ownerData.electricityBillImageUrl;
                          if (url) window.open(url, "_blank");
                        }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Property Information */}
          <div className="form-section">
            <h3 className="section-title">Property Information</h3>

            <div className="form-group">
              <label htmlFor="title">Property Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={propertyData.title}
                onChange={handlePropertyChange}
                placeholder="Modern 2BHK Apartment"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={propertyData.description}
                onChange={handlePropertyChange}
                placeholder="Describe the property..."
                rows="3"
              />
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3 className="section-title">Location</h3>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={propertyData.location.address}
                onChange={handleLocationChange}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={propertyData.location.city}
                  onChange={handleLocationChange}
                  placeholder="Mumbai"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={propertyData.location.state}
                  onChange={handleLocationChange}
                  placeholder="Maharashtra"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={propertyData.location.country}
                  onChange={handleLocationChange}
                  placeholder="India"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pincode">Pincode</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={propertyData.location.pincode}
                  onChange={handleLocationChange}
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="form-section">
            <h3 className="section-title">Property Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="listingType">Property For *</label>
                <select
                  id="listingType"
                  name="listingType"
                  value={propertyData.listingType}
                  onChange={handlePropertyChange}
                  className="form-select"
                  required
                >
                  <option value="rent">Rent</option>
                  <option value="sell">Sell</option>
                  <option value="commercial">Commercial</option>
                  <option value="lease">Lease</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="area">Area (sq ft) *</label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={propertyData.area}
                  onChange={handlePropertyChange}
                  placeholder="1200"
                  min="1"
                  required
                />
              </div>
            </div>

            {!isCommercial && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="propertyType">Type *</label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={propertyData.propertyType}
                      onChange={handlePropertyChange}
                      className="form-select"
                      required
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="villa">Villa</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bedrooms">Bedrooms</label>
                    <input
                      type="number"
                      id="bedrooms"
                      name="bedrooms"
                      value={propertyData.bedrooms}
                      onChange={handlePropertyChange}
                      placeholder="2"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bathrooms">Bathrooms</label>
                    <input
                      type="number"
                      id="bathrooms"
                      name="bathrooms"
                      value={propertyData.bathrooms}
                      onChange={handlePropertyChange}
                      placeholder="2"
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}

            {propertyData.listingType === "rent" ? (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rent">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    id="rent"
                    name="rent"
                    value={propertyData.rent}
                    onChange={handlePropertyChange}
                    placeholder="25000"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="deposit">Security Deposit (₹)</label>
                  <input
                    type="number"
                    id="deposit"
                    name="deposit"
                    value={propertyData.deposit}
                    onChange={handlePropertyChange}
                    placeholder="50000"
                    min="0"
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="price">
                  {propertyData.listingType === "sell"
                    ? "Sale Price"
                    : propertyData.listingType === "lease"
                      ? "Lease Amount"
                      : "Commercial Price"}{" "}
                  (₹) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={propertyData.price}
                  onChange={handlePropertyChange}
                  placeholder="5000000"
                  min="1"
                  required
                />
              </div>
            )}
          </div>

          {/* Amenities */}
          {!isCommercial && (
            <div className="form-section">
              <h3 className="section-title">Amenities</h3>
              <div className="amenities-grid">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="amenity-checkbox">
                    <input
                      type="checkbox"
                      checked={propertyData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                    />
                    <span className="Ownercheckmark"></span>
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Property Images */}
          <div className="form-section">
            <h3 className="section-title">Property Images *</h3>
            <div className="form-group">
              <div className="file-upload-area">
                <input
                  type="file"
                  id="media"
                  accept={[...allowedTypes.images, ...allowedTypes.videos].join(
                    ","
                  )}
                  multiple
                  onChange={handleMediaChange}
                  className="file-input"
                />
                <label htmlFor="media" className="file-upload-label">
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">
                    <strong>Click to upload property images</strong>
                  </div>
                </label>
              </div>

              {mediaPreviews.length > 0 && (
                <div className="media-previews-container">
                  <h4>Selected Media ({mediaPreviews.length})</h4>
                  <div className="media-previews-grid">
                    {mediaPreviews.map((preview) => (
                      <div key={preview.id} className="media-preview-item">
                        {preview.type === "image" ? (
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="media-preview-image"
                          />
                        ) : (
                          <video
                            src={preview.url}
                            className="media-preview-video"
                            controls
                          />
                        )}
                        <div className="media-preview-overlay">
                          <span className="media-name">{preview.name}</span>
                          <button
                            type="button"
                            className="remove-media-btn"
                            onClick={() => removeMedia(preview.id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || uploadingMedia}
          >
            {uploadingMedia ? (
              <>
                <span className="loading-spinner"></span>
                Uploading Media...
              </>
            ) : loading ? (
              <>
                <span className="loading-spinner"></span>
                {isEdit ? "Updating Property..." : "Creating Property..."}
              </>
            ) : isEdit ? (
              "Update Property"
            ) : (
              "Create Property"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;