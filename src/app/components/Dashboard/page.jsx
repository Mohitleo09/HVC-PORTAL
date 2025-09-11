"use client";
import React, { useState, useEffect } from "react";

const DashboardPage = () => {
  const [doctorCount, setDoctorCount] = useState(0);
  const [totalDoctorCount, setTotalDoctorCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [showAllUpcomingSchedules, setShowAllUpcomingSchedules] = useState(false);
  const [completedVideos, setCompletedVideos] = useState(0);
  const [completedShorts, setCompletedShorts] = useState(0);
  const [completedSchedules, setCompletedSchedules] = useState(0);
  const [completedWorkflowCount, setCompletedWorkflowCount] = useState(0);
  const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all', 'day', 'week', 'month', 'customWeek', 'customMonth'
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [thumbnailCount, setThumbnailCount] = useState(0);
  const [completedWorkflows, setCompletedWorkflows] = useState(0);
  const [pendingWorkflows, setPendingWorkflows] = useState(0);

  // Helper function to retry failed API calls
  const retryFetch = async (fetchFunction, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fetchFunction();
        return; // Success, exit retry loop
      } catch (error) {
        console.warn(`API call attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} attempts failed for API call`);
          throw error;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  };

  // Fetch doctor count from API
  const fetchDoctorCount = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) {
        const data = await response.json();
        // Count only active doctors
        const activeDoctors = data.doctors?.filter(doctor => doctor.status === 'Active') || [];
        const totalDoctors = data.doctors?.length || 0;
        setDoctorCount(activeDoctors.length);
        console.log('Dashboard: Active doctors count:', activeDoctors.length, 'Total doctors:', totalDoctors);
        
        // Store total count for display
        setTotalDoctorCount(totalDoctors);
      } else {
        console.error('Failed to fetch doctor count:', response.status, response.statusText);
        setDoctorCount(0);
      }
    } catch (error) {
      console.error('Error fetching doctor count:', error);
      setDoctorCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch question count from API
  const fetchQuestionCount = async () => {
    try {
      setQuestionLoading(true);
      const response = await fetch('/api/questions');
      if (response.ok) {
        const data = await response.json();
        // Count only active questions
        const activeQuestions = data.questions?.filter(q => q.status === 'Active') || [];
        setQuestionCount(activeQuestions.length);
      } else {
        console.error('Failed to fetch question count:', response.status, response.statusText);
        setQuestionCount(0);
      }
    } catch (error) {
      console.error('Error fetching question count:', error);
      setQuestionCount(0);
    } finally {
      setQuestionLoading(false);
    }
  };

  // Fetch schedules from API
  const fetchSchedules = async () => {
    try {
      setScheduleLoading(true);
      const response = await fetch('/api/schedule');
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard: Schedules fetched:', data);
        setSchedules(data.schedules || []);
      } else {
        console.error('Failed to fetch schedules:', response.status, response.statusText);
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setScheduleLoading(false);
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
          console.log('Dashboard: Media counts fetched:', data.counts);
        } else {
          console.error('Failed to fetch media counts:', data.error || 'Unknown error');
          setCompletedVideos(0);
          setCompletedShorts(0);
          setCompletedSchedules(0);
        }
      } else {
        console.error('Failed to fetch media counts:', response.status, response.statusText);
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

  // Fetch thumbnail count from API
  const fetchThumbnailCount = async () => {
    try {
      const response = await fetch('/api/thumbnails');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setThumbnailCount(data.thumbnails?.length || 0);
          console.log('Dashboard: Thumbnail count fetched:', data.thumbnails?.length || 0);
        } else {
          console.error('Failed to fetch thumbnail count');
          setThumbnailCount(0);
        }
      } else {
        console.error('Failed to fetch thumbnail count');
        setThumbnailCount(0);
      }
    } catch (error) {
      console.error('Error fetching thumbnail count:', error);
      setThumbnailCount(0);
    }
  };

  // Fetch workflow counts from API
  const fetchWorkflowCounts = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const workflows = data.workflows || [];
          const completed = workflows.filter(w => w.workflowStatus === 'completed').length;
          const pending = workflows.filter(w => w.workflowStatus === 'in_progress' || w.workflowStatus === 'not_started').length;
          
          setCompletedWorkflows(completed);
          setPendingWorkflows(pending);
          console.log('Dashboard: Workflow counts fetched - Completed:', completed, 'Pending:', pending);
        } else {
          console.error('Failed to fetch workflow counts');
          setCompletedWorkflows(0);
          setPendingWorkflows(0);
        }
      } else {
        console.error('Failed to fetch workflow counts');
        setCompletedWorkflows(0);
        setPendingWorkflows(0);
      }
    } catch (error) {
      console.error('Error fetching workflow counts:', error);
      setCompletedWorkflows(0);
      setPendingWorkflows(0);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    // Set up global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection in dashboard:', event.reason);
      event.preventDefault(); // Prevent the default error handling
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Initial data fetch
    fetchDoctorCount();
    fetchQuestionCount();
    fetchSchedules();
    fetchMediaCounts(); // Fetch media counts on mount
    fetchThumbnailCount(); // Fetch thumbnail count on mount
    fetchWorkflowCounts(); // Fetch workflow counts on mount

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Set up polling to refresh data every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Wrap all fetch calls in a single try-catch to prevent unhandled rejections
        await Promise.allSettled([
          retryFetch(fetchDoctorCount, 2, 500),
          retryFetch(fetchQuestionCount, 2, 500),
          retryFetch(fetchSchedules, 2, 500),
          retryFetch(fetchMediaCounts, 2, 500), // Refresh media counts every 5 seconds
          retryFetch(fetchThumbnailCount, 2, 500), // Refresh thumbnail count every 5 seconds
          retryFetch(fetchWorkflowCounts, 2, 500) // Refresh workflow counts every 5 seconds
        ]);
      } catch (error) {
        console.error('Error in dashboard polling interval:', error);
        // Don't let errors break the polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for updates from other components
  useEffect(() => {
    const handleDoctorUpdate = () => {
      console.log('Doctor update detected, refreshing count...');
      fetchDoctorCount();
    };

    const handleQuestionUpdate = () => {
      console.log('Question update detected, refreshing question count...');
      fetchQuestionCount();
    };

    const handleScheduleUpdate = () => {
      console.log('Schedule update detected, refreshing schedules...');
      fetchSchedules();
    };

    const handleMediaUpdate = () => {
      console.log('Media update detected, refreshing media counts...');
      fetchMediaCounts();
    };

    const handleThumbnailUpdate = () => {
      console.log('Thumbnail update detected, refreshing thumbnail count...');
      fetchThumbnailCount();
    };

    const handleWorkflowUpdate = () => {
      console.log('Workflow update detected, refreshing workflow counts...');
      fetchWorkflowCounts();
    };

    const handleCompletedWorkflowCountUpdate = (event) => {
      try {
        console.log('Completed workflow count update detected:', event.detail?.count);
        setCompletedWorkflowCount(event.detail?.count || 0);
      } catch (error) {
        console.error('Error handling workflow count update:', error);
        setCompletedWorkflowCount(0);
      }
    };

    // Listen for custom events when doctors, questions, schedules, or trends are added/updated
    window.addEventListener('doctorCountUpdated', handleDoctorUpdate);
    window.addEventListener('questionCountUpdated', handleQuestionUpdate);
    window.addEventListener('scheduleUpdated', handleScheduleUpdate);
    window.addEventListener('mediaUpdated', handleMediaUpdate);
    window.addEventListener('workflowUpdated', handleWorkflowUpdate);
    window.addEventListener('completedWorkflowCountUpdated', handleCompletedWorkflowCountUpdate);
    window.addEventListener('thumbnailUpdated', handleThumbnailUpdate);
    
    return () => {
      window.removeEventListener('doctorCountUpdated', handleDoctorUpdate);
      window.removeEventListener('questionCountUpdated', handleQuestionUpdate);
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
      window.removeEventListener('mediaUpdated', handleMediaUpdate);
      window.removeEventListener('workflowUpdated', handleWorkflowUpdate);
      window.removeEventListener('completedWorkflowCountUpdated', handleCompletedWorkflowCountUpdate);
      window.removeEventListener('thumbnailUpdated', handleThumbnailUpdate);
    };
  }, []);

  // Function to manually refresh doctor count
  const refreshDoctorCount = () => {
    setLoading(true);
    fetchDoctorCount();
  };

  // Function to manually refresh question count
  const refreshQuestionCount = () => {
    setQuestionLoading(true);
    fetchQuestionCount();
  };

  // Function to manually refresh schedules
  const refreshSchedules = () => {
    setScheduleLoading(true);
    fetchSchedules();
  };

  // Function to manually refresh media counts
  const refreshMediaCounts = () => {
    setMediaLoading(true);
    fetchMediaCounts();
  };

  // Function to manually refresh workflow counts
  const refreshWorkflowCounts = () => {
    fetchWorkflowCounts();
  };

  // Function to manually refresh completed workflow count
  const refreshCompletedWorkflowCount = () => {
    // Request a refresh from the schedule page by dispatching a custom event
    const event = new CustomEvent('requestWorkflowCountRefresh');
    window.dispatchEvent(event);
    console.log('Requesting completed workflow count refresh...');
  };

  // Function to manually refresh thumbnail count
  const refreshThumbnailCount = () => {
    fetchThumbnailCount();
  };

  // Handle Show All button click for upcoming schedules
  const handleShowAllUpcoming = () => {
    setShowAllUpcomingSchedules(!showAllUpcomingSchedules);
  };

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

  // Get upcoming schedules based on current state
  const upcomingSchedules = schedules
    .filter(schedule => schedule && schedule.date) // Filter out invalid schedules
    .sort((a, b) => {
      try {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // Check if dates are valid
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0; // Keep original order if dates are invalid
        }
        
        return dateA - dateB;
      } catch (error) {
        console.error('Error sorting dates:', error);
        return 0; // Keep original order on error
      }
    })
    .filter(schedule => {
      if (scheduleFilter === 'all') return true;
      
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
    })
    .slice(0, showAllUpcomingSchedules ? schedules.length : 5);

  // Get filtered schedules count for display
  const getFilteredSchedulesCount = () => {
    return schedules
      .filter(schedule => schedule && schedule.date)
      .filter(schedule => {
        if (scheduleFilter === 'all') return true;
        
        try {
          const scheduleDate = new Date(schedule.date);
          const today = new Date();
          
          if (scheduleFilter === 'day') {
            return scheduleDate.toDateString() === today.toDateString();
          } else if (scheduleFilter === 'week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
          } else if (scheduleFilter === 'month') {
            return scheduleDate.getMonth() === today.getMonth() && 
                   scheduleDate.getFullYear() === today.getFullYear();
          } else if (scheduleFilter === 'customWeek' && selectedWeek) {
            const selectedDate = new Date(selectedWeek);
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
          } else if (scheduleFilter === 'customMonth' && selectedMonth) {
            const selectedDate = new Date(selectedMonth);
            return scheduleDate.getMonth() === selectedDate.getMonth() && 
                   scheduleDate.getFullYear() === selectedDate.getFullYear();
          }
          
          return true;
        } catch (error) {
          return true;
        }
      }).length;
  };

  console.log('Dashboard: Schedules state:', schedules);
  console.log('Dashboard: Upcoming schedules:', upcomingSchedules);

  const stats = [
    { 
      id: 1, 
      label: "Total No Of Doctors", 
      value: loading ? "..." : doctorCount, 
      border: "border-blue-200",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      textColor: "text-gray-700",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    { 
      id: 2, 
      label: "Total No Of Questions", 
      value: questionLoading ? "..." : questionCount, 
      border: "border-red-200",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      textColor: "text-gray-700",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    { 
      id: 3, 
      label: "Completed Workflows", 
      value: completedWorkflows, 
      border: "border-green-200",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      textColor: "text-gray-700",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    { 
      id: 4, 
      label: "Pending Workflows", 
      value: pendingWorkflows, 
      border: "border-yellow-200",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      textColor: "text-gray-700",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    { 
      id: 5, 
      label: "Total No Of Thumbnails", 
      value: thumbnailCount, 
      border: "border-purple-200",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      textColor: "text-gray-700",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl border ${s.border} p-6 ${s.bgColor} shadow-lg hover:shadow-xl transition-all duration-300 min-h-[160px] relative group`}
          >
            {/* Content */}
            <div className="flex flex-col h-full">
              {/* Icon and Label Row */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-white/60 ${s.textColor}`}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${s.textColor}`}>{s.label}</h3>
                </div>
                {s.id === 3 && (
                  <button
                    onClick={refreshWorkflowCounts}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Refresh completed workflow count"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
                {s.id === 4 && (
                  <button
                    onClick={refreshWorkflowCounts}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Refresh pending workflow count"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
                {s.id === 5 && (
                  <button
                    onClick={refreshThumbnailCount}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Refresh thumbnail count"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Value */}
              <div className="flex-1 flex items-center justify-center">
                <div className={`text-5xl font-bold ${s.textColor} ${(loading && s.id === 1) || (questionLoading && s.id === 2) || (thumbnailCount === 0 && s.id === 5) ? 'text-gray-400' : ''}`}>
                  {s.value}
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-4 space-y-2">
                {s.id === 1 && totalDoctorCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Active
                    </span>
                    <span className="text-gray-500">
                      Total: {totalDoctorCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* Doctor Status Summary */}
      {/* {totalDoctorCount > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Doctor Status Summary</h3>
            <button
              onClick={refreshDoctorCount}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh doctor status"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{doctorCount}</div>
              <div className="text-sm text-green-700 font-medium">Active Doctors</div>
              <div className="text-xs text-green-600 mt-1">Currently Available</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{totalDoctorCount - doctorCount}</div>
              <div className="text-sm text-gray-700 font-medium">Inactive Doctors</div>
              <div className="text-xs text-gray-600 mt-1">Temporarily Unavailable</div>
            </div>
          </div>
        </div>
      )} */}

      {/* Controls (icon placeholders) */}
      {/* <div className="flex justify-end gap-2">
        <button className="w-10 h-10 rounded-md border bg-white shadow-sm" title="Grid" />
        <button className="w-10 h-10 rounded-md border bg-white shadow-sm" title="List" />
        <button className="w-10 h-10 rounded-md border bg-white shadow-sm" title="Filter" />
      </div> */}

      {/* Upcoming Schedule */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Upcoming Schedule</h2>
          <button
            onClick={refreshSchedules}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh schedules"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {/* Schedule Filter Options */}
        <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
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
            {scheduleFilter === 'day' && `Showing today's schedules (${getFilteredSchedulesCount()})`}
            {scheduleFilter === 'week' && `Showing this week's schedules (${getFilteredSchedulesCount()})`}
            {scheduleFilter === 'month' && `Showing this month's schedules (${getFilteredSchedulesCount()})`}
            {scheduleFilter === 'customWeek' && selectedWeek && `Showing schedules for week of ${formatWeekRange(selectedWeek)} (${getFilteredSchedulesCount()})`}
            {scheduleFilter === 'customMonth' && selectedMonth && `Showing schedules for ${formatMonth(selectedMonth)} (${getFilteredSchedulesCount()})`}
          </div>
        </div>
        
        {/* Active Filter Indicator */}
        {scheduleFilter !== 'all' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
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
                ({getFilteredSchedulesCount()} of {schedules.length} total)
              </span>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 border-b">S.No</th>
                <th className="px-4 py-3 border-b">Doctor Name</th>
                <th className="px-4 py-3 border-b">Department</th>
                <th className="px-4 py-3 border-b">Date</th>
              </tr>
            </thead>
            <tbody>
              {scheduleLoading ? (
                <tr key="loading-row">
                  <td colSpan="4" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-600 text-sm">Loading schedules...</span>
                    </div>
                  </td>
                </tr>
              ) : upcomingSchedules.length === 0 ? (
                <tr key="empty-row">
                  <td colSpan="4" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div className="text-center">
                        <p className="text-gray-600 font-medium">
                          {scheduleFilter === 'all' && 'No schedules found'}
                          {scheduleFilter === 'day' && 'No schedules for today'}
                          {scheduleFilter === 'week' && 'No schedules for this week'}
                          {scheduleFilter === 'month' && 'No schedules for this month'}
                          {scheduleFilter === 'customWeek' && selectedWeek && `No schedules for week of ${formatWeekRange(selectedWeek)}`}
                          {scheduleFilter === 'customMonth' && selectedMonth && `No schedules for ${formatMonth(selectedMonth)}`}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {scheduleFilter === 'all' && 'Create your first schedule to get started!'}
                          {scheduleFilter === 'day' && 'Try selecting a different time period or create new schedules'}
                          {scheduleFilter === 'week' && 'Try selecting a different time period or create new schedules'}
                          {scheduleFilter === 'month' && 'Try selecting a different time period or create new schedules'}
                          {scheduleFilter === 'customWeek' && 'Try selecting a different week or create new schedules'}
                          {scheduleFilter === 'customMonth' && 'Try selecting a different month or create new schedules'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                upcomingSchedules.map((schedule, index) => (
                  <tr key={schedule._id || schedule.id || `schedule-${index}`} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-3 border-b">{index + 1}</td>
                    <td className="px-4 py-3 border-b">{schedule.doctor}</td>
                    <td className="px-4 py-3 border-b">{schedule.department}</td>
                    <td className="px-4 py-3 border-b">{schedule.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 flex justify-center items-center gap-4">
            <button 
              onClick={handleShowAllUpcoming}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                showAllUpcomingSchedules 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {showAllUpcomingSchedules ? 'Show Less' : 'Show All'}
            </button>
            
            {showAllUpcomingSchedules ? (
              <div className="text-sm text-gray-600">
                Showing all {getFilteredSchedulesCount()} schedules
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Showing first 5 of {getFilteredSchedulesCount()} schedules
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;


