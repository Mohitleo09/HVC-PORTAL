'use client';
import { useState, useEffect } from 'react';

const UsersPage = () => {
     const [users, setUsers] = useState([]);
   const [loading, setLoading] = useState(false);
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
              //  department: user.department || 'General',
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
    
    // Try to get doctor name from various possible fields with more comprehensive search
    let doctorName = activity.doctorName || 
                    activity.doctor?.name || 
                    activity.doctor?.doctorName ||
                    activity.details?.doctorName ||
                    activity.details?.doctor?.name ||
                    activity.metadata?.doctorName ||
                    activity.data?.doctorName ||
                    activity.doctorName ||
                    activity.doctor?.fullName ||
                    activity.doctor?.displayName ||
                    activity.doctor?.title ||
                    activity.doctor?.firstName + ' ' + activity.doctor?.lastName ||
                    activity.doctor?.first_name + ' ' + activity.doctor?.last_name;
    
    // Clean up the doctor name if it exists
    if (doctorName && doctorName.trim() && doctorName !== 'null' && doctorName !== 'undefined') {
      doctorName = doctorName.trim();
    } else {
      doctorName = null;
    }
    
    // If still no doctor name, try to extract from other fields
    if (!doctorName) {
      // Check if there's a doctor ID that we can use
      const doctorId = activity.doctorId || activity.doctor?.id || activity.details?.doctorId;
      if (doctorId && doctorId !== 'null' && doctorId !== 'undefined') {
        doctorName = `Doctor ID: ${doctorId}`;
      } else {
        doctorName = 'Unknown Doctor';
      }
    }
    
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
    
    // Try to get doctor name from various possible fields
    let doctorName = activity.doctorName || 
                    activity.doctor?.name || 
                    activity.doctor?.doctorName ||
                    activity.details?.doctorName ||
                    activity.details?.doctor?.name ||
                    activity.metadata?.doctorName ||
                    activity.data?.doctorName;
    
    // If still no doctor name, try to extract from other fields
    if (!doctorName) {
      // Check if there's a doctor ID that we can use
      const doctorId = activity.doctorId || activity.doctor?.id || activity.details?.doctorId;
      if (doctorId) {
        doctorName = `Doctor ID: ${doctorId}`;
      } else {
        doctorName = 'Unknown Doctor';
      }
    }
    
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
      
      console.log('🔍 Fetching user activities for:', username, 'ID:', userId);
      
      // Fetch from both user-activity and thumbnail-activity endpoints, and doctors for enrichment
      const [userResponse, thumbnailResponse, doctorsResponse] = await Promise.all([
        fetch(`/api/user-activity?userId=${userId}&username=${username}&limit=200`),
        fetch(`/api/thumbnail-activity?userId=${userId}&username=${username}&limit=200`),
        fetch('/api/doctors')
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
        const thumbnailSpecificActivities = (thumbnailData.activities || []).filter(activity => {
          const matchesUserId = activity.userId === userId || activity.userId === String(userId);
          const matchesUsername = activity.username === username || activity.username === String(username);
          return matchesUserId || matchesUsername;
        });
        allActivities = [...allActivities, ...thumbnailSpecificActivities];
        console.log('📊 Thumbnail activities found:', thumbnailSpecificActivities.length);
      }

      // Build doctor map for enrichment
      let doctorIdToName = {};
      try {
        if (doctorsResponse && doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json();
          const list = doctorsData.doctors || [];
          list.forEach(d => {
            const id = d._id || d.id;
            if (id) doctorIdToName[id] = d.name || d.fullName || d.displayName || d.title || '';
          });
        }
      } catch (e) {
        console.warn('Doctor enrichment skipped due to error:', e);
      }

      // Enrich thumbnail activities with missing doctorName
      allActivities = allActivities.map(activity => {
        const action = String(activity.action || '').toLowerCase();
        if (action.startsWith('thumbnail_')) {
          const currentName = activity.doctorName && String(activity.doctorName).trim();
          const doctorFromObj = activity.doctor && (activity.doctor.name || activity.doctor.doctorName || activity.doctor.fullName || activity.doctor.displayName || activity.doctor.title);
          const did = activity.doctorId || (activity.doctor && activity.doctor.id) || (activity.details && activity.details.doctorId);
          if (!currentName || currentName === 'Unknown Doctor') {
            if (doctorFromObj) {
              activity.doctorName = doctorFromObj;
            } else if (did && doctorIdToName[did]) {
              activity.doctorName = doctorIdToName[did];
            }
          }
        }
        return activity;
      });
      
      // Enhanced deduplication across sources and noisy events
      const uniqueActivities = [];
      const seenStrict = new Set();
      const seenPerMinute = new Set(); // for dashboard_access collapsing
      const seenThumbDeletePerMinute = new Set(); // collapse repeated thumbnail deletes per doctor per minute

      const roundToGranularity = (date, granularity) => {
        const d = new Date(date);
        if (granularity === 'minute') {
          d.setSeconds(0, 0);
        } else if (granularity === 'second') {
          d.setMilliseconds(0);
        }
        return d.getTime();
      };

      const getActor = (a) => a.userId || a.username || a.user?.id || a.user?.username || 'unknown';
      const getDoctorRef = (a) => a.doctorId || a.doctor?.id || a.details?.doctorId || a.doctorName || a.details?.doctorName || '';
      const getResourceRef = (a) => a.thumbnailId || a.details?.thumbnailId || a.workflowId || a.details?.workflowId || '';

      const buildKey = (a, granularity = 'second') => {
        const t = roundToGranularity(a.timestamp, granularity);
        const actor = getActor(a);
        const doctorRef = getDoctorRef(a);
        const resourceRef = getResourceRef(a);
        return `${a.action}|${actor}|${doctorRef}|${resourceRef}|${t}`;
      };

      for (const activity of allActivities) {
        const action = String(activity.action || '').toLowerCase();

        // Skip thumbnail activities with no identifiable doctor (would render as "Unknown Doctor")
        if (action.startsWith('thumbnail_')) {
          const hasDoctorName = Boolean(
            activity.doctorName ||
            (activity.doctor && (activity.doctor.name || activity.doctor.doctorName || activity.doctor.fullName || activity.doctor.displayName)) ||
            (activity.details && (activity.details.doctorName || (activity.details.doctor && activity.details.doctor.name)))
          );
          const hasDoctorRef = Boolean(getDoctorRef(activity));
          if (!hasDoctorName && !hasDoctorRef) {
            continue;
          }
        }

        // Collapse dashboard_access to one per minute per actor
        if (action === 'dashboard_access') {
          const minuteKey = buildKey(activity, 'minute');
          if (seenPerMinute.has(minuteKey)) continue;
          seenPerMinute.add(minuteKey);
          uniqueActivities.push(activity);
          continue;
        }

        // Collapse repeated thumbnail delete events per doctor per minute
        if (action.startsWith('thumbnail_') && action.includes('delete')) {
          const actor = getActor(activity);
          const doctorRef = getDoctorRef(activity);
          const tMinute = roundToGranularity(activity.timestamp, 'minute');
          const minuteKey = `thumbnail_delete|${actor}|${doctorRef}|${tMinute}`;
          if (seenThumbDeletePerMinute.has(minuteKey)) continue;
          seenThumbDeletePerMinute.add(minuteKey);
          uniqueActivities.push(activity);
          continue;
        }

        // Collapse duplicate delete events that can come from multiple sources (non-thumbnail)
        if (action.includes('delete')) {
          const deleteKey = buildKey(activity, 'second');
          if (seenStrict.has(deleteKey)) continue;
          seenStrict.add(deleteKey);
          uniqueActivities.push(activity);
          continue;
        }

        // Default dedup (strict)
        const strictKey = buildKey(activity, 'second');
        if (seenStrict.has(strictKey)) continue;
        seenStrict.add(strictKey);
        uniqueActivities.push(activity);
      }
      
      // Sort by timestamp (newest first)
      uniqueActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log('📊 Total activities found:', allActivities.length);
      console.log('📊 Unique activities:', uniqueActivities.length);
      
      // Debug: Check for dashboard_access duplicates
      const dashboardActivities = allActivities.filter(a => a.action === 'dashboard_access');
      console.log('🔍 Dashboard access activities:', dashboardActivities.map(a => ({
        action: a.action,
        timestamp: a.timestamp,
        userId: a.userId,
        username: a.username,
        source: a.source || 'unknown'
      })));
      
      if (uniqueActivities.length === 0) {
        const placeholderActivity = {
          action: 'No activity performed',
          timestamp: new Date(),
          details: {}
        };
        setSelectedUserActivities([placeholderActivity]);
      } else {
        setSelectedUserActivities(uniqueActivities);
      }
      
      setShowActivityModal(true);
    } catch (error) {
      console.error('Error fetching user activities:', error);
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
      // department: user.department,
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

    // Create canvas for chart with better dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1400;
    canvas.height = 1000;

    // Helper function to draw rounded rectangle
    const drawRoundedRect = (x, y, width, height, radius, fillColor, strokeColor = null) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      
      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    // Helper function to draw shadow
    const drawShadow = (x, y, width, height, radius) => {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      drawRoundedRect(x, y, width, height, radius, '#ffffff');
      ctx.restore();
    };

    // Set background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header section with shadow
    drawShadow(50, 30, canvas.width - 100, 120, 20);
    drawRoundedRect(50, 30, canvas.width - 100, 120, 20, '#ffffff', '#e2e8f0');

    // Header content
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Employee Activity Report', canvas.width / 2, 70);

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${activityChartData.user?.name || 'Unknown User'}`, canvas.width / 2, 100);

    ctx.fillStyle = '#6b7280';
    ctx.font = '18px Arial';
    ctx.fillText(`@${activityChartData.user?.username || 'unknown'} • Generated ${new Date(activityChartData.timestamp).toLocaleDateString()}`, canvas.width / 2, 125);

    // Employee info cards
    const cardY = 180;
    const cardWidth = (canvas.width - 150) / 3;
    const cardHeight = 100;

    // Card 1: Total Activities
    drawShadow(50, cardY, cardWidth, cardHeight, 15);
    drawRoundedRect(50, cardY, cardWidth, cardHeight, 15, '#ffffff', '#e2e8f0');
    
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(activityChartData.totalActivities.toString(), 50 + cardWidth/2, cardY + 45);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.fillText('Total Activities', 50 + cardWidth/2, cardY + 70);

    // Card 2: Login Activities
    const loginCount = activityChartData.userChart.data.find(item => item.category === 'Login')?.count || 0;
    drawShadow(50 + cardWidth + 25, cardY, cardWidth, cardHeight, 15);
    drawRoundedRect(50 + cardWidth + 25, cardY, cardWidth, cardHeight, 15, '#ffffff', '#e2e8f0');
    
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(loginCount.toString(), 50 + cardWidth + 25 + cardWidth/2, cardY + 45);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.fillText('Login Sessions', 50 + cardWidth + 25 + cardWidth/2, cardY + 70);

    // Card 3: Navigation Activities
    const navCount = activityChartData.userChart.data.find(item => item.category === 'Page Navigation')?.count || 0;
    drawShadow(50 + (cardWidth + 25) * 2, cardY, cardWidth, cardHeight, 15);
    drawRoundedRect(50 + (cardWidth + 25) * 2, cardY, cardWidth, cardHeight, 15, '#ffffff', '#e2e8f0');
    
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(navCount.toString(), 50 + (cardWidth + 25) * 2 + cardWidth/2, cardY + 45);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.fillText('Page Views', 50 + (cardWidth + 25) * 2 + cardWidth/2, cardY + 70);

    // Chart section
    const chartY = cardY + cardHeight + 60;
    const chartWidth = canvas.width - 100;
    const chartHeight = 400;

    drawShadow(50, chartY, chartWidth, chartHeight, 20);
    drawRoundedRect(50, chartY, chartWidth, chartHeight, 20, '#ffffff', '#e2e8f0');

    // Chart title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Activity Distribution', canvas.width / 2, chartY + 40);

    // Draw modern donut chart
    const centerX = canvas.width / 2;
    const centerY = chartY + chartHeight / 2 + 20;
    const outerRadius = 140;
    const innerRadius = 80;

    let currentAngle = -Math.PI / 2;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    
    activityChartData.userChart.data.forEach((item, index) => {
      const sliceAngle = (item.count / activityChartData.userChart.total) * 2 * Math.PI;
      
      // Outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Add subtle highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      currentAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(activityChartData.userChart.total.toString(), centerX, centerY - 10);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.fillText('Total', centerX, centerY + 15);

    // Legend section
    const legendY = chartY + chartHeight - 80;
    const legendStartX = 100;
    const legendItemHeight = 25;

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Activity Breakdown', legendStartX, legendY);

    let legendItemY = legendY + 30;
    activityChartData.userChart.data.forEach((item, index) => {
      const color = colors[index % colors.length];
      
      // Legend item background
      drawRoundedRect(legendStartX, legendItemY - 15, 300, legendItemHeight, 8, '#f8fafc', '#e2e8f0');
      
      // Color indicator
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(legendStartX + 15, legendItemY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Text
      ctx.fillStyle = '#374151';
      ctx.font = '16px Arial';
      ctx.fillText(item.category, legendStartX + 35, legendItemY + 5);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.count} (${item.percentage}%)`, legendStartX + 280, legendItemY + 5);
      
      ctx.textAlign = 'left';
      legendItemY += legendItemHeight + 10;
    });

    // Footer
    const footerY = canvas.height - 60;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by HCV Portal System', canvas.width / 2, footerY);
    ctx.fillText(new Date().toLocaleString(), canvas.width / 2, footerY + 20);

    // Convert to image and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee-activity-report-${activityChartData.user?.username || 'unknown'}-${new Date().toISOString().split('T')[0]}.png`;
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
          
          // Try to get doctor name from various possible fields with more comprehensive search
          let doctorName = activity.doctorName || 
                          activity.doctor?.name || 
                          activity.doctor?.doctorName ||
                          activity.details?.doctorName ||
                          activity.details?.doctor?.name ||
                          activity.metadata?.doctorName ||
                          activity.data?.doctorName ||
                          activity.doctorName ||
                          activity.doctor?.fullName ||
                          activity.doctor?.displayName ||
                          activity.doctor?.title ||
                          activity.doctor?.firstName + ' ' + activity.doctor?.lastName ||
                          activity.doctor?.first_name + ' ' + activity.doctor?.last_name;
          
          // Clean up the doctor name if it exists
          if (doctorName && doctorName.trim() && doctorName !== 'null' && doctorName !== 'undefined') {
            doctorName = doctorName.trim();
          } else {
            doctorName = null;
          }
          
          // If still no doctor name, try to extract from other fields
          if (!doctorName) {
            // Check if there's a doctor ID that we can use
            const doctorId = activity.doctorId || activity.doctor?.id || activity.details?.doctorId;
            if (doctorId && doctorId !== 'null' && doctorId !== 'undefined') {
              doctorName = `Doctor ID: ${doctorId}`;
            } else {
              doctorName = 'Unknown Doctor';
            }
          }
          
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
          
          // Try to get doctor name from various possible fields
          let doctorName = activity.doctorName || 
                          activity.doctor?.name || 
                          activity.doctor?.doctorName ||
                          activity.details?.doctorName ||
                          activity.details?.doctor?.name ||
                          activity.metadata?.doctorName ||
                          activity.data?.doctorName;
          
          // If still no doctor name, try to extract from other fields
          if (!doctorName) {
            // Check if there's a doctor ID that we can use
            const doctorId = activity.doctorId || activity.doctor?.id || activity.details?.doctorId;
            if (doctorId) {
              doctorName = `Doctor ID: ${doctorId}`;
            } else {
              doctorName = 'Unknown Doctor';
            }
          }
          
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
          // Header background with gradient effect
          doc.setFillColor(30, 64, 175); // Deep blue background
          doc.rect(0, 0, pageWidth, 35, 'F');
          
          // Company/System name
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text('HCV PORTAL', margin, 15);

          // Report title
          doc.setFontSize(16);
          doc.setFont('helvetica', 'normal');
          doc.text('Employee Activity Report', pageWidth - margin, 15, { align: 'right' });
          
          // Subtitle
          doc.setFontSize(12);
          doc.text('Professional Activity Analysis', pageWidth - margin, 25, { align: 'right' });
          
          // Reset text color
          doc.setTextColor(0, 0, 0);
        };

        // Helper function to draw a clean section header
        const drawSectionHeader = (title, y) => {
          // Section background with subtle border
          doc.setFillColor(248, 250, 252); // Light gray background
          doc.rect(margin, y - 8, contentWidth, 16, 'F');
          
          // Left accent line
          doc.setFillColor(59, 130, 246); // Blue accent
          doc.rect(margin, y - 8, 4, 16, 'F');
          
          // Section title
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55); // Dark gray text
          doc.text(title, margin + 8, y + 2);
          
          // Reset text color
          doc.setTextColor(0, 0, 0);
        };

        // Helper function to draw a clean card
        const drawCard = (title, data, y, color) => {
          const cardHeight = 40;
          const cardWidth = contentWidth / 3 - 8;
          
          // Card background with shadow effect
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240); // Light border
          doc.rect(margin + 1, y + 1, cardWidth, cardHeight, 'FD'); // Shadow
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, y, cardWidth, cardHeight, 'FD'); // Main card
          
          // Card title
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99); // Gray text
          doc.text(title, margin + 8, y + 10);
          
          // Card data
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(color.r, color.g, color.b);
          doc.text(data.toString(), margin + 8, y + 25);
          
          // Card subtitle
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128); // Light gray
          doc.text('Total Activities', margin + 8, y + 35);
          
          return cardWidth + 8;
        };

        // Helper function to draw a clean table
        const drawTable = (headers, data, y, colors) => {
          const tableWidth = contentWidth;
          const colWidth = tableWidth / headers.length;
          const rowHeight = 10;
          
          // Table header background with accent
          doc.setFillColor(59, 130, 246); // Blue header
          doc.rect(margin, y, tableWidth, rowHeight, 'F');
          
          // Table header text
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255); // White text on blue
          
          headers.forEach((header, index) => {
            doc.text(header, margin + (index * colWidth) + 4, y + 6);
          });
          
          // Table data
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          
          data.forEach((row, rowIndex) => {
            const currentY = y + rowHeight + (rowIndex * rowHeight);
            
            // Alternate row background
            if (rowIndex % 2 === 0) {
              doc.setFillColor(248, 250, 252);
              doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
            }
            
            // Color indicator for first column
            if (colors && colors[rowIndex]) {
              const color = hexToRgb(colors[rowIndex]);
              if (color) {
                doc.setFillColor(color.r, color.g, color.b);
                doc.rect(margin + 2, currentY + 2, 4, 4, 'F');
              }
            }
            
            // Table data
            row.forEach((cell, colIndex) => {
              doc.text(cell.toString(), margin + (colIndex * colWidth) + 4, currentY + 6);
            });
          });
          
          // Table border
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, y, tableWidth, rowHeight + (data.length * rowHeight), 'S');
          
          return y + rowHeight + (data.length * rowHeight) + 15;
        };

        // Start building the PDF
        drawHeader();
        
        let currentY = 45;

        // Employee Information Section
        drawSectionHeader('Employee Information', currentY);
        currentY += 20;
        
        // Employee info in a more organized layout
        const infoData = [
          ['Name', activityChartData.user?.name || 'Unknown User'],
          // ['Username', `@${activityChartData.user?.username || 'unknown'}`],
          ['Email', activityChartData.user?.email || 'N/A'],
          // ['Department', activityChartData.user?.department || 'General'],
          ['Report Generated', new Date(activityChartData.timestamp).toLocaleString()]
        ];
        
        infoData.forEach(([label, value]) => {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(55, 65, 81);
          doc.text(`${label}:`, margin, currentY);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(value, margin + 35, currentY);
          
          currentY += 7;
        });
        
        currentY += 15;

        // Activity Summary Cards
        drawSectionHeader('Activity Summary', currentY);
        currentY += 20;

        // Create multiple summary cards
        const summaryCards = [
          { title: 'Total Activities', value: activityChartData.userChart.total, color: '#3b82f6' },
          { title: 'Login Sessions', value: activityChartData.userChart.data.find(item => item.category === 'Login')?.count || 0, color: '#10b981' },
          { title: 'Page Views', value: activityChartData.userChart.data.find(item => item.category === 'Page Navigation')?.count || 0, color: '#f59e0b' }
        ];
        
        summaryCards.forEach((card, index) => {
          const cardColor = hexToRgb(card.color);
          const cardX = margin + (index * (contentWidth / 3 + 8));
          drawCard(card.title, card.value, currentY, cardColor);
        });
        
        currentY += 50;

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
        const footerY = pageHeight - 20;
        
        // Footer line
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('Generated by HCV Portal System', margin, footerY);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, footerY, { align: 'right' });
        
        // Add generation timestamp
        doc.setFontSize(8);
        doc.text(`Generated on ${new Date().toLocaleString()}`, margin, footerY + 8);

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
        <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50">
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
                    <div key={`${activity.action}_${activity.timestamp}_${index}`} className="border border-gray-200 rounded-lg p-4">
                      {activity.action === 'No activity performed' ? (
                    <div className="text-center py-8">
                          <span className="text-xl font-bold text-gray-600">{activity.action}</span>
                    </div>
                  ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
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
                            
                            {/* Only show additional details if they provide extra information not already in the main text */}
                            {activity.action === 'page_navigation' && (activity.details?.fromPage || activity.details?.toPage) && (
                              <div className="mt-2 text-sm text-gray-700">
                                <strong>From:</strong> {activity.details?.fromPage || activity.details?.from || 'Unknown Page'}
                                <div className="mt-1">
                                  <strong>To:</strong> {activity.details?.toPage || activity.details?.to || 'Unknown Page'}
                                    </div>
                                    </div>
                                  )}
                            
                            {/* Only show step details for schedule activities if step info exists */}
                            {(activity.action.startsWith('schedule_') || activity.action.startsWith('workflow_')) && 
                             activity.stepName && activity.stepNumber && (
                              <div className="mt-2 text-sm text-gray-700">
                                <strong>Step:</strong> {activity.stepNumber}: {activity.stepName}
                              </div>
                            )}
                          </div>
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
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
