'use client';

import React, { useMemo, useState, useEffect } from 'react';
import ScheduleModal from './Shedule';

// Edit Schedule Form Component
const EditScheduleForm = ({ schedule, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    department: schedule.department || '',
    doctor: schedule.doctor || '',
    languages: schedule.languages || [],
    question: schedule.question || [],
    date: schedule.date || ''
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

  // Fetch data when component mounts
  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
    fetchQuestions();
    fetchLanguages();
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

  // Memoized filtered data
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
      doctor: '' // Reset doctor selection when department changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      const response = await fetch(`/api/schedule`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, id: schedule._id || schedule.id }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage('Schedule updated successfully!');
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('scheduleUpdated'));
        setTimeout(() => {
          onUpdate();
          onClose();
        }, 1500);
      } else {
        setSubmitMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setSubmitMessage('Failed to update schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* First Row - Department and Doctor */}
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
                    filteredDoctors.map(doctor => (
                      <option key={doctor._id || doctor.id} value={doctor.name}>{doctor.name}</option>
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
              {formData.department && filteredDoctors.length === 0 && !loadingDoctors && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No doctors available in the selected department
                </p>
              )}
              {formData.doctor && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Selected Doctor Info
                  </div>
                  {(() => {
                    const selectedDoctor = doctors.find(doc => doc.name === formData.doctor);
                    return selectedDoctor ? (
                      <div className="space-y-1">
                        <div className="text-sm text-blue-700">
                          <span className="font-medium">Department:</span> {selectedDoctor.department}
                        </div>
                        <div className="text-sm text-blue-700">
                          <span className="font-medium">Languages:</span> {selectedDoctor.languages}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-blue-700">Doctor information not available</div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Second Row - Languages and Question */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            Appointment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Languages */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Languages <span className="text-red-500">*</span>
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
                >
                  {loadingLanguages ? (
                    <option value="">Loading languages...</option>
                  ) : availableLanguages.length === 0 ? (
                    <option value="">No languages available</option>
                  ) : (
                    availableLanguages
                      .filter(lang => lang.status === 'Active')
                      .map(lang => (
                        <option key={lang._id || lang.id} value={lang.name} className="py-2 px-3 hover:bg-purple-50 cursor-pointer">
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
              {formData.languages.length > 0 && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v2m3-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0a2 2 0 012-2m-3 0H9a2 2 0 00-2 2v0a2 2 0 002 2h2a2 2 0 002-2v0a2 2 0 00-2-2" />
                    </svg>
                    Selected Languages
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

            {/* Question */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="flex items-center gap-2">
                  Questions <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="relative group">
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
                    filteredQuestions.map(question => (
                      <option key={question._id || question.id} value={question.text} className="py-2 px-3 hover:bg-green-50 cursor-pointer">
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
              {formData.department && filteredQuestions.length === 0 && !loadingQuestions && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No questions available in the selected department
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 12a2 2 0 002 2z" />
              </svg>
            </div>
            Appointment Date
          </h3>
          <div className="relative">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none bg-white transition-all duration-200 hover:border-gray-300"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 12a2 2 0 002 2z" />
              </svg>
            </div>
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
                <span>Updating Schedule...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Update Schedule</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const SchedulePage = () => {
  const [query, setQuery] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const rowsPerPage = 10;

  // Fetch schedules from API
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching schedules from API...');
      
      const response = await fetch('/api/schedule');
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Schedules data:', data);
        setSchedules(data.schedules || []);
        setRetryCount(0); // Reset retry count on success
      } else {
        console.error('Failed to fetch schedules:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setSchedules([]); // Set empty array on error
        setError(`Failed to load schedules: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Network error - API endpoint may not be available');
        setSchedules([]); // Set empty array on network error
        setError('Network error: Unable to connect to the server. Please check your connection and try again.');
      } else {
        setSchedules([]); // Set empty array on other errors
        setError(`Error loading schedules: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors for refresh functionality
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await fetch('/api/doctors');
      if (response.ok) {
        console.log('Doctors refreshed successfully');
      } else {
        console.error('Failed to refresh doctors:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Fetch questions for refresh functionality
  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const response = await fetch('/api/questions');
      if (response.ok) {
        console.log('Questions refreshed successfully');
      } else {
        console.error('Failed to refresh questions:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch languages for refresh functionality
  const fetchLanguages = async () => {
    try {
      setLoadingLanguages(true);
      const response = await fetch('/api/languages');
      if (response.ok) {
        console.log('Languages refreshed successfully');
      } else {
        console.error('Failed to refresh languages:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing languages:', error);
    } finally {
      setLoadingLanguages(false);
    }
  };

  // Retry function
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchSchedules();
  };

  // Load schedules on component mount and when modal closes
  useEffect(() => {
    fetchSchedules();
  }, []);

  // Listen for schedule updates from other components
  useEffect(() => {
    const handleScheduleUpdate = () => {
      console.log('Schedule update event received, refreshing data...');
      fetchSchedules();
    };

    window.addEventListener('scheduleUpdated', handleScheduleUpdate);
    
    return () => {
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!isScheduleModalOpen && !showEditModal) {
      // Refresh data when modal closes with proper cleanup
      const timeoutId = setTimeout(fetchSchedules, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isScheduleModalOpen, showEditModal]);

  // Handle View Action
  const handleView = (schedule) => {
    setSelectedSchedule(schedule);
    setShowViewModal(true);
  };

  // Handle Edit Action
  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
  };

  // Handle Delete Action
  const handleDelete = async (scheduleId) => {
    const schedule = schedules.find(s => (s._id || s.id) === scheduleId);
    setScheduleToDelete({ id: scheduleId, schedule });
    setShowDeleteModal(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/schedule?id=${scheduleToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setSchedules(prev => prev.filter(s => s._id !== scheduleToDelete.id && s.id !== scheduleToDelete.id));
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('scheduleUpdated'));
        alert('Schedule deleted successfully!');
      } else {
        alert('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setScheduleToDelete(null);
    }
  };

  const cancelDeleteSchedule = () => {
    setShowDeleteModal(false);
    setScheduleToDelete(null);
  };

  // Handle Show All button click
  const handleShowAll = () => {
    setShowAllSchedules(!showAllSchedules);
    setQuery(''); // Clear search query when showing all
    setCurrentPage(1); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
    setShowAllSchedules(false); // Reset show all when searching
  };

  // Handle clear search
  const handleClearSearch = () => {
    setQuery('');
    setCurrentPage(1);
    setShowAllSchedules(false);
  };

  const rows = useMemo(() => schedules, [schedules]);

  // Apply filtering based on search query
  const filteredRows = useMemo(() => {
    if (!query.trim()) {
      return rows; // Return all rows if no search query
    }
    
    const searchTerm = query.toLowerCase().trim();
    return rows.filter(
      (r) => 
        r.doctor.toLowerCase().includes(searchTerm) ||
        r.department.toLowerCase().includes(searchTerm)
    );
  }, [rows, query]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  // Get current page data
  const currentRows = showAllSchedules 
    ? filteredRows 
    : filteredRows.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  return (
    <div className="p-6">
      {/* Header with Search and Schedule Button */}
      <div className="flex items-center justify-between mb-6">
        {/* Search Section */}
        <div className="flex-1 max-w-2xl">
          <div className="flex w-full rounded-full border border-indigo-300 overflow-hidden shadow-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // Trigger search on Enter key
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search With Department Name, Doctor Name....."
              className="flex-1 px-5 py-3 outline-none"
            />
            <button 
              onClick={handleSearch}
              className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </button>
            {query && (
              <button
                onClick={handleClearSearch}
                className="px-5 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Schedule Button */}
        <div className="flex gap-2">
          <button 
            onClick={() => {
              console.log('Refresh button clicked!');
              fetchSchedules();
              fetchDoctors();
              fetchQuestions();
              fetchLanguages();
            }}
            disabled={loading || loadingDoctors || loadingQuestions || loadingLanguages}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:bg-green-400 disabled:cursor-not-allowed"
            title="Refresh schedules data"
          >
            {loading || loadingDoctors || loadingQuestions || loadingLanguages ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {loading || loadingDoctors || loadingQuestions || loadingLanguages ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={() => {
              console.log('Schedule button clicked!');
              setIsScheduleModalOpen(true);
              console.log('Modal state set to:', true);
              console.log('Current modal state:', isScheduleModalOpen);
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
          >
            Schedule
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Search Results Counter */}
        {query && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <span className="text-blue-800 font-medium">
                  Search Results for "{query}"
                </span>
              </div>
              <div className="text-sm text-blue-600">
                Found {filteredRows.length} schedule{filteredRows.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 border-b">S.No</th>
              <th className="px-4 py-3 border-b">Doctor Name</th>
              <th className="px-4 py-3 border-b">Department Name</th>
              <th className="px-4 py-3 border-b">Question Name</th>
              <th className="px-4 py-3 border-b">Languages</th>
              <th className="px-4 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600 font-medium">Loading schedules...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-center">
                      <p className="text-red-600 font-medium mb-2">Failed to load schedules</p>
                      <p className="text-gray-600 text-sm mb-3">{error}</p>
                      <button 
                        onClick={handleRetry}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : currentRows.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-3 border text-center text-gray-500">
                  No schedules found. Add your first schedule!
                </td>
              </tr>
            ) : (
              currentRows.map((r, index) => (
                <tr key={r._id || r.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-3 border-b">
                    {showAllSchedules ? index + 1 : startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 border-b">{r.doctor}</td>
                  <td className="px-4 py-3 border-b">{r.department}</td>
                  <td className="px-4 py-3 border-b">
                    <button 
                      onClick={() => {
                        setSelectedQuestions(r.question);
                        setShowQuestionsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                    >
                      View ({r.question.length})
                    </button>
                  </td>
                  <td className="px-4 py-3 border-b">
                    {Array.isArray(r.languages) ? r.languages.join(', ') : r.languages}
                  </td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleView(r)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEdit(r)}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(r._id || r.id)}
                        disabled={isDeleting}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          isDeleting 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination and Show All Section */}
        <div className="p-4 border-t border-gray-200">
          {/* Show All Button and Status */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <button 
              onClick={handleShowAll}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                showAllSchedules 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {showAllSchedules ? 'Show Paginated' : 'Show All'}
            </button>
            
            {showAllSchedules ? (
              <div className="text-sm text-gray-600">
                Showing all {filteredRows.length} schedules
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {query ? (
                  <>
                    Search results: {startIndex + 1}-{Math.min(endIndex, filteredRows.length)} of {filteredRows.length} schedules
                  </>
                ) : (
                  <>
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredRows.length)} of {filteredRows.length} schedules
                  </>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls (only show when not showing all) */}
          {!showAllSchedules && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === totalPages
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => {
          console.log('Modal closing...');
          setIsScheduleModalOpen(false);
          // Refresh data immediately when modal closes
          setTimeout(() => {
            console.log('Refreshing data after modal close...');
            fetchSchedules();
          }, 100);
        }}
      />
      
             {/* Questions Modal */}
       {showQuestionsModal && selectedQuestions && (
         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Selected Questions</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Refresh the questions data
                    fetchSchedules();
                  }}
                  className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 font-medium"
                  title="Refresh questions data"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={() => setShowQuestionsModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {selectedQuestions.map((question, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 font-medium">{question}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

             {/* View Schedule Modal */}
       {showViewModal && selectedSchedule && (
         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 border border-gray-200 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Schedule Details</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Refresh the selected schedule data
                    fetchSchedules();
                  }}
                  className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 font-medium"
                  title="Refresh schedule data"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Department</label>
                  <p className="text-gray-900 font-semibold">{selectedSchedule.department}</p>
                </div>

                {/* Doctor */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Doctor</label>
                  <p className="text-gray-900 font-semibold">{selectedSchedule.doctor}</p>
                </div>

                {/* Date */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Date</label>
                  <p className="text-gray-900 font-semibold">{selectedSchedule.date}</p>
                </div>

                {/* Created At */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Created At</label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(selectedSchedule.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Languages */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-600 mb-3">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {selectedSchedule.languages.map((lang, index) => (
                    <span key={index} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-600 mb-3">Questions</label>
                <div className="space-y-2">
                  {selectedSchedule.question.map((q, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 font-medium">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

                           {/* Edit Schedule Modal */}
         {showEditModal && selectedSchedule && (
           <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Edit Schedule</h3>
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
                  title="Refresh data"
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
                  onClick={() => {
                    setShowEditModal(false);
                    // Assuming resetForm is defined elsewhere or will be added
                    // For now, we'll just close the modal
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
            <EditScheduleForm 
              schedule={selectedSchedule} 
              onClose={() => setShowEditModal(false)}
              onUpdate={fetchSchedules}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && scheduleToDelete && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the schedule for <strong>"{scheduleToDelete.schedule?.doctor}"</strong> in <strong>"{scheduleToDelete.schedule?.department}"</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteSchedule}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Yes'}
              </button>
              <button
                onClick={cancelDeleteSchedule}
                disabled={isDeleting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {/* <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
        Schedule Modal: {isScheduleModalOpen ? 'OPEN' : 'CLOSED'} | 
        View Modal: {showViewModal ? 'OPEN' : 'CLOSED'} | 
        Edit Modal: {showEditModal ? 'OPEN' : 'CLOSED'} | 
        Questions Modal: {showQuestionsModal ? 'OPEN' : 'CLOSED'} | 
        Schedules Count: {schedules.length} | 
        Loading: {loading ? 'YES' : 'NO'} | 
        Error: {error || 'N/A'} | 
        Retry Count: {retryCount}
      </div> */}
    </div>
  );
};

export default SchedulePage;


