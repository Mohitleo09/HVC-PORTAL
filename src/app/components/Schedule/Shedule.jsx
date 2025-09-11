'use client';

import React, { useState, useEffect, useMemo } from 'react';

const ScheduleModal = ({ isOpen, onClose }) => {
  console.log('ScheduleModal rendered with isOpen:', isOpen);
  
  const [formData, setFormData] = useState({
    department: '',
    doctor: '',
    languages: [],
    question: [],
    date: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);

  // Fetch doctors when component mounts or when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      fetchDepartments();
      fetchQuestions();
      fetchLanguages();
    }
  }, [isOpen]);

  // Listen for doctor count updates from other components
  useEffect(() => {
    if (!isOpen) return; // Only listen when modal is open

    const handleDoctorUpdate = () => {
      fetchDoctors();
      fetchDepartments();
    };

    const handleQuestionUpdate = () => {
      fetchQuestions();
    };

    const handleLanguageUpdate = () => {
      fetchLanguages();
    };

    const handleDepartmentUpdate = () => {
      fetchDepartments();
    };

    window.addEventListener('doctorCountUpdated', handleDoctorUpdate);
    window.addEventListener('questionCountUpdated', handleQuestionUpdate);
    window.addEventListener('languageCountUpdated', handleLanguageUpdate);
    window.addEventListener('departmentCountUpdated', handleDepartmentUpdate);
    
    return () => {
      window.removeEventListener('doctorCountUpdated', handleDoctorUpdate);
      window.removeEventListener('questionCountUpdated', handleQuestionUpdate);
      window.removeEventListener('languageCountUpdated', handleLanguageUpdate);
      window.removeEventListener('departmentCountUpdated', handleDepartmentUpdate);
    };
  }, [isOpen]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any pending operations when component unmounts
      setDoctors([]);
      setQuestions([]);
      setDepartments([]);
      setAvailableLanguages([]);
      setError('');
    };
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setError('');
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      } else {
        console.error('Failed to fetch doctors:', response.status);
        setError('Failed to load doctors. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setError('');
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        // Only show Active departments
        const activeDepartments = data.departments?.filter(dept => dept.status === 'Active') || [];
        setDepartments(activeDepartments.map(dept => dept.name));
      } else {
        console.error('Failed to fetch departments:', response.status);
        setError('Failed to load departments. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Network error. Please check your connection.');
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true);
      setError('');
      const response = await fetch('/api/questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        console.error('Failed to fetch questions:', response.status);
        setError('Failed to load questions. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      setLoadingLanguages(true);
      setError('');
      const response = await fetch('/api/languages');
      if (response.ok) {
        const data = await response.json();
        setAvailableLanguages(data.languages || []);
      } else {
        console.error('Failed to fetch languages:', response.status);
        setError('Failed to load languages. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoadingLanguages(false);
    }
  };

  // Memoized filtered data to prevent unnecessary recalculations
  const filteredDoctors = useMemo(() => {
    let filtered = doctors.filter(doctor => doctor.status === 'Active');
    
    if (formData.department) {
      filtered = filtered.filter(doctor => doctor.department === formData.department);
    }
    
    return filtered;
  }, [doctors, formData.department]);

  const filteredQuestions = useMemo(() => 
    formData.department 
      ? questions.filter(question => 
          question.department === formData.department && 
          question.status === 'Active'
        )
      : questions.filter(question => question.status === 'Active'),
    [questions, formData.department]
  );

  // Reset doctor selection when department changes
  const handleDepartmentChange = (department) => {
    setFormData(prev => ({
      ...prev,
      department,
      doctor: '', // Reset doctor selection when department changes
      languages: [] // Reset languages when department changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.department || !formData.doctor || formData.languages.length === 0 || formData.question.length === 0 || !formData.date) {
      setSubmitMessage('Please fill in all required fields');
      return;
    }

    // Validate that selected doctor belongs to selected department
    const selectedDoctor = doctors.find(doc => doc.name === formData.doctor);
    if (selectedDoctor && selectedDoctor.department !== formData.department) {
      setSubmitMessage('Selected doctor does not belong to the selected department');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage('Schedule created successfully!');
        console.log('Schedule saved:', result.schedule);
        
        // Dispatch multiple events to notify other components
        window.dispatchEvent(new CustomEvent('scheduleUpdated'));
        window.dispatchEvent(new CustomEvent('scheduleAdded'));
        window.dispatchEvent(new CustomEvent('newScheduleCreated'));
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            department: '',
            doctor: '',
            languages: [],
            question: [],
            date: ''
          });
          setSubmitMessage('');
          onClose();
        }, 2000);
      } else {
        console.error('Schedule creation failed:', result);
        setSubmitMessage(`Error: ${result.error || 'Failed to create schedule'}`);
      }
    } catch (error) {
      console.error('Error submitting schedule:', error);
      setSubmitMessage('Failed to create schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    if (field === 'doctor') {
      // When doctor changes, update languages based on selected doctor
      const selectedDoctor = doctors.find(doc => doc.name === value);
      if (selectedDoctor && selectedDoctor.languages) {
        // Convert languages to array if it's a string
        const doctorLanguages = Array.isArray(selectedDoctor.languages) 
          ? selectedDoctor.languages 
          : selectedDoctor.languages.split(',').map(lang => lang.trim());
        
        setFormData(prev => ({
          ...prev,
          [field]: value,
          languages: doctorLanguages
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          languages: []
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  console.log('ScheduleModal render - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('ScheduleModal not rendering - isOpen is false');
    return null;
  }

  console.log('ScheduleModal rendering modal content');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-gray-200 transform transition-all duration-300 hover:shadow-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Create New Schedule</h2>
              <p className="text-sm text-gray-600">Fill in the details below to schedule an appointment</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                fetchDoctors();
                fetchDepartments();
                fetchQuestions();
                fetchLanguages();
              }}
              disabled={loadingDoctors || loadingQuestions || loadingLanguages}
              className="px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-all duration-200 flex items-center gap-2 font-medium"
              title="Refresh doctors, departments, and questions"
            >
              {loadingDoctors || loadingQuestions || loadingLanguages ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-red-800 font-medium">{error}</span>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-all duration-200 hover:border-gray-300"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => {
                        const doctorCount = doctors.filter(doctor => doctor.department === dept).length;
                        const questionCount = questions.filter(question => question.department === dept).length;
                        return (
                          <option key={dept} value={dept}>
                            {dept} ({doctorCount} doctor{doctorCount !== 1 ? 's' : ''}, {questionCount} question{questionCount !== 1 ? 's' : ''})
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Doctor Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Doctor Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.doctor}
                      onChange={(e) => handleChange('doctor', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-all duration-200 hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      disabled={loadingDoctors || !formData.department}
                    >
                      <option value="">
                        {!formData.department 
                          ? 'Select Department First' 
                          : loadingDoctors 
                            ? 'Loading doctors...' 
                            : filteredDoctors.length === 0 
                              ? 'No doctors in this department' 
                              : 'Select Doctor'
                        }
                      </option>
                      {!loadingDoctors && filteredDoctors.length > 0 && (
                        filteredDoctors.map((doctor, index) => (
                          <option key={doctor._id || doctor.id || `doctor-${index}`} value={doctor.name}>{doctor.name}</option>
                        ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {!formData.department && (
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Please select a department first to see available doctors
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Languages and Questions Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Languages */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Languages <span className="text-red-500">*</span>
                    {formData.doctor && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Auto-filled from doctor's languages)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      multiple
                      value={formData.languages}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        handleMultiSelect('languages', selectedOptions);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none min-h-[140px] bg-white transition-all duration-200 hover:border-gray-300"
                      disabled={!formData.doctor}
                    >
                      {!formData.doctor ? (
                        <option value="">Select Doctor First</option>
                      ) : loadingLanguages ? (
                        <option value="">Loading languages...</option>
                      ) : availableLanguages.length === 0 ? (
                        <option value="">No languages available</option>
                      ) : (
                        availableLanguages
                          .filter(lang => lang.status === 'Active')
                          .map((lang, index) => (
                            <option key={lang._id || lang.id || `lang-${index}`} value={lang.name} className="py-2 px-3 hover:bg-purple-50 cursor-pointer">
                              {lang.name}
                            </option>
                          ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {!formData.doctor && (
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Please select a doctor first to see available languages
                    </p>
                  )}
                  {formData.languages.length > 0 && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v2m3-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0a2 2 0 012-2m-3 0H9a2 2 0 00-2 2v0a2 2 0 002 2h2a2 2 0 002-2v0a2 2 0 00-2-2" />
                        </svg>
                        Selected Languages ({formData.languages.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.languages.map((lang, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {lang}
                            <button
                              onClick={() => {
                                const newLanguages = formData.languages.filter(l => l !== lang);
                                handleMultiSelect('languages', newLanguages);
                              }}
                              className="ml-1 text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Questions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Questions <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      multiple
                      value={formData.question}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        handleMultiSelect('question', selectedOptions);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-green-100 focus:border-green-400 appearance-none min-h-[160px] bg-white transition-all duration-200 hover:border-gray-300"
                      disabled={loadingQuestions || !formData.department}
                    >
                      {!formData.department ? (
                        <option value="">Select Department First</option>
                      ) : loadingQuestions ? (
                        <option value="">Loading questions...</option>
                      ) : filteredQuestions.length === 0 ? (
                        <option value="">No questions available in this department</option>
                      ) : (
                        filteredQuestions.map((question, index) => (
                          <option key={question._id || question.id || `question-${index}`} value={question.text} className="py-2 px-3 hover:bg-green-50 cursor-pointer">
                            {question.text}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {!formData.department && (
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Please select a department first to see available questions
                    </p>
                  )}
                  {formData.question.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl shadow-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-bold text-green-800">Selected Questions ({formData.question.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {formData.question.map((q, index) => (
                          <span key={index} className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-200 to-green-300 text-green-900 text-sm font-semibold rounded-full shadow-md">
                            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                            {q}
                            <button
                              onClick={() => {
                                const newQuestions = formData.question.filter(question => question !== q);
                                handleMultiSelect('question', newQuestions);
                              }}
                              className="ml-1 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors duration-200 text-xs font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date Field */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Schedule Date
              </h3>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none bg-white transition-all duration-200 hover:border-gray-300"
                />
              </div>
            </div>

            {/* Submit Message */}
            {submitMessage && (
              <div className={`p-4 rounded-xl text-center font-medium ${
                submitMessage.includes('Error') || submitMessage.includes('Please fill')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {submitMessage.includes('Error') || submitMessage.includes('Please fill') ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {submitMessage}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-10 py-4 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating Schedule...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create Schedule</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
