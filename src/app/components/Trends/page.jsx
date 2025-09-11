"use client";
import React, { useState, useEffect } from 'react';
import NewTrendForm from './newtrend';

const TrendsPage = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrend, setEditingTrend] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [trendToDelete, setTrendToDelete] = useState(null);
  const [showAllTrends, setShowAllTrends] = useState(false);

  // Fetch trends from API
  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/trends');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched trends data:', data); // Debug log
        console.log('Individual trends:', data.trends); // Debug log
        
        setTrends(data.trends || []);
      } else {
        console.error('Failed to fetch trends:', response.status);
        setError('Failed to load trends');
        setTrends([]);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
      setError('Network error. Please try again.');
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to update views from YouTube videos
  const updateViewsFromYouTube = async (trends) => {
    const updatedTrends = [...trends];
    let hasChanges = false;
    
    console.log('🔄 Starting real-time view update from YouTube...');
    
    for (let i = 0; i < updatedTrends.length; i++) {
      const trend = updatedTrends[i];
      if (trend.youtubeLink && trend.youtubeLink.trim()) {
        try {
          console.log(`📊 Updating views for: "${trend.topic}" (${trend.youtubeLink})`);
          
          const response = await fetch('/api/youtube/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ youtubeUrl: trend.youtubeLink }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.video.views !== trend.views) {
              const oldViews = trend.views;
              updatedTrends[i] = {
                ...trend,
                views: result.video.views
              };
              hasChanges = true;
              console.log(`✅ Views updated for "${trend.topic}": ${oldViews.toLocaleString()} → ${result.video.views.toLocaleString()}`);
            } else if (result.success) {
              console.log(`ℹ️ No change in views for "${trend.topic}": ${trend.views.toLocaleString()}`);
            }
          } else {
            console.error(`❌ Failed to update views for "${trend.topic}":`, response.status);
          }
        } catch (error) {
          console.error(`❌ Error updating views for trend "${trend.topic}":`, error);
        }
      }
    }
    
    if (hasChanges) {
      console.log('🎯 View updates completed with changes');
    } else {
      console.log('ℹ️ No view count changes detected');
    }
    
    return updatedTrends;
  };

  // Load trends on component mount
  useEffect(() => {
    fetchTrends();
  }, []);

  // Periodically update views from YouTube videos every 5 seconds
  useEffect(() => {
    if (trends.length === 0) return;

    const interval = setInterval(async () => {
      console.log('🔄 Auto-updating views from YouTube videos every 5 seconds...');
      const updatedTrends = await updateViewsFromYouTube(trends);
      
      // Only update if there are actual changes
      const hasChanges = updatedTrends.some((trend, index) => 
        trend.views !== trends[index]?.views
      );
      
      if (hasChanges) {
        setTrends(updatedTrends);
        console.log('✅ Views updated successfully in real-time');
        // Notify Dashboard to refresh trending topics
        window.dispatchEvent(new CustomEvent('trendUpdated'));
      } else {
        console.log('ℹ️ No view count changes detected in this update cycle');
      }
    }, 5 * 1000); // 5 seconds

    return () => clearInterval(interval);
  }, [trends]);

  // Filter trends based on search term
  const filteredTrends = trends.filter(trend => {
    if (!searchTerm.trim()) return true;
    return trend.topic.toLowerCase().includes(searchTerm.toLowerCase().trim());
  }).sort((a, b) => b.views - a.views); // Sort by views from highest to lowest

  // Get displayed trends (limited to 10 unless showAllTrends is true)
  const displayedTrends = showAllTrends ? filteredTrends : filteredTrends.slice(0, 10);

  // Handle new trend added or updated
  const handleTrendAdded = (newTrend) => {
    console.log('Trend added/updated:', newTrend);
    console.log('Current editingTrend:', editingTrend);
    
    if (editingTrend) {
      // Update existing trend
      console.log('Updating existing trend with ID:', editingTrend._id || editingTrend.id);
      setTrends(prev => prev.map(trend => 
        (trend._id || trend.id) === (editingTrend._id || editingTrend.id) ? newTrend : trend
      ));
      setEditingTrend(null);
      alert('Trend updated successfully!');
    } else {
      // Add new trend
      console.log('Adding new trend');
      setTrends(prev => [newTrend, ...prev]);
      alert('Trend added successfully!');
    }
    
    // Clear search to show all trends after add/edit
    setSearchTerm('');
    
    // Notify Dashboard to refresh trending topics
    window.dispatchEvent(new CustomEvent('trendUpdated'));
  };

  // Handle edit trend
  const handleEditTrend = (trend) => {
    console.log('Editing trend:', trend);
    setEditingTrend(trend);
    setShowAddModal(true);
  };

  // Handle delete trend
  const handleDeleteTrend = async (id) => {
    console.log('🗑️ Deleting trend with ID:', id);
    const trend = trends.find(t => (t._id || t.id) === id);
    console.log('📋 Trend to delete:', trend);
    console.log('🔍 All trend IDs:', trends.map(t => ({ id: t._id || t.id, topic: t.topic })));
    
    setTrendToDelete({ id, trend });
    setShowDeleteModal(true);
  };

  const confirmDeleteTrend = async () => {
    if (!trendToDelete) return;
    
    try {
      console.log('🌐 Making DELETE request to:', `/api/trends/${trendToDelete.id}`);
      console.log('🗑️ Trend to delete:', trendToDelete.trend);
      console.log('🔍 All trend IDs:', trends.map(t => ({ id: t._id || t.id, topic: t.topic })));
      
      const response = await fetch(`/api/trends/${trendToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Delete response status:', response.status);
      console.log('📡 Delete response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Delete result:', result);
        console.log('🗑️ Trend deleted successfully from database');
        setTrends(prev => prev.filter(trend => (trend._id || trend.id) !== trendToDelete.id));
        alert('Trend deleted successfully!');
        
        // Notify Dashboard to refresh trending topics
        window.dispatchEvent(new CustomEvent('trendUpdated'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to delete trend from database:', response.status, errorData);
        console.error('🔍 Response details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData,
          trendId: trendToDelete.id,
          trendData: trendToDelete.trend
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed to delete trend';
        if (response.status === 404) {
          errorMessage = 'Trend not found. It may have already been deleted.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error deleting trend:', error);
      alert(`Error deleting trend: ${error.message}`);
    } finally {
      setShowDeleteModal(false);
      setTrendToDelete(null);
    }
  };

  const cancelDeleteTrend = () => {
    setShowDeleteModal(false);
    setTrendToDelete(null);
  };

  // Close modal and reset editing state
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingTrend(null);
  };

  // Refresh trends data
  const refreshTrends = () => {
    console.log('🔄 Refreshing trends data...');
    fetchTrends();
  };

  // Handle Show All button click for trends
  const handleShowAllTrends = () => {
    setShowAllTrends(!showAllTrends);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Trends</h1>
          <p className="text-sm text-gray-600 mt-1">
            Add YouTube links to trends for dynamic view updates
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              console.log('🔄 Manual refresh requested by user');
              const updatedTrends = await updateViewsFromYouTube(trends);
              setTrends(updatedTrends);
              alert('Views refreshed from YouTube!');
            }}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            title="Refresh views from YouTube immediately"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Views
            </div>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Trend
            </div>
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by topic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
              title="Clear search"
            >
              ✕ Clear
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            Found {filteredTrends.length} trend{filteredTrends.length !== 1 ? 's' : ''} 
            {searchTerm && ` matching "${searchTerm}"`}
            {filteredTrends.length > 10 && !showAllTrends && (
              <span className="ml-2 text-blue-600">(Showing first 10)</span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                S.No
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Topic
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Views
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading-row">
                <td colSpan="4" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600 font-medium">Loading trends...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr key="error-row">
                <td colSpan="4" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-600 font-medium">Failed to load trends</p>
                      <p className="text-gray-500 text-sm">{error}</p>
                      <button 
                        onClick={fetchTrends}
                        className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : displayedTrends.length === 0 ? (
              <tr key="empty-row">
                <td colSpan="4" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">
                        {searchTerm ? `No trends found matching "${searchTerm}"` : 'No trends found'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {searchTerm ? 'Try a different search term' : 'Start by adding your first trend'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              displayedTrends.map((trend, index) => (
                <tr key={trend._id || trend.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{trend.topic}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">{trend.views.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">views</span>
                      {trend.youtubeLink && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live
                          </span>
                          {/* <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            Auto-update
                          </span> */}
                        </div>
                      )}
                    </div>
                    {/* {trend.youtubeLink && (
                      <p className="text-xs text-gray-500 mt-1">
                        Updates every 5 seconds from YouTube
                      </p>
                    )} */}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTrend(trend)}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors duration-150"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTrend(trend._id || trend.id)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Show All Button */}
        {filteredTrends.length > 10 && (
          <div className="p-4 flex justify-center items-center gap-4">
            <button 
              onClick={handleShowAllTrends}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                showAllTrends 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {showAllTrends ? 'Show Less' : 'Show All'}
            </button>
            
            {showAllTrends ? (
              <div className="text-sm text-gray-600">
                Showing all {filteredTrends.length} trends
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Showing first 10 of {filteredTrends.length} trends
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Trend Form Modal */}
      <NewTrendForm
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onTrendAdded={handleTrendAdded}
        editingTrend={editingTrend}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && trendToDelete && (
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
                Are you sure you want to delete the trend <strong>"{trendToDelete.trend?.topic}"</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteTrend}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={cancelDeleteTrend}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendsPage;
