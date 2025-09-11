"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Added toast import

const ReportsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState('all');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedWorkflowQuestions, setSelectedWorkflowQuestions] = useState([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fallback notification function in case toast is not available
  const showNotification = (message, type = 'info') => {
    try {
      if (toast && typeof toast[type] === 'function') {
        toast[type](message);
      } else {
        // Fallback to alert if toast is not available
        alert(`${type.toUpperCase()}: ${message}`);
      }
    } catch (error) {
      console.error('Notification error:', error);
      alert(`${type.toUpperCase()}: ${message}`);
    }
  };

  // Helper function to safely render workflow data
  const safeRender = (value, fallback = 'Unknown') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      // If it's an object with an _id, use that
      if (value._id) return value._id.toString();
      // If it's an object with a name property, use that
      if (value.name) return value.name;
      // Otherwise, stringify it safely
      try {
        return JSON.stringify(value);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  // Fetch schedules to count uninitiated workflows
  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedule');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  // Fetch workflows from database
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching workflows...');
      const response = await fetch('/api/workflows');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Fetched workflows:', data.workflows?.length || 0);
        // Clean and validate workflow data before setting state
        const cleanWorkflows = (data.workflows || []).map(workflow => ({
          ...workflow,
          // Ensure all fields are safe to render
          doctorName: safeRender(workflow.doctorName, 'Unknown Doctor'),
          departmentName: safeRender(workflow.departmentName, 'Unknown Department'),
          workflowStatus: safeRender(workflow.workflowStatus, 'not_started'),
          scheduleId: safeRender(workflow.scheduleId, ''),
          currentStep: typeof workflow.currentStep === 'number' ? workflow.currentStep : 0,
          lastUpdated: workflow.lastUpdated || null,
          steps: Array.isArray(workflow.steps) ? workflow.steps : []
        }));
        
        setWorkflows(cleanWorkflows);
      } else {
        throw new Error(data.error || 'Failed to fetch workflows');
      }
    } catch (error) {
      console.error('❌ Error fetching workflows:', error);
      setError(error.message);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };



  // Calculate counts for different workflow states
  const calculateCounts = () => {
    // Count workflows by status
    const completedCount = workflows.filter(w => w.workflowStatus === 'completed').length;
    const inProgressCount = workflows.filter(w => w.workflowStatus === 'in_progress').length;
    
    // Count schedules that haven't been started yet
    const uninitiatedCount = schedules.filter(schedule => {
      // Check if there's no workflow for this schedule + doctor combination
      const hasWorkflow = workflows.some(workflow => {
        const workflowScheduleId = safeRender(workflow.scheduleId);
        const scheduleId = safeRender(schedule._id);
        return workflowScheduleId === scheduleId && workflow.doctorName === schedule.doctor;
      });
      return !hasWorkflow;
    }).length;
    
    return {
      completed: completedCount,
      inProgress: inProgressCount,
      uninitiated: uninitiatedCount,
      total: schedules.length
    };
  };

  // Filter workflows based on search query
  const filteredWorkflows = workflows.filter(workflow => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    switch (searchBy) {
      case 'doctor':
        return workflow.doctorName.toLowerCase().includes(query);
      case 'department':
        return workflow.departmentName.toLowerCase().includes(query);
      case 'all':
      default:
        return workflow.doctorName.toLowerCase().includes(query) || 
               workflow.departmentName.toLowerCase().includes(query);
    }
  });

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchBy('all');
  };

  // Fetch questions for a specific workflow
  const fetchWorkflowQuestions = async (workflow) => {
    try {
      setLoadingQuestions(true);
      
      // Find the schedule that corresponds to this workflow
      const correspondingSchedule = schedules.find(schedule => {
        const scheduleId = safeRender(schedule._id);
        const workflowScheduleId = safeRender(workflow.scheduleId);
        return scheduleId === workflowScheduleId && schedule.doctor === workflow.doctorName;
      });
      
      if (correspondingSchedule && correspondingSchedule.question) {
        setSelectedWorkflowQuestions(Array.isArray(correspondingSchedule.question) ? correspondingSchedule.question : [correspondingSchedule.question]);
      } else {
        setSelectedWorkflowQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching workflow questions:', error);
      setSelectedWorkflowQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleWorkflowClick = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowWorkflowDetails(true);
    fetchWorkflowQuestions(workflow);
  };

  const closeWorkflowDetails = () => {
    setShowWorkflowDetails(false);
    setSelectedWorkflow(null);
  };

  const getWorkflowStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkflowStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '✅ Completed';
      case 'in_progress':
        return '🔄 In Progress';
      default:
        return '⏳ Not Started';
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSchedules();
    fetchWorkflows();
  }, []);

  // Calculate counts
  const counts = calculateCounts();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Reports...</h2>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Reports</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              
              <div className="space-y-3">
                <button
                  onClick={fetchWorkflows}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  🔄 Retry
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  🔄 Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Reports content
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workflow Reports</h1>
              <p className="text-gray-600 mt-1">Monitor and analyze your content creation workflows</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
                             <button
                 onClick={() => {
                   fetchSchedules();
                   fetchWorkflows();
                 }}
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



        {/* Workflow Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Start</p>
                <p className="text-3xl font-bold text-blue-600">
                  {counts.uninitiated}
                </p>
                <p className="text-xs text-gray-500 mt-1">Schedules with Start button</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-red-600">
                  {counts.inProgress}
                </p>
                <p className="text-xs text-gray-500 mt-1">Currently being worked on</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-grey-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {counts.completed}
                </p>
                <p className="text-xs text-gray-500 mt-1">All steps finished</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Overall Progress</h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {counts.total > 0 
                  ? Math.round((counts.completed / counts.total) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 via-green-500 to-red-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${counts.total > 0 
                  ? (counts.completed / counts.total) * 100
                  : 0}%` 
              }}
            ></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {counts.uninitiated}
              </p>
              <p className="text-sm text-gray-600">Ready to Start</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {counts.inProgress}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {counts.completed}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {counts.total}
              </p>
              <p className="text-sm text-gray-600">Total Schedules</p>
            </div>
          </div>
        </div>

        {/* Workflows List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Workflow Details</h3>
                         <div className="text-sm text-gray-600">
               Showing {filteredWorkflows.length} workflows
             </div>
          </div>

          {/* Search Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search Type Selector */}
              <div className="flex-shrink-0">
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                >
                  <option value="all">Search All</option>
                  <option value="doctor">Doctor Name</option>
                  <option value="department">Department</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchBy === 'all' ? 'Search by doctor name or department...' :
                      searchBy === 'doctor' ? 'Search by doctor name...' :
                      'Search by department...'
                    }
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>

            {/* Search Results Summary */}
            {searchQuery && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <span>
                  Search results for "{searchQuery}" in {searchBy === 'all' ? 'all fields' : searchBy}:
                  <span className="font-semibold text-blue-600 ml-1">
                    {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''} found
                  </span>
                </span>
              </div>
            )}
          </div>
          
          
          
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No workflows found' : 'No workflows found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No workflows match your search for "${searchQuery}" in ${searchBy === 'all' ? 'all fields' : searchBy}. Try adjusting your search terms.`
                  : 'No workflows have been created yet. Create a schedule to get started.'
                }
              </p>
              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = '/schedule'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Schedule
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow, index) => (
                <div
                  key={workflow._id || index}
                  onClick={() => handleWorkflowClick(workflow)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {workflow.doctorName}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getWorkflowStatusColor(workflow.workflowStatus)}`}>
                          {getWorkflowStatusText(workflow.workflowStatus)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Department: {workflow.departmentName}
                      </p>
                      {/* {workflow.scheduleId && (
                        <p className="text-sm text-gray-500">
                          Schedule ID: {workflow.scheduleId}
                        </p>
                      )} */}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {workflow.lastUpdated ? new Date(workflow.lastUpdated).toLocaleDateString() : 'No date'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {workflow.steps && workflow.steps.length > 0 
                          ? `${workflow.steps.filter(s => s.status === 'completed').length}/${workflow.steps.length} steps`
                          : 'No steps'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Details Modal */}
      {showWorkflowDetails && selectedWorkflow && (
        <div className="fixed inset-0 flex items-center bg-black/50 justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-8">
              {/* Header with gradient background */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Workflow Details</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Generate PDF report with better error handling
                      const generatePDF = async () => {
                        setGeneratingPDF(true);
                        try {
                          // Dynamic import with better error handling
                          const jsPDFModule = await import('jspdf');
                          const jsPDF = jsPDFModule.default;
                          
                          if (!jsPDF) {
                            throw new Error('jsPDF library failed to load');
                          }
                          
                          const doc = new jsPDF();
                          
                          // Initialize yPosition for tracking vertical position
                          let yPosition = 20;
                          
                          // Set document properties
                          doc.setProperties({
                            title: `Workflow Report - ${selectedWorkflow.doctorName}`,
                            subject: 'Workflow Completion Report',
                            author: 'HVC Portal',
                            creator: 'HVC Portal System'
                          });

                          // Add header with logo placeholder
                          doc.setFillColor(59, 130, 246); // Blue color
                          doc.rect(0, 0, 220, 30, 'F');
                          
                          // Add title
                          doc.setTextColor(255, 255, 255);
                          doc.setFontSize(24);
                          doc.setFont('helvetica', 'bold');
                          doc.text('HVC PORTAL', 20, 20);
                          
                          // Add subtitle
                          doc.setFontSize(14);
                          doc.text('Workflow Completion Report', 20, 28);
                          
                          // Reset text color for content
                          doc.setTextColor(0, 0, 0);
                          
                          // Add report generation info
                          doc.setFontSize(10);
                          doc.setFont('helvetica', 'normal');
                          doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 40);
                          
                          // Add workflow overview section
                          doc.setFontSize(16);
                          doc.setFont('helvetica', 'bold');
                          doc.text('Workflow Overview', 20, 55);
                          
                          // Add workflow details in a structured format with better alignment
                          doc.setFontSize(12);
                          doc.setFont('helvetica', 'bold');
                          doc.text('Doctor Name:', 20, 70);
                          doc.setFont('helvetica', 'normal');
                          doc.text(selectedWorkflow.doctorName || 'N/A', 70, 70);
                          
                          doc.setFont('helvetica', 'bold');
                          doc.text('Department:', 20, 80);
                          doc.setFont('helvetica', 'normal');
                          doc.text(selectedWorkflow.departmentName || 'N/A', 70, 80);
                          
                          doc.setFont('helvetica', 'bold');
                          doc.text('Status:', 20, 90);
                          doc.setFont('helvetica', 'normal');
                          doc.text(selectedWorkflow.workflowStatus || 'N/A', 70, 90);
                          
                          doc.setFont('helvetica', 'bold');
                          doc.text('Current Step:', 20, 100);
                          doc.setFont('helvetica', 'normal');
                          doc.text((selectedWorkflow.currentStep || 0).toString(), 70, 100);
                          
                          doc.setFont('helvetica', 'bold');
                          doc.text('Last Updated:', 20, 110);
                          doc.setFont('helvetica', 'normal');
                          doc.text(selectedWorkflow.lastUpdated ? new Date(selectedWorkflow.lastUpdated).toLocaleDateString() : 'N/A', 70, 110);
                          
                          // Add questions count to basic information
                          doc.setFont('helvetica', 'bold');
                          doc.text('Questions Count:', 20, 120);
                          doc.setFont('helvetica', 'normal');
                          doc.text(`${selectedWorkflowQuestions ? selectedWorkflowQuestions.length : 0} questions assigned`, 70, 120);
                          
                          // Add questions section
                          doc.setFontSize(16);
                          doc.setFont('helvetica', 'bold');
                          doc.text('Assigned Questions', 20, 140);
                          
                          if (selectedWorkflowQuestions && selectedWorkflowQuestions.length > 0) {
                            yPosition = 150;
                            
                            selectedWorkflowQuestions.forEach((question, index) => {
                              // Check if we need a new page
                              if (yPosition > 250) {
                                doc.addPage();
                                yPosition = 20;
                                
                                // Add header to new page
                                doc.setFillColor(59, 130, 246);
                                doc.rect(0, 0, 220, 20, 'F');
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(12);
                                doc.setFont('helvetica', 'bold');
                                doc.text(`Workflow Report - ${selectedWorkflow.doctorName} (Continued)`, 20, 15);
                                doc.setTextColor(0, 0, 0);
                              }
                              
                              // Question number and text with better alignment
                              doc.setFontSize(11);
                              doc.setFont('helvetica', 'bold');
                              doc.text(`Q${index + 1}:`, 20, yPosition);
                              
                              // Wrap question text if it's too long with better spacing
                              const questionLines = doc.splitTextToSize(question || 'No question text', 160);
                              doc.setFont('helvetica', 'normal');
                              doc.setFontSize(10);
                              
                              questionLines.forEach((line, lineIndex) => {
                                if (yPosition > 250) {
                                  doc.addPage();
                                  yPosition = 20;
                                  
                                  // Add header to new page
                                  doc.setFillColor(59, 130, 246);
                                  doc.rect(0, 0, 220, 20, 'F');
                                  doc.setTextColor(255, 255, 255);
                                  doc.setFontSize(12);
                                  doc.setFont('helvetica', 'bold');
                                  doc.text(`Workflow Report - ${selectedWorkflow.doctorName} (Continued)`, 20, 15);
                                  doc.setTextColor(0, 0, 0);
                                }
                                
                                doc.text(line, 40, yPosition + (lineIndex * 6));
                              });
                              
                              yPosition += (questionLines.length * 6) + 12;
                            });
                          } else {
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'normal');
                            doc.text('No questions assigned to this workflow.', 20, 150);
                            yPosition = 160;
                          }
                          
                          // Add workflow steps section
                          if (selectedWorkflow.steps && selectedWorkflow.steps.length > 0) {
                            // Check if we need a new page
                            if (yPosition > 200) {
                              doc.addPage();
                              yPosition = 20;
                              
                              // Add header to new page
                              doc.setFillColor(59, 130, 246);
                              doc.rect(0, 0, 220, 20, 'F');
                              doc.setTextColor(255, 255, 255);
                              doc.setFontSize(12);
                              doc.setFont('helvetica', 'bold');
                              doc.text(`Workflow Report - ${selectedWorkflow.doctorName} (Continued)`, 20, 15);
                              doc.setTextColor(0, 0, 0);
                            }
                            
                            doc.setFontSize(16);
                            doc.setFont('helvetica', 'bold');
                            doc.text('Workflow Steps Progress', 20, yPosition);
                            yPosition += 15;
                            
                            selectedWorkflow.steps.forEach((step, index) => {
                              // Check if we need a new page
                              if (yPosition > 250) {
                                doc.addPage();
                                yPosition = 20;
                                
                                // Add header to new page
                                doc.setFillColor(59, 130, 246);
                                doc.rect(0, 0, 220, 20, 'F');
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(12);
                                doc.setFont('helvetica', 'bold');
                                doc.text(`Workflow Report - ${selectedWorkflow.doctorName} (Continued)`, 20, 15);
                                doc.setTextColor(0, 0, 0);
                              }
                              
                              // Step header with better alignment
                              doc.setFontSize(11);
                              doc.setFont('helvetica', 'bold');
                              doc.text(`Step ${index + 1}: ${step.stepName || `Step ${index + 1}`}`, 20, yPosition);
                              yPosition += 8;
                              
                              // Step status with better alignment
                              doc.setFont('helvetica', 'normal');
                              doc.setFontSize(10);
                              doc.text(`Status: ${step.status || 'pending'}`, 35, yPosition);
                              yPosition += 8;
                              
                              // Step data if completed with better alignment
                              if (step.status === 'completed' && (step.formData || step.submittedData || step.data)) {
                                const stepData = step.formData || step.submittedData || step.data;
                                if (typeof stepData === 'object') {
                                  Object.entries(stepData).forEach(([key, value]) => {
                                    if (yPosition > 250) {
                                      doc.addPage();
                                      yPosition = 20;
                                      
                                      // Add header to new page
                                      doc.setFillColor(59, 130, 246);
                                      doc.rect(0, 0, 220, 20, 'F');
                                      doc.setTextColor(255, 255, 255);
                                      doc.setFontSize(12);
                                      doc.setFont('helvetica', 'bold');
                                      doc.text(`Workflow Report - ${selectedWorkflow.doctorName} (Continued)`, 20, 15);
                                      doc.setTextColor(0, 0, 0);
                                    }
                                    
                                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                                    
                                    doc.text(`${label}: ${valueStr}`, 50, yPosition);
                                    yPosition += 6;
                                  });
                                }
                              }
                              yPosition += 8;
                            });
                          }
                          
                          // Add summary section at the end
                          if (yPosition > 200) {
                            doc.addPage();
                            yPosition = 20;
                            
                            // Add header to new page
                            doc.setFillColor(59, 130, 246);
                            doc.rect(0, 0, 220, 20, 'F');
                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`Workflow Report - ${selectedWorkflow.doctorName} (Continued)`, 20, 15);
                            doc.setTextColor(0, 0, 0);
                          }
                          
                          doc.setFontSize(16);
                          doc.setFont('helvetica', 'bold');
                          doc.text('Workflow Summary', 20, yPosition);
                          yPosition += 15;
                          
                          doc.setFontSize(10);
                          doc.setFont('helvetica', 'normal');
                          doc.text(`• Total Questions: ${selectedWorkflowQuestions ? selectedWorkflowQuestions.length : 0}`, 20, yPosition);
                          yPosition += 8;
                          doc.text(`• Workflow Status: ${selectedWorkflow.workflowStatus || 'N/A'}`, 20, yPosition);
                          yPosition += 8;
                          doc.text(`• Completed Steps: ${selectedWorkflow.steps ? selectedWorkflow.steps.filter(s => s.status === 'completed').length : 0}`, 20, yPosition);
                          yPosition += 8;
                          doc.text(`• Total Steps: ${selectedWorkflow.steps ? selectedWorkflow.steps.length : 0}`, 20, yPosition);
                          
                          // Add footer
                          const pageCount = doc.internal.getNumberOfPages();
                          for (let i = 1; i <= pageCount; i++) {
                            doc.setPage(i);
                            
                            // Footer line
                            doc.setDrawColor(200, 200, 200);
                            doc.line(20, 280, 190, 280);
                            
                            // Footer text
                            doc.setFontSize(8);
                            doc.setTextColor(100, 100, 100);
                            doc.text(`Page ${i} of ${pageCount}`, 20, 285);
                            doc.text('HVC Portal - Workflow Management System', 120, 285);
                          }
                          
                          // Save the PDF
                          const filename = `workflow-report-${selectedWorkflow.doctorName}-${new Date().toISOString().split('T')[0]}.pdf`;
                          doc.save(filename);
                          
                          // Show success message
                          showNotification('PDF report generated successfully!', 'success');
                          
                        } catch (error) {
                          console.error('❌ PDF Generation Error:', error);
                          
                          // More specific error messages
                          let errorMessage = 'Failed to generate PDF report.';
                          
                          if (error.message.includes('jsPDF library failed to load')) {
                            errorMessage = 'PDF library failed to load. Please refresh the page and try again.';
                          } else if (error.message.includes('splitTextToSize')) {
                            errorMessage = 'Error processing text content. Please try again.';
                          } else if (error.message.includes('addPage')) {
                            errorMessage = 'Error creating PDF pages. Please try again.';
                          }
                          
                          showNotification(errorMessage, 'error');
                          
                          // Fallback: Try to show more details in console
                          console.error('Full error details:', {
                            message: error.message,
                            stack: error.stack,
                            workflow: selectedWorkflow,
                            questions: selectedWorkflowQuestions
                          });
                        } finally {
                          setGeneratingPDF(false);
                        }
                      };
                      
                      // Start PDF generation
                      generatePDF();
                    }}
                    disabled={selectedWorkflow.workflowStatus !== 'completed' || generatingPDF}
                    title={selectedWorkflow.workflowStatus !== 'completed' ? 'Complete the workflow first to download the report' : 'Download comprehensive PDF report with questions and workflow details'}
                    className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 shadow-md transform hover:-translate-y-0.5 flex items-center gap-2 ${
                      selectedWorkflow.workflowStatus === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-lg cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${selectedWorkflow.workflowStatus !== 'completed' || generatingPDF ? 'opacity-50' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {generatingPDF ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      selectedWorkflow.workflowStatus === 'completed' ? 'Download Complete Report' : 'Complete Workflow to Download'
                    )}
                  </button>
                  <button
                    onClick={closeWorkflowDetails}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <svg className="w-6 h-6 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information Card */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Doctor</span>
                      <p className="text-lg font-semibold text-gray-900">{selectedWorkflow.doctorName}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Department</span>
                      <p className="text-lg font-semibold text-gray-900">{selectedWorkflow.departmentName}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</span>
                      <span className={`inline-block px-3 py-2 rounded-full text-sm font-semibold ${getWorkflowStatusColor(selectedWorkflow.workflowStatus)}`}>
                        {getWorkflowStatusText(selectedWorkflow.workflowStatus)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Step</span>
                      <p className="text-lg font-semibold text-gray-900">{selectedWorkflow.currentStep}</p>
                    </div>
                  </div>

                  {/* Questions Section */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Questions ({selectedWorkflowQuestions.length})</span>
                    </div>
                    
                    {loadingQuestions ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Loading questions...</span>
                      </div>
                    ) : selectedWorkflowQuestions.length > 0 ? (
                      <div className="space-y-2">
                        {selectedWorkflowQuestions.map((question, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-gray-700 text-sm">{question}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No questions available for this workflow</p>
                      </div>
                    )}
                  </div>
                </div>
                
                
                
                {/* Workflow Steps Card */}
                {selectedWorkflow.steps && selectedWorkflow.steps.length > 0 && (
                   <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-2xl p-6 border border-gray-100">
                     <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       Workflow Steps
                     </h3>
                     <div className="space-y-3">
                      {selectedWorkflow.steps.map((step, index) => (
                          <div key={step.stepId || index} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                            {/* Step Header */}
                            <div className="flex items-center gap-4 p-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                                step.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                step.status === 'active' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
                          }`}>
                            {step.status === 'completed' ? '✓' : step.status === 'active' ? '●' : '○'}
                          </div>
                          <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-lg">{step.stepName || `Step ${index + 1}`}</p>
                                <p className="text-sm text-gray-600 capitalize font-medium">{step.status || 'pending'}</p>
                              </div>
                            </div>
                            
                            {/* Step Submitted Data - Show when step is completed */}
                            {step.status === 'completed' && step.formData && (
                              <div className="border-t border-gray-100 bg-gray-50 p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Submitted Data
                                </h4>
                                <div className="space-y-3">
                                  {Object.entries(step.formData).map(([key, value]) => (
                                    <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </span>
                                      </div>
                                      <div className="text-gray-900">
                                        {typeof value === 'object' ? (
                                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                            {JSON.stringify(value, null, 2)}
                                          </pre>
                                        ) : (
                                          <p className="text-sm font-medium">{String(value)}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Step Submitted Data - Alternative structure for backward compatibility */}
                            {step.status === 'completed' && !step.formData && step.submittedData && (
                              <div className="border-t border-gray-100 bg-gray-50 p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Submitted Data
                                </h4>
                                <div className="space-y-3">
                                  {Object.entries(step.submittedData).map(([key, value]) => (
                                    <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </span>
                                      </div>
                                      <div className="text-gray-900">
                                        {typeof value === 'object' ? (
                                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                            {JSON.stringify(value, null, 2)}
                                          </pre>
                                        ) : (
                                          <p className="text-sm font-medium">{String(value)}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Step Submitted Data - Alternative structure for data field */}
                            {step.status === 'completed' && !step.formData && !step.submittedData && step.data && (
                              <div className="border-t border-gray-100 bg-gray-50 p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Step Data
                                </h4>
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(step.data, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                     </div>
                   </div>
                 )}

                 
                
                {/* Close Button */}
                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <button
                    onClick={closeWorkflowDetails}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
