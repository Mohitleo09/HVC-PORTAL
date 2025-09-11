'use client';
import { useState, useEffect } from 'react';

const UsersPage = () => {
     const [users, setUsers] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [error, setError] = useState(null);
   const [lastUpdated, setLastUpdated] = useState(null);
   const [loginLogs, setLoginLogs] = useState([]);
   const [showActivityModal, setShowActivityModal] = useState(false);
   const [selectedUserActivities, setSelectedUserActivities] = useState([]);
   const [selectedUserForActivity, setSelectedUserForActivity] = useState(null);
   const [activityLoading, setActivityLoading] = useState(false);
   
   // CRUD operation states
   const [showViewModal, setShowViewModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [showDownloadModal, setShowDownloadModal] = useState(false);
   const [selectedUser, setSelectedUser] = useState(null);
   const [editFormData, setEditFormData] = useState({});
   const [crudLoading, setCrudLoading] = useState(false);
   const [downloadLoading, setDownloadLoading] = useState(false);
   const [activityChartData, setActivityChartData] = useState(null);
   
   // Date range modal states
   const [showDateRangeModal, setShowDateRangeModal] = useState(false);
   const [startDate, setStartDate] = useState('');
   const [endDate, setEndDate] = useState('');
   const [dateRangeLoading, setDateRangeLoading] = useState(false);
   const [selectedUserForDateRange, setSelectedUserForDateRange] = useState(null);

     // Fetch real user data with their activities
   useEffect(() => {
     fetchUserData();
     
     // Auto-refresh every 2 minutes for real-time login status updates
     const interval = setInterval(() => {
       fetchUserData();
     }, 2 * 60 * 1000); // 2 minutes
     
     return () => {
       clearInterval(interval);
     };
   }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users from the system
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();

      if (!usersData.success) {
        throw new Error('Failed to fetch users');
      }


       // Fetch login/logout logs for user activity tracking
       const loginLogsResponse = await fetch('/api/auth/login-logs');
       const loginLogsData = await loginLogsResponse.json();
       setLoginLogs(loginLogsData.logs || []);

             // Process users with their real data (exclude admin and only show active users)
       const processedUsers = await Promise.all(
         usersData.users
           .filter(user => user.role !== 'admin' && user.username !== 'admin' && user.status === 'active') // Exclude admin users and only show active users
           .map(async (user) => {

           // Get user's login/logout activity
           const userLoginLogs = loginLogs.filter(log => 
             log.username === user.username || log.email === user.email
           );
           
           // Get last login and logout times
           const lastLogin = userLoginLogs
             .filter(log => log.action === 'login')
             .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
           
           const lastLogout = userLoginLogs
             .filter(log => log.action === 'logout')
             .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
           
           // Calculate session duration if both login and logout exist
           let sessionDuration = null;
           if (lastLogin && lastLogout && new Date(lastLogout.timestamp) > new Date(lastLogin.timestamp)) {
             const duration = new Date(lastLogout.timestamp) - new Date(lastLogin.timestamp);
             sessionDuration = Math.round(duration / (1000 * 60)); // Convert to minutes
           }
           
           // Check if user is currently logged in (has login but no logout after it)
           const isCurrentlyLoggedIn = lastLogin && (!lastLogout || new Date(lastLogout.timestamp) < new Date(lastLogin.timestamp));

                        return {
               id: user._id || user.id,
               name: user.name || user.username,
               email: user.email,
               department: user.department || 'General',
               username: user.username,
               isCurrentlyLoggedIn,
               status: user.status || 'Active',
               // Login/logout tracking
               loginInfo: {
                 lastLogin: lastLogin ? new Date(lastLogin.timestamp) : null,
                 lastLogout: lastLogout ? new Date(lastLogout.timestamp) : null,
                 sessionDuration,
                 totalLogins: userLoginLogs.filter(log => log.action === 'login').length,
                 totalLogouts: userLoginLogs.filter(log => log.action === 'logout').length
               }
             };
        })
      );

             setUsers(processedUsers);
       setLastUpdated(new Date());
     } catch (err) {
       console.error('Error fetching user data:', err);
       setError(err.message);
     } finally {
       setLoading(false);
     }
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const refreshData = () => {
    fetchUserData();
  };

  // Helper function to format thumbnail activity display text
  const getThumbnailActivityDisplayText = (activity) => {
    const action = activity.action.replace('thumbnail_', '');
    const doctorName = activity.doctorName || 'Unknown Doctor';
    
    switch (action) {
      case 'create':
        return `Thumbnail created for ${doctorName}`;
      case 'view':
        return `Viewed thumbnail for ${doctorName}`;
      case 'edit':
        return `Edited thumbnail for ${doctorName}`;
      case 'delete':
        return `Deleted thumbnail for ${doctorName}`;
      case 'update':
        return `Updated thumbnail for ${doctorName}`;
      case 'upload':
        return `Uploaded thumbnail for ${doctorName}`;
      case 'approve':
        return `Approved thumbnail for ${doctorName}`;
      case 'reject':
        return `Rejected thumbnail for ${doctorName}`;
      default:
        return `Thumbnail ${action} for ${doctorName}`;
    }
  };

  // Helper function to format page navigation activity display text
  const getPageNavigationDisplayText = (activity) => {
    const fromPage = activity.details?.fromPage || activity.details?.from || 'Unknown Page';
    const toPage = activity.details?.toPage || activity.details?.to || 'Unknown Page';
    
    return `Navigated from ${fromPage} to ${toPage}`;
  };

  // Helper function to format schedule activity display text
  const getScheduleActivityDisplayText = (activity) => {
    const action = activity.action;
    const doctorName = activity.doctorName || 'Unknown Doctor';
    const stepName = activity.stepName || '';
    const stepNumber = activity.stepNumber || '';
    
    switch (action) {
      case 'schedule_start':
        return `Started workflow for ${doctorName}`;
      case 'schedule_continue':
        return `Continued workflow for ${doctorName}`;
      case 'schedule_complete':
        return `Completed workflow for ${doctorName}`;
      case 'workflow_step_complete':
        return `Completed Step ${stepNumber}: ${stepName} for ${doctorName}`;
      case 'workflow_step_edit':
        return `Edited Step ${stepNumber}: ${stepName} for ${doctorName}`;
      default:
        return `Schedule ${action} for ${doctorName}`;
    }
  };

  const viewUserActivity = async (userId, username) => {
    try {
      setActivityLoading(true);
      setSelectedUserForActivity({ userId, username });
      
      console.log('🔍 Fetching INDIVIDUAL user activities for:', username, 'ID:', userId);
      
      // Fetch user activities, thumbnail activities, and schedule activities
      const [userResponse, thumbnailResponse, scheduleResponse] = await Promise.all([
        fetch(`/api/user-activity?userId=${userId}&username=${username}&limit=100`),
        fetch(`/api/thumbnail-activity?userId=${userId}&username=${username}&limit=100`),
        fetch(`/api/schedule-activity?userId=${userId}&username=${username}&limit=100`)
      ]);

        let allActivities = [];
        
      // Process user activities
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const userSpecificActivities = (userData.activities || []).filter(activity => 
          activity.userId === userId || 
          activity.username === username ||
          activity.userId === String(userId) ||
          activity.username === String(username)
        );
        allActivities = [...allActivities, ...userSpecificActivities];
        console.log('📊 User activities found:', userSpecificActivities.length);
      }

      // Process thumbnail activities
      if (thumbnailResponse.ok) {
        const thumbnailData = await thumbnailResponse.json();
        console.log('🔍 Raw thumbnail activities for debugging:', thumbnailData.activities?.length || 0);
        console.log('🔍 Looking for userId:', userId, 'username:', username);
        
        const thumbnailSpecificActivities = (thumbnailData.activities || []).filter(activity => {
          const matchesUserId = activity.userId === userId || activity.userId === String(userId);
          const matchesUsername = activity.username === username || activity.username === String(username);
          const matches = matchesUserId || matchesUsername;
          
          if (matches) {
            console.log('✅ Found matching thumbnail activity:', {
              action: activity.action,
              userId: activity.userId,
              username: activity.username,
              doctorName: activity.doctorName
            });
          }
          
          return matches;
        });
        
        allActivities = [...allActivities, ...thumbnailSpecificActivities];
        console.log('📊 Thumbnail activities found:', thumbnailSpecificActivities.length);
      }

      // Process schedule activities
      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        console.log('🔍 Raw schedule activities for debugging:', scheduleData.activities?.length || 0);
        
        const scheduleSpecificActivities = (scheduleData.activities || []).filter(activity => {
          const matchesUserId = activity.userId === userId || activity.userId === String(userId);
          const matchesUsername = activity.username === username || activity.username === String(username);
          const matches = matchesUserId || matchesUsername;
          
          if (matches) {
            console.log('✅ Found matching schedule activity:', {
            action: activity.action,
              userId: activity.userId,
              username: activity.username,
              doctorName: activity.doctorName,
              stepName: activity.stepName
            });
          }
          
          return matches;
        });
        
        allActivities = [...allActivities, ...scheduleSpecificActivities];
        console.log('📊 Schedule activities found:', scheduleSpecificActivities.length);
      }

      // Sort activities by timestamp (newest first)
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log('✅ Total filtered activities for user:', allActivities.length);
      
      // If no activities found, create a placeholder
      if (allActivities.length === 0) {
        const placeholderActivity = {
          action: 'No activity performed',
          timestamp: new Date(),
          details: {}
        };
        setSelectedUserActivities([placeholderActivity]);
      } else {
        setSelectedUserActivities(allActivities);
      }
      
      setShowActivityModal(true);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      // Show error message
      const errorActivity = {
        action: 'error',
        timestamp: new Date(),
        details: {
          message: 'Error occurred while fetching activities',
          userId: userId,
          username: username,
          error: error.message
        }
      };
      setSelectedUserActivities([errorActivity]);
      setShowActivityModal(true);
    } finally {
      setActivityLoading(false);
    }
  };



  // CRUD Operations
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      department: user.department,
      username: user.username,
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      setCrudLoading(true);
      
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        // Refresh data after successful update
        await fetchUserData();
        setShowEditModal(false);
        setSelectedUser(null);
        setEditFormData({});
      } else {
        console.error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDeleteUserConfirm = async () => {
    try {
      setCrudLoading(true);
      
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh data after successful deletion
        await fetchUserData();
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setCrudLoading(false);
    }
  };



  const handleDownloadActivityChart = async (user) => {
    try {
      setDownloadLoading(true);
      setSelectedUser(user);
      
      console.log('📊 Generating activity report for user:', user.username);
      
      // Fetch general activity data, thumbnail activity data, and schedule activity data
      const [userActivityResponse, thumbnailActivityResponse, scheduleActivityResponse] = await Promise.all([
        fetch(`/api/user-activity?userId=${user.id}&limit=200`),
        fetch(`/api/thumbnail-activity?userId=${user.id}&username=${user.username}&limit=200`),
        fetch(`/api/schedule-activity?userId=${user.id}&username=${user.username}&limit=200`)
      ]);

      let userActivities = [];
      let thumbnailActivities = [];
      let scheduleActivities = [];

      // Process user activities (General Activity)
      if (userActivityResponse.ok) {
        const userData = await userActivityResponse.json();
        userActivities = userData.activities || [];
        console.log('📊 User activities found:', userActivities.length);
      }

      // Process thumbnail activities
      if (thumbnailActivityResponse.ok) {
        const thumbnailData = await thumbnailActivityResponse.json();
        thumbnailActivities = thumbnailData.activities || [];
        console.log('📊 Thumbnail activities found:', thumbnailActivities.length);
      }

      // Process schedule activities
      if (scheduleActivityResponse.ok) {
        const scheduleData = await scheduleActivityResponse.json();
        scheduleActivities = scheduleData.activities || [];
        console.log('📊 Schedule activities found:', scheduleActivities.length);
      }

      // Process and categorize activities
      const chartData = processActivityDataForChart(userActivities, thumbnailActivities, scheduleActivities, user);
      setActivityChartData(chartData);
      setShowDownloadModal(true);
      
      console.log('✅ Activity report generated successfully');
    } catch (error) {
      console.error('❌ Error preparing activity chart:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const processActivityDataForChart = (userActivities, thumbnailActivities, scheduleActivities, user) => {
    // Process user activities (login, navigation, thumbnails, schedules)
    const userActivityCategories = {
      'Login': 0,
      'Logout': 0,
      'Page Navigation': 0,
      'Thumbnail Activities': 0,
      'Schedule Activities': 0,
      'Other User Actions': 0
    };

    // Process user activities
    userActivities.forEach(activity => {
      if (activity.action === 'login') {
        userActivityCategories['Login']++;
      } else if (activity.action === 'logout') {
        userActivityCategories['Logout']++;
      } else if (activity.action === 'page_navigation') {
        userActivityCategories['Page Navigation']++;
      } else {
        userActivityCategories['Other User Actions']++;
      }
    });

    // Process thumbnail activities
    thumbnailActivities.forEach(activity => {
      userActivityCategories['Thumbnail Activities']++;
    });

    // Process schedule activities
    scheduleActivities.forEach(activity => {
      userActivityCategories['Schedule Activities']++;
    });

    // Convert to chart format and filter out zero values
    const processCategories = (categories) => {
      const chartData = Object.entries(categories)
        .filter(([_, count]) => count > 0)
        .map(([category, count]) => ({
          category,
          count,
          percentage: 0
        }));

      const total = chartData.reduce((sum, item) => sum + item.count, 0);
      chartData.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
      });

      return { data: chartData, total };
    };

    const userChart = processCategories(userActivityCategories);

    return {
      user: user,
      userChart,
      totalActivities: userChart.total,
      timestamp: new Date().toISOString(),
      rawData: {
        userActivities,
        thumbnailActivities,
        scheduleActivities
      }
    };
  };

  // Handle date range report generation
  const handleDateRangeReport = async (user) => {
    try {
      setDateRangeLoading(true);
      setSelectedUserForDateRange(user);
      
      // Set default dates (last 7 days)
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
      
      setShowDateRangeModal(true);
    } catch (error) {
      console.error('Error opening date range modal:', error);
    } finally {
      setDateRangeLoading(false);
    }
  };


  // Generate report for specific date range
  const generateDateRangeReport = async () => {
    if (!startDate || !endDate || !selectedUserForDateRange) return;
    
    try {
      setDateRangeLoading(true);
      
      // Fetch user activity data, thumbnail activity data, and schedule activity data for the specific date range
      const [userActivityResponse, thumbnailActivityResponse, scheduleActivityResponse] = await Promise.all([
        fetch(`/api/user-activity?userId=${selectedUserForDateRange.id}&startDate=${startDate}&endDate=${endDate}&limit=1000`),
        fetch(`/api/thumbnail-activity?userId=${selectedUserForDateRange.id}&username=${selectedUserForDateRange.username}&startDate=${startDate}&endDate=${endDate}&limit=1000`),
        fetch(`/api/schedule-activity?userId=${selectedUserForDateRange.id}&username=${selectedUserForDateRange.username}&startDate=${startDate}&endDate=${endDate}&limit=1000`)
      ]);

      let userActivities = [];
      let thumbnailActivities = [];
      let scheduleActivities = [];

      if (userActivityResponse.ok) {
        const userData = await userActivityResponse.json();
        userActivities = userData.activities || [];
      }

      if (thumbnailActivityResponse.ok) {
        const thumbnailData = await thumbnailActivityResponse.json();
        thumbnailActivities = thumbnailData.activities || [];
      }

      if (scheduleActivityResponse.ok) {
        const scheduleData = await scheduleActivityResponse.json();
        scheduleActivities = scheduleData.activities || [];
      }

      // Process and categorize activities for the date range
      const chartData = processActivityDataForChart(userActivities, thumbnailActivities, scheduleActivities, selectedUserForDateRange);
      setActivityChartData(chartData);
      setShowDownloadModal(true);
      setShowDateRangeModal(false);
    } catch (error) {
      console.error('Error generating date range report:', error);
    } finally {
      setDateRangeLoading(false);
    }
  };

       const downloadChartAsImage = () => {
    if (!activityChartData) return;

    // Create canvas for chart
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 800;

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Activity Report`, canvas.width / 2, 40);
    ctx.fillText(`${activityChartData.user?.name || 'Unknown User'} (@${activityChartData.user?.username || 'unknown'})`, canvas.width / 2, 75);

    // Draw subtitle
    ctx.font = '16px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Generated on ${new Date(activityChartData.timestamp).toLocaleString()}`, canvas.width / 2, 100);

    // Summary section
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';
    ctx.fillText(`Total User Activities: ${activityChartData.totalActivities}`, 50, 140);
    ctx.fillText(`Login Activities: ${activityChartData.userChart.data.find(item => item.category === 'Login')?.count || 0}`, 50, 165);
    ctx.fillText(`Navigation Activities: ${activityChartData.userChart.data.find(item => item.category === 'Page Navigation')?.count || 0}`, 50, 190);
    ctx.fillText(`Thumbnail Activities: ${activityChartData.userChart.data.find(item => item.category === 'Thumbnail Activities')?.count || 0}`, 50, 215);
    ctx.fillText(`Schedule Activities: ${activityChartData.userChart.data.find(item => item.category === 'Schedule Activities')?.count || 0}`, 50, 240);

    // Draw single centered pie chart
    const chartY = 280;
    const radius = 120;
    const centerX = canvas.width / 2;

    // User Activities Chart
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('User Activities Distribution', centerX, chartY - 40);

    let currentAngle = 0;
    const userColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    activityChartData.userChart.data.forEach((item, index) => {
      const sliceAngle = (item.count / activityChartData.userChart.total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, chartY);
      ctx.arc(centerX, chartY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = userColors[index % userColors.length];
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      currentAngle += sliceAngle;
    });

    // Draw legend below chart
    const legendY = chartY + radius + 80;
    const legendStartX = centerX - 200;

    // User Activities Legend
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.fillText('User Activities Legend', centerX, legendY);
    
    let legendItemY = legendY + 30;
    activityChartData.userChart.data.forEach((item, index) => {
      const color = userColors[index % userColors.length];
      
      ctx.fillStyle = color;
      ctx.fillRect(legendStartX + (index % 2) * 250, legendItemY - 8, 12, 12);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.category}: ${item.count} (${item.percentage}%)`, legendStartX + (index % 2) * 250 + 20, legendItemY);
      
      if (index % 2 === 1) {
        legendItemY += 20;
      }
    });

    // Convert to image and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprehensive-activity-chart-${activityChartData.user?.username || 'unknown'}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex) => {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

       const downloadChartAsPDF = () => {
      if (!activityChartData) return;

      // Import jsPDF dynamically to avoid SSR issues
      import('jspdf').then(({ default: jsPDF }) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);

        // Helper function to format page navigation activity display text
        const getPageNavigationDisplayText = (activity) => {
          const fromPage = activity.details?.fromPage || activity.details?.from || 'Unknown Page';
          const toPage = activity.details?.toPage || activity.details?.to || 'Unknown Page';
          
          return `Navigated from ${fromPage} to ${toPage}`;
        };

        // Helper function to format thumbnail activity display text
        const getThumbnailActivityDisplayText = (activity) => {
          const action = activity.action.replace('thumbnail_', '');
          const doctorName = activity.doctorName || 'Unknown Doctor';
          
          switch (action) {
            case 'create':
              return `Thumbnail created for ${doctorName}`;
            case 'view':
              return `Viewed thumbnail for ${doctorName}`;
            case 'edit':
              return `Edited thumbnail for ${doctorName}`;
            case 'delete':
              return `Deleted thumbnail for ${doctorName}`;
            case 'update':
              return `Updated thumbnail for ${doctorName}`;
            case 'upload':
              return `Uploaded thumbnail for ${doctorName}`;
            case 'approve':
              return `Approved thumbnail for ${doctorName}`;
            case 'reject':
              return `Rejected thumbnail for ${doctorName}`;
            default:
              return `Thumbnail ${action} for ${doctorName}`;
          }
        };

        // Helper function to format schedule activity display text
        const getScheduleActivityDisplayText = (activity) => {
          const action = activity.action;
          const doctorName = activity.doctorName || 'Unknown Doctor';
          const stepName = activity.stepName || '';
          const stepNumber = activity.stepNumber || '';
          
          switch (action) {
            case 'schedule_start':
              return `Started workflow for ${doctorName}`;
            case 'schedule_continue':
              return `Continued workflow for ${doctorName}`;
            case 'schedule_complete':
              return `Completed workflow for ${doctorName}`;
            case 'workflow_step_complete':
              return `Completed Step ${stepNumber}: ${stepName} for ${doctorName}`;
            case 'workflow_step_edit':
              return `Edited Step ${stepNumber}: ${stepName} for ${doctorName}`;
            default:
              return `Schedule ${action} for ${doctorName}`;
          }
        };

        // Helper function to draw a clean header
        const drawHeader = () => {
          // Header background
          doc.setFillColor(59, 130, 246); // Blue background
          doc.rect(0, 0, pageWidth, 25, 'F');
          
          // Company/System name
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
          doc.text('HCV PORTAL', margin, 12);

          // Report title
          doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
          doc.text('Employee Activity Report', pageWidth - margin, 12, { align: 'right' });
          
          // Reset text color
          doc.setTextColor(0, 0, 0);
        };

        // Helper function to draw a clean section header
        const drawSectionHeader = (title, y) => {
          // Section background
          doc.setFillColor(248, 250, 252); // Light gray background
          doc.rect(margin, y - 5, contentWidth, 12, 'F');
          
          // Section title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55); // Dark gray text
          doc.text(title, margin + 3, y + 2);
          
          // Reset text color
          doc.setTextColor(0, 0, 0);
        };

        // Helper function to draw a clean card
        const drawCard = (title, data, y, color) => {
          const cardHeight = 35;
          const cardWidth = contentWidth / 3 - 5;
          
          // Card background
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(229, 231, 235); // Light gray border
          doc.rect(margin, y, cardWidth, cardHeight, 'FD');
          
          // Card title
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99); // Gray text
          doc.text(title, margin + 5, y + 8);
          
          // Card data
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(color.r, color.g, color.b);
          doc.text(data.toString(), margin + 5, y + 20);
          
          // Card subtitle
          doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128); // Light gray
          doc.text('Total Activities', margin + 5, y + 28);
          
          return cardWidth + 5;
        };

        // Helper function to draw a clean table
        const drawTable = (headers, data, y, colors) => {
          const tableWidth = contentWidth;
          const colWidth = tableWidth / headers.length;
          const rowHeight = 8;
          
          // Table header background
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, y, tableWidth, rowHeight, 'F');
          
          // Table header text
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(55, 65, 81);
          
          headers.forEach((header, index) => {
            doc.text(header, margin + (index * colWidth) + 3, y + 5);
          });
          
          // Table data
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          
          data.forEach((row, rowIndex) => {
            const currentY = y + rowHeight + (rowIndex * rowHeight);
            
            // Alternate row background
            if (rowIndex % 2 === 0) {
              doc.setFillColor(249, 250, 251);
              doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
            }
            
            // Color indicator for first column
            if (colors && colors[rowIndex]) {
              const color = hexToRgb(colors[rowIndex]);
              if (color) {
                doc.setFillColor(color.r, color.g, color.b);
                doc.rect(margin + 1, currentY + 1, 3, 3, 'F');
              }
            }
            
            // Table data
            row.forEach((cell, colIndex) => {
              doc.text(cell.toString(), margin + (colIndex * colWidth) + 3, currentY + 5);
            });
          });
          
          return y + rowHeight + (data.length * rowHeight) + 10;
        };

        // Start building the PDF
        drawHeader();
        
        let currentY = 35;

        // Employee Information Section
        drawSectionHeader('Employee Information', currentY);
        currentY += 15;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Name:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(activityChartData.user?.name || 'Unknown User', margin + 20, currentY);

          currentY += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Username:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(`@${activityChartData.user?.username || 'unknown'}`, margin + 20, currentY);
        
        currentY += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Email:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(activityChartData.user?.email || 'N/A', margin + 20, currentY);

          currentY += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Department:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(activityChartData.user?.department || 'General', margin + 20, currentY);

          currentY += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Report Generated:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(activityChartData.timestamp).toLocaleString(), margin + 20, currentY);
        
        currentY += 20;

        // Activity Summary Cards
        drawSectionHeader('Activity Summary', currentY);
        currentY += 15;

        const userColor = hexToRgb('#3b82f6');
        
        drawCard('General Activities', activityChartData.userChart.total, currentY, userColor);
        
        currentY += 45;

        // General Activities Breakdown
        if (activityChartData.userChart.data.length > 0) {
          drawSectionHeader('General Activities Breakdown', currentY);
          currentY += 15;
          
          const userHeaders = ['Activity Type', 'Count', 'Percentage'];
          const userData = activityChartData.userChart.data.map(item => [
            item.category,
            item.count,
            `${item.percentage}%`
          ]);
          const userColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
          
          currentY = drawTable(userHeaders, userData, currentY, userColors);
        } else {
          drawSectionHeader('General Activities Breakdown', currentY);
          currentY += 15;
          
          doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text('No Activity Found', margin, currentY);
          currentY += 10;
        doc.setFontSize(10);
          doc.text('This user has not performed any activities yet.', margin, currentY);
          currentY += 20;
        }


        // Detailed Activity Data Section
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = margin;
        }

        drawSectionHeader('Detailed Activity History', currentY);
        currentY += 15;

        // General Activities Detailed Data
        if (activityChartData.rawData.userActivities.length > 0 || activityChartData.rawData.thumbnailActivities.length > 0 || activityChartData.rawData.scheduleActivities.length > 0) {
          doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
          doc.setTextColor(59, 130, 246); // Blue
          doc.text('General Activities History:', margin, currentY);
        currentY += 8;

        doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

          // Process user activities
          activityChartData.rawData.userActivities.forEach((activity, index) => {
            if (currentY > pageHeight - margin - 30) {
          doc.addPage();
              currentY = margin;
        }

          const timestamp = new Date(activity.timestamp).toLocaleString();
        doc.setFont('helvetica', 'bold');
            
            // Use appropriate display text based on activity type
            let displayText;
            if (activity.action.startsWith('thumbnail_')) {
              displayText = getThumbnailActivityDisplayText(activity);
            } else if (activity.action.startsWith('schedule_') || activity.action.startsWith('workflow_')) {
              displayText = getScheduleActivityDisplayText(activity);
            } else if (activity.action === 'page_navigation') {
              displayText = getPageNavigationDisplayText(activity);
            } else {
              displayText = String(activity.action || 'Unknown Action');
            }
            
            doc.text(`${index + 1}. ${displayText}`, margin, currentY);
        doc.setFont('helvetica', 'normal');
            doc.text(`   Time: ${timestamp}`, margin + 5, currentY + 4);

          // Add specific details based on activity type
          if (activity.action.startsWith('thumbnail_') && activity.doctorName) {
            doc.text(`   Doctor: ${activity.doctorName}`, margin + 5, currentY + 8);
            currentY += 3;
          } else if (activity.action === 'page_navigation' && (activity.details?.fromPage || activity.details?.toPage)) {
            doc.text(`   From: ${activity.details?.fromPage || activity.details?.from || 'Unknown Page'}`, margin + 5, currentY + 8);
            doc.text(`   To: ${activity.details?.toPage || activity.details?.to || 'Unknown Page'}`, margin + 5, currentY + 12);
            currentY += 6;
          } else if ((activity.action.startsWith('schedule_') || activity.action.startsWith('workflow_')) && activity.doctorName) {
            doc.text(`   Doctor: ${activity.doctorName}`, margin + 5, currentY + 8);
            if (activity.stepName && activity.stepNumber) {
              doc.text(`   Step: ${activity.stepNumber}: ${activity.stepName}`, margin + 5, currentY + 12);
              currentY += 3;
            }
              currentY += 3;
          }
            currentY += 12;
        });

          // Process thumbnail activities
          let thumbnailIndex = activityChartData.rawData.userActivities.length;
          activityChartData.rawData.thumbnailActivities.forEach((activity) => {
        if (currentY > pageHeight - margin - 30) {
          doc.addPage();
              currentY = margin;
        }

          const timestamp = new Date(activity.timestamp).toLocaleString();
        doc.setFont('helvetica', 'bold');
            doc.text(`${thumbnailIndex + 1}. ${getThumbnailActivityDisplayText(activity)}`, margin, currentY);
        doc.setFont('helvetica', 'normal');
            doc.text(`   Time: ${timestamp}`, margin + 5, currentY + 4);

          if (activity.doctorName) {
            doc.text(`   Doctor: ${activity.doctorName}`, margin + 5, currentY + 8);
              currentY += 3;
          }
            currentY += 12;
            thumbnailIndex++;
        });

          // Process schedule activities
          let scheduleIndex = activityChartData.rawData.userActivities.length + activityChartData.rawData.thumbnailActivities.length;
          activityChartData.rawData.scheduleActivities.forEach((activity) => {
        if (currentY > pageHeight - margin - 30) {
          doc.addPage();
              currentY = margin;
        }

          const timestamp = new Date(activity.timestamp).toLocaleString();
        doc.setFont('helvetica', 'bold');
            doc.text(`${scheduleIndex + 1}. ${getScheduleActivityDisplayText(activity)}`, margin, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(`   Time: ${timestamp}`, margin + 5, currentY + 4);

          if (activity.doctorName) {
            doc.text(`   Doctor: ${activity.doctorName}`, margin + 5, currentY + 8);
            if (activity.stepName && activity.stepNumber) {
              doc.text(`   Step: ${activity.stepNumber}: ${activity.stepName}`, margin + 5, currentY + 12);
              currentY += 3;
            }
            currentY += 3;
          }
            currentY += 12;
            scheduleIndex++;
          });
        } else {
          doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
          doc.setTextColor(59, 130, 246); // Blue
          doc.text('General Activities History:', margin, currentY);
        currentY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
          doc.setTextColor(107, 114, 128);
          doc.text('No Activity Found', margin, currentY);
          currentY += 10;
          doc.setFontSize(9);
          doc.text('This user has not performed any activities yet.', margin, currentY);
          currentY += 20;
        }

        // Activity Summary Statistics
        if (currentY > pageHeight - 50) {
                doc.addPage();
          currentY = margin;
        }

        drawSectionHeader('Activity Statistics Summary', currentY);
        currentY += 15;

        // Create a comprehensive statistics table
        const statsHeaders = ['Activity Type', 'Total Count', 'Percentage of Total'];
        const totalActivities = activityChartData.totalActivities;
        
        const statsData = [
          ['General Activities', activityChartData.userChart.total, `${Math.round((activityChartData.userChart.total / totalActivities) * 100)}%`]
        ];

        const statsColors = ['#3b82f6'];
        currentY = drawTable(statsHeaders, statsData, currentY, statsColors);

        // Footer
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128);
        doc.text('Generated by HCV Portal System', margin, footerY);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, footerY, { align: 'right' });

                 // Download PDF
        doc.save(`employee-activity-report-${activityChartData.user?.username || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`);
       }).catch(error => {
         console.error('Error loading jsPDF:', error);
         alert('PDF generation failed. Please try again.');
       });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button 
          onClick={refreshData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Weekly Data</h1>
              <p className="text-gray-600 mt-1">Monitor active employees' activities and assigned schedule completion data</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={refreshData}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                <p className="text-xs text-gray-500 mt-1">active employees</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Currently Active</p>
                <p className="text-3xl font-bold text-green-600">{users.length}</p>
                <p className="text-xs text-gray-500 mt-1">Active employees</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Active Employees
            </label>
            <input
              type="text"
              placeholder="Search active employees by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
        </div>
      </div>

      {/* Users Table */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
           <table className="min-w-full">
             <thead className="bg-gray-25 border-b border-gray-100">
              <tr>
                 <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700">
                   Employee
                </th>
                 <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700">
                   Activity
                </th>
                 <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
             <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                 <tr key={user.id} className="hover:bg-gray-25 transition-all duration-200">
                   <td className="px-8 py-6">
                     <div className="flex items-center space-x-4">
                       <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                         <span className="text-white font-semibold text-lg">
                           {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-base font-semibold text-gray-900 truncate">
                          {user.name}
                        </div>
                         {/* <div className="text-sm text-gray-500 mt-1">
                          @{user.username}
                         </div> */}
                         <div className="text-sm text-gray-400 mt-1 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                   <td className="px-8 py-6">
                     <div className="flex flex-col space-y-2">
                       {/* General Activity - Simple */}
                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                         </svg>
                             <span className="text-sm font-semibold text-blue-800">Activity</span>
                           </div>
                       <button
                             onClick={() => viewUserActivity(user.id, user.username)}
                             className="text-blue-600 hover:text-blue-800 text-xs"
                           >
                             View Details →
                       </button>
                         </div>
                       </div>
                     </div>
                   </td>
                                       <td className="px-8 py-6">
                      <div className="flex justify-center">
                                                 <div className="flex flex-col space-y-2">
                                                       <button 
                              onClick={() => handleDownloadActivityChart(user)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-all duration-200 hover:shadow-sm border border-blue-100"
                              title="Download Activity Report"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Download Report
                            </button>

                            <button 
                              onClick={() => handleDateRangeReport(user)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-all duration-200 hover:shadow-sm border border-green-100"
                              title="Download Report by Date Range"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Date Range Report
                            </button>

                         </div>
                      </div>
                  </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
        
                 {filteredUsers.length === 0 && (
           <div className="text-center py-16">
             <div className="text-gray-400 text-lg font-medium">
               No active employees found
             </div>
             <div className="text-gray-400 text-sm mt-2">
               Try adjusting your search criteria or check if users are activated
             </div>
           </div>
         )}
      </div>

      {/* User Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                User Activity: {selectedUserForActivity?.username}
              </h2>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedUserActivities.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                 </svg>
             </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
                    <p className="text-gray-500 mb-4">This user has not performed any activities yet.</p>
                    <div className="text-sm text-gray-400">
                      <p>Activities include:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• Login and logout actions</li>
                        <li>• Page navigation</li>
                        <li>• Dashboard access</li>
                        <li>• Other user interactions</li>
                      </ul>
               </div>
                </div>
              ) : (
                  selectedUserActivities.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      {activity.action === 'No activity performed' ? (
                    <div className="text-center py-8">
                          <span className="text-xl font-bold text-gray-600">{activity.action}</span>
                    </div>
                  ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-blue-600">
                              {activity.action.startsWith('thumbnail_') ? 
                                getThumbnailActivityDisplayText(activity) : 
                                (activity.action.startsWith('schedule_') || activity.action.startsWith('workflow_')) ?
                                getScheduleActivityDisplayText(activity) :
                                activity.action === 'page_navigation' ?
                                getPageNavigationDisplayText(activity) :
                                activity.action
                              }
                              </span>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                            {activity.action.startsWith('thumbnail_') && activity.doctorName && (
                              <div className="mt-2 text-sm text-gray-700">
                                <strong>Doctor:</strong> {activity.doctorName}
                              </div>
                            )}
                            {activity.action === 'page_navigation' && (activity.details?.fromPage || activity.details?.toPage) && (
                              <div className="mt-2 text-sm text-gray-700">
                                <strong>From:</strong> {activity.details?.fromPage || activity.details?.from || 'Unknown Page'}
                                <div className="mt-1">
                                  <strong>To:</strong> {activity.details?.toPage || activity.details?.to || 'Unknown Page'}
                                    </div>
                                    </div>
                                  )}
                            {(activity.action.startsWith('schedule_') || activity.action.startsWith('workflow_')) && activity.doctorName && (
                              <div className="mt-2 text-sm text-gray-700">
                                <strong>Doctor:</strong> {activity.doctorName}
                                {activity.stepName && activity.stepNumber && (
                                  <div className="mt-1">
                                    <strong>Step:</strong> {activity.stepNumber}: {activity.stepName}
                                    </div>
                                  )}
                                    </div>
                                  )}
                                </div>
                            <span className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleDateString()}
                            </span>
                              </div>
                      )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}



        {/* View User Modal */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">User Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                    </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="text-sm text-gray-900">@{selectedUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{selectedUser.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Schedules</label>
                  <p className="text-sm text-gray-900">{selectedUser.totalSchedules}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completed Schedules</label>
                  <p className="text-sm text-gray-900">{selectedUser.completedSchedules}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weekly Hours</label>
                  <p className="text-sm text-gray-900">{selectedUser.weeklyHours} hrs</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                    </button>
        </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit User</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editFormData.username || ''}
                    onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={crudLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {crudLoading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-600">Delete User</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
      </div>
              
              <div className="mb-4">
                <p className="text-gray-700">
                  Are you sure you want to delete <strong>{selectedUser.name}</strong> (@{selectedUser.username})?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone. All user data will be permanently removed.
                </p>
    </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUserConfirm}
                  disabled={crudLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {crudLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}

                 {/* Download Activity Chart Modal */}
         {showDownloadModal && activityChartData && activityChartData.user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Activity Report
                </h2>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

                             <div className="mb-6">
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-blue-800 mb-2">
                     {activityChartData.user?.name || 'Unknown User'} (@{activityChartData.user?.username || 'unknown'})
                   </h3>
                   <p className="text-blue-700">
                     Total Activities: <span className="font-bold">{activityChartData.totalActivities}</span> | 
                     Generated: <span className="font-medium">{new Date(activityChartData.timestamp).toLocaleString()}</span>
                   </p>
                 </div>
               </div>

                             {/* General Activity Chart Preview */}
               <div className="mb-6">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Chart Preview</h3>
                 <div className="flex justify-center">
                   {/* General Activity Chart */}
                   <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                     <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">👤 General Activities</h4>
                     {activityChartData.userChart.data.length > 0 ? (
                     <div className="flex items-center justify-center">
                       <div className="relative">
                         <div className="w-32 h-32 relative">
                           {activityChartData.userChart.data.map((item, index) => {
                             const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                             const color = colors[index % colors.length];
                             const percentage = item.percentage;
                             const rotation = index === 0 ? 0 : 
                               activityChartData.userChart.data.slice(0, index).reduce((sum, prevItem) => sum + (prevItem.percentage / 100) * 360, 0);
                             
                             return (
                               <div
                                 key={item.category}
                                 className="absolute inset-0 rounded-full border-2 border-white"
                                 style={{
                                   background: `conic-gradient(${color} 0deg ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`,
                                   transform: `rotate(${rotation}deg)`
                                 }}
                               />
                             );
                           })}
                         </div>
                       </div>
                     </div>
                     ) : (
                       <div className="flex items-center justify-center py-8">
                         <div className="text-center">
                           <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                             <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                             </svg>
                           </div>
                           <p className="text-gray-500 text-sm">No Activity</p>
                         </div>
                       </div>
                     )}
                     <div className="mt-3 text-center">
                       <div className="text-lg font-bold text-blue-600">{activityChartData.userChart.total}</div>
                       <div className="text-xs text-gray-500">Total Activities</div>
                     </div>
                   </div>
                 </div>
               </div>

                             {/* Activity Breakdown - General Activities Only */}
               <div className="mb-6">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Breakdown</h3>
                 
                 {/* General Activities Breakdown */}
                 <div className="mb-6">
                   <h4 className="text-md font-semibold text-blue-700 mb-3">👤 General Activities</h4>
                   {activityChartData.userChart.data.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {activityChartData.userChart.data.map((item, index) => {
                       const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                       const color = colors[index % colors.length];
                       
                       return (
                         <div key={item.category} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                               <div 
                                 className="w-3 h-3 rounded-full"
                                 style={{ backgroundColor: color }}
                               ></div>
                               <span className="font-medium text-blue-800 text-sm">{item.category}</span>
                             </div>
                             <div className="text-right">
                               <div className="text-md font-bold text-blue-900">{item.count}</div>
                               <div className="text-xs text-blue-600">{item.percentage}%</div>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   ) : (
                     <div className="text-center py-8">
                       <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                         <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                         </svg>
                       </div>
                       <p className="text-gray-500 text-sm">No Activity</p>
                     </div>
                   )}
                 </div>

               </div>

                             {/* Download Options */}
               <div className="flex justify-center gap-4">
                 <button
                   onClick={downloadChartAsImage}
                   className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   Download as PNG Image
                 </button>
                 <button
                   onClick={downloadChartAsPDF}
                   className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                   </svg>
                   Download as PDF
                 </button>
                 <button
                   onClick={() => setShowDownloadModal(false)}
                   className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                 >
                   Close
                 </button>
               </div>
            </div>
          </div>
                 )}

        {/* Date Range Modal */}
        {showDateRangeModal && selectedUserForDateRange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Select Date Range for Report
                </h2>
                <button
                  onClick={() => setShowDateRangeModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    {selectedUserForDateRange.name} (@{selectedUserForDateRange.username})
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Select start and end dates to generate a custom activity report
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={endDate || undefined}
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={startDate || undefined}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDateRangeModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateDateRangeReport}
                  disabled={!startDate || !endDate || dateRangeLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center gap-2"
                >
                  {dateRangeLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}


     </div>
  </div>
);
};

export default UsersPage;
