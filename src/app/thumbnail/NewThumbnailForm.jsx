'use client';

import React, { useState, useEffect } from 'react';
import { trackThumbnailCreate } from '../utils/activityTracker';

const NewThumbnailForm = ({ 
  isOpen, 
  onClose, 
  departments = [], 
  onSubmit, 
  submitting = false 
}) => {
  const [formData, setFormData] = useState({
    department: '',
    doctor: '',
    topic: '',
    teluguThumbnail: null,
    englishThumbnail: null,
    hindiThumbnail: null
  });
  const [doctors, setDoctors] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetFormData();
    }
  }, [isOpen]);

  // Function to reset form data
  const resetFormData = () => {
    setFormData({
      department: '',
      doctor: '',
      topic: '',
      teluguThumbnail: null,
      englishThumbnail: null,
      hindiThumbnail: null
    });
    setDoctors([]);
    setTopics([]);
  };

  // Function to close form
  const closeForm = () => {
    resetFormData();
    onClose();
  };

  // Fetch doctors based on selected department
  const fetchDoctorsByDepartment = async (departmentId) => {
    if (!departmentId) {
      setDoctors([]);
      setLoadingDoctors(false);
      return;
    }
    
    try {
      setLoadingDoctors(true);
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const result = await response.json();
        
        // Get the department name from the selected department ID
        const selectedDept = departments.find(dept => dept._id === departmentId);
        const deptName = selectedDept?.name;
        
        if (!deptName) {
          console.error('Department not found:', departmentId);
          setDoctors([]);
          setLoadingDoctors(false);
          return;
        }
        
        // Filter doctors by department name and only show active doctors
        const filteredDoctors = result.doctors?.filter(doctor => {
          const matchesDept = doctor.department === deptName;
          const isActive = doctor.status === 'Active';
          return matchesDept && isActive;
        }) || [];
        
        setDoctors(filteredDoctors);
        
      } else {
        console.error('Failed to fetch doctors');
        setDoctors([]);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };



  // Handle department change
  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    
    // Reset doctor and topic selection when department changes
    setFormData(prev => ({ ...prev, department: deptId, doctor: '', topic: '' }));
    
    // Clear doctors list
    setDoctors([]);
    
    // Fetch doctors for the selected department
    if (deptId) {
      fetchDoctorsByDepartment(deptId);
    }
  };

  // Handle doctor change
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setFormData(prev => ({ ...prev, doctor: doctorId }));
  };

  // Handle topic change
  const handleTopicChange = (e) => {
    const topicName = e.target.value;
    setFormData(prev => ({ ...prev, topic: topicName }));
  };

  // Handle file selection for Telugu
  const handleTeluguFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file for Telugu');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB for Telugu thumbnail');
        return;
      }
      
      setFormData(prev => ({ ...prev, teluguThumbnail: file }));
    } else {
      setFormData(prev => ({ ...prev, teluguThumbnail: null }));
    }
  };

  // Handle file selection for English
  const handleEnglishFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file for English');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB for English thumbnail');
        return;
      }
      
      setFormData(prev => ({ ...prev, englishThumbnail: file }));
    } else {
      setFormData(prev => ({ ...prev, englishThumbnail: null }));
    }
  };

  // Handle file selection for Hindi
  const handleHindiFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file for Hindi');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB for Hindi thumbnail');
        return;
      }
      
      setFormData(prev => ({ ...prev, hindiThumbnail: file }));
    } else {
      setFormData(prev => ({ ...prev, hindiThumbnail: null }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    if (!formData.department || !formData.doctor || !formData.topic || (!formData.teluguThumbnail && !formData.englishThumbnail && !formData.hindiThumbnail)) {
      alert('Please fill all required fields and select at least one thumbnail image');
      return;
    }

    // Call the parent onSubmit function with the event object
    if (onSubmit) {
      await onSubmit(e, formData);
      closeForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header - Fixed */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Add New Thumbnail</h2>
              <p className="text-sm text-gray-600 mt-1">Create thumbnails for your content in multiple languages</p>
            </div>
            <button 
              onClick={closeForm}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Form Content with Enhanced Scrolling */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative" style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#64748b #f8fafc',
            maxHeight: 'calc(100vh - 250px)',
            minHeight: '400px'
          }}>
            {/* Scroll Indicator */}
            <div className="absolute top-2 right-8 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full opacity-75 z-10">
              ↕️ Scroll to see more
            </div>
            
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 14px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f8fafc;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                margin: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #64748b;
                border-radius: 8px;
                border: 2px solid #f8fafc;
                transition: all 0.2s ease;
                min-height: 50px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #475569;
                transform: scale(1.05);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .custom-scrollbar::-webkit-scrollbar-corner {
                background: #f8fafc;
              }
              /* Firefox scrollbar */
              .custom-scrollbar {
                scrollbar-width: auto;
                scrollbar-color: #64748b #f8fafc;
              }
              /* Ensure scrollbar is always visible */
              .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                background: #64748b;
              }
              /* Force scrollbar to show */
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #64748b !important;
              }
            `}</style>
            
            <form id="newThumbnailForm" onSubmit={handleSubmit} className="space-y-8 pb-6">

              {/* Step 1: Basic Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-indigo-600 font-semibold text-sm">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Department Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={handleDepartmentChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                    >
                      <option value="">Choose Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Department Status Indicators */}
                    {loadingDoctors && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center text-sm text-blue-700">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading doctors for selected department...
                        </div>
                      </div>
                    )}
                    
                    {formData.department && !loadingDoctors && doctors.length === 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center text-sm text-red-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          No doctors available in this department
                        </div>
                      </div>
                    )}
                    
                    {formData.department && !loadingDoctors && doctors.length > 0 && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-sm text-green-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Doctor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.doctor}
                      onChange={handleDoctorChange}
                      required
                      disabled={!formData.department || loadingDoctors}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 transition-colors"
                    >
                      <option value="">
                        {!formData.department 
                          ? 'Please select a department first' 
                          : loadingDoctors
                            ? 'Loading doctors...'
                            : doctors.length === 0 
                              ? 'No doctors available in this department' 
                              : 'Choose Doctor'
                        }
                      </option>
                      {!loadingDoctors && doctors.length > 0 && doctors.map(doctor => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                    
                    {formData.doctor && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-sm text-green-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Doctor selected successfully
                        </div>
                      </div>
                    )}
                    
                  </div>

                  {/* Topic Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.topic}
                      onChange={handleTopicChange}
                      placeholder="Enter topic name (e.g., Diabetes Management, Heart Health)"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    
                    {formData.topic && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-sm text-green-700">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Topic entered successfully
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>
              </div>

              {/* Step 2: Thumbnail Upload */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-indigo-600 font-semibold text-sm">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Thumbnail Upload</h3>
                </div>
                
                

                {/* Language Selection Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className={`text-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.teluguThumbnail 
                      ? 'border-green-400 bg-green-50 shadow-md' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                    <div className="text-2xl mb-2">🇮🇳</div>
                    <div className="text-sm font-medium text-gray-700">Telugu</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                      formData.teluguThumbnail 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {formData.teluguThumbnail ? '✓ Selected' : 'Not selected'}
                    </div>
                  </div>
                  
                  <div className={`text-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.englishThumbnail 
                      ? 'border-green-400 bg-green-50 shadow-md' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                    <div className="text-2xl mb-2">🇺🇸</div>
                    <div className="text-sm font-medium text-gray-700">English</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                      formData.englishThumbnail 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {formData.englishThumbnail ? '✓ Selected' : 'Not selected'}
                    </div>
                  </div>
                  
                  <div className={`text-center p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.hindiThumbnail 
                      ? 'border-green-400 bg-green-50 shadow-md' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}>
                    <div className="text-2xl mb-2">🇮🇳</div>
                    <div className="text-sm font-medium text-gray-700">Hindi</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                      formData.hindiThumbnail 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {formData.hindiThumbnail ? '✓ Selected' : 'Not selected'}
                    </div>
                  </div>
                </div>

                {/* File Upload Sections */}
                <div className="space-y-4">
                  {/* Telugu Thumbnail */}
                  <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Telugu Thumbnail
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTeluguFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    {formData.teluguThumbnail && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-green-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formData.teluguThumbnail.name}
                          </div>
                          <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full">
                            {(formData.teluguThumbnail.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* English Thumbnail */}
                  <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      English Thumbnail
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEnglishFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    {formData.englishThumbnail && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-green-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formData.englishThumbnail.name}
                          </div>
                          <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full">
                            {(formData.englishThumbnail.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hindi Thumbnail */}
                  <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Hindi Thumbnail
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHindiFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    {formData.hindiThumbnail && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-green-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formData.hindiThumbnail.name}
                          </div>
                          <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full">
                            {(formData.hindiThumbnail.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Fixed Footer with Buttons */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
            <div className="flex gap-3">
              <button
                type="submit"
                form="newThumbnailForm"
                disabled={submitting || !formData.department || !formData.doctor || !formData.topic || (!formData.teluguThumbnail && !formData.englishThumbnail && !formData.hindiThumbnail)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-indigo-400 disabled:to-blue-400 text-white rounded-lg font-semibold text-base transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Thumbnail{formData.teluguThumbnail && formData.englishThumbnail && formData.hindiThumbnail ? 's' : ''}...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Thumbnail{formData.teluguThumbnail && formData.englishThumbnail && formData.hindiThumbnail ? 's' : ''}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors text-base hover:shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewThumbnailForm;
