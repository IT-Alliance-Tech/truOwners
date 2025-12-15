import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { buildApiUrl, API_CONFIG } from '../../../config/api';
import { uploadFile, generateFileName } from '../../../config/supabase';
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler';
import './Owner.css';
import PropertySuccessModal from './PropertySuccessModal';

const EditProperty = ({ property, onClose, onSuccess, onComplete }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      googleMapsLink: ''
    },
    rent: '',
    deposit: '',
    propertyType: 'apartment',
    bedrooms: '',
    bathrooms: '',
    area: '',
    amenities: []
  });
  
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successProperty, setSuccessProperty] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const amenitiesList = [
    'WiFi', 'Parking', 'Gym', 'Swimming Pool', 'Security', 'Elevator',
    'Balcony', 'Garden', 'Furnished', 'Air Conditioning', 'Heating',
    'Laundry', 'Pet Friendly', 'Near Metro', 'Shopping Mall', 'Hospital'
  ];

  const allowedTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    videos: ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
  };

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        location: {
          address: property.location?.address || '',
          city: property.location?.city || '',
          state: property.location?.state || '',
          country: property.location?.country || '',
          pincode: property.location?.pincode || '',
          googleMapsLink: property.location?.googleMapsLink || ''
        },
        rent: property.rent || '',
        deposit: property.deposit || '',
        propertyType: property.propertyType || 'apartment',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        area: property.area || '',
        amenities: property.amenities || []
      });

      if (property.images && property.images.length > 0) {
        setExistingImages(property.images);
        const previews = property.images.map((image, index) => ({
          id: `existing-${index}`,
          type: 'image',
          url: image,
          name: `image-${index}`,
          isExisting: true
        }));
        setMediaPreviews(previews);
      } else {
        setExistingImages([]);
        setMediaPreviews([]);
      }
    }
  }, [property]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
    if (error) setError('');
  };

  const handleGoogleMapsLinkPaste = (e) => {
    const link = e.target.value;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        googleMapsLink: link
      }
    }));
  };

  const openGoogleMaps = () => {
    const address = `${formData.location.address} ${formData.location.city} ${formData.location.state} ${formData.location.country}`.trim();
    const encodedAddress = encodeURIComponent(address || 'current location');
    const googleMapsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const isImage = allowedTypes.images.includes(file.type);
      const isVideo = allowedTypes.videos.includes(file.type);
      
      if (!isImage && !isVideo) {
        errors.push(`${file.name}: Invalid file type. Only images and videos are allowed.`);
        return;
      }

      const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxSize) {
        const sizeLimit = isImage ? '10MB' : '100MB';
        errors.push(`${file.name}: File too large. Maximum size: ${sizeLimit}`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles]);
      
      validFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = {
            id: Date.now() + index,
            file,
            type: allowedTypes.images.includes(file.type) ? 'image' : 'video',
            url: event.target.result,
            name: file.name,
            isNew: true
          };
          setMediaPreviews(prev => [...prev, preview]);
        };
        reader.readAsDataURL(file);
      });
    }

    e.target.value = '';
  };

  const removeMedia = (id) => {
    const preview = mediaPreviews.find(p => p.id === id);
    
    if (preview?.isExisting) {
      setExistingImages(prev => prev.filter(img => img !== preview.url));
    } else if (preview?.isNew) {
      setMediaFiles(prev => prev.filter(file => file !== preview?.file));
    }
    
    setMediaPreviews(prev => prev.filter(p => p.id !== id));
  };

  const uploadAllMedia = async () => {
    if (mediaFiles.length === 0) return [];

    setUploadingMedia(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const fileName = generateFileName(file.name, formData.title || 'property');
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        const uploadResult = await uploadFile(file, fileName);
        
        if (uploadResult.success) {
          uploadedUrls.push(uploadResult.url);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
        } else {
          throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }
      }

      return uploadedUrls;
    } catch (error) {
      throw error;
    } finally {
      setUploadingMedia(false);
      setUploadProgress({});
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Property title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Property description is required');
      return false;
    }
    if (!formData.location.address.trim()) {
      setError('Property address is required');
      return false;
    }
    if (!formData.location.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.location.state.trim()) {
      setError('State is required');
      return false;
    }
    if (!formData.location.country.trim()) {
      setError('Country is required');
      return false;
    }
    if (!formData.rent || formData.rent <= 0) {
      setError('Valid rent amount is required');
      return false;
    }
    if (!formData.deposit || formData.deposit <= 0) {
      setError('Valid deposit amount is required');
      return false;
    }
    if (!formData.bedrooms || formData.bedrooms <= 0) {
      setError('Number of bedrooms is required');
      return false;
    }
    if (!formData.bathrooms || formData.bathrooms <= 0) {
      setError('Number of bathrooms is required');
      return false;
    }
    if (!formData.area || formData.area <= 0) {
      setError('Property area is required');
      return false;
    }
    if (existingImages.length === 0 && mediaFiles.length === 0) {
      setError('At least one image is required');
      return false;
    }
    return true;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);
  setError('');

  try {
    // Upload any new media files
    const newMediaUrls = await uploadAllMedia();
    const allMediaUrls = [...existingImages, ...newMediaUrls];

    // Send PATCH request to update property
    const response = await fetch(`${buildApiUrl(API_CONFIG.OWNER.PROPERTIES)}/${property.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description,
        location: {
          address: formData.location.address,
          city: formData.location.city,
          state: formData.location.state,
          country: formData.location.country,
          pincode: formData.location.pincode,
          googleMapsLink: formData.location.googleMapsLink
        },
        rent: parseInt(formData.rent),
        deposit: parseInt(formData.deposit),
        propertyType: formData.propertyType,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseInt(formData.area),
        amenities: formData.amenities,
        images: allMediaUrls
      }),
    });

    let data;
    try {
      data = await response.json();
      validateApiResponse(data);
    } catch (parseError) {
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data.error || handleApiError(null, response));
    }

    if (data.success) {
      // Update state for further edits (keeps form editable)
      setFormData({
        title: data.data.title || '',
        description: data.data.description || '',
        location: {
          address: data.data.location?.address || '',
          city: data.data.location?.city || '',
          state: data.data.location?.state || '',
          country: data.data.location?.country || '',
          pincode: data.data.location?.pincode || '',
          googleMapsLink: data.data.location?.googleMapsLink || ''
        },
        rent: data.data.rent || '',
        deposit: data.data.deposit || '',
        propertyType: data.data.propertyType || 'apartment',
        bedrooms: data.data.bedrooms || '',
        bathrooms: data.data.bathrooms || '',
        area: data.data.area || '',
        amenities: data.data.amenities || []
      });

      setExistingImages(data.data.images || []);
      const previews = (data.data.images || []).map((image, index) => ({
        id: `existing-${index}`,
        type: 'image',
        url: image,
        name: `image-${index}`,
        isExisting: true
      }));
      setMediaPreviews(previews);

      setSuccessProperty(data.data);
      setShowSuccess(true);

      // Call callbacks but do NOT close form (we want user to keep editing)
      onSuccess && onSuccess({ property: data.data });
      onComplete && onComplete();
    } else {
      throw new Error(getErrorMessage(data));
    }
  } catch (err) {
    console.error('Edit property error:', err);
    setError(err.message || 'Failed to update property. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Auto-dismiss the success toast after a short time (non-blocking)
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), 2500);
    return () => clearTimeout(t);
  }, [showSuccess]);

  return (
    <>
      {/* NOTE: success notification is rendered INSIDE the modal as a non-blocking toast
          so it does NOT block editing. */}
      
      {/* ✅ Edit Property Modal */}
      <div className="auth-overlay">
        {/* The modal container — sits ABOVE the overlay */}
        <div className="auth-modal property-modal">
          {/* non-blocking success toast (appears top-right inside modal) */}
          {showSuccess && successProperty && (
            <div className="success-toast" role="status" aria-live="polite">
              <PropertySuccessModal
                onClose={() => setShowSuccess(false)}
                property={successProperty}
                message="Property updated successfully!"
                // If PropertySuccessModal expects an overlay, ensure it can render without its own backdrop.
              />
            </div>
          )}

          <div className="auth-header">
            <h2>Edit Property</h2>
            <p>Update your property details</p>
            {onClose && (
              <button className="auth-close" onClick={onClose}>×</button>
            )}
          </div>

          <form className="auth-form property-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <div style={{ whiteSpace: "pre-line" }}>{error}</div>
              </div>
            )}

            {/* --- Basic Information --- */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>

              <div className="form-group">
                <label htmlFor="title">Property Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Modern 2BHK Apartment in Downtown"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your property, its features, and nearby amenities..."
                  rows="4"
                  required
                />
              </div>
            </div>

            {/* --- Location Information --- */}
            <div className="form-section">
              <h3 className="section-title">Location Information</h3>
              <p className="section-subtitle">
                Provide detailed address information for your property
              </p>

              <div className="form-group">
                <label htmlFor="address">Street Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.location.address}
                  onChange={handleLocationChange}
                  placeholder="e.g., 123 Main Street, Apartment 4B"
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
                    value={formData.location.city}
                    onChange={handleLocationChange}
                    placeholder="e.g., Mumbai"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.location.state}
                    onChange={handleLocationChange}
                    placeholder="e.g., Maharashtra"
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
                    value={formData.location.country}
                    onChange={handleLocationChange}
                    placeholder="e.g., India"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">Pincode</label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.location.pincode}
                    onChange={handleLocationChange}
                    placeholder="e.g., 400001"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="googleMapsLink">
                  Google Maps Link (Optional)
                  <span className="help-text">
                    Get precise location and help tenants find your property easily
                  </span>
                </label>
                <div className="maps-input-container">
                  <input
                    type="url"
                    id="googleMapsLink"
                    name="googleMapsLink"
                    value={formData.location.googleMapsLink}
                    onChange={handleGoogleMapsLinkPaste}
                    placeholder="Paste Google Maps link here..."
                    className="maps-input"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary maps-button"
                    onClick={openGoogleMaps}
                    title="Open Google Maps to find your property"
                  >
                    📍 Find on Maps
                  </button>
                </div>
              </div>
            </div>

            {/* --- Property Details --- */}
            <div className="form-section">
              <h3 className="section-title">Property Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="propertyType">Property Type *</label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="area">Area (sq ft) *</label>
                  <input
                    type="number"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="e.g., 1200"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bedrooms">Bedrooms *</label>
                  <input
                    type="number"
                    id="bedrooms"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bathrooms">Bathrooms *</label>
                  <input
                    type="number"
                    id="bathrooms"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rent">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    id="rent"
                    name="rent"
                    value={formData.rent}
                    onChange={handleInputChange}
                    placeholder="e.g., 25000"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="deposit">Security Deposit (₹) *</label>
                  <input
                    type="number"
                    id="deposit"
                    name="deposit"
                    value={formData.deposit}
                    onChange={handleInputChange}
                    placeholder="e.g., 50000"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* --- Amenities --- */}
            <div className="form-section">
              <h3 className="section-title">Amenities</h3>
              <p className="section-subtitle">
                Select all amenities available in your property
              </p>

              <div className="amenities-grid">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="amenity-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                    />
                    <span className="checkmark"></span>
                    {amenity}
                  </label>
                ))}
              </div>
            </div>

            {/* --- Media Upload Section --- */}
            <div className="form-section">
              <h3 className="section-title">Property Media</h3>
              <p className="section-subtitle">
                Upload high-quality images and videos to showcase your property
              </p>

              <div className="form-group">
                <label htmlFor="media">Upload Images & Videos</label>

                <div className="file-upload-area">
                  <input
                    type="file"
                    id="media"
                    accept={[...allowedTypes.images, ...allowedTypes.videos].join(",")}
                    multiple
                    onChange={handleMediaChange}
                    className="file-input"
                  />

                  <label htmlFor="media" className="file-upload-label">
                    <div className="upload-icon">📷📹</div>
                    <div className="upload-text">
                      <strong>Click to upload</strong> or drag and drop
                    </div>
                    <div className="upload-hint">
                      Images: JPG, PNG, WebP (max 10MB each)
                      <br />
                      Videos: MP4, WebM, MOV (max 100MB each)
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

                          {uploadingMedia &&
                            uploadProgress[preview.name] !== undefined && (
                              <div className="upload-progress">
                                <div
                                  className="upload-progress-bar"
                                  style={{
                                    width: `${uploadProgress[preview.name]}%`,
                                  }}
                                />
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- Submit Button --- */}
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
                  Updating Property...
                </>
              ) : (
                "Update Property"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProperty;
