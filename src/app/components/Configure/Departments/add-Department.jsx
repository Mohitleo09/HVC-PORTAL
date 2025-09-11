"use client";
import React, { useState } from 'react';

const AddDepartment = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: formData.name.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage('Department added successfully!');
        onSubmit(result.department); // Pass the saved department to parent
        setFormData({ name: '' }); // Reset form
        
        // Clear success message after a delay
        setTimeout(() => {
          setSubmitMessage('');
        }, 2000);
      } else {
        setSubmitMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding department:', error);
      setSubmitMessage('Failed to add department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '' });
    setSubmitMessage('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 mb-2">
          Department Name *
        </label>
        <input
          type="text"
          id="departmentName"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter department name"
          required
          disabled={isSubmitting}
        />
      </div>

      {submitMessage && (
        <div className={`p-3 rounded-md text-sm ${
          submitMessage.includes('Error') || submitMessage.includes('Failed') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {submitMessage}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          disabled={isSubmitting}
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={!formData.name.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Create Department'}
        </button>
      </div>
    </form>
  );
};

export default AddDepartment;
