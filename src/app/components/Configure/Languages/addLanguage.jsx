"use client";
import React, { useState } from 'react';

const AddLanguage = ({ onCreate }) => {
  const [languageName, setLanguageName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!languageName.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: languageName.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage('Language added successfully!');
        onCreate(result.language); // Pass the saved language to parent
        setLanguageName(''); // Reset form
        
        // Close modal after success (optional)
        setTimeout(() => {
          setSubmitMessage('');
        }, 2000);
      } else {
        setSubmitMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding language:', error);
      setSubmitMessage('Failed to add language. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLanguageName('');
    setSubmitMessage('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="languageName" className="block text-sm font-medium text-gray-700 mb-2">
          Language Name *
        </label>
        <input
          type="text"
          id="languageName"
          value={languageName}
          onChange={(e) => setLanguageName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter language name"
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
          disabled={!languageName.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add Language'}
        </button>
      </div>
    </form>
  );
};

export default AddLanguage;
