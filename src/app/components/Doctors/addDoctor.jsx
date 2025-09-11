"use client";
import React, { useState, useEffect } from 'react';

const AddDoctorModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    languages: [],
    photos: [],
    gender: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [gender, setGender] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [photoPreview, setPhotoPreview] = useState([]);

  // Fetch departments from API with retry
  const fetchDepartments = async (retryCount = 0) => {
    try {
      setLoadingDepartments(true);
      
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/departments', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text(); // Get response as text first
      
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      let data;
      try {
        data = JSON.parse(text); // Try to parse JSON
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure received');
      }
      
      // Filter only active departments and extract names
      const activeDepartments = (data.departments || [])
        .filter(dept => dept && dept.status === 'Active' && dept.name)
        .map(dept => dept.name);
      
      setAvailableDepartments(activeDepartments);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout for departments');
        if (retryCount < 2) {
          console.log(`Retrying departments fetch (attempt ${retryCount + 1})`);
          setTimeout(() => fetchDepartments(retryCount + 1), 1000);
          return;
        }
        setAvailableDepartments(['Oncology', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine']);
      } else {
        console.error('Error fetching departments:', error);
        if (retryCount < 2) {
          console.log(`Retrying departments fetch (attempt ${retryCount + 1})`);
          setTimeout(() => fetchDepartments(retryCount + 1), 1000);
          return;
        }
        // Fallback to default departments if API fails
        setAvailableDepartments(['Oncology', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine']);
      }
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch languages from API with retry
  const fetchLanguages = async (retryCount = 0) => {
    try {
      setLoadingLanguages(true);
      
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/languages', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text(); // Get response as text first
      
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      let data;
      try {
        data = JSON.parse(text); // Try to parse JSON
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure received');
      }
      
      // Filter only active languages and extract names
      const activeLanguages = (data.languages || [])
        .filter(lang => lang && lang.status === 'Active' && lang.name)
        .map(lang => lang.name);
      
      setAvailableLanguages(activeLanguages);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout for languages');
        if (retryCount < 2) {
          console.log(`Retrying languages fetch (attempt ${retryCount + 1})`);
          setTimeout(() => fetchLanguages(retryCount + 1), 1000);
          return;
        }
        setAvailableLanguages(['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi']);
      } else {
        console.error('Error fetching languages:', error);
        if (retryCount < 2) {
          console.log(`Retrying languages fetch (attempt ${retryCount + 1})`);
          setTimeout(() => fetchLanguages(retryCount + 1), 1000);
          return;
        }
        // Fallback to default languages if API fails
        setAvailableLanguages(['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi']);
      }
    } finally {
      setLoadingLanguages(false);
    }
  };

  // Refresh both departments and languages
  const refreshAll = async () => {
    await Promise.all([fetchDepartments(), fetchLanguages()]);
  };

  // Load departments and languages on component mount and listen for updates
  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchLanguages();
    }
  }, [open]);

  // Listen for updates from other components
  useEffect(() => {
    const handleDepartmentUpdate = () => {
      fetchDepartments();
    };
    
    const handleLanguageUpdate = () => {
      fetchLanguages();
    };
    
    window.addEventListener('departmentCountUpdated', handleDepartmentUpdate);
    window.addEventListener('languageCountUpdated', handleLanguageUpdate);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('departmentCountUpdated', handleDepartmentUpdate);
      window.removeEventListener('languageCountUpdated', handleLanguageUpdate);
    };
  }, []);

  const handleLanguageToggle = (language) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image. Please select only image files.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    // Limit total photos to 10
    if (formData.photos.length + validFiles.length > 10) {
      alert('Maximum 10 photos allowed. Please remove some existing photos first.');
      return;
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoData = {
          name: file.name,
          data: event.target.result,
          type: file.type,
          size: file.size
        };
        
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, photoData]
        }));
        
        // Create preview URL
        setPhotoPreview(prev => [...prev, URL.createObjectURL(file)]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove photo
  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    
    // Revoke preview URL to free memory
    setPhotoPreview(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      return newPreviews.filter((_, i) => i !== index);
    });
  };

  // Clear all photos
  const clearAllPhotos = () => {
    setFormData(prev => ({
      ...prev,
      photos: []
    }));
    
    // Revoke all preview URLs
    setPhotoPreview.forEach(url => URL.revokeObjectURL(url));
    setPhotoPreview([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.name.trim() && formData.department && formData.languages.length > 0 && formData.gender) {
      setSubmitting(true);
      
      const newDoctor = {
        name: formData.name.trim(),
        department: formData.department,
        languages: formData.languages.join(', '),
        photos: formData.photos,
        gender: formData.gender
      };
      
      console.log('🔍 Form submitted with data:', formData);
      console.log('🔍 New doctor object being sent:', newDoctor);
      console.log('🔍 Gender field value:', newDoctor.gender);
      console.log('🔍 Gender field type:', typeof newDoctor.gender);
      
      try {
        // Call the onSave function with the new doctor data
        await onSave(newDoctor);
        
        // Show success message
        setShowSuccess(true);
        
        // Reset form after successful save
        setTimeout(() => {
          setFormData({ name: '', department: '', languages: [], photos: [], gender: '' });
          setPhotoPreview([]);
          setShowSuccess(false);
          onClose();
        }, 2000);
        
        console.log('Doctor form submitted and saved successfully');
      } catch (error) {
        console.error('Error during form submission:', error);
        
        // Try to extract more error information
        let errorMessage = 'Failed to save doctor. Please try again.';
        if (error?.message) {
          errorMessage = `Error: ${error.message}`;
        } else if (typeof error === 'string') {
          errorMessage = `Error: ${error}`;
        } else if (error && typeof error === 'object') {
          errorMessage = `Error: ${JSON.stringify(error)}`;
        }
        
        alert(errorMessage);
      } finally {
        setSubmitting(false);
      }
    } else {
      console.log('❌ Form validation failed:', {
        name: formData.name.trim(),
        department: formData.department,
        languages: formData.languages.length,
        gender: formData.gender
      });
      alert('Please fill in all required fields');
    }
  };

  const handleClose = () => {
    setFormData({ 
      name: '', 
      department: '', 
      languages: [],
      photos: [],
      gender: ''
    });
    // Revoke all preview URLs
    photoPreview.forEach(url => URL.revokeObjectURL(url));
    setPhotoPreview([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl bg-white rounded shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Add New Doctor</h2>
            {(loadingDepartments || loadingLanguages) && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading data...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshAll}
              disabled={loadingDepartments || loadingLanguages}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:bg-gray-50 disabled:text-gray-400"
            >
              {loadingDepartments || loadingLanguages ? 'Refreshing...' : 'Refresh All'}
            </button>
            <button onClick={handleClose} className="text-gray-600 hover:text-gray-900">✕</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Name *
              </label>
              <input
                type="text"
                id="doctorName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter doctor's name"
                required
              />
            </div>

            {/* Gender Field */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department *
                </label>
                <button
                  type="button"
                  onClick={fetchDepartments}
                  disabled={loadingDepartments}
                  className="text-xs text-blue-600 hover:text-blue-800 underline disabled:text-gray-400"
                >
                  {loadingDepartments ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loadingDepartments}
              >
                <option value="">
                  {loadingDepartments ? 'Loading departments...' : 'Select a department'}
                </option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {loadingDepartments && (
                <p className="text-sm text-blue-600 mt-1">Loading departments from database...</p>
              )}
              {!loadingDepartments && availableDepartments.length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">No active departments found. Please add departments first.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Languages *
                </label>
                <button
                  type="button"
                  onClick={fetchLanguages}
                  disabled={loadingLanguages}
                  className="text-xs text-blue-600 hover:text-blue-800 underline disabled:text-gray-400"
                >
                  {loadingLanguages ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {loadingLanguages ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-blue-600">Loading languages from database...</p>
                </div>
              ) : availableLanguages.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-yellow-600">No active languages found. Please add languages first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableLanguages.map((language) => (
                    <label key={language} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.languages.includes(language)}
                        onChange={() => handleLanguageToggle(language)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
              )}
              {!loadingLanguages && availableLanguages.length > 0 && formData.languages.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Please select at least one language</p>
              )}
            </div>

            {/* Gallery Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Photos (Optional)
              </label>
              <div className="space-y-4">
                {/* Photo Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={submitting || formData.photos.length >= 10}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`cursor-pointer block ${
                      submitting || formData.photos.length >= 10 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:text-blue-600'
                    }`}
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {formData.photos.length >= 10 
                        ? 'Maximum photos reached (10)' 
                        : 'Click to upload photos or drag and drop'
                      }
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB each. Max 10 photos.
                    </p>
                  </label>
                </div>

                {/* Photo Preview Grid */}
                {formData.photos.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Uploaded Photos ({formData.photos.length}/10)
                      </h4>
                      <button
                        type="button"
                        onClick={clearAllPhotos}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                        disabled={submitting}
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photoPreview[index]}
                            alt={photo.name}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all duration-200"
                              disabled={submitting}
                              title="Remove photo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                            {photo.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Status */}
            {submitting && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-green-800 text-sm font-medium">Saving Doctor</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || !formData.department || formData.languages.length === 0 || !formData.gender || submitting || loadingDepartments || loadingLanguages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Add Doctor</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDoctorModal;
