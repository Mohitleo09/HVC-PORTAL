"use client";
import React, { useState, useEffect } from 'react';

const AddQuestion = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    text: '',
    department: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);


  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        // Filter only active departments and extract names
        const activeDepartments = (data.departments || [])
          .filter(dept => dept.status === 'Active')
          .map(dept => dept.name);
        setAvailableDepartments(activeDepartments);
      } else {
        console.error('Failed to fetch departments');
        // Fallback to default departments if API fails
        setAvailableDepartments(['Oncology', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine']);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Fallback to default departments if API fails
      setAvailableDepartments(['Oncology', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine']);
    } finally {
      setLoadingDepartments(false);
    }
  };



  // Load departments on component mount and listen for updates
  useEffect(() => {
    fetchDepartments();
    
    // Listen for department updates from other components
    const handleDepartmentUpdate = () => {
      fetchDepartments();
    };
    
    window.addEventListener('departmentCountUpdated', handleDepartmentUpdate);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('departmentCountUpdated', handleDepartmentUpdate);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.text.trim() || !formData.department) {
      setSubmitMessage('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage('Question added successfully!');
        console.log('Question saved:', result.question);
        
        // Call onSubmit with the saved question data
        await onSubmit({
          _id: result.question._id,
          text: result.question.text,
          department: result.question.department,
          status: result.question.status
        });
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({ text: '', department: '' });
          setSubmitMessage('');
          onClose();
        }, 2000);
      } else {
        setSubmitMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      setSubmitMessage('Failed to add question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ text: '', department: '' });
    setSubmitMessage('');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Add New Question</h3>
        <button
          type="button"
          onClick={fetchDepartments}
          disabled={loadingDepartments}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:bg-gray-50 disabled:text-gray-400"
        >
          {loadingDepartments ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Submit Message */}
      {submitMessage && (
        <div className={`p-3 rounded-lg text-center font-medium ${
          submitMessage.includes('Error') || submitMessage.includes('Please fill')
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {submitMessage}
        </div>
      )}

      <div>
        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-2">
          Question Text *
        </label>
        <textarea
          id="questionText"
          value={formData.text}
          onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your question here..."
          rows="4"
          required
          disabled={isSubmitting}
        />
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
          disabled={isSubmitting || loadingDepartments}
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



      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!formData.text.trim() || !formData.department || isSubmitting || loadingDepartments}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Adding...</span>
            </>
          ) : (
            <span>Add Question</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default AddQuestion;
