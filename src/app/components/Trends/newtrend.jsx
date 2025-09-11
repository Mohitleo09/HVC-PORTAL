'use client';
import React, { useState, useEffect } from 'react';

const NewTrendForm = ({ isOpen, onClose, onTrendAdded, editingTrend = null }) => {
  const [formData, setFormData] = useState({
    topic: '',
    views: '',
    description: '',
    youtubeLink: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  // Update form data when editingTrend changes
  useEffect(() => {
    if (editingTrend) {
      setFormData({
        topic: editingTrend.topic || '',
        views: editingTrend.views || '',
        description: editingTrend.description || '',
        youtubeLink: editingTrend.youtubeLink || ''
      });
    } else {
      // Reset form when not editing
      setFormData({
        topic: '',
        views: '',
        description: '',
        youtubeLink: ''
      });
    }
  }, [editingTrend]);

  // Function to analyze YouTube video and extract view count
  const analyzeYouTubeVideo = async (youtubeUrl) => {
    if (!youtubeUrl.trim()) {
      setYoutubeError('');
      return;
    }

    setIsAnalyzing(true);
    setYoutubeError('');

    try {
      const response = await fetch('/api/youtube/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update the views field with the extracted view count
        setFormData(prev => ({
          ...prev,
          views: result.video.views.toString(),
          topic: prev.topic || result.video.title // Use video title as topic if topic is empty
        }));
        setYoutubeError('');
        console.log('✅ YouTube video analyzed successfully:', result.video);
      } else {
        setYoutubeError(result.error || 'Failed to analyze video');
        console.error('❌ YouTube analysis failed:', result.error);
      }
    } catch (error) {
      console.error('Error analyzing YouTube video:', error);
      setYoutubeError('Network error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle YouTube link change with debounced analysis
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.youtubeLink && formData.youtubeLink.trim()) {
        analyzeYouTubeVideo(formData.youtubeLink);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.youtubeLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.views) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = editingTrend ? `/api/trends/${editingTrend.id}` : '/api/trends';
      const method = editingTrend ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          views: parseInt(formData.views),
          description: formData.description,
          youtubeLink: formData.youtubeLink,
          status: "Active"
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Notify parent component about the new/updated trend
        onTrendAdded(result.trend);
        
        // Reset form and close modal
        setFormData({ topic: '', views: '', description: '', youtubeLink: '' });
        onClose();
      } else {
        setError(result.error || 'Failed to save trend');
      }
    } catch (error) {
      console.error('Error saving trend:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
    if (youtubeError && field === 'youtubeLink') setYoutubeError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {editingTrend ? 'Edit Trend' : 'Add New Trend'}
              </h3>
              <p className="text-sm text-gray-600">
                {editingTrend ? 'Update trend information' : 'Fill in the details below'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* YouTube Link Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                YouTube Video Link
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.youtubeLink}
                  onChange={(e) => handleChange('youtubeLink', e.target.value)}
                  placeholder="Paste YouTube video URL here..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 pr-12"
                />
                {isAnalyzing && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              {youtubeError && (
                <p className="mt-1 text-sm text-red-600">{youtubeError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Paste a YouTube link to automatically fetch video data and view count
              </p>
            </div>

            {/* Topic Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => handleChange('topic', e.target.value)}
                placeholder="Enter trend topic"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                required
              />
            </div>

            {/* Views Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Views <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.views}
                onChange={(e) => handleChange('views', e.target.value)}
                placeholder="Enter view count"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                required
              />
              {formData.youtubeLink && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Views will be automatically updated from YouTube video
                  </p>
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Views will auto-refresh every 5 seconds on the trends page
                  </p>
                </div>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter trend description (optional)"
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isAnalyzing}
                className={`px-6 py-2 font-semibold rounded-lg transition-all duration-200 ${
                  isSubmitting || isAnalyzing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingTrend ? 'Updating...' : 'Saving...'}
                  </div>
                ) : (
                  editingTrend ? 'Update Trend' : 'Add Trend'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTrendForm;
