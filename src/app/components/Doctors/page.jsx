"use client";
import React, { useState, useEffect } from "react";
import AddDoctorModal from "./addDoctor";

const DoctorsPage = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newlyAddedDoctor, setNewlyAddedDoctor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    languages: [],
    status: 'Active',
    photos: [],
    gender: ''
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name'); // 'name' or 'department'
  const [showAll, setShowAll] = useState(false);
  const [doctorsPerPage] = useState(10);
  const [photoViewer, setPhotoViewer] = useState({ open: false, photos: [], currentIndex: 0 });

  // Load doctors from API when component mounts
  useEffect(() => {
    loadDoctors();
  }, []);

  // Function to check gender status
  const checkGenderStatus = async () => {
    try {
      console.log('🔍 Checking gender status...');
      
      const response = await fetch('/api/doctors/fix-gender');
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Gender status:', result);
        
        const { stats, sampleDoctorsWithoutGender } = result;
        
        let message = `📊 Gender Status Report:\n\n`;
        message += `Total Doctors: ${stats.totalDoctors}\n`;
        message += `With Gender: ${stats.doctorsWithGender}\n`;
        message += `Without Gender: ${stats.doctorsWithoutGender}\n`;
        message += `Percentage Complete: ${stats.percentageWithGender}%\n\n`;
        
        if (stats.doctorsWithoutGender > 0) {
          message += `Doctors needing gender values:\n`;
          sampleDoctorsWithoutGender.forEach(doctor => {
            message += `• ${doctor.name} (${doctor.department})\n`;
          });
          if (stats.doctorsWithoutGender > 5) {
            message += `... and ${stats.doctorsWithoutGender - 5} more\n`;
          }
          message += `\nClick "Fix Gender" to automatically set default values.`;
        } else {
          message += `✅ All doctors have gender values set!`;
        }
        
        alert(message);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to check gender status:', errorData);
        alert(`❌ Failed to check gender status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error checking gender status:', error);
      alert(`❌ Error checking gender status: ${error.message}`);
    }
  };

  // Function to fix gender issues for existing doctors
  const fixGenderIssues = async () => {
    try {
      console.log('🔧 Fixing gender issues for existing doctors...');
      
      const response = await fetch('/api/doctors/fix-gender', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Gender fix result:', result);
        
        if (result.fixedCount > 0) {
          alert(`✅ Fixed ${result.fixedCount} doctors with missing gender values. They have been set to "Other" by default. You can now edit them individually to set the correct gender.`);
          // Reload doctors to show updated data
          await loadDoctors();
        } else {
          alert('ℹ️ All doctors already have gender values set.');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fix gender issues:', errorData);
        alert(`❌ Failed to fix gender issues: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fixing gender issues:', error);
      alert(`❌ Error fixing gender issues: ${error.message}`);
    }
  };

  // Load departments and languages when edit modal opens
  useEffect(() => {
    if (isEditOpen) {
      fetchDepartments();
      fetchLanguages();
    }
  }, [isEditOpen]);

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

  // Cleanup edit state when component unmounts
  useEffect(() => {
    return () => {
      setEditingDoctor(null);
      setEditForm({ name: '', department: '', languages: [], status: 'Active', photos: [], gender: '' });
      setIsEditOpen(false);
    };
  }, []);

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

  // Filter doctors based on search criteria
  const filteredDoctors = doctors.filter(doctor => {
    // Ensure doctor has required fields before filtering
    if (!doctor || !doctor.name || !doctor.department) {
      console.warn('Invalid doctor data found:', doctor);
      return false;
    }
    
    // Ensure doctor has a valid ID
    if (!doctor._id && !doctor.id) {
      console.warn('Doctor missing ID:', doctor);
      return false;
    }
    
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase().trim();
    
    if (searchBy === 'name') {
      return doctor.name.toLowerCase().includes(term);
    } else if (searchBy === 'department') {
      return doctor.department.toLowerCase().includes(term);
    }
    
    return true;
  });

  // Get doctors to display based on showAll state
  const doctorsToDisplay = showAll ? filteredDoctors : filteredDoctors.slice(0, doctorsPerPage);

  const handleLanguageToggle = (language) => {
    setEditForm(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      console.log('Loading doctors from API...');
      const response = await fetch('/api/doctors');
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', data);
        console.log('Loaded doctors:', data.doctors);
        
        // Ensure all doctors have proper IDs and validate data structure
        const validatedDoctors = (data.doctors || []).map((doctor, index) => {
          console.log(`Validating doctor ${index}:`, doctor);
          console.log(`Doctor ${index} gender:`, doctor.gender);
          console.log(`Doctor ${index} gender type:`, typeof doctor.gender);
          console.log(`Doctor ${index} has gender:`, !!doctor.gender);
          console.log(`Doctor ${index} all fields:`, Object.keys(doctor));
          
          if (!doctor._id && !doctor.id) {
            console.warn(`Doctor at index ${index} missing ID:`, doctor);
            // Create a temporary ID for display purposes
            return { ...doctor, _id: `temp-${Date.now()}-${index}` };
          }
          return doctor;
        });
        
        console.log('Validated doctors:', validatedDoctors);
        console.log('Sample validated doctor:', validatedDoctors[0]);
        if (validatedDoctors[0]) {
          console.log('Sample doctor gender:', validatedDoctors[0].gender);
          console.log('Sample doctor gender type:', typeof validatedDoctors[0].gender);
        }
        setDoctors(validatedDoctors);
      } else {
        console.error('Failed to load doctors:', response.status);
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Set empty array to prevent crashes
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (id, action) => {
    const doctor = doctors.find(d => d._id === id || d.id === id);
    if (!doctor) return;

    switch (action) {
      case 'edit':
        console.log('Opening edit form for doctor:', doctor);
        setEditingDoctor(doctor);
        // Convert languages string to array if it's a string
        const languagesArray = typeof doctor.languages === 'string' 
          ? doctor.languages.split(',').map(lang => lang.trim()).filter(lang => lang)
          : doctor.languages || [];
        
        const formData = {
          name: doctor.name,
          department: doctor.department,
          languages: languagesArray,
          status: doctor.status || 'Active',
          photos: doctor.photos || [],
          gender: doctor.gender || ''
        };
        console.log('Setting edit form data:', formData);
        setEditForm(formData);
        setIsEditOpen(true);
        break;
      case 'delete':
        setDeleteConfirm(doctor);
        break;
      case 'deactivate':
        handleToggleStatus(id);
        break;
      case 'view':
        setViewingDoctor(doctor);
        break;
      case 'gallery':
        if (doctor.photos && doctor.photos.length > 0) {
          setPhotoViewer({
            open: true,
            photos: doctor.photos,
            currentIndex: 0
          });
        } else {
          alert('No photos available for this doctor.');
        }
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const handleEditSave = async () => {
    if (!editingDoctor || !editForm.name.trim() || !editForm.department.trim() || editForm.languages.length === 0 || !editForm.gender) {
      alert('Please fill in all required fields');
      return;
    }

    // Prevent duplicate submissions
    if (editingDoctor.isSubmitting) {
      return;
    }

    // Set submitting flag
    setEditingDoctor(prev => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch('/api/doctors', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: editingDoctor._id || editingDoctor.id, 
          name: editForm.name.trim(),
          department: editForm.department.trim(),
          languages: editForm.languages.join(', '),
          status: editForm.status,
          photos: editForm.photos,
          gender: editForm.gender
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Close modal and clear state first
        setIsEditOpen(false);
        setEditingDoctor(null);
        setEditForm({ name: '', department: '', languages: [], status: 'Active', photos: [], gender: '' });
        
        // Clear search to show all doctors after edit
        setSearchTerm('');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('doctorCountUpdated'));
        
        // Reload doctors from API to ensure data consistency
        await loadDoctors();
        
        // Show success message
        alert(`Doctor "${editForm.name.trim()}" has been successfully updated!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('Failed to update doctor. Please try again.');
    } finally {
      // Clear submitting flag and reset state
      setEditingDoctor(null);
      setEditForm({ name: '', department: '', languages: [], status: 'Active', photos: [], gender: '' });
    }
  };

  const handleEditCancel = () => {
    // Close modal and clear all edit state
    setIsEditOpen(false);
    setEditingDoctor(null);
    setEditForm({ name: '', department: '', languages: [], status: 'Active', photos: [], gender: '' });
  };

  const handleSaveDoctor = async (newDoctor) => {
    try {
      console.log('Saving doctor:', newDoctor);
      console.log('🔍 Doctor gender being sent:', newDoctor.gender);
      console.log('🔍 Full doctor object:', JSON.stringify(newDoctor, null, 2));
      
      // Save to database via API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response;
      try {
        const requestBody = JSON.stringify(newDoctor);
        console.log('🔍 Request body being sent:');
        console.log('🔍 Request body type:', typeof requestBody);
        console.log('🔍 Request body length:', requestBody.length);
        console.log('🔍 Request body preview (first 500 chars):', requestBody.substring(0, 500));
        console.log('🔍 Gender field in request:', newDoctor.gender);
        
        response = await fetch('/api/doctors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('API Response status:', response.status);
        console.log('API Response status text:', response.statusText);
        console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw new Error(`Network error: ${fetchError.message}`);
      }

      let responseData;
      try {
        responseData = await response.json();
        console.log('API Response data:', responseData);
        console.log('API Response data type:', typeof responseData);
        console.log('API Response data keys:', Object.keys(responseData));
        
        // Check if the returned doctor has gender field
        if (responseData.doctor) {
          console.log('🔍 Returned doctor object:', responseData.doctor);
          console.log('🔍 Returned doctor gender:', responseData.doctor.gender);
          console.log('🔍 Returned doctor keys:', Object.keys(responseData.doctor));
        }
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        console.error('❌ Response text:', await response.text());
        throw new Error('Invalid JSON response from server');
      }

      // Additional debugging for error responses
      if (!response.ok) {
        console.error('❌ API returned error response');
        console.error('❌ Response status:', response.status);
        console.error('❌ Response status text:', response.statusText);
        console.error('❌ Response data:', responseData);
        console.error('❌ Response data type:', typeof responseData);
        console.error('❌ Response data constructor:', responseData?.constructor?.name);
        
        if (responseData && typeof responseData === 'object') {
          console.error('❌ Response data properties:', Object.getOwnPropertyNames(responseData));
          console.error('❌ Response data enumerable keys:', Object.keys(responseData));
          console.error('❌ Response data values:', Object.values(responseData));
        }
      }
      
      if (response.ok) {
        // Reload doctors from database to get the updated list with proper IDs
        await loadDoctors();
        
        // Set newly added doctor for highlighting (use the returned doctor from API)
        if (responseData.doctor && responseData.doctor._id) {
          setNewlyAddedDoctor(responseData.doctor._id);
          // Remove highlight after 3 seconds
          setTimeout(() => setNewlyAddedDoctor(null), 3000);
        }
        
        // Clear search to show all doctors including the new one
        setSearchTerm('');
        
        // Show success message
        alert(`Doctor "${newDoctor.name}" has been successfully added!`);
        
        // Dispatch custom event to notify Dashboard to update doctor count
        window.dispatchEvent(new CustomEvent('doctorCountUpdated'));
        
        // Return success to close the form
        return Promise.resolve();
      } else {
        console.error('Failed to save doctor:', responseData);
        console.error('Response status:', response.status);
        console.error('Response status text:', response.statusText);
        console.error('Full response data:', responseData);
        
        // Try to extract error message from various possible locations
        let errorMessage = 'Unknown error occurred';
        
        if (responseData.error) {
          if (typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          } else if (typeof responseData.error === 'object') {
            // If error is an object, try to extract message from it
            if (responseData.error.message) {
              errorMessage = responseData.error.message;
            } else if (responseData.error.error) {
              errorMessage = responseData.error.error;
            } else {
              // Try to stringify the error object
              try {
                errorMessage = JSON.stringify(responseData.error);
              } catch (stringifyError) {
                errorMessage = 'Error object could not be stringified';
              }
            }
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (response.status === 400) {
          errorMessage = 'Bad request - please check your input data';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized - please check your authentication';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden - you do not have permission to perform this action';
        } else if (response.status === 404) {
          errorMessage = 'Resource not found';
        } else if (response.status === 409) {
          errorMessage = 'Conflict - the resource already exists';
        } else if (response.status === 422) {
          errorMessage = 'Validation error - please check your input data';
        } else if (response.status >= 500) {
          errorMessage = 'Server error - please try again later';
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error('Extracted error message:', errorMessage);
        console.error('Creating error object with message:', errorMessage);
        
        const error = new Error(errorMessage);
        console.error('Error object created:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        alert(`Failed to save doctor: ${errorMessage}`);
        return Promise.reject(error);
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor.name);
      console.error('Error properties:', Object.getOwnPropertyNames(error));
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Ensure we have a proper error object
      let errorToThrow = error;
      if (!(error instanceof Error)) {
        console.error('Error is not an Error instance, creating new Error');
        errorToThrow = new Error(error?.message || 'Unknown error occurred');
      }
      
      const errorMessage = errorToThrow.message || 'Network error occurred';
      alert(`Error saving doctor: ${errorMessage}`);
      return Promise.reject(errorToThrow);
    }
  };

  const handleToggleStatus = async (id) => {
    const current = doctors.find((d) => d._id === id || d.id === id);
    if (!current) return;

    const newStatus = current.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const response = await fetch('/api/doctors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: current._id || current.id, 
          status: newStatus 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Reload doctors from database to ensure data consistency
        await loadDoctors();
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('doctorCountUpdated'));
        
        console.log(`Doctor ${current.name} status updated to: ${newStatus}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating doctor status:', error);
      alert('Failed to update doctor status. Please try again.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    const id = deleteConfirm._id || deleteConfirm.id;
    
    try {
      const response = await fetch(`/api/doctors?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        // Reload doctors from database to ensure data consistency
        await loadDoctors();
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('doctorCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor. Please try again.');
    } finally {
      setDeleteConfirm(null); // Close the popup
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Photo viewer navigation
  const nextPhoto = () => {
    setPhotoViewer(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }));
  };

  const prevPhoto = () => {
    setPhotoViewer(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1
    }));
  };

  const closePhotoViewer = () => {
    setPhotoViewer({ open: false, photos: [], currentIndex: 0 });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage Doctors</h1>
        <div className="flex gap-2">
          {/* <button 
            onClick={checkGenderStatus}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Check Status
          </button>
          <button 
            onClick={fixGenderIssues}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Fix Gender
          </button> */}
          <button 
            onClick={loadDoctors} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
          <button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Add Doctor
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder={`Search by ${searchBy === 'name' ? 'doctor name' : 'department'}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowAll(false); // Reset showAll when searching
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={searchBy}
              onChange={(e) => {
                setSearchBy(e.target.value);
                setShowAll(false); // Reset showAll when changing search type
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Search by Name</option>
              <option value="department">Search by Department</option>
            </select>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowAll(false); // Reset showAll when clearing search
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                title="Clear search"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} 
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
         {/* Status Summary */}
         <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
           <div className="flex items-center justify-between text-sm">
             <div className="flex items-center gap-4">
               <span className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                 <span className="text-green-700 font-medium">
                   Active: {filteredDoctors.filter(d => d.status === 'Active').length}
                 </span>
               </span>
               <span className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                 <span className="text-red-700 font-medium">
                   Inactive: {filteredDoctors.filter(d => d.status === 'Inactive').length}
                 </span>
               </span>
             </div>
                            <span className="text-gray-600">
                 {searchTerm ? `Showing: ${filteredDoctors.length} of ${doctors.length} doctors` : `Total: ${doctors.length} doctors`}
                 {!showAll && filteredDoctors.length > doctorsPerPage && ` (${doctorsToDisplay.length} visible)`}
               </span>
           </div>
         </div>
         
         <table className="min-w-full bg-white">
           <thead>
             <tr className="bg-gray-100 text-left">
               <th className="px-4 py-3 border">S.No</th>
               <th className="px-4 py-3 border">Doctor Name</th>
               <th className="px-4 py-3 border">Gender</th>
               <th className="px-4 py-3 border">Department</th>
               <th className="px-3 py-3 border">Languages</th>
               <th className="px-4 py-3 border">Gallery</th>
               <th className="px-4 py-3 border">Status</th>
               <th className="px-4 py-3 border">Actions</th>
             </tr>
           </thead>
           <tbody>
             {loading ? (
               <tr>
                 <td colSpan="8" className="px-4 py-3 border text-center text-gray-500">
                   Loading doctors...
                 </td>
               </tr>
             ) : !Array.isArray(filteredDoctors) || filteredDoctors.length === 0 ? (
               <tr>
                 <td colSpan="8" className="px-4 py-3 border text-center text-gray-500">
                   {searchTerm ? `No doctors found matching "${searchTerm}". Try a different search term.` : 'No doctors found. Add your first doctor!'}
                 </td>
               </tr>
             ) : (
               doctorsToDisplay
                 .filter(doctor => doctor && (doctor._id || doctor.id)) // Filter out invalid doctors
                 .map((doctor, index) => (
                   <tr 
                     key={doctor._id || doctor.id || `doctor-${index}`} 
                     className={`text-left transition-all duration-300 ${
                       newlyAddedDoctor === (doctor._id || doctor.id)
                         ? 'bg-green-50 border-l-4 border-l-green-500 shadow-md' 
                         : doctor.status === 'Inactive'
                         ? 'bg-gray-100 opacity-60'
                         : ''
                     }`}
                   >
                     <td className="px-4 py-3 border">{index + 1}</td>
                     <td className="px-4 py-3 border">
                       <span className={`font-medium ${
                         doctor.status === 'Inactive' 
                           ? 'text-gray-500 line-through' 
                           : 'text-gray-900'
                       }`}>
                         {doctor.name}
                       </span>
                     </td>
                     <td className="px-4 py-3 border">
                       <span className={`${
                         doctor.status === 'Inactive' 
                           ? 'text-gray-500 line-through' 
                           : 'text-gray-700'
                       }`}>
                         {doctor.gender || 'Not specified'}
                       </span>
                     </td>
                     <td className="px-4 py-3 border">
                       <span className={`${
                         doctor.status === 'Inactive' 
                           ? 'text-gray-500 line-through' 
                           : 'text-gray-700'
                       }`}>
                         {doctor.department}
                       </span>
                     </td>
                     <td className="px-4 py-3 border">
                       <span className={`${
                         doctor.status === 'Inactive' 
                           ? 'text-gray-500 line-through' 
                           : 'text-gray-700'
                       }`}>
                         {doctor.languages}
                       </span>
                     </td>
                     <td className="px-4 py-3 border">
                       {doctor.photos && doctor.photos.length > 0 ? (
                         <div className="flex items-center gap-2">
                           <div className="flex -space-x-2">
                             {doctor.photos.slice(0, 3).map((photo, photoIndex) => (
                               <img
                                 key={photoIndex}
                                 src={photo.data}
                                 alt={photo.name}
                                 className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                 title={photo.name}
                               />
                             ))}
                           </div>
                           {doctor.photos.length > 3 && (
                             <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                               +{doctor.photos.length - 3}
                             </span>
                           )}
                           <button
                             onClick={() => handleAction(doctor._id || doctor.id, "gallery")}
                             className="text-xs text-blue-600 hover:text-blue-800 underline"
                             title="View all photos"
                           >
                             View All
                           </button>
                         </div>
                       ) : (
                         <span className="text-gray-400 text-sm">No photos</span>
                       )}
                     </td>
                     <td className="px-4 py-3 border">
                       <span className={`inline-block text-xs px-3 py-1 rounded font-medium ${
                         doctor.status === 'Active' 
                           ? 'bg-green-200 text-green-800 border border-green-300' 
                           : 'bg-red-200 text-red-800 border border-red-300'
                       }`}>
                         {doctor.status || 'Active'}
                       </span>
                     </td>
                     <td className="px-4 py-3 border">
                       <div className="flex gap-2">
                         <button
                           onClick={() => handleAction(doctor._id || doctor.id, "view")}
                           className={`px-3 py-1 rounded text-white ${
                             doctor.status === 'Inactive' 
                               ? 'bg-gray-400 cursor-not-allowed' 
                               : 'bg-cyan-500 hover:bg-cyan-600'
                           }`}
                           disabled={doctor.status === 'Inactive'}
                         >
                           View
                         </button>
                         <button
                           onClick={() => handleAction(doctor._id || doctor.id, "edit")}
                           className={`px-3 py-1 rounded text-white ${
                             doctor.status === 'Inactive' 
                               ? 'bg-gray-400 cursor-not-allowed' 
                               : 'bg-yellow-500 hover:bg-yellow-600'
                           }`}
                           disabled={doctor.status === 'Inactive'}
                         >
                           Edit
                         </button>
                         <button
                           onClick={() => handleAction(doctor._id || doctor.id, "delete")}
                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                         >
                           Delete
                         </button>
                         <button
                           onClick={() => handleAction(doctor._id || doctor.id, "deactivate")}
                           className={`px-3 py-1 rounded text-white font-medium ${
                             doctor.status === 'Active' 
                               ? 'bg-orange-500 hover:bg-orange-600' 
                               : 'bg-green-500 hover:bg-green-600'
                           }`}
                         >
                           {doctor.status === 'Active' ? 'Deactivate' : 'Activate'}
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))
             )}
           </tbody>
         </table>
         
         {/* Show All Button and Pagination */}
         {filteredDoctors.length > doctorsPerPage && (
           <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
             <div className="flex items-center justify-between">
               <div className="text-sm text-gray-600">
                 {showAll 
                   ? `Showing all ${filteredDoctors.length} doctors`
                   : `Showing ${doctorsToDisplay.length} of ${filteredDoctors.length} doctors`
                 }
               </div>
               <div className="flex gap-2">
                 {!showAll && (
                   <button
                     onClick={() => setShowAll(true)}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                     title="Show all doctors"
                   >
                     Show All
                   </button>
                 )}
                 {showAll && (
                   <button
                     onClick={() => setShowAll(false)}
                     className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                     title="Show limited doctors"
                   >
                     Show Less
                   </button>
                 )}
               </div>
             </div>
           </div>
         )}
       </div>
       
       <AddDoctorModal
         open={isAddOpen}
         onClose={() => setIsAddOpen(false)}
         onSave={handleSaveDoctor}
       />

       {/* Edit Doctor Modal */}
       {isEditOpen && editingDoctor && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
           <div className="w-full max-w-4xl bg-white rounded shadow-lg max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between px-6 py-4 border-b">
               <h3 className="text-xl font-semibold text-gray-800">
                 Edit Doctor: {editingDoctor.name}
               </h3>
               <div className="flex items-center gap-3">
                 <button
                   type="button"
                   onClick={refreshAll}
                   disabled={loadingDepartments || loadingLanguages}
                   className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:bg-gray-50 disabled:text-gray-400"
                 >
                   {loadingDepartments || loadingLanguages ? 'Refreshing...' : 'Refresh Data'}
                 </button>
                 <button 
                   onClick={handleEditCancel} 
                   className="text-gray-600 hover:text-gray-900"
                 >
                   ✕
                 </button>
               </div>
             </div>
             
             <div className="p-6">
               <form onSubmit={(e) => { e.preventDefault(); handleEditSave(); }} className="space-y-6">
                 {/* Doctor Name */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Doctor Name *
                   </label>
                   <input
                     type="text"
                     value={editForm.name}
                     onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Enter doctor's name"
                     required
                   />
                 </div>

                 {/* Gender */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Gender *
                   </label>
                   <select
                     value={editForm.gender}
                     onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     required
                   >
                     <option value="">Select gender</option>
                     <option value="Male">Male</option>
                     <option value="Female">Female</option>
                     <option value="Other">Other</option>
                   </select>
                 </div>

                 {/* Department */}
                 <div>
                   <div className="flex items-center justify-between mb-2">
                     <label className="block text-sm font-medium text-gray-700">
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
                     value={editForm.department}
                     onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
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

                 {/* Languages */}
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
                             checked={editForm.languages.includes(language)}
                             onChange={() => handleLanguageToggle(language)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                             disabled={editingDoctor?.isSubmitting}
                           />
                           <span className="text-sm text-gray-700">{language}</span>
                         </label>
                       ))}
                     </div>
                   )}
                   {!loadingLanguages && availableLanguages.length > 0 && editForm.languages.length === 0 && (
                     <p className="text-sm text-red-600 mt-1">Please select at least one language</p>
                   )}
                 </div>

                 {/* Gallery Section */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Doctor Photos
                   </label>
                   <div className="space-y-4">
                     {/* Current Photos Display */}
                     {editForm.photos && editForm.photos.length > 0 && (
                       <div>
                         <div className="flex items-center justify-between mb-3">
                           <h4 className="text-sm font-medium text-gray-700">
                             Current Photos ({editForm.photos.length})
                           </h4>
                           <button
                             type="button"
                             onClick={() => setEditForm(prev => ({ ...prev, photos: [] }))}
                             className="text-xs text-red-600 hover:text-red-800 underline"
                             disabled={editingDoctor?.isSubmitting}
                           >
                             Remove All
                           </button>
                         </div>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                           {editForm.photos.map((photo, index) => (
                             <div key={index} className="relative group">
                               <img
                                 src={photo.data}
                                 alt={photo.name}
                                 className="w-full h-24 object-cover rounded-lg border border-gray-200"
                               />
                               <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                 <button
                                   type="button"
                                   onClick={() => setEditForm(prev => ({
                                     ...prev,
                                     photos: prev.photos.filter((_, i) => i !== index)
                                   }))}
                                   className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all duration-200"
                                   disabled={editingDoctor?.isSubmitting}
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
                     
                     {/* Photo Upload for Edit */}
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                       <input
                         type="file"
                         multiple
                         accept="image/*"
                         onChange={(e) => {
                           const files = Array.from(e.target.files);
                           const validFiles = files.filter(file => {
                             if (!file.type.startsWith('image/')) {
                               alert(`File ${file.name} is not an image. Please select only image files.`);
                               return false;
                             }
                             if (file.size > 5 * 1024 * 1024) {
                               alert(`File ${file.name} is too large. Maximum size is 5MB.`);
                               return false;
                             }
                             return true;
                           });
                           
                           if (editForm.photos.length + validFiles.length > 10) {
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
                               
                               setEditForm(prev => ({
                                 ...prev,
                                 photos: [...prev.photos, photoData]
                               }));
                             };
                             reader.readAsDataURL(file);
                           });
                         }}
                         className="hidden"
                         id="edit-photo-upload"
                         disabled={editingDoctor?.isSubmitting || (editForm.photos && editForm.photos.length >= 10)}
                       />
                       <label
                         htmlFor="edit-photo-upload"
                         className={`cursor-pointer block ${
                           editingDoctor?.isSubmitting || (editForm.photos && editForm.photos.length >= 10)
                             ? 'opacity-50 cursor-not-allowed' 
                             : 'hover:text-blue-600'
                         }`}
                       >
                         <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                           <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                         </svg>
                         <span className="text-sm text-gray-600">
                           {editForm.photos && editForm.photos.length >= 10 
                             ? 'Maximum photos reached (10)' 
                             : 'Click to add more photos'
                           }
                         </span>
                         <p className="text-xs text-gray-500 mt-1">
                           PNG, JPG, GIF up to 5MB each. Max 10 photos total.
                         </p>
                       </label>
                     </div>
                   </div>
                 </div>

                 {/* Status */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Status
                   </label>
                   <select
                     value={editForm.status}
                     onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="Active">Active</option>
                     <option value="Inactive">Inactive</option>
                   </select>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex justify-end space-x-3 pt-4 border-t">
                   <button
                     type="button"
                     onClick={handleEditCancel}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={!editForm.name.trim() || !editForm.department.trim() || editForm.languages.length === 0 || !editForm.gender || editingDoctor?.isSubmitting}
                     className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                   >
                     {editingDoctor?.isSubmitting ? (
                       <>
                         <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Saving...
                       </>
                     ) : (
                       'Save Changes'
                     )}
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete "{deleteConfirm.name}"?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl bg-white rounded shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">Doctor Details</h3>
              <button 
                onClick={() => setViewingDoctor(null)} 
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Doctor Name</label>
                    <p className="text-lg text-gray-900 font-medium">{viewingDoctor.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-lg text-gray-900">{viewingDoctor.gender || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Department</label>
                    <p className="text-lg text-gray-900">{viewingDoctor.department}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Languages</label>
                    <p className="text-lg text-gray-900">{viewingDoctor.languages}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      viewingDoctor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingDoctor.status || 'Active'}
                    </span>
                  </div>
                  
                  {viewingDoctor.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Created On</label>
                      <p className="text-sm text-gray-900">{new Date(viewingDoctor.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Photos Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Photos</h4>
                  
                  {viewingDoctor.photos && viewingDoctor.photos.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
                        {viewingDoctor.photos.length} photo{viewingDoctor.photos.length !== 1 ? 's' : ''} available
                      </div>
                      
                      {/* Photo Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {viewingDoctor.photos.map((photo, index) => (
                          <div key={index} className="relative group cursor-pointer">
                            <img
                              src={photo.data}
                              alt={photo.name}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                              onClick={() => setPhotoViewer({
                                open: true,
                                photos: viewingDoctor.photos,
                                currentIndex: index
                              })}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                              <div className="truncate">{photo.name}</div>
                              <div className="text-xs opacity-75">
                                {(photo.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setPhotoViewer({
                          open: true,
                          photos: viewingDoctor.photos,
                          currentIndex: 0
                        })}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      >
                        View All Photos
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm">No photos uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {photoViewer.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Photo Gallery ({photoViewer.currentIndex + 1} of {photoViewer.photos.length})
              </h3>
              <button
                onClick={closePhotoViewer}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Photo Display */}
            <div className="relative p-6 bg-black">
              <img
                src={photoViewer.photos[photoViewer.currentIndex]?.data}
                alt={photoViewer.photos[photoViewer.currentIndex]?.name}
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
              />
              
              {/* Navigation Arrows */}
              {photoViewer.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            {/* Footer with Thumbnails */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {photoViewer.photos[photoViewer.currentIndex]?.name}
                </div>
                <div className="flex gap-2">
                  {photoViewer.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setPhotoViewer(prev => ({ ...prev, currentIndex: index }))}
                      className={`w-16 h-16 rounded-lg border-2 overflow-hidden ${
                        index === photoViewer.currentIndex 
                          ? 'border-blue-500' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={photo.data}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;