"use client";
import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RolesPermission() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyAddedUser, setNewlyAddedUser] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedUserActivities, setSelectedUserActivities] = useState([]);
  const [selectedUserSchedules, setSelectedUserSchedules] = useState([]);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add keyboard shortcut for fast refresh
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+R or F5 for fast refresh
      if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
        event.preventDefault();
        if (!refreshing) {
          fastRefresh();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshing]);

  const fetchUsers = async (isFastRefresh = false) => {
    try {
      if (isFastRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const startTime = Date.now();
      const response = await fetch("/api/users", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
            let users = data.success && Array.isArray(data.users) ? data.users : [];
    
    // Sort users: admin first, then regular users
    users.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return 0;
    });
    
    setUsers(users);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Users fetched in ${duration}ms (${users.length} users)`);
        console.log('📋 Current users in database:', users);
        
        if (isFastRefresh) {
          setLastRefreshTime(duration);
          toast.success(`Refreshed in ${duration}ms`);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch users:', errorData);
        setUsers([]);
        if (isFastRefresh) {
          toast.error(`Failed to refresh users: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      if (isFastRefresh) {
        toast.error('Network error during refresh');
      }
    } finally {
      if (isFastRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Fast refresh function
  const fastRefresh = () => {
    fetchUsers(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('🚀 Submitting user data:', { 
        username: formData.username, 
        email: formData.email, 
        role: formData.role,
        passwordLength: formData.password.length 
      });
      
      // Test database connection first
      console.log('🔍 Testing database connection...');
      try {
        const testResponse = await fetch("/api/users", {
          method: "HEAD",
        });
        console.log('📡 Database test response:', testResponse.status);
      } catch (testError) {
        console.error('❌ Database connection test failed:', testError);
        toast.error('Database connection failed. Please check your configuration.');
        return;
      }
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        }),
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        const newUser = result.user || result;
        console.log('✅ User created successfully:', newUser);
        toast.success(`User "${newUser.username}" created successfully! They can now log in with their email and password.`);
        setShowAddModal(false);
        resetForm();
        
        // Set newly added user for highlighting
        setNewlyAddedUser(newUser._id);
        
        // Remove highlight after 5 seconds
        setTimeout(() => setNewlyAddedUser(null), 5000);
        
        fetchUsers();
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        const errorMessage = errorData.error || "Failed to create user";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("❌ Network/Client Error:", error);
      toast.error(`Network error: ${error.message}. Please check your connection and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          updates: {
            username: formData.username,
            email: formData.email,
            role: formData.role
          }
        }),
      });

      if (response.ok) {
        toast.success("User updated successfully!");
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ username: '', email: '', password: '', role: 'user' });
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("User deleted successfully!");
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleStatusChange = async (userId, newStatus, username) => {
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    const confirmMessage = `Are you sure you want to ${action} user "${username}"?`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          updates: { status: newStatus }
        }),
      });

      if (response.ok) {
        toast.success(`User "${username}" ${action}d successfully!`);
        if (newStatus === 'deactivated') {
          toast.info("Deactivated users will not be able to access their dashboard until reactivated.");
        }
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', confirmPassword: '', role: 'user' });
    setFormErrors({});
    setSelectedUser(null);
  };

  const viewUserActivity = async (userId, username) => {
    try {
      setActivityLoading(true);
      setSelectedUserForActivity({ userId, username });
      
      const response = await fetch(`/api/user-activity?userId=${userId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUserActivities(data.activities || []);
        setShowActivityModal(true);
      } else {
        toast.error('Failed to fetch user activities');
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
      toast.error('Failed to fetch user activities');
    } finally {
      setActivityLoading(false);
    }
  };

  const viewScheduleActivity = async (userId, username) => {
    try {
      setActivityLoading(true);
      setSelectedUserForActivity({ userId, username });
      
      const response = await fetch(`/api/schedule-activity?userId=${userId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUserSchedules(data.activities || []);
        setShowScheduleModal(true);
      } else {
        toast.error('Failed to fetch schedule activities');
      }
    } catch (error) {
      console.error('Error fetching schedule activities:', error);
      toast.error('Failed to fetch schedule activities');
    } finally {
      setActivityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permission</h1>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
            {loading ? 'Loading users...' : `${users.length} user${users.length !== 1 ? 's' : ''} in system`}
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-blue-600">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            )}
            {lastRefreshTime && !refreshing && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Last refresh: {lastRefreshTime}ms
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          {/* <button
            onClick={fastRefresh}
            disabled={refreshing}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            title="Fast refresh users (Ctrl+R or F5)"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Fast Refresh
              </>
            )}
          </button> */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New User
          </button>
        </div>
      </div>

      {/* Information Section
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works:</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Add New User:</strong> Creates a new user account with secure password hashing</li>
                <li><strong>Login Credentials:</strong> New users can immediately log in with their email and password</li>
                <li><strong>User Status:</strong> Deactivated users cannot access their dashboard until reactivated</li>
                <li><strong>Admin Protection:</strong> Admin users cannot be modified through this interface</li>
              </ul>
            </div>
          </div>
        </div>
      </div> */}

             {/* Users Table */}
       <div className="bg-white rounded-lg shadow overflow-hidden">
         
         <div className="overflow-x-auto">
           <table className="min-w-full">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   S.No
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Username
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Email
                 </th>
                                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                    {/* <span className="ml-1 text-xs text-gray-400">(Admin first)</span> */}
                  </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Status
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Actions
                 </th>

               </tr>
             </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => {
              // Add section divider after admin users
              const isLastAdmin = user.role === 'admin' && 
                (index === users.length - 1 || users[index + 1]?.role !== 'admin');
              
              return (
                <React.Fragment key={user._id}>
                  {/* {isLastAdmin && (
                    <tr className="bg-gray-100">
                      <td colSpan="6" className="px-6 py-2">
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Regular Users
                        </div>
                      </td>
                    </tr>
                  )} */}
                  <tr 
                    className={`hover:bg-gray-50 transition-all duration-300 ${
                      newlyAddedUser === user._id
                        ? 'bg-green-50 border-l-4 border-l-green-500 shadow-md' 
                        : user.role === 'admin'
                        ? 'bg-purple-50 border-l-4 border-l-purple-200'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{index + 1}</span>
                        {newlyAddedUser === user._id && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {user.role === 'admin' ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            {user.role}
                          </>
                        ) : (
                          user.role
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.role === 'admin' ? (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-xs transition-colors"
                          >
                            Delete
                          </button>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(user._id, 'deactivated', user.username)}
                              className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(user._id, 'active', user.username)}
                              className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found. Add a new user to get started.
        </div>
      )}
    </div>

             {/* Add User Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
             <h2 className="text-xl font-bold mb-4">Add New User</h2>
             
                           <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> New users will be able to log in immediately with their email and password.
                </p>
              </div>
             
             <form onSubmit={handleAddUser}>
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Username
                 </label>
                 <input
                   type="text"
                   required
                   value={formData.username}
                   onChange={(e) => setFormData({...formData, username: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
               </div>
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Email
                 </label>
                 <input
                   type="email"
                   required
                   value={formData.email}
                   onChange={(e) => setFormData({...formData, email: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
               </div>
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Password
                 </label>
                 <input
                   type="password"
                   required
                   value={formData.password}
                   onChange={(e) => setFormData({...formData, password: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
               </div>
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Confirm Password
                 </label>
                 <input
                   type="password"
                   required
                   value={formData.confirmPassword}
                   onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>}
               </div>
               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Role
                 </label>
                 <select
                   value={formData.role}
                   onChange={(e) => setFormData({...formData, role: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="user">User</option>
                 </select>
               </div>
               <div className="flex space-x-3">
                 <button
                   type="submit"
                   className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                   disabled={isSubmitting}
                 >
                   {isSubmitting ? 'Adding...' : 'Add User'}
                 </button>
                 <button
                   type="button"
                   onClick={() => {
                     setShowAddModal(false);
                     resetForm();
                   }}
                   className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                 >
                   Cancel
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <p className="text-gray-500 text-center py-8">No activity found for this user.</p>
                ) : (
                  selectedUserActivities.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-blue-600">{activity.action}</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                          {activity.details && Object.keys(activity.details).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              {Object.entries(activity.details).map(([key, value]) => (
                                <div key={key}>
                                  <strong>{key}:</strong> {String(value)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Activity Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Schedule History: {selectedUserForActivity?.username}
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
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
                {selectedUserSchedules.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No schedule activity found for this user.</p>
                ) : (
                  selectedUserSchedules.map((schedule, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-green-600">{schedule.action}</span>
                            <span className="text-sm text-gray-500">for Dr. {schedule.doctorName}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(schedule.timestamp).toLocaleString()}
                          </p>
                          {schedule.stepNumber && (
                            <p className="text-sm text-gray-600 mt-1">
                              Step {schedule.stepNumber}: {schedule.stepName}
                            </p>
                          )}
                          {schedule.duration > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Duration: {Math.floor(schedule.duration / 60000)}m {Math.floor((schedule.duration % 60000) / 1000)}s
                            </p>
                          )}
                          {schedule.notes && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              Notes: {schedule.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(schedule.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
