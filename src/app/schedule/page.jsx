'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Navbar from '../navbar/navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import StartPage from './startpage';
import { trackScheduleStart, getCurrentSessionInfo } from '../utils/activityTracker';

const SchedulePage = () => {
  const [query, setQuery] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isStartPageOpen, setIsStartPageOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [workflowStates, setWorkflowStates] = useState({});
  const [completedWorkflowCount, setCompletedWorkflowCount] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [completedVideos, setCompletedVideos] = useState(0);
  const [completedShorts, setCompletedShorts] = useState(0);
  const [completedSchedules, setCompletedSchedules] = useState(0);
  const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all', 'day', 'week', 'month', 'customWeek', 'customMonth'
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const fetchSchedules = async () => {
    setRefreshing(true);
    try {
      console.log('Fetching schedules from /api/schedule...');
      const response = await fetch('/api/schedule');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Schedules data received:', data);
        setSchedules(data.schedules || []);
        setError(null);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(`Failed to fetch schedules: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      // Handle different types of errors
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError(new Error('Network error: Unable to connect to the server. Please check if your development server is running.'));
      } else {
        setError(err);
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Emit completed workflow count for dashboard
  const emitCompletedWorkflowCount = (count) => {
    const event = new CustomEvent('completedWorkflowCountUpdated', {
      detail: { count }
    });
    window.dispatchEvent(event);
    console.log('📡 Emitted completed workflow count:', count);
  };

  // Fetch schedules on component mount
  useEffect(() => {
    fetchSchedules();
    fetchWorkflows();
    fetchMediaCounts();
  }, []);

  // Fetch workflows from database
  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('🔍 Raw workflows data:', data.workflows);
          console.log('🔍 Workflows count:', data.workflows?.length || 0);
          
          // Log metadata if available
          if (data.metadata) {
            console.log('🔍 Data quality metadata:', data.metadata);
            if (data.metadata.hasDataQualityIssues) {
              console.warn('⚠️ Data quality issues detected:', {
                totalFound: data.metadata.totalFound,
                validCount: data.metadata.validCount,
                invalidCount: data.metadata.invalidCount
              });
            }
          }
          
          // Log first few workflows for debugging
          if (data.workflows && data.workflows.length > 0) {
            console.log('🔍 First workflow sample:', {
              _id: data.workflows[0]._id,
              scheduleId: data.workflows[0].scheduleId,
              scheduleIdType: typeof data.workflows[0].scheduleId,
              scheduleIdIsObject: data.workflows[0].scheduleId && typeof data.workflows[0].scheduleId === 'object',
              doctorName: data.workflows[0].doctorName
            });
          }
          
          // Create workflow states mapping for each doctor
          const states = {};
          let completedCount = 0;
          
          // Ensure workflows is an array and has content
          if (!Array.isArray(data.workflows) || data.workflows.length === 0) {
            console.log('📋 No workflows to process');
            setWorkflowStates({});
            setCompletedWorkflowCount(0);
            return;
          }
          
          try {
            data.workflows.forEach(workflow => {
              try {
                // Validate workflow data before processing
                if (!workflow || !workflow._id) {
                  console.warn('⚠️ Invalid workflow data:', workflow);
                  return; // Skip invalid workflows
                }
                
                // Handle cases where scheduleId might be null or undefined
                let scheduleId;
                if (workflow.scheduleId && typeof workflow.scheduleId === 'object' && workflow.scheduleId._id) {
                  scheduleId = workflow.scheduleId._id;
                } else if (workflow.scheduleId) {
                  scheduleId = workflow.scheduleId;
                } else {
                  console.warn('⚠️ Workflow has no scheduleId:', workflow._id);
                  return; // Skip this workflow if no scheduleId
                }
                
                // Validate doctorName
                if (!workflow.doctorName) {
                  console.warn('⚠️ Workflow has no doctorName:', workflow._id);
                  return; // Skip workflows without doctor names
                }
                
                const doctorName = workflow.doctorName;
                const key = `${scheduleId}_${doctorName}`; // Unique key for schedule + doctor
                
                console.log(`📋 Processing workflow:`, {
                  workflowId: workflow._id,
                  scheduleId,
                  doctorName,
                  key,
                  workflowStatus: workflow.workflowStatus,
                  currentStep: workflow.currentStep,
                  departmentName: workflow.departmentName
                });
                
                if (workflow.workflowStatus === 'completed') {
                  states[key] = 'completed';
                  completedCount++;
                  console.log(`✅ Setting ${doctorName} to completed`);
                } else if (workflow.workflowStatus === 'in_progress') {
                  states[key] = 'active';
                  console.log(`🟢 Setting ${doctorName} to active`);
                }
              } catch (workflowError) {
                console.error('❌ Error processing individual workflow:', workflowError, workflow);
                // Continue with next workflow instead of crashing
              }
            });
          } catch (forEachError) {
            console.error('❌ Error in workflows forEach loop:', forEachError);
            // Set default values if processing fails
            setWorkflowStates({});
            setCompletedWorkflowCount(0);
            return;
          }
          
          console.log('🎯 Final workflow states:', states);
          setWorkflowStates(states);
          setCompletedWorkflowCount(completedCount);
          
          // Emit event with completed workflow count for dashboard
          emitCompletedWorkflowCount(completedCount);
          
          console.log('🎯 Updated workflowStates:', states);
          console.log('🎯 Completed workflow count:', completedCount);
        }
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  // Fetch media counts from API
  const fetchMediaCounts = async () => {
    try {
      setMediaLoading(true);
      const response = await fetch('/api/media');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompletedVideos(data.counts.videos.completed || 0);
          setCompletedShorts(data.counts.shorts.completed || 0);
          setCompletedSchedules(data.counts.schedules?.completed || 0);
          console.log('Schedule: Media counts fetched:', data.counts);
        } else {
          console.error('Failed to fetch media counts');
          setCompletedVideos(0);
          setCompletedShorts(0);
          setCompletedSchedules(0);
        }
      } else {
        console.error('Failed to fetch media counts');
        setCompletedVideos(0);
        setCompletedShorts(0);
        setCompletedSchedules(0);
      }
    } catch (error) {
      console.error('Error fetching media counts:', error);
      setCompletedVideos(0);
      setCompletedShorts(0);
      setCompletedSchedules(0);
    } finally {
      setMediaLoading(false);
    }
  };

  // Listen for schedule updates from other components
  useEffect(() => {
    const handleScheduleUpdate = () => {
      console.log('Schedule update event received, refreshing data...');
      fetchSchedules();
    };

    const handleScheduleAdded = () => {
      console.log('New schedule added event received, refreshing data...');
      fetchSchedules();
    };

    const handleScheduleDeleted = () => {
      console.log('Schedule deleted event received, refreshing data...');
      fetchSchedules();
    };

    // Listen for various schedule events
    window.addEventListener('scheduleUpdated', handleScheduleUpdate);
    window.addEventListener('scheduleAdded', handleScheduleAdded);
    window.addEventListener('scheduleDeleted', handleScheduleDeleted);
    
    // Also listen for custom events from the ScheduleModal
    window.addEventListener('newScheduleCreated', handleScheduleAdded);
    
    return () => {
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
      window.removeEventListener('scheduleAdded', handleScheduleAdded);
      window.removeEventListener('scheduleDeleted', handleScheduleDeleted);
      window.removeEventListener('newScheduleCreated', handleScheduleAdded);
    };
  }, []);

  // Add polling for real-time updates (every 10 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!loading) {
        console.log('Polling for schedule updates...');
        fetchSchedules();
        fetchMediaCounts();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [loading]);

  // Listen for workflow events
  useEffect(() => {
    const handleWorkflowStarted = (event) => {
      const { scheduleId, doctorName } = event.detail;
      const key = `${scheduleId}_${doctorName}`;
      
      console.log(`🚀 Workflow Started for Doctor: ${doctorName}`);
      console.log(`📋 Schedule ID: ${scheduleId}`);
      console.log(`🔑 Workflow Key: ${key}`);
      
      setWorkflowStates(prev => ({
        ...prev,
        [key]: 'active'
      }));
      
      // Refresh workflow data from database
      fetchWorkflows();
    };

    const handleWorkflowCompleted = (event) => {
      const { scheduleId, doctorName } = event.detail;
      const key = `${scheduleId}_${doctorName}`;
      
      console.log(`🎉 Workflow Completed for Doctor: ${doctorName}`);
      console.log(`📋 Schedule ID: ${scheduleId}`);
      console.log(`🔑 Workflow Key: ${key}`);
      
      setWorkflowStates(prev => ({
        ...prev,
        [key]: 'completed'
      }));
      
      // Refresh workflow data from database to get accurate count
      fetchWorkflows();
    };

    const handleMediaUpdate = (event) => {
      console.log('Media update detected, refreshing media counts...');
      fetchMediaCounts();
    };

    const handleRequestWorkflowCountRefresh = () => {
      console.log('Dashboard requested workflow count refresh...');
      fetchWorkflows();
    };

    window.addEventListener('workflowStarted', handleWorkflowStarted);
    window.addEventListener('workflowCompleted', handleWorkflowCompleted);
    window.addEventListener('mediaUpdated', handleMediaUpdate);
    window.addEventListener('requestWorkflowCountRefresh', handleRequestWorkflowCountRefresh);
    
    return () => {
      window.removeEventListener('workflowStarted', handleWorkflowStarted);
      window.removeEventListener('workflowCompleted', handleWorkflowCompleted);
      window.removeEventListener('mediaUpdated', handleMediaUpdate);
      window.removeEventListener('requestWorkflowCountRefresh', handleRequestWorkflowCountRefresh);
    };
  }, []);

  // Filter schedules based on search query
  const filteredSchedules = useMemo(() => {
    let filtered = schedules;
    
    // Apply date filtering first
    if (scheduleFilter !== 'all') {
      filtered = filtered.filter(schedule => {
        if (!schedule.date) return false;
        
        try {
          const scheduleDate = new Date(schedule.date);
          const today = new Date();
          
          if (scheduleFilter === 'day') {
            // Same day
            return scheduleDate.toDateString() === today.toDateString();
          } else if (scheduleFilter === 'week') {
            // This week (Monday to Sunday)
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
            endOfWeek.setHours(23, 59, 59, 999);
            
            return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
          } else if (scheduleFilter === 'month') {
            // This month
            return scheduleDate.getMonth() === today.getMonth() && 
                   scheduleDate.getFullYear() === today.getFullYear();
          } else if (scheduleFilter === 'customWeek' && selectedWeek) {
            // Custom selected week
            const selectedDate = new Date(selectedWeek);
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Monday
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
            endOfWeek.setHours(23, 59, 59, 999);
            
            return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
          } else if (scheduleFilter === 'customMonth' && selectedMonth) {
            // Custom selected month
            const selectedDate = new Date(selectedMonth);
            return scheduleDate.getMonth() === selectedDate.getMonth() && 
                   scheduleDate.getFullYear() === selectedDate.getFullYear();
          }
          
          return true;
        } catch (error) {
          console.error('Error filtering schedule by date:', error);
          return true;
        }
      });
    }
    
    // Then apply search query filtering
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      filtered = filtered.filter(
        (schedule) => 
          schedule.doctor?.toLowerCase().includes(searchTerm) ||
          schedule.department?.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }, [schedules, query, scheduleFilter, selectedWeek, selectedMonth]);

  // Pagination logic
  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredSchedules.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  // Get current page data
  const currentRows = showAllSchedules 
    ? filteredSchedules 
    : filteredSchedules.slice(startIndex, endIndex);

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

  // Handle Start/Continue button click with activity tracking
  const handleStartContinueClick = async (schedule) => {
    try {
      // Track schedule start/continue activity
      const sessionInfo = getCurrentSessionInfo();
      if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
        const isContinue = workflowStates[`${schedule._id}_${schedule.doctor}`] === 'active';
        const action = isContinue ? 'schedule_continue' : 'schedule_start';
        
        await trackScheduleStart(
          sessionInfo.currentUser.userId,
          sessionInfo.currentUser.username,
          schedule._id,
          schedule.doctor,
          null, // stepNumber
          isContinue ? 'Continue Workflow' : 'Start Workflow'
        );
        
        console.log(`📊 Tracked ${action} for user ${sessionInfo.currentUser.username} and doctor ${schedule.doctor}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to track schedule start/continue activity:', error);
    }
    
    // Open the start page
    setSelectedSchedule(schedule);
    setIsStartPageOpen(true);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // Helper function to format week range for display
  const formatWeekRange = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
  };

  // Helper function to format month for display
  const formatMonth = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Handle week selection
  const handleWeekSelection = (weekDate) => {
    setSelectedWeek(weekDate);
    setScheduleFilter('customWeek');
    setShowWeekPicker(false);
  };

  // Handle month selection
  const handleMonthSelection = (monthDate) => {
    setSelectedMonth(monthDate);
    setScheduleFilter('customMonth');
    setShowMonthPicker(false);
  };

  return (
    <ProtectedRoute>
      <Navbar>
        <div className="p-6">
          {/* Header with Search and Media Refresh */}
          <div className="flex flex-col items-center mb-6 gap-4">
            {/* Search Bar */}
            <div className="flex w-full max-w-4xl rounded-full border border-indigo-300 overflow-hidden shadow-sm">
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
                placeholder="Search With Department Name, Doctor Name..........."
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

            {/* Schedule Filter Options */}
            <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4 w-full max-w-4xl">
              <span className="text-sm font-medium text-gray-600 mr-2">Filter by:</span>
              
              {/* All Schedules Filter */}
              <button
                onClick={() => setScheduleFilter('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  scheduleFilter === 'all'
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                All
              </button>
              
              {/* Day Filter */}
              <button
                onClick={() => setScheduleFilter('day')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  scheduleFilter === 'day'
                    ? 'bg-green-100 text-green-700 border-2 border-green-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Today
              </button>
              
              {/* Week Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowWeekPicker(!showWeekPicker)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    scheduleFilter === 'week' || scheduleFilter === 'customWeek'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  By week
                </button>
                
                {/* Week Date Picker */}
                {showWeekPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[280px]">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select a week:</label>
                      <input
                        type="date"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleWeekSelection(selectedWeek)}
                        disabled={!selectedWeek}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setShowWeekPicker(false)}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Month Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    scheduleFilter === 'month' || scheduleFilter === 'customMonth'
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  By month
                </button>
                
                {/* Month Date Picker */}
                {showMonthPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[280px]">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select a month:</label>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMonthSelection(selectedMonth)}
                        disabled={!selectedMonth}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:bg-purple-300 disabled:cursor-not-allowed hover:bg-purple-700"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setShowMonthPicker(false)}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Reset Filter Button */}
              {(scheduleFilter !== 'all' || selectedWeek || selectedMonth) && (
                <button
                  onClick={() => {
                    setScheduleFilter('all');
                    setSelectedWeek('');
                    setSelectedMonth('');
                    setShowWeekPicker(false);
                    setShowMonthPicker(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200 transition-all duration-200"
                  title="Clear filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
              
              {/* Filter Info */}
              <div className="ml-auto text-xs text-gray-500">
                {scheduleFilter === 'all' && `Showing all ${schedules.length} schedules`}
                {scheduleFilter === 'day' && `Showing today's schedules (${filteredSchedules.length})`}
                {scheduleFilter === 'week' && `Showing this week's schedules (${filteredSchedules.length})`}
                {scheduleFilter === 'month' && `Showing this month's schedules (${filteredSchedules.length})`}
                {scheduleFilter === 'customWeek' && selectedWeek && `Showing schedules for week of ${formatWeekRange(selectedWeek)} (${filteredSchedules.length})`}
                {scheduleFilter === 'customMonth' && selectedMonth && `Showing schedules for ${formatMonth(selectedMonth)} (${filteredSchedules.length})`}
              </div>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {scheduleFilter !== 'all' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 max-w-4xl mx-auto">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="text-blue-800 font-medium">
                  {scheduleFilter === 'day' && 'Today\'s Schedules'}
                  {scheduleFilter === 'week' && 'This Week\'s Schedules'}
                  {scheduleFilter === 'month' && 'This Month\'s Schedules'}
                  {scheduleFilter === 'customWeek' && selectedWeek && `Week of ${formatWeekRange(selectedWeek)}`}
                  {scheduleFilter === 'customMonth' && selectedMonth && `${formatMonth(selectedMonth)} Schedules`}
                </span>
                <span className="text-blue-600 text-sm">
                  ({filteredSchedules.length} of {schedules.length} total)
                </span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {/* Search Results Counter */}
            {(query || scheduleFilter !== 'all') && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    <span className="text-blue-800 font-medium">
                      {query && scheduleFilter !== 'all' 
                        ? `Search Results for "${query}" with ${scheduleFilter === 'day' ? 'Today' : scheduleFilter === 'week' ? 'This Week' : scheduleFilter === 'month' ? 'This Month' : scheduleFilter === 'customWeek' ? 'Custom Week' : 'Custom Month'} filter`
                        : query 
                          ? `Search Results for "${query}"`
                          : `${scheduleFilter === 'day' ? 'Today\'s' : scheduleFilter === 'week' ? 'This Week\'s' : scheduleFilter === 'month' ? 'This Month\'s' : scheduleFilter === 'customWeek' ? 'Custom Week' : 'Custom Month'} Schedules`
                      }
                    </span>
                  </div>
                  <div className="text-sm text-blue-600">
                    Found {filteredSchedules.length} schedule{filteredSchedules.length !== 1 ? 's' : ''}
                    {query && scheduleFilter !== 'all' && (
                      <span className="ml-2 text-blue-500">
                        (Filtered from {schedules.length} total)
                      </span>
                    )}
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
                  <th className="px-4 py-3 border-b">Date</th>
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
                          <p className="text-gray-600 text-sm mb-3">{error.message}</p>
                          <button 
                            onClick={fetchSchedules}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div className="text-center">
                          <p className="text-gray-600 font-medium">
                            {query ? `No schedules found for "${query}"` : 'No schedules found'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {query ? 'Try adjusting your search terms' : 'Create your first schedule to get started!'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRows.map((schedule, index) => (
                    <tr key={schedule._id || schedule.id || index} className="odd:bg-white even:bg-gray-50">
                      <td className="px-4 py-3 border-b">
                        {showAllSchedules ? index + 1 : startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3 border-b">{schedule.doctor}</td>
                      <td className="px-4 py-3 border-b">{schedule.department}</td>
                      <td className="px-4 py-3 border-b">
                        <button 
                          onClick={() => {
                            setSelectedQuestions(schedule.question);
                            setShowQuestionsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                        >
                          View ({schedule.question ? schedule.question.length : 0})
                        </button>
                      </td>
                      <td className="px-4 py-3 border-b">
                        {Array.isArray(schedule.languages) ? schedule.languages.join(', ') : schedule.languages}
                      </td>
                      <td className="px-4 py-3 border-b">
                        {schedule.date || 'N/A'}
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="flex flex-col gap-2">
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleStartContinueClick(schedule)}
                              className={`px-3 py-1 text-sm rounded transition-all duration-200 ${
                                workflowStates[`${schedule._id}_${schedule.doctor}`] === 'active' 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : workflowStates[`${schedule._id}_${schedule.doctor}`] === 'completed'
                                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-not-allowed'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                              disabled={workflowStates[`${schedule._id}_${schedule.doctor}`] === 'completed'}
                            >
                              {workflowStates[`${schedule._id}_${schedule.doctor}`] === 'active' ? 'Continue' : 
                               workflowStates[`${schedule._id}_${schedule.doctor}`] === 'completed' ? 'Completed' : 'Start'}
                            </button>
                          </div>
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
                    Showing all {filteredSchedules.length} schedules
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {query ? (
                      <>
                        Search results: {startIndex + 1}-{Math.min(endIndex, filteredSchedules.length)} of {filteredSchedules.length} schedules
                      </>
                    ) : (
                      <>
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredSchedules.length)} of {filteredSchedules.length} schedules
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
                            ? 'bg-green-600 text-white'
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
        </div>

        {/* Start Page Popup */}
        {isStartPageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <StartPage
              isOpen={isStartPageOpen}
              onClose={() => {
                setIsStartPageOpen(false);
                setSelectedSchedule(null);
              }}
              schedule={selectedSchedule}
            />
          </div>
        )}

        {/* Questions Modal */}
        {showQuestionsModal && selectedQuestions && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Selected Questions</h3>
                <div className="flex gap-3">
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
      </Navbar>
    </ProtectedRoute>
  );
};

export default SchedulePage;


