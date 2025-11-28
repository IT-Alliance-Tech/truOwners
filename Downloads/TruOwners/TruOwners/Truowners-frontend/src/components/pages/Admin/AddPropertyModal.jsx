import React, { useState } from 'react';
import { buildApiUrl, API_CONFIG } from '../../../config/api';
import { uploadFile, generateFileName } from '../../../config/supabase';
import { handleApiError, getErrorMessage, validateApiResponse } from '../../../utils/errorHandler';
import '../Owner/Owner.css';
import '../Auth/Auth.css';
import Compressor from 'compressorjs';

const AddPropertyModal = ({ onClose, onSuccess, token }) => {
  const [ownerData, setOwnerData] = useState({
    email: '',
    name: '',
    phone: '',
    idProofType: 'Aadhar',
    idProofNumber: '',
    idProofImageUrl: ''
  });

  const [propertyData, setPropertyData] = useState({
    title: '',
    description: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    },
    rent: '',
    deposit: '',
    propertyType: 'apartment',
    bedrooms: '',
    bathrooms: '',
    area: '',
    amenities: []
  });

  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ownerExists, setOwnerExists] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [checkingOwner, setCheckingOwner] = useState(false);

  const amenitiesList = [
    'WiFi', 'Parking', 'Gym', 'Swimming Pool', 'Security', 'Elevator',
    'Balcony', 'Garden', 'Furnished', 'Air Conditioning', 'Heating',
    'Laundry', 'Pet Friendly', 'Near Metro', 'Shopping Mall', 'Hospital'
  ];

  const idProofTypes = ['Aadhar', 'Passport', 'Driving License', 'Voter ID'];

  const allowedTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    videos: ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
  };

  // Check if owner exists when email is entered
  const handleEmailBlur = async () => {
    if (!ownerData.email || !ownerData.email.includes('@')) return;

    setCheckingOwner(true);
    setError('');
    try {
      const response = await fetch(buildApiUrl(`/admin/check-owner?email=${ownerData.email}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.exists) {
          setOwnerExists(true);
          setOwnerInfo(data.data.owner);
          // Populate owner data from existing owner
          setOwnerData(prev => ({
            ...prev,
            name: data.data.owner.name || '',
            phone: data.data.owner.phone || ''
          }));
          setError('✓ Owner found. Property will be linked to existing owner.');
        } else {
          setOwnerExists(false);
          setOwnerInfo(null);
          // Clear owner fields for new owner
          setOwnerData(prev => ({
            ...prev,
            name: '',
            phone: '',
            idProofType: 'Aadhar',
            idProofNumber: '',
            idProofImageUrl: ''
          }));
          setError('');
        }
      }
    } catch (err) {
      console.error('Error checking owner:', err);
      setError('Failed to check owner. Please try again.');
    } finally {
      setCheckingOwner(false);
    }
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwnerData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({
      ...prev,
      location: { ...prev.location, [name]: value }
    }));
    if (error) setError('');
  };

  const handleAmenityToggle = (amenity) => {
    setPropertyData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleIdProofChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!allowedTypes.images.includes(file.type)) {
      setError('ID Proof must be an image file');
      return;
    }

    setIdProofFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setIdProofPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
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
            addValidFile(compressedFile, 'image');
          },
          error(err) {
            console.error('Compression failed:', err);
            setError(`${file.name}: Compression failed`);
          }
        });
      } else if (isVideo) {
        addValidFile(file, 'video');
      }
    });

    e.target.value = '';
  };

  function addValidFile(file, type) {
    setMediaFiles(prev => [...prev, file]);
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = {
        id: Date.now() + Math.random(),
        file,
        type,
        url: event.target.result,
        name: file.name
      };
      setMediaPreviews(prev => [...prev, preview]);
    };
    reader.readAsDataURL(file);
  }

  const removeMedia = (id) => {
    setMediaPreviews(prev => prev.filter(preview => preview.id !== id));
    setMediaFiles(prev => {
      const preview = mediaPreviews.find(p => p.id === id);
      return prev.filter(file => file !== preview?.file);
    });
  };

  const uploadAllMedia = async () => {
    if (mediaFiles.length === 0) return [];

    setUploadingMedia(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const fileName = generateFileName(file.name, propertyData.title || 'property');
        const uploadResult = await uploadFile(file, fileName);

        if (uploadResult.success) {
          uploadedUrls.push(uploadResult.url);
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
      return uploadedUrls;
    } catch (error) {
      throw error;
    } finally {
      setUploadingMedia(false);
    }
  };

  const validateForm = () => {
    // Validate owner fields
    if (!ownerData.email || !ownerData.email.includes('@')) {
      setError('Valid owner email is required');
      return false;
    }
    
    // Only validate owner details if owner doesn't exist
    if (!ownerExists) {
      if (!ownerData.name.trim()) {
        setError('Owner name is required');
        return false;
      }
      if (!ownerData.phone.trim()) {
        setError('Owner phone is required');
        return false;
      }
      if (!ownerData.idProofType) {
        setError('ID Proof type is required');
        return false;
      }
      if (!ownerData.idProofNumber.trim()) {
        setError('ID Proof number is required');
        return false;
      }
      if (!idProofFile) {
        setError('ID Proof image is required for new owners');
        return false;
      }
    }

    // Validate property fields
    if (!propertyData.title.trim()) {
      setError('Property title is required');
      return false;
    }
    if (!propertyData.location.address.trim() || !propertyData.location.city.trim() ||
        !propertyData.location.state.trim() || !propertyData.location.country.trim()) {
      setError('Complete location information is required');
      return false;
    }
    if (!propertyData.rent || propertyData.rent <= 0) {
      setError('Valid rent amount is required');
      return false;
    }
    if (mediaFiles.length === 0) {
      setError('At least one property image is required');
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
      // Upload ID proof if new owner
      let idProofUrl = ownerData.idProofImageUrl;
      if (!ownerExists && idProofFile) {
        const idProofFileName = generateFileName(idProofFile.name, `idproof_${ownerData.email}`);
        const idProofResult = await uploadFile(idProofFile, idProofFileName);
        if (!idProofResult.success) {
          throw new Error('Failed to upload ID proof');
        }
        idProofUrl = idProofResult.url;
      }

      // Upload property media
      const mediaUrls = await uploadAllMedia();

      // Submit to backend
      const response = await fetch(buildApiUrl('/admin/properties'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          owner: {
            email: ownerData.email,
            name: ownerData.name,
            phone: ownerData.phone,
            idProofType: ownerData.idProofType,
            idProofNumber: ownerData.idProofNumber,
            idProofImageUrl: idProofUrl
          },
          property: {
            title: propertyData.title,
            description: propertyData.description,
            location: propertyData.location,
            rent: parseInt(propertyData.rent),
            deposit: parseInt(propertyData.deposit) || 0,
            propertyType: propertyData.propertyType,
            bedrooms: parseInt(propertyData.bedrooms) || 0,
            bathrooms: parseInt(propertyData.bathrooms) || 0,
            area: parseInt(propertyData.area) || 0,
            amenities: propertyData.amenities,
            images: mediaUrls
          }
        })
      });

      let data;
      try {
        data = await response.json();
        validateApiResponse(data);
      } catch (parseError) {
        throw new Error('Invalid response from server');
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
      console.error('Add property error:', err);
      setError(err.message || 'Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal property-modal">
        <div className="auth-header">
          <h2>Add Property with Owner</h2>
          <p>Create a new property and owner profile</p>
          <button className="auth-close" onClick={onClose}>×</button>
        </div>

        <form className="auth-form property-form" onSubmit={handleSubmit}>
          {error && (
            <div className={error.startsWith('✓') ? "auth-success" : "auth-error"}>
              <span>{error.startsWith('✓') ? '✓' : '⚠️'}</span>
              <div style={{ whiteSpace: 'pre-line' }}>{error}</div>
            </div>
          )}

          {/* Owner Details Section */}
          <div className="form-section">
            <h3 className="section-title">Owner Details</h3>
            <p className="section-subtitle">Enter owner information</p>

            <div className="form-group">
              <label htmlFor="email">Owner Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={ownerData.email}
                onChange={handleOwnerChange}
                onBlur={handleEmailBlur}
                placeholder="owner@example.com"
                required
                disabled={checkingOwner}
              />
              {checkingOwner && <small>Checking...</small>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Owner Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={ownerData.name}
                  onChange={handleOwnerChange}
                  placeholder="John Doe"
                  required
                  disabled={ownerExists}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Owner Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={ownerData.phone}
                  onChange={handleOwnerChange}
                  placeholder="+1234567890"
                  required
                  disabled={ownerExists}
                />
              </div>
            </div>

            {!ownerExists && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="idProofType">ID Proof Type *</label>
                    <select
                      id="idProofType"
                      name="idProofType"
                      value={ownerData.idProofType}
                      onChange={handleOwnerChange}
                      className="form-select"
                      required
                    >
                      {idProofTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="idProofNumber">ID Proof Number *</label>
                    <input
                      type="text"
                      id="idProofNumber"
                      name="idProofNumber"
                      value={ownerData.idProofNumber}
                      onChange={handleOwnerChange}
                      placeholder="1234-5678-9012"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="idProof">ID Proof Image *</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="idProof"
                      accept={allowedTypes.images.join(',')}
                      onChange={handleIdProofChange}
                      className="file-input"
                    />
                    <label htmlFor="idProof" className="file-upload-label">
                      <div className="upload-icon">📄</div>
                      <div className="upload-text">
                        <strong>Click to upload ID Proof</strong>
                      </div>
                    </label>
                  </div>
                  {idProofPreview && (
                    <div className="media-previews-container">
                      <img src={idProofPreview} alt="ID Proof" style={{ maxWidth: '200px', marginTop: '10px' }} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Property Details Section */}
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
                <label htmlFor="propertyType">Type *</label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={propertyData.propertyType}
                  onChange={handlePropertyChange}
                  className="form-select"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="villa">Villa</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="area">Area (sq ft)</label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={propertyData.area}
                  onChange={handlePropertyChange}
                  placeholder="1200"
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
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
          </div>

          {/* Amenities */}
          <div className="form-section">
            <h3 className="section-title">Amenities</h3>
            <div className="amenities-grid">
              {amenitiesList.map(amenity => (
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

          {/* Property Images */}
          <div className="form-section">
            <h3 className="section-title">Property Images *</h3>
            <div className="form-group">
              <div className="file-upload-area">
                <input
                  type="file"
                  id="media"
                  accept={[...allowedTypes.images, ...allowedTypes.videos].join(',')}
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
                    {mediaPreviews.map(preview => (
                      <div key={preview.id} className="media-preview-item">
                        {preview.type === 'image' ? (
                          <img src={preview.url} alt={preview.name} className="media-preview-image" />
                        ) : (
                          <video src={preview.url} className="media-preview-video" controls />
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
                Creating Property...
              </>
            ) : (
              'Create Property'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;
