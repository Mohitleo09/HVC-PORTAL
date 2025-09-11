'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../navbar/navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import NewThumbnailForm from './NewThumbnailForm';
import { trackThumbnailCreate, trackThumbnailView, trackThumbnailEdit, trackThumbnailDelete, trackThumbnailUpdate } from '../utils/activityTracker';
import { getCurrentSessionInfo } from '../utils/activityTracker';

const ThumbnailPage = () => {
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    doctor: '',
    teluguThumbnail: null,
    englishThumbnail: null,
    hindiThumbnail: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [viewingThumbnail, setViewingThumbnail] = useState(null);
  const [editingThumbnail, setEditingThumbnail] = useState(null);
  const [editFormData, setEditFormData] = useState({
    department: '',
    doctor: '',
    languages: {
      telugu: null,
      english: null,
      hindi: null
    },
    newThumbnails: {
      telugu: null,
      english: null,
      hindi: null
    }
  });
  const [editingDoctors, setEditingDoctors] = useState([]);
  const [editingLoadingDoctors, setEditingLoadingDoctors] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');

  // Function to reset form data
  const resetFormData = () => {
    setFormData({
      department: '',
      doctor: '',
      teluguThumbnail: null,
      englishThumbnail: null,
      hindiThumbnail: null
    });
    setSelectedDepartment('');
    setDoctors([]);
  };

  // Function to close add form
  const closeAddForm = () => {
    setShowAddForm(false);
    resetFormData();
  };

  // Function to open add form
  const openAddForm = () => {
    setShowAddForm(true);
    // Reset form data when opening
    resetFormData();
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchThumbnails();
    fetchDepartments();
  }, []);

  // Scroll to top when form opens
  useEffect(() => {
    if (showAddForm) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const formContent = document.querySelector('.custom-scrollbar');
        if (formContent) {
          formContent.scrollTop = 0;
        }
      }, 150);
    }
  }, [showAddForm]);

  // Fetch thumbnails
  const fetchThumbnails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/thumbnails');
      if (response.ok) {
        const result = await response.json();
        setThumbnails(result.thumbnails || []);
      } else {
        setError('Failed to fetch thumbnails');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const result = await response.json();
        const deptList = result.departments || [];
        setDepartments(deptList);
        console.log('Departments loaded:', deptList);
      } else {
        console.error('Failed to fetch departments');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Fetch doctors based on selected department
  const fetchDoctorsByDepartment = async (departmentId) => {
    if (!departmentId) {
      setDoctors([]);
      setLoadingDoctors(false);
      return;
    }
    
    // Check if departments are loaded
    if (departments.length === 0) {
      console.log('Departments not loaded yet, fetching departments first...');
      await fetchDepartments();
    }
    
    try {
      setLoadingDoctors(true);
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const result = await response.json();
        
        // Get the department name from the selected department ID
        const selectedDept = departments.find(dept => dept._id === departmentId);
        const deptName = selectedDept?.name;
        
        console.log('Selected department ID:', departmentId);
        console.log('Available departments:', departments);
        console.log('Selected department object:', selectedDept);
        console.log('Department name to match:', deptName);
        console.log('All doctors from API:', result.doctors);
        
        if (!deptName) {
          console.error('Department not found:', departmentId);
          setDoctors([]);
          setLoadingDoctors(false);
          return;
        }
        
        // Filter doctors by department name (string) and only show active doctors
        const filteredDoctors = result.doctors?.filter(doctor => {
          const matchesDept = doctor.department === deptName;
          const isActive = doctor.status === 'Active';
          console.log(`Doctor ${doctor.name}: department="${doctor.department}" (matches: ${matchesDept}), status="${doctor.status}" (active: ${isActive})`);
          return matchesDept && isActive;
        }) || [];
        
        console.log(`Found ${filteredDoctors.length} doctors for department "${deptName}" (ID: ${departmentId}):`, filteredDoctors);
        
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
    console.log('Department changed to:', deptId);
    
    // Reset doctor selection when department changes
    setFormData(prev => ({ ...prev, department: deptId, doctor: '' }));
    setSelectedDepartment(deptId);
    
    // Clear doctors list first
    setDoctors([]);
    
    // Fetch doctors for the selected department
    if (deptId) {
      fetchDoctorsByDepartment(deptId);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, thumbnail: file }));
    } else {
      alert('Please select a valid image file');
    }
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
  const handleSubmit = async (e, formDataFromForm) => {
    // If called from the form component, use the passed formData
    // If called directly (with event), use the local formData
    const dataToUse = formDataFromForm || formData;
    
    if (e && e.preventDefault) {
    e.preventDefault();
    }
    
    console.log('🚀 Starting thumbnail form submission...');
    console.log('📋 Form data:', dataToUse);
    
    if (!dataToUse.department || !dataToUse.doctor || (!dataToUse.teluguThumbnail && !dataToUse.englishThumbnail && !dataToUse.hindiThumbnail)) {
      console.error('❌ Missing required fields:', {
        department: !!dataToUse.department,
        doctor: !!dataToUse.doctor,
        teluguThumbnail: !!dataToUse.teluguThumbnail,
        englishThumbnail: !!dataToUse.englishThumbnail,
        hindiThumbnail: !!dataToUse.hindiThumbnail
      });
      alert('Please fill all required fields and select at least one thumbnail image');
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('🌐 Sending request to /api/thumbnails...');
      
      // Create thumbnails for each selected language
      const createdThumbnails = [];
      
      // Get user information for tracking
      const sessionInfo = getCurrentSessionInfo();
      const userId = sessionInfo.currentUser?.userId || 'unknown';
      const username = sessionInfo.currentUser?.username || 'unknown';
      
      // Get doctor and department info
      let selectedDoctor = doctors.find(doctor => doctor._id === dataToUse.doctor);
      let doctorName = selectedDoctor?.name || 'Unknown Doctor';
      
      // If doctor not found in local array, fetch from API
      if (!selectedDoctor && dataToUse.doctor) {
        try {
          console.log('🔍 Doctor not found locally, fetching from API...');
          const response = await fetch('/api/doctors');
          if (response.ok) {
            const result = await response.json();
            selectedDoctor = result.doctors?.find(doctor => doctor._id === dataToUse.doctor);
            doctorName = selectedDoctor?.name || 'Unknown Doctor';
            console.log('🔍 Fetched doctor from API:', selectedDoctor);
          }
        } catch (error) {
          console.error('❌ Error fetching doctor from API:', error);
        }
      }
      
      console.log('🔍 Doctor lookup debug:', {
        selectedDoctorId: dataToUse.doctor,
        availableDoctors: doctors.length,
        selectedDoctor: selectedDoctor,
        doctorName: doctorName,
        doctorsList: doctors.map(d => ({ id: d._id, name: d.name }))
      });
      
      if (dataToUse.teluguThumbnail) {
        const teluguFormData = new FormData();
        teluguFormData.append('department', dataToUse.department);
        teluguFormData.append('doctor', dataToUse.doctor);
        teluguFormData.append('thumbnail', dataToUse.teluguThumbnail);
        teluguFormData.append('language', 'telugu');
        teluguFormData.append('userId', userId);
        teluguFormData.append('username', username);
        teluguFormData.append('doctorName', doctorName);
        
        const teluguResponse = await fetch('/api/thumbnails', {
          method: 'POST',
          body: teluguFormData
        });
        
        if (teluguResponse.ok) {
          const teluguResult = await teluguResponse.json();
          if (teluguResult.success) {
            createdThumbnails.push(teluguResult.thumbnail);
          }
        }
      }
      
      if (dataToUse.englishThumbnail) {
        const englishFormData = new FormData();
        englishFormData.append('department', dataToUse.department);
        englishFormData.append('doctor', dataToUse.doctor);
        englishFormData.append('thumbnail', dataToUse.englishThumbnail);
        englishFormData.append('language', 'english');
        englishFormData.append('userId', userId);
        englishFormData.append('username', username);
        englishFormData.append('doctorName', doctorName);
        
        const englishResponse = await fetch('/api/thumbnails', {
          method: 'POST',
          body: englishFormData
        });
        
        if (englishResponse.ok) {
          const englishResult = await englishResponse.json();
          if (englishResult.success) {
            createdThumbnails.push(englishResult.thumbnail);
          }
        }
      }
      
      if (dataToUse.hindiThumbnail) {
        const hindiFormData = new FormData();
        hindiFormData.append('department', dataToUse.department);
        hindiFormData.append('doctor', dataToUse.doctor);
        hindiFormData.append('thumbnail', dataToUse.hindiThumbnail);
        hindiFormData.append('language', 'hindi');
        hindiFormData.append('userId', userId);
        hindiFormData.append('username', username);
        hindiFormData.append('doctorName', doctorName);
        
        const hindiResponse = await fetch('/api/thumbnails', {
          method: 'POST',
          body: hindiFormData
        });
        
        if (hindiResponse.ok) {
          const hindiResult = await hindiResponse.json();
          if (hindiResult.success) {
            createdThumbnails.push(hindiResult.thumbnail);
          }
        }
      }

      console.log('📡 All thumbnail responses processed');
      console.log('✅ Created thumbnails:', createdThumbnails);

      if (createdThumbnails.length > 0) {
        console.log('🎉 Thumbnails created successfully!');
        setThumbnails(prev => [...createdThumbnails, ...prev]);
        closeAddForm();
        
        // Track thumbnail creation activities
        const sessionInfo = getCurrentSessionInfo();
        if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
          const { userId, username } = sessionInfo.currentUser;
          
          // Get department info
          const selectedDept = departments.find(dept => dept._id === dataToUse.department);
          
          // Get doctor info
          const selectedDoctor = doctors.find(doctor => doctor._id === dataToUse.doctor);
          const doctorName = selectedDoctor?.name || 'Unknown Doctor';
          
          // Track each created thumbnail
          createdThumbnails.forEach(thumbnail => {
            console.log('🔍 Tracking thumbnail create for user:', { userId, username, doctorName });
            trackThumbnailCreate(userId, username, thumbnail._id, doctorName, {
              fileName: thumbnail.thumbnailUrl ? thumbnail.thumbnailUrl.split('/').pop() : 'thumbnail',
              fileSize: thumbnail.fileSize || 0,
              fileType: thumbnail.fileType || 'image',
              language: thumbnail.language,
              department: selectedDept?.name || 'Unknown'
            });
          });
        }
        
        // Dispatch event to update dashboard counts
        window.dispatchEvent(new CustomEvent('thumbnailUpdated'));
        
        alert(`Successfully created ${createdThumbnails.length} thumbnail(s)!`);
      } else {
        alert('Failed to create any thumbnails. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error adding thumbnail:', err);
      console.error('❌ Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      alert(`Error adding thumbnail: ${err.message}`);
    } finally {
      setSubmitting(false);
      console.log('🏁 Form submission completed');
    }
  };

  // Handle thumbnail deletion
  const handleDelete = async (thumbnail) => {
    // Debug: Log the thumbnail object to understand its structure
    console.log('🔍 Thumbnail object for deletion:', thumbnail);
    console.log('🔍 Available properties:', Object.keys(thumbnail));
    console.log('🔍 Active language filter:', selectedLanguage);
    
    // Extract the ID from the thumbnail object, trying different possible properties
    const thumbnailId = thumbnail._id || thumbnail.id || thumbnail.thumbnailId;
    
    if (!thumbnailId) {
      console.error('❌ No valid ID found for thumbnail:', thumbnail);
      console.error('❌ Available properties:', Object.keys(thumbnail));
      alert('Error: Could not identify thumbnail for deletion. Please check the console for details.');
      return;
    }

    console.log('✅ Found thumbnail ID:', thumbnailId);

    // Determine what to delete based on language filter
    let deleteMessage = '';
    let deleteType = '';

    if (selectedLanguage) {
      // Language-specific deletion
      deleteType = 'language';
      deleteMessage = `Are you sure you want to delete the ${selectedLanguage} thumbnail for this doctor?\n\nDoctor: ${thumbnail.doctorName || 'Unknown'}\nDepartment: ${thumbnail.departmentName || 'Unknown'}\nLanguage: ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}`;
    } else {
      // Delete entire doctor group (all languages)
      deleteType = 'all';
      deleteMessage = `Are you sure you want to delete ALL thumbnails for this doctor?\n\nDoctor: ${thumbnail.doctorName || 'Unknown'}\nDepartment: ${thumbnail.departmentName || 'Unknown'}\nThis will remove thumbnails in all languages (Telugu, English, Hindi)`;
    }

    if (!confirm(deleteMessage)) {
      return;
    }

    try {
      if (deleteType === 'language') {
        // Delete specific language thumbnail
        console.log(`🗑️ Attempting to delete ${selectedLanguage} thumbnail:`, { id: thumbnailId, thumbnail });
        
        const response = await fetch(`/api/thumbnails/${thumbnailId}`, {
        method: 'DELETE'
      });

        console.log('📡 Delete API response status:', response.status);

      if (response.ok) {
          const result = await response.json();
          console.log('✅ Delete API response:', result);
          
          // Track thumbnail deletion activity
          const sessionInfo = getCurrentSessionInfo();
          if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
            const { userId, username } = sessionInfo.currentUser;
            
            trackThumbnailDelete(userId, username, thumbnailId, thumbnail.doctorName || 'Unknown', {
              fileName: thumbnail.thumbnailUrl ? thumbnail.thumbnailUrl.split('/').pop() : 'thumbnail',
              language: selectedLanguage,
              department: thumbnail.departmentName || 'Unknown',
              reason: `Deleted ${selectedLanguage} thumbnail`
            });
          }
          
          // Remove the specific thumbnail from the local state
          setThumbnails(prev => prev.filter(thumb => {
            const thumbId = thumb._id || thumb.id || thumb.thumbnailId;
            return thumbId !== thumbnailId;
          }));
          
          // Dispatch event to update dashboard counts
        window.dispatchEvent(new CustomEvent('thumbnailUpdated'));
          
          alert(`Successfully deleted ${selectedLanguage} thumbnail!`);
      } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Delete API error response:', errorData);
          console.error('❌ HTTP status:', response.status);
          alert(`Failed to delete ${selectedLanguage} thumbnail: ${errorData.message || `HTTP ${response.status}`}`);
        }
      } else {
        // Delete all language thumbnails for the doctor
        console.log('🗑️ Attempting to delete ALL thumbnails for doctor:', thumbnail);
        
        // Find all thumbnails for this doctor
        const doctorThumbnails = thumbnails.filter(thumb => 
          thumb.doctor === thumbnail.doctorId || thumb.doctor === thumbnail.doctor
        );
        
        console.log(`📋 Found ${doctorThumbnails.length} thumbnails to delete for doctor`);
        
        if (doctorThumbnails.length === 0) {
          alert('No thumbnails found for this doctor to delete.');
          return;
        }
        
        // Delete all thumbnails for the doctor
        const deletePromises = doctorThumbnails.map(async (thumb) => {
          const thumbId = thumb._id || thumb.id || thumb.thumbnailId;
          const response = await fetch(`/api/thumbnails/${thumbId}`, {
            method: 'DELETE'
          });
          return { response, thumbId, success: response.ok };
        });
        
        const deleteResults = await Promise.all(deletePromises);
        const successfulDeletes = deleteResults.filter(result => result.success);
        const failedDeletes = deleteResults.filter(result => !result.success);
        
        console.log('📡 Delete results:', { successful: successfulDeletes.length, failed: failedDeletes.length });
        
        if (successfulDeletes.length > 0) {
          // Track thumbnail deletion activities
          const sessionInfo = getCurrentSessionInfo();
          if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
            const { userId, username } = sessionInfo.currentUser;
            
            // Track each deleted thumbnail
            successfulDeletes.forEach(result => {
              const deletedThumbnail = doctorThumbnails.find(dt => 
                (dt._id || dt.id || dt.thumbnailId) === result.thumbId
              );
              
              if (deletedThumbnail) {
                trackThumbnailDelete(userId, username, result.thumbId, thumbnail.doctorName || 'Unknown', {
                  fileName: deletedThumbnail.thumbnailUrl ? deletedThumbnail.thumbnailUrl.split('/').pop() : 'thumbnail',
                  language: deletedThumbnail.language,
                  department: thumbnail.departmentName || 'Unknown',
                  reason: deleteType === 'language' ? `Deleted ${selectedLanguage} thumbnail` : 'Deleted all thumbnails for doctor'
                });
              }
            });
          }
          
          // Remove all thumbnails for this doctor from local state
          setThumbnails(prev => prev.filter(thumb => {
            const isDoctorThumb = doctorThumbnails.some(dt => 
              (dt._id || dt.id || dt.thumbnailId) === (thumb._id || thumb.id || thumb.thumbnailId)
            );
            return !isDoctorThumb;
          }));
          
          // Dispatch event to update dashboard counts
          window.dispatchEvent(new CustomEvent('thumbnailUpdated'));
          
          if (failedDeletes.length === 0) {
            alert(`Successfully deleted all ${successfulDeletes.length} thumbnails for this doctor!`);
          } else {
            alert(`Partially successful: Deleted ${successfulDeletes.length} thumbnails, failed to delete ${failedDeletes.length} thumbnails.`);
          }
        } else {
          alert('Failed to delete any thumbnails. Please try again.');
        }
      }
    } catch (err) {
      console.error('❌ Error deleting thumbnail(s):', err);
      console.error('❌ Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      alert(`Error deleting thumbnail(s): ${err.message}`);
    }
  };

  // Handle opening edit form
  const handleEdit = (thumbnail) => {
    setEditingThumbnail(thumbnail);
    setEditFormData({
      department: thumbnail.department,
      doctor: thumbnail.doctor,
      languages: {
        telugu: thumbnail.teluguThumbnailUrl,
        english: thumbnail.englishThumbnailUrl,
        hindi: thumbnail.hindiThumbnailUrl
      },
      newThumbnails: {
        telugu: null,
        english: null,
        hindi: null
      }
    });
    
    // Fetch doctors for the current department
    if (thumbnail.department) {
      fetchEditingDoctorsByDepartment(thumbnail.department);
    }
  };

  // Fetch doctors for editing form based on selected department
  const fetchEditingDoctorsByDepartment = async (departmentId) => {
    if (!departmentId) {
      setEditingDoctors([]);
      setEditingLoadingDoctors(false);
      return;
    }
    
    try {
      setEditingLoadingDoctors(true);
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const result = await response.json();
        
        // Get the department name from the selected department ID
        const selectedDept = departments.find(dept => dept._id === departmentId);
        const deptName = selectedDept?.name;
        
        if (!deptName) {
          console.error('Department not found:', departmentId);
          setEditingDoctors([]);
          setEditingLoadingDoctors(false);
          return;
        }
        
        // Filter doctors by department name and only show active doctors
        const filteredDoctors = result.doctors?.filter(doctor => {
          const matchesDept = doctor.department === deptName;
          const isActive = doctor.status === 'Active';
          return matchesDept && isActive;
        }) || [];
        
        setEditingDoctors(filteredDoctors);
        
      } else {
        console.error('Failed to fetch doctors for editing');
        setEditingDoctors([]);
      }
    } catch (err) {
      console.error('Error fetching doctors for editing:', err);
      setEditingDoctors([]);
    } finally {
      setEditingLoadingDoctors(false);
    }
  };

  // Handle department change in edit form
  const handleEditDepartmentChange = (e) => {
    const deptId = e.target.value;
    console.log('Edit form - Department changed to:', deptId);
    
    // Reset doctor selection when department changes
    setEditFormData(prev => ({ ...prev, department: deptId, doctor: '' }));
    
    // Clear doctors list first
    setEditingDoctors([]);
    
    // Fetch doctors for the selected department
    if (deptId) {
      fetchEditingDoctorsByDepartment(deptId);
    }
  };

  // Handle file change in edit form
  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setEditFormData(prev => ({ ...prev, newThumbnails: { ...prev.newThumbnails, [e.target.name]: file } }));
    } else {
      alert('Please select a valid image file');
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Starting multi-language thumbnail edit submission...');
    console.log('📋 Edit form data:', editFormData);
    
    if (!editFormData.department || !editFormData.doctor) {
      console.error('❌ Missing required fields in edit form:', {
        department: !!editFormData.department,
        doctor: !!editFormData.doctor
      });
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('🔄 Processing updates for all languages...');
      
      // Update each language thumbnail that has changes
      const updatePromises = [];
      const updatedThumbnails = [];
      
      // Process Telugu thumbnail
      if (editFormData.newThumbnails.telugu && editingThumbnail.languages.telugu) {
        const teluguFormData = new FormData();
        teluguFormData.append('department', editFormData.department);
        teluguFormData.append('doctor', editFormData.doctor);
        teluguFormData.append('thumbnail', editFormData.newThumbnails.telugu);
        teluguFormData.append('language', 'telugu');
        
        updatePromises.push(
          fetch(`/api/thumbnails/${editingThumbnail.languages.telugu.id}`, {
            method: 'PATCH',
            body: teluguFormData
          }).then(response => response.json())
        );
      }
      
      // Process English thumbnail
      if (editFormData.newThumbnails.english && editingThumbnail.languages.english) {
        const englishFormData = new FormData();
        englishFormData.append('department', editFormData.department);
        englishFormData.append('doctor', editFormData.doctor);
        englishFormData.append('thumbnail', editFormData.newThumbnails.english);
        englishFormData.append('language', 'english');
        
        updatePromises.push(
          fetch(`/api/thumbnails/${editingThumbnail.languages.english.id}`, {
        method: 'PATCH',
            body: englishFormData
          }).then(response => response.json())
        );
      }
      
      // Process Hindi thumbnail
      if (editFormData.newThumbnails.hindi && editingThumbnail.languages.hindi) {
        const hindiFormData = new FormData();
        hindiFormData.append('department', editFormData.department);
        hindiFormData.append('doctor', editFormData.doctor);
        hindiFormData.append('thumbnail', editFormData.newThumbnails.hindi);
        hindiFormData.append('language', 'hindi');
        
        updatePromises.push(
          fetch(`/api/thumbnails/${editingThumbnail.languages.hindi.id}`, {
            method: 'PATCH',
            body: hindiFormData
          }).then(response => response.json())
        );
      }
      
      if (updatePromises.length === 0) {
        alert('No changes detected. Please select new thumbnails to update.');
        return;
      }
      
      console.log(`📤 Updating ${updatePromises.length} language thumbnail(s)...`);
      
      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      
      console.log('📡 All update responses:', results);
      
      // Check if all updates were successful
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        console.log('🎉 All language thumbnails updated successfully!');
        
        // Track thumbnail update activities
        const sessionInfo = getCurrentSessionInfo();
        if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
          const { userId, username } = sessionInfo.currentUser;
          
          // Track each updated thumbnail
          results.forEach((result, index) => {
            if (result.success && result.thumbnail) {
              const language = ['telugu', 'english', 'hindi'][index];
              trackThumbnailUpdate(userId, username, result.thumbnail._id, editingThumbnail.doctorName, {
                fileName: result.thumbnail.thumbnailUrl ? result.thumbnail.thumbnailUrl.split('/').pop() : 'thumbnail',
                language: language,
                department: editingThumbnail.departmentName,
                editType: 'thumbnail_replaced',
                previousValues: editingThumbnail.languages[language] || {},
                newValues: result.thumbnail
              });
            }
          });
        }
        
        // Refresh the thumbnails list
        await fetchThumbnails();
          
          // Reset edit form
        setEditFormData({ 
          department: '', 
          doctor: '', 
          languages: { telugu: null, english: null, hindi: null },
          newThumbnails: { telugu: null, english: null, hindi: null }
        });
          setEditingThumbnail(null);
          setEditingDoctors([]);
          
          // Dispatch event to update dashboard counts
          window.dispatchEvent(new CustomEvent('thumbnailUpdated'));
          
        alert(`Successfully updated ${results.length} language thumbnail(s)!`);
        } else {
        const failedUpdates = results.filter(result => !result.success);
        console.error('❌ Some updates failed:', failedUpdates);
        alert(`Failed to update ${failedUpdates.length} thumbnail(s). Please try again.`);
      }
    } catch (err) {
      console.error('❌ Error updating thumbnails:', err);
      console.error('❌ Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      alert(`Error updating thumbnails: ${err.message}`);
    } finally {
      setSubmitting(false);
      console.log('🏁 Multi-language edit form submission completed');
    }
  };

  // Group thumbnails by doctor for table display
  const groupedThumbnails = thumbnails.reduce((groups, thumbnail) => {
    const doctorId = thumbnail.doctor;
    const doctorName = thumbnail.doctorName;
    const departmentId = thumbnail.department;
    const departmentName = thumbnail.departmentName;
    
    if (!groups[doctorId]) {
      groups[doctorId] = {
        doctorId,
        doctorName,
        departmentId,
        departmentName,
        languages: {},
        totalThumbnails: 0,
        createdAt: thumbnail.createdAt,
        updatedAt: thumbnail.updatedAt
      };
    }
    
    // Add language thumbnail
    groups[doctorId].languages[thumbnail.language] = {
      id: thumbnail._id,
      thumbnailUrl: thumbnail.thumbnailUrl,
      language: thumbnail.language,
      createdAt: thumbnail.createdAt,
      updatedAt: thumbnail.updatedAt
    };
    
    groups[doctorId].totalThumbnails++;
    
    // Update timestamps to show the most recent
    if (new Date(thumbnail.updatedAt) > new Date(groups[doctorId].updatedAt)) {
      groups[doctorId].updatedAt = thumbnail.updatedAt;
    }
    if (new Date(thumbnail.createdAt) < new Date(groups[doctorId].createdAt)) {
      groups[doctorId].createdAt = thumbnail.createdAt;
    }
    
    return groups;
  }, {});

  // Convert grouped thumbnails to array and filter
  const filteredGroupedThumbnails = Object.values(groupedThumbnails).filter(group => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
                         (group.doctorName && group.doctorName.toLowerCase().includes(searchLower)) ||
                         (group.departmentName && group.departmentName.toLowerCase().includes(searchLower));
    const matchesDepartment = !selectedDepartment || group.departmentId === selectedDepartment;
    
    // Language filtering: only show doctors who have thumbnails in the selected language
    const matchesLanguage = !selectedLanguage || group.languages[selectedLanguage];
    
    return matchesSearch && matchesDepartment && matchesLanguage;
  });

  // Get filtered languages for display (when a specific language is selected)
  const getFilteredLanguages = (group) => {
    if (!selectedLanguage) {
      // If no language filter, show all available languages
      return group.languages;
    } else {
      // If language filter is active, only show that specific language
      return selectedLanguage in group.languages ? { [selectedLanguage]: group.languages[selectedLanguage] } : {};
    }
  };

  return (
    <ProtectedRoute>
      <Navbar>
        <div className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Thumbnail Management</h1>
            <p className="text-gray-600">Manage and organize your thumbnails efficiently</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button 
                onClick={openAddForm}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Add New Thumbnail
              </button>
            </div>
            
            <div className="flex gap-2">
              {/* <button 
                onClick={fetchThumbnails}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button> */}
              
              {/* Test Database Connection Button */}
              {/* <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/health');
                    const data = await response.json();
                    if (data.success && data.database.connected) {
                      alert('✅ Database connection successful!\n\nStatus: ' + data.status + '\nResponse Time: ' + data.responseTime);
                    } else {
                      alert('❌ Database connection failed!\n\nError: ' + (data.database.error || 'Unknown error'));
                    }
                  } catch (error) {
                    alert('❌ Failed to test database connection: ' + error.message);
                  }
                }}
                className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                title="Test Database Connection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button> */}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by doctor name, department, or language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">All Languages</option>
                <option value="telugu">Telugu</option>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
              {(searchQuery || selectedDepartment || selectedLanguage) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDepartment('');
                    setSelectedLanguage('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
              {/* <select 
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select> */}
            </div>
          </div>

          {/* Thumbnail Count Display */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total Doctors:</span> {Object.values(groupedThumbnails).length}
              <span className="ml-2 text-gray-500">({thumbnails.length} total thumbnails)</span>
            </div>
            {(selectedDepartment || selectedLanguage) && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Filtered:</span> {filteredGroupedThumbnails.length} of {Object.values(groupedThumbnails).length}
                {selectedDepartment && (
                  <span className="ml-2 text-blue-600">• Dept: {departments.find(d => d._id === selectedDepartment)?.name}</span>
                )}
                {selectedLanguage && (
                  <span className="ml-2 text-green-600">• Lang: {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}</span>
                        )}
                      </div>
                        )}
                      </div>

          {/* New Thumbnail Form Component */}
          <NewThumbnailForm
            isOpen={showAddForm}
            onClose={closeAddForm}
            departments={departments}
            onSubmit={handleSubmit}
            submitting={submitting}
          />

          {/* Thumbnail Details Modal */}
          {viewingThumbnail && (
            <div className="fixed inset-0  bg-opacity-50% flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Thumbnail Details</h2>
                  <button 
                    onClick={() => setViewingThumbnail(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Show all language thumbnails for the doctor */}
                {viewingThumbnail && (
                  <>
                    {/* Doctor Information */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Doctor Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                          <span className="font-medium text-gray-600">Doctor Name:</span>
                          <span className="ml-2 text-gray-900">{viewingThumbnail.doctorName}</span>
                      </div>
                      <div>
                          <span className="font-medium text-gray-600">Department:</span>
                          <span className="ml-2 text-gray-900">{viewingThumbnail.departmentName}</span>
                      </div>
                      <div>
                          <span className="font-medium text-gray-600">Total Thumbnails:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedLanguage ? 
                              Object.keys(getFilteredLanguages(viewingThumbnail)).length : 
                              viewingThumbnail.totalThumbnails
                            }
                            {selectedLanguage && (
                              <span className="text-gray-500"> (filtered by {selectedLanguage})</span>
                            )}
                          </span>
                      </div>
                      <div>
                          <span className="font-medium text-gray-600">Languages:</span>
                          <span className="ml-2 text-gray-900">
                            {(() => {
                              const orderedLanguages = ['telugu', 'english', 'hindi'];
                              const availableLanguages = orderedLanguages.filter(lang => getFilteredLanguages(viewingThumbnail)[lang]);
                              
                              return availableLanguages.map(lang => 
                                lang.charAt(0).toUpperCase() + lang.slice(1)
                              ).join(', ');
                            })()}
                          </span>
                      </div>
                    </div>
                  </div>

                    {/* All Language Thumbnails */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Display languages in specific order: Telugu, English, Hindi */}
                      {(() => {
                        const orderedLanguages = ['telugu', 'english', 'hindi'];
                        const availableLanguages = orderedLanguages.filter(lang => getFilteredLanguages(viewingThumbnail)[lang]);
                        
                        return availableLanguages.map(lang => {
                          const thumbnail = getFilteredLanguages(viewingThumbnail)[lang];
                          return (
                            <div key={lang} className="space-y-3">
                              <h4 className="text-md font-semibold text-gray-800 capitalize">
                                {lang} Thumbnail
                              </h4>
                              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                                <img 
                                  src={thumbnail.thumbnailUrl} 
                                  alt={`${lang} thumbnail`}
                                  className="max-w-full max-h-48 object-contain rounded-lg"
                                />
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                Created: {new Date(thumbnail.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Close Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setViewingThumbnail(null)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Edit Thumbnail Modal */}
          {editingThumbnail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Edit Doctor Thumbnails</h2>
                  <button 
                    onClick={() => {
                      setEditingThumbnail(null);
                      setEditFormData({ 
                        department: '', 
                        doctor: '', 
                        languages: { telugu: null, english: null, hindi: null },
                        newThumbnails: { telugu: null, english: null, hindi: null }
                      });
                      setEditingDoctors([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-6">
                  {/* Doctor Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Doctor Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                          Doctor Name
                    </label>
                        <p className="text-gray-900 font-medium">{editingThumbnail.doctorName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <p className="text-gray-900 font-medium">{editingThumbnail.departmentName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Department Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Department *
                    </label>
                    <select
                      value={editFormData.department}
                      onChange={handleEditDepartmentChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Choose Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor *
                    </label>
                    <select
                      value={editFormData.doctor}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, doctor: e.target.value }))}
                      required
                      disabled={!editFormData.department || editingLoadingDoctors}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {!editFormData.department 
                          ? 'Please select a department first' 
                          : editingLoadingDoctors
                            ? 'Loading doctors...'
                            : editingDoctors.length === 0 
                              ? 'No doctors available in this department' 
                              : 'Choose Doctor'
                        }
                      </option>
                      {!editingLoadingDoctors && editingDoctors.length > 0 && editingDoctors.map(doctor => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Language Thumbnails Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {selectedLanguage ? `${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} Thumbnails` : 'Language Thumbnails'}
                    </h3>
                    
                    {/* Telugu Thumbnail - Show only when no filter or Telugu filter is active */}
                    {(!selectedLanguage || selectedLanguage === 'telugu') && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Telugu Thumbnail</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Current Thumbnail</label>
                            {editingThumbnail.languages.telugu ? (
                              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                                <img 
                                  src={editingThumbnail.languages.telugu.thumbnailUrl} 
                                  alt="Current Telugu Thumbnail"
                                  className="h-24 w-24 object-cover rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center text-gray-500">
                                No Telugu thumbnail
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">New Thumbnail (Optional)</label>
                            <input
                              type="file"
                              name="telugu"
                              accept="image/*"
                              onChange={handleEditFileChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {editFormData.newThumbnails.telugu && (
                      <p className="text-sm text-green-600 mt-1">
                                New image selected: {editFormData.newThumbnails.telugu.name}
                      </p>
                    )}
                  </div>
                        </div>
                      </div>
                    )}

                    {/* English Thumbnail - Show only when no filter or English filter is active */}
                    {(!selectedLanguage || selectedLanguage === 'english') && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-700 mb-3">English Thumbnail</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Current Thumbnail</label>
                            {editingThumbnail.languages.english ? (
                              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                                <img 
                                  src={editingThumbnail.languages.english.thumbnailUrl} 
                                  alt="Current English Thumbnail"
                                  className="h-24 w-24 object-cover rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center text-gray-500">
                                No English thumbnail
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">New Thumbnail (Optional)</label>
                            <input
                              type="file"
                              name="english"
                              accept="image/*"
                              onChange={handleEditFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {editFormData.newThumbnails.english && (
                              <p className="text-sm text-green-600 mt-1">
                                New image selected: {editFormData.newThumbnails.english.name}
                              </p>
                            )}
                  </div>
                        </div>
                      </div>
                    )}

                    {/* Hindi Thumbnail - Show only when no filter or Hindi filter is active */}
                    {(!selectedLanguage || selectedLanguage === 'hindi') && (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Hindi Thumbnail</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Current Thumbnail</label>
                            {editingThumbnail.languages.hindi ? (
                              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                                <img 
                                  src={editingThumbnail.languages.hindi.thumbnailUrl} 
                                  alt="Current Hindi Thumbnail"
                                  className="h-24 w-24 object-cover rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center text-gray-500">
                                No Hindi thumbnail
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">New Thumbnail (Optional)</label>
                    <input
                      type="file"
                              name="hindi"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                            {editFormData.newThumbnails.hindi && (
                      <p className="text-sm text-green-600 mt-1">
                                New image selected: {editFormData.newThumbnails.hindi.name}
                      </p>
                    )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {submitting ? 'Updating...' : selectedLanguage ? `Update ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} Thumbnail` : 'Update All Thumbnails'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingThumbnail(null);
                        setEditFormData({ 
                          department: '', 
                          doctor: '', 
                          languages: { telugu: null, english: null, hindi: null },
                          newThumbnails: { telugu: null, english: null, hindi: null }
                        });
                        setEditingDoctors([]);
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchQuery || selectedDepartment || selectedLanguage) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: "{searchQuery}"
                    </span>
                  )}
                  {selectedDepartment && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Dept: {departments.find(d => d._id === selectedDepartment)?.name}
                    </span>
                  )}
                  {selectedLanguage && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Lang: {selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDepartment('');
                    setSelectedLanguage('');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Main Content - Thumbnails Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600 font-medium">Loading thumbnails...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-red-600 font-medium mb-2">Failed to load thumbnails</p>
                    <p className="text-gray-600 text-sm mb-3">{error}</p>
                    <button 
                      onClick={fetchThumbnails}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : filteredGroupedThumbnails.length === 0 ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-gray-600 font-medium">No thumbnails found</p>
                    <p className="text-gray-500 text-sm">Create your first thumbnail to get started!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Language Thumbnails
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Languages
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGroupedThumbnails.map((group, index) => (
                      <tr key={`${group.doctorId}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {/* Display languages in specific order: Telugu, English, Hindi */}
                            {(() => {
                              const orderedLanguages = ['telugu', 'english', 'hindi'];
                              const availableLanguages = orderedLanguages.filter(lang => getFilteredLanguages(group)[lang]);
                              
                              return availableLanguages.map(lang => {
                                const thumbnail = getFilteredLanguages(group)[lang];
                                return (
                                  <div key={lang} className="flex flex-col items-center">
                                    <img 
                                      src={thumbnail.thumbnailUrl || '/placeholder-thumbnail.png'} 
                                      alt={`${lang} thumbnail`}
                                      className="h-12 w-12 object-cover rounded-lg border-2 border-gray-200"
                                      title={`${lang.charAt(0).toUpperCase() + lang.slice(1)} Thumbnail`}
                                    />
                                    <span className="text-xs text-gray-500 mt-1 capitalize">
                                      {lang}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.doctorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.departmentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1">
                            {/* Display languages in specific order: Telugu, English, Hindi */}
                            {(() => {
                              const orderedLanguages = ['telugu', 'english', 'hindi'];
                              const availableLanguages = orderedLanguages.filter(lang => getFilteredLanguages(group)[lang]);
                              
                              return availableLanguages.map(lang => (
                                <span 
                                  key={lang}
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    lang === 'telugu' ? 'bg-orange-100 text-orange-800' :
                                    lang === 'english' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </span>
                              ));
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                // Track thumbnail view activity
                                const sessionInfo = getCurrentSessionInfo();
                                if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
                                  const { userId, username } = sessionInfo.currentUser;
                                  
                                  // Track view for each language thumbnail
                                  Object.values(group.languages).forEach(thumbnail => {
                                    trackThumbnailView(userId, username, thumbnail.id, group.doctorName, {
                                      fileName: thumbnail.thumbnailUrl ? thumbnail.thumbnailUrl.split('/').pop() : 'thumbnail',
                                      language: thumbnail.language,
                                      department: group.departmentName,
                                      duration: 0 // Could be enhanced to track actual view duration
                                    });
                                  });
                                }
                                
                                setViewingThumbnail(group);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded hover:bg-indigo-50"
                              title="View All Languages"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => {
                                // Track thumbnail edit activity
                                const sessionInfo = getCurrentSessionInfo();
                                if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
                                  const { userId, username } = sessionInfo.currentUser;
                                  
                                  // Track edit for each language thumbnail
                                  Object.values(group.languages).forEach(thumbnail => {
                                    trackThumbnailEdit(userId, username, thumbnail.id, group.doctorName, {
                                      fileName: thumbnail.thumbnailUrl ? thumbnail.thumbnailUrl.split('/').pop() : 'thumbnail',
                                      language: thumbnail.language,
                                      department: group.departmentName,
                                      editType: 'edit_form_opened'
                                    });
                                  });
                                }
                                
                                handleEdit(group);
                              }}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                              title="Edit All Languages"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => {
                                // Create a proper thumbnail object for deletion
                                const firstThumbnail = Object.values(getFilteredLanguages(group))[0];
                                if (firstThumbnail) {
                                  const thumbnailForDelete = {
                                    _id: firstThumbnail.id, // Use the id from grouped structure as _id
                                    id: firstThumbnail.id,
                                    thumbnailId: firstThumbnail.id,
                                    doctorName: group.doctorName,
                                    departmentName: group.departmentName,
                                    doctorId: group.doctorId,
                                    doctor: group.doctorId,
                                    department: group.departmentId,
                                    thumbnailUrl: firstThumbnail.thumbnailUrl,
                                    language: firstThumbnail.language,
                                    createdAt: firstThumbnail.createdAt,
                                    updatedAt: firstThumbnail.updatedAt
                                  };
                                  handleDelete(thumbnailForDelete);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                              title={selectedLanguage ? `Delete ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} Thumbnail` : "Delete All Languages"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Navbar>
    </ProtectedRoute>
  );
};

export default ThumbnailPage;
