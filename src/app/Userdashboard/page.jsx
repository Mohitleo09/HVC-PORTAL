'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '../navbar/navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { trackDashboardAccess, getCurrentSessionInfo } from '../utils/activityTracker';
import NewTrendForm from '../components/Trends/newtrend';

const UserDashboardPage = () => {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
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
  const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all', 'day', 'week', 'month', 'customWeek', 'customMonth'
  const [thumbnailCount, setThumbnailCount] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  // Trends state
  const [trends, setTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState('');
  const [showAddTrendModal, setShowAddTrendModal] = useState(false);
  const [editingTrend, setEditingTrend] = useState(null);
  const [trendSearchTerm, setTrendSearchTerm] = useState('');
  const [showDeleteTrendModal, setShowDeleteTrendModal] = useState(false);
  const [trendToDelete, setTrendToDelete] = useState(null);
  const [showAllTrends, setShowAllTrends] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
      
      // Track dashboard access
      try {
        trackDashboardAccess(session.user.id || session.user.email, session.user.username || session.user.name);
        console.log('✅ Dashboard access tracked for:', session.user.username || session.user.name);
      } catch (error) {
        console.warn('⚠️ Failed to track dashboard access:', error);
      }
    }
  }, [session]);

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
        console.log('User Dashboard: Active doctors count:', activeDoctors.length, 'Total doctors:', totalDoctors);
        
        // Store total count for display
        setTotalDoctorCount(totalDoctors);
      } else {
        console.error('Failed to fetch doctor count');
      }
    } catch (error) {
      console.error('Error fetching doctor count:', error);
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
        console.error('Failed to fetch question count');
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
        console.log('User Dashboard: Schedules fetched:', data);
        setSchedules(data.schedules || []);
      } else {
        console.error('Failed to fetch schedules');
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
          console.log('User Dashboard: Media counts fetched:', data.counts);
        } else {
          console.error('Failed to fetch media counts');
          setCompletedShorts(0);
          setCompletedVideos(0);
          setCompletedSchedules(0);
        }
      } else {
        console.error('Failed to fetch media counts');
        setCompletedShorts(0);
        setCompletedVideos(0);
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
          console.log('User Dashboard: Thumbnail count fetched:', data.thumbnails?.length || 0);
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

  // Load data when component mounts
  useEffect(() => {
    if (user) {
      // Track dashboard access
      try {
        const sessionInfo = getCurrentSessionInfo();
        if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
          trackDashboardAccess(sessionInfo.currentUser.userId, sessionInfo.currentUser.username);
        }
      } catch (error) {
        console.warn('⚠️ Failed to track dashboard access:', error);
      }
      
      fetchDoctorCount();
      fetchQuestionCount();
      fetchSchedules();
      fetchMediaCounts();
      fetchThumbnailCount(); // Fetch thumbnail count on mount
      fetchTrends(); // Fetch trends on mount
    }
  }, [user]);

  // Set up polling to refresh data every 5 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchDoctorCount();
      fetchQuestionCount();
      fetchSchedules();
      fetchMediaCounts();
      fetchThumbnailCount(); // Refresh thumbnail count
      fetchTrends(); // Refresh trends
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

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

  // Listen for updates from other components
  useEffect(() => {
    if (!user) return;

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

    const handleTrendUpdate = () => {
      console.log('Trend update detected, refreshing trends...');
      fetchTrends();
    };

    // Listen for custom events when doctors, questions, schedules, trends, or thumbnails are added/updated
    window.addEventListener('doctorCountUpdated', handleDoctorUpdate);
    window.addEventListener('questionCountUpdated', handleQuestionUpdate);
    window.addEventListener('scheduleUpdated', handleScheduleUpdate);
    window.addEventListener('mediaUpdated', handleMediaUpdate);
    window.addEventListener('thumbnailUpdated', handleThumbnailUpdate);
    window.addEventListener('trendUpdated', handleTrendUpdate);
    
    return () => {
      window.removeEventListener('doctorCountUpdated', handleDoctorUpdate);
      window.removeEventListener('questionCountUpdated', handleQuestionUpdate);
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
      window.removeEventListener('mediaUpdated', handleMediaUpdate);
      window.removeEventListener('thumbnailUpdated', handleThumbnailUpdate);
      window.removeEventListener('trendUpdated', handleTrendUpdate);
    };
  }, [user]);

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

  // Function to manually refresh thumbnail count
  const refreshThumbnailCount = () => {
    fetchThumbnailCount();
  };

  // Fetch trends from API
  const fetchTrends = async () => {
    try {
      setTrendsLoading(true);
      setTrendsError('');
      const response = await fetch('/api/trends');
      
      if (response.ok) {
        const data = await response.json();
        console.log('User Dashboard: Fetched trends data:', data);
        setTrends(data.trends || []);
      } else {
        console.error('Failed to fetch trends:', response.status);
        setTrendsError('Failed to load trends');
        setTrends([]);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
      setTrendsError('Network error. Please try again.');
      setTrends([]);
    } finally {
      setTrendsLoading(false);
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
    setTrendSearchTerm('');
    
    // Notify Dashboard to refresh trending topics
    window.dispatchEvent(new CustomEvent('trendUpdated'));
  };

  // Handle edit trend
  const handleEditTrend = (trend) => {
    console.log('Editing trend:', trend);
    setEditingTrend(trend);
    setShowAddTrendModal(true);
  };

  // Handle delete trend
  const handleDeleteTrend = async (id) => {
    console.log('🗑️ Deleting trend with ID:', id);
    const trend = trends.find(t => (t._id || t.id) === id);
    console.log('📋 Trend to delete:', trend);
    
    setTrendToDelete({ id, trend });
    setShowDeleteTrendModal(true);
  };

  const confirmDeleteTrend = async () => {
    if (!trendToDelete) return;
    
    try {
      console.log('🌐 Making DELETE request to:', `/api/trends/${trendToDelete.id}`);
      
      const response = await fetch(`/api/trends/${trendToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Delete result:', result);
        setTrends(prev => prev.filter(trend => (trend._id || trend.id) !== trendToDelete.id));
        alert('Trend deleted successfully!');
        
        // Notify Dashboard to refresh trending topics
        window.dispatchEvent(new CustomEvent('trendUpdated'));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to delete trend from database:', response.status, errorData);
        
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
      setShowDeleteTrendModal(false);
      setTrendToDelete(null);
    }
  };

  const cancelDeleteTrend = () => {
    setShowDeleteTrendModal(false);
    setTrendToDelete(null);
  };

  // Close modal and reset editing state
  const handleCloseTrendModal = () => {
    setShowAddTrendModal(false);
    setEditingTrend(null);
  };

  // Function to manually refresh trends
  const refreshTrends = () => {
    console.log('🔄 Refreshing trends data...');
    fetchTrends();
  };

  // Handle Show All button click for trends
  const handleShowAllTrends = () => {
    setShowAllTrends(!showAllTrends);
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

  // Handle Show All button click for upcoming schedules
  const handleShowAllUpcoming = () => {
    setShowAllUpcomingSchedules(!showAllUpcomingSchedules);
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

  // Filter trends based on search term
  const filteredTrends = trends.filter(trend => {
    if (!trendSearchTerm.trim()) return true;
    return trend.topic.toLowerCase().includes(trendSearchTerm.toLowerCase().trim());
  }).sort((a, b) => b.views - a.views); // Sort by views from highest to lowest

  // Get displayed trends (limited to 10 unless showAllTrends is true)
  const displayedTrends = showAllTrends ? filteredTrends : filteredTrends.slice(0, 10);

  console.log('User Dashboard: Schedules state:', schedules);
  console.log('User Dashboard: Upcoming schedules:', upcomingSchedules);
  console.log('User Dashboard: Trends state:', trends);
  console.log('User Dashboard: Filtered trends:', filteredTrends);

  if (!user) {
    return <div>Loading...</div>;
  }

  const stats = [
    { 
      id: 3, 
      label: "Total No Of Schedules", 
      value: scheduleLoading ? "..." : schedules.length, 
      border: "border-blue-200",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
      textColor: "text-gray-700",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    { 
      id: 4, 
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
    <ProtectedRoute>
      <Navbar>
        <div className="p-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {stats.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border ${s.border} p-6 ${s.bgColor} shadow-lg hover:shadow-xl transition-all duration-300 min-h-[160px] relative group`}
            >
              {/* Refresh Button */}
              {s.refreshable && (
                <button
                  onClick={s.onRefresh}
                  className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Refresh count"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              
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
                </div>
                
                {/* Value */}
                <div className="flex-1 flex items-center justify-center">
                  <div className={`text-5xl font-bold ${s.textColor} ${(loading && s.id === 1) || (questionLoading && s.id === 2) || (scheduleLoading && s.id === 3) || (thumbnailCount === 0 && s.id === 4) ? 'text-gray-400' : ''}`}>
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

        {/* Trends Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Trending Topics</h2>
            <div className="flex gap-3">
              {/* <button
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
              </button> */}
              {/* <button
                onClick={() => setShowAddTrendModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Trend
                </div>
              </button> */}
            </div>
          </div>

          {/* Search Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Search by topic name..."
                  value={trendSearchTerm}
                  onChange={(e) => setTrendSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {trendSearchTerm && (
                <button
                  onClick={() => setTrendSearchTerm('')}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  title="Clear search"
                >
                  ✕ Clear
                </button>
              )}
            </div>
            {trendSearchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                Found {filteredTrends.length} trend{filteredTrends.length !== 1 ? 's' : ''} 
                {trendSearchTerm && ` matching "${trendSearchTerm}"`}
                {filteredTrends.length > 10 && !showAllTrends && (
                  <span className="ml-2 text-blue-600">(Showing first 10)</span>
                )}
              </div>
            )}
          </div>

          {/* Trends Table */}
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
                </tr>
              </thead>
              <tbody>
                {trendsLoading ? (
                  <tr key="loading-row">
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-600 font-medium">Loading trends...</span>
                      </div>
                    </td>
                  </tr>
                ) : trendsError ? (
                  <tr key="error-row">
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-red-600 font-medium">Failed to load trends</p>
                          <p className="text-gray-500 text-sm">{trendsError}</p>
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
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">
                            {trendSearchTerm ? `No trends found matching "${trendSearchTerm}"` : 'No trends found'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {trendSearchTerm ? 'Try a different search term' : 'Start by adding your first trend'}
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
                            </div>
                          )}
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
        </section>
      </div>

      {/* New Trend Form Modal */}
      <NewTrendForm
        isOpen={showAddTrendModal}
        onClose={handleCloseTrendModal}
        onTrendAdded={handleTrendAdded}
        editingTrend={editingTrend}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteTrendModal && trendToDelete && (
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
        </Navbar>
      </ProtectedRoute>
  );
};

export default UserDashboardPage;


