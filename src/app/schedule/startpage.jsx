'use client';

import React, { useState, useEffect } from 'react';
import { 
  trackScheduleStart, 
  trackScheduleComplete, 
  trackWorkflowStepComplete, 
  trackWorkflowStepEdit,
  getCurrentSessionInfo 
} from '../utils/activityTracker';

const StartPage = ({ isOpen, onClose, schedule }) => {
  const [formData, setFormData] = useState({
    name: '',
    languages: [],
    date: '',
    status: '',
    reason: ''
  });

  const [completedSteps, setCompletedSteps] = useState(0);
  const [workflowStarted, setWorkflowStarted] = useState(false);
  const [workflowId, setWorkflowId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentEditingStep, setCurrentEditingStep] = useState(0); // Track which step is being edited
  
  // Voice-to-text states
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const steps = [
    { id: 1, name: 'Going To Shoot', status: 'failed' },
    { id: 2, name: 'Shoot Completed', status: 'failed' },
    { id: 3, name: 'Video/Shorts Editing', status: 'failed' },
    { id: 4, name: 'Thumbnails Editing', status: 'failed' },
    { id: 5, name: 'Thumbnail & Spell Check', status: 'failed' },
    { id: 6, name: 'SEO Keywords', status: 'failed' },
    { id: 7, name: 'Upload Videos', status: 'failed' }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsRecording(true);
        console.log('🎤 Voice recognition started');
      };
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setFormData(prev => ({
            ...prev,
            reason: prev.reason + finalTranscript + ' '
          }));
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('Please allow microphone access to use voice-to-text feature.');
        }
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
        console.log('🎤 Voice recognition ended');
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Function to get current step status
  const getStepStatus = (stepId) => {
    // Check if we have workflow data to determine actual status
    if (workflowId && completedSteps > 0) {
      // For step 1: check if status is "going" (orange) when only step 1 is completed
      if (stepId === 1 && completedSteps === 1) {
        return 'going'; // Special status for step 1 with "going"
      }
      // For step 1: if step 2 is completed, step 1 should be green
      if (stepId === 1 && completedSteps >= 2) {
        return 'completed'; // Step 1 becomes green when step 2 is completed
      }
      // For step 2: if completed, it should be green
      if (stepId === 2 && completedSteps >= 2) {
        return 'completed';
      }
      // For step 3: if step 3 is completed, both step 1 and 2 should be green
      if (stepId === 3 && completedSteps >= 3) {
        return 'completed';
      }
      if (stepId === 1 && completedSteps >= 3) {
        return 'completed'; // Step 1 becomes green when step 3 is completed
      }
      if (stepId === 2 && completedSteps >= 3) {
        return 'completed'; // Step 2 becomes green when step 3 is completed
      }
      // Continue this pattern for all steps
      if (stepId === 4 && completedSteps >= 4) {
        return 'completed';
      }
      if (stepId <= 3 && completedSteps >= 4) {
        return 'completed'; // Steps 1, 2, 3 become green when step 4 is completed
      }
      if (stepId === 5 && completedSteps >= 5) {
        return 'completed';
      }
      if (stepId <= 4 && completedSteps >= 5) {
        return 'completed'; // Steps 1, 2, 3, 4 become green when step 5 is completed
      }
      if (stepId === 6 && completedSteps >= 6) {
        return 'completed';
      }
      if (stepId <= 5 && completedSteps >= 6) {
        return 'completed'; // Steps 1, 2, 3, 4, 5 become green when step 6 is completed
      }
      if (stepId === 7 && completedSteps >= 7) {
        return 'completed';
      }
      if (stepId <= 6 && completedSteps >= 7) {
        return 'completed'; // All steps become green when step 7 is completed
      }
    }
    
    // Default logic
    const status = stepId <= completedSteps ? 'completed' : 
                  stepId === completedSteps + 1 ? 'active' : 'failed';
    
    console.log(`🔍 Step ${stepId} status: ${status} (completedSteps: ${completedSteps})`);
    return status;
  };

  // Voice-to-text functions
  const startRecording = () => {
    if (recognition) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsRecording(false);
      }
    } else {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const clearReason = () => {
    setFormData(prev => ({
      ...prev,
      reason: ''
    }));
  };
   
   // Function to automatically update step 1 status to "completed" when step 2 is completed
   const updateStep1Status = async () => {
     try {
       console.log('🔄 Updating step 1 status to completed...');
       
       // Create form data for step 1 with "completed" status
       const step1FormData = {
         name: 'Auto-updated', // Default name for auto-update
         languages: [], // No languages for step 1
         date: new Date().toISOString().split('T')[0], // Current date
         status: 'completed', // Set status to completed
         reason: 'Automatically completed when step 2 was finished' // Auto reason
       };
       
       // Update step 1 in the database
       const response = await fetch(`/api/workflows/${workflowId}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           stepId: 1,
           formData: step1FormData
         })
       });
       
       if (response.ok) {
         console.log('✅ Step 1 status automatically updated to completed');
       } else {
         console.warn('⚠️ Could not auto-update step 1 status:', response.status);
       }
     } catch (error) {
       console.error('❌ Error auto-updating step 1 status:', error);
     }
   };

  // Function to edit a previous step
  const editStep = (stepNumber) => {
    if (stepNumber <= completedSteps) {
      setCurrentEditingStep(stepNumber);
      // Load the data for that specific step
      loadStepData(stepNumber);
    }
  };

  // Function to load data for a specific step
  const loadStepData = async (stepNumber) => {
    try {
      if (workflowId) {
        const response = await fetch(`/api/workflows/${workflowId}`);
        const data = await response.json();
        
        if (data.success && data.workflow.steps) {
          const stepData = data.workflow.steps.find(step => step.stepId === stepNumber);
          if (stepData && stepData.formData) {
             console.log('🔍 Loading step data for editing:', stepData.formData);
             
             // Load the step data and ensure status is set to "completed" for editing
             // Handle date formatting - ensure it's in YYYY-MM-DD format for the input field
             let formattedDate = '';
             if (stepData.formData.date) {
               try {
                 // If date is already a string in YYYY-MM-DD format, use it directly
                 if (typeof stepData.formData.date === 'string' && stepData.formData.date.includes('-')) {
                   formattedDate = stepData.formData.date;
                 } else {
                   // If date is a Date object or other format, convert it
                   const dateObj = new Date(stepData.formData.date);
                   if (!isNaN(dateObj.getTime())) {
                     formattedDate = dateObj.toISOString().split('T')[0];
                   }
                 }
               } catch (dateError) {
                 console.warn('⚠️ Error formatting date:', dateError);
                 formattedDate = '';
               }
             }
             
             setFormData({
               name: stepData.formData.name || '',
               languages: stepData.formData.languages || [],
               date: formattedDate,
               status: 'completed', // Always set status to completed when editing
               reason: stepData.formData.reason || ''
             });
             
             console.log('✅ Form data loaded for editing:', {
               name: stepData.formData.name || '',
               languages: stepData.formData.languages || [],
               date: formattedDate,
               status: 'completed',
               reason: stepData.formData.reason || ''
             });
          }
        }
      }
    } catch (error) {
      console.error('Error loading step data:', error);
    }
  };

  // Function to go back to current step
  const goToCurrentStep = () => {
    setCurrentEditingStep(0);
    setFormData({
      name: '',
      languages: [],
      date: '',
      status: '',
      reason: ''
    });
  };


  // Create or get existing workflow when component opens
  useEffect(() => {
    if (isOpen && schedule && !workflowStarted) {
      initializeWorkflow();
    }
    
    // Reset workflow state when modal closes
    if (!isOpen) {
      setWorkflowStarted(false);
      setWorkflowId(null);
      setCompletedSteps(0);
      setCurrentEditingStep(0);
      setFormData({
        name: '',
        languages: [],
        date: '',
        status: '',
        reason: ''
      });
      setError(null);
    }
  }, [isOpen, schedule, workflowStarted]);

  const initializeWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate schedule data
      if (!schedule || !schedule._id || !schedule.doctor || !schedule.department) {
        console.error('❌ Invalid schedule data:', schedule);
        setError('Invalid schedule data. Please try again.');
        return;
      }
      
      console.log('🔍 Initializing workflow for schedule:', {
        id: schedule._id,
        doctor: schedule.doctor,
        department: schedule.department
      });
      
      // Check if workflow already exists for this specific doctor and schedule
      try {
        console.log('🔍 Checking for existing workflows...');
        const response = await fetch('/api/workflows');
        const data = await response.json();
        
        if (data.success && data.workflows && Array.isArray(data.workflows)) {
          console.log(`🔍 Found ${data.workflows.length} total workflows`);
          
          // Find workflow for THIS specific doctor and schedule combination
          const existingWorkflow = data.workflows.find(w => {
            if (!w || !w.scheduleId || !w.doctorName) {
              console.warn('⚠️ Invalid workflow data:', w);
              return false;
            }
            
            const scheduleId = w.scheduleId._id || w.scheduleId;
            const doctorName = w.doctorName;
            
            console.log('🔍 Checking workflow:', { 
              workflowId: w._id,
              scheduleId, 
              doctorName, 
              targetSchedule: schedule._id, 
              targetDoctor: schedule.doctor,
              isMatch: scheduleId === schedule._id && doctorName === schedule.doctor
            });
            
            return scheduleId === schedule._id && doctorName === schedule.doctor;
          });
          
          if (existingWorkflow) {
            // Workflow exists for THIS specific doctor and schedule
            console.log('🔄 Found existing workflow for:', schedule.doctor, existingWorkflow);
            console.log('📊 Existing workflow currentStep:', existingWorkflow.currentStep);
          
            setWorkflowId(existingWorkflow._id);
            // currentStep represents the last completed step, so we use it directly
            setCompletedSteps(existingWorkflow.currentStep || 0);
            setWorkflowStarted(true);
            
            console.log('📊 Set completedSteps to:', existingWorkflow.currentStep || 0);
            
            // Track schedule start activity
            try {
              const sessionInfo = getCurrentSessionInfo();
              if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
                await trackScheduleStart(
                  sessionInfo.currentUser.userId,
                  sessionInfo.currentUser.username,
                  schedule._id,
                  schedule.doctor,
                  existingWorkflow.currentStep || 0,
                  steps[existingWorkflow.currentStep || 0]?.name || 'Unknown Step'
                );
              }
            } catch (error) {
              console.warn('⚠️ Failed to track schedule start activity:', error);
            }
            
            // Emit event to update parent component
            window.dispatchEvent(new CustomEvent('workflowStarted', { 
              detail: { 
                scheduleId: schedule._id,
                doctorName: schedule.doctor 
              } 
            }));
            return; // Exit early since we found an existing workflow
          } else {
            console.log('🔍 No existing workflow found for this doctor and schedule combination');
          }
        } else {
          console.log('🔍 No workflows found or invalid response:', data);
        }
      } catch (fetchError) {
        console.error('❌ Error fetching existing workflows:', fetchError);
        // Continue to create new workflow if fetch fails
      }
      
      // No existing workflow found, create new one
      console.log('🆕 No existing workflow found for:', schedule.doctor, '- creating new one');
       
       // Validate required fields before creating workflow
       if (!schedule._id || !schedule.doctor || !schedule.department) {
         console.error('❌ Missing required fields for workflow creation:', {
           scheduleId: schedule._id,
           doctor: schedule.doctor,
           department: schedule.department
         });
         throw new Error('Missing required fields: schedule ID, doctor, or department');
       }
      
      try {
        // Create new workflow for this specific doctor
        const createResponse = await fetch('/api/workflows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scheduleId: schedule._id,
            doctorName: schedule.doctor,
            departmentName: schedule.department
          })
        });
        
        console.log('📤 Creating workflow with data:', {
          scheduleId: schedule._id,
          doctorName: schedule.doctor,
          departmentName: schedule.department
        });
        
        console.log('📡 Response status:', createResponse.status);
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('❌ Workflow creation failed with response:', errorText);
          
          // Try to parse the error response as JSON
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            console.warn('⚠️ Could not parse error response as JSON:', parseError);
          }
          
          // Throw the error for any non-200 responses
          throw new Error(errorData?.error || `HTTP ${createResponse.status}: ${createResponse.statusText || 'Bad Request'}`);
        }
         
         const createData = await createResponse.json();
         console.log('📥 Workflow creation response:', createData);
         
         if (createData.success) {
           setWorkflowId(createData.workflow._id);
           setWorkflowStarted(true);
           setCompletedSteps(0); // Start with 0 completed steps
           
           console.log('✅ Workflow created/retrieved successfully for:', schedule.doctor);
           console.log('📊 Initial state: completedSteps = 0, first step should be active');
           console.log('📝 Message:', createData.message);
           
           // Track schedule start activity for new workflow
           try {
             const sessionInfo = getCurrentSessionInfo();
             if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
               await trackScheduleStart(
                 sessionInfo.currentUser.userId,
                 sessionInfo.currentUser.username,
                 schedule._id,
                 schedule.doctor,
                 0,
                 steps[0]?.name || 'Step 1'
               );
             }
           } catch (error) {
             console.warn('⚠️ Failed to track schedule start activity:', error);
           }
           
           // Emit event to update parent component
           window.dispatchEvent(new CustomEvent('workflowStarted', { 
             detail: { 
               scheduleId: schedule._id,
               doctorName: schedule.doctor 
             } 
           }));
         } else {
           console.error('❌ Workflow creation failed:', createData);
           throw new Error(createData.error || 'Failed to create workflow');
         }
      } catch (createError) {
        console.error('❌ Error creating workflow:', createError);
        throw new Error(`Failed to create workflow: ${createError.message}`);
      }
    } catch (err) {
      console.error('Error initializing workflow:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!workflowId) {
      setError('Workflow not initialized');
      return;
    }
    
    // Validate form data - languages not required at step 1
    const isStep1 = completedSteps === 0;
    const requiredFields = isStep1 
      ? (formData.name && formData.date && formData.status && formData.reason)
      : (formData.name && formData.languages && formData.languages.length > 0 && formData.date && formData.status && formData.reason);
    
    console.log('🔍 Form validation:', {
      isStep1,
      name: !!formData.name,
      languages: !!formData.languages,
      languagesLength: formData.languages ? formData.languages.length : 0,
      date: !!formData.date,
      status: !!formData.status,
      reason: !!formData.reason,
      requiredFields
    });
    
    if (requiredFields) {
      try {
        setLoading(true);
        setError(null);
        
        let stepToUpdate;
        let isEditing = false;
        
        if (currentEditingStep > 0) {
          // Editing a previous step
          stepToUpdate = currentEditingStep;
          isEditing = true;
          console.log('📝 Editing step:', stepToUpdate);
        } else {
          // Adding a new step
          stepToUpdate = completedSteps + 1;
          console.log('📝 Submitting form for step:', stepToUpdate);
        }
        
        console.log('📝 Current completedSteps before submission:', completedSteps);
        console.log('📝 Form data being sent:', formData);
        console.log('📝 Languages field type:', typeof formData.languages, 'Value:', formData.languages);
        console.log('📝 Languages isArray:', Array.isArray(formData.languages));
        
        // Ensure languages is always an array before sending
        const cleanFormData = {
          ...formData,
          languages: Array.isArray(formData.languages) ? formData.languages : (formData.languages ? [formData.languages] : [])
        };
        
        console.log('📝 Clean form data being sent:', cleanFormData);
        
        // Update workflow step in database
        const response = await fetch(`/api/workflows/${workflowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stepId: stepToUpdate,
            formData: cleanFormData
          })
        });
        
        const data = await response.json();
        console.log('📡 API Response:', data);
        
        if (data.success) {
          if (isEditing) {
            console.log('✅ Step updated successfully in database');
            
            // Track workflow step edit
            try {
              const sessionInfo = getCurrentSessionInfo();
              if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
                await trackWorkflowStepEdit(
                  sessionInfo.currentUser.userId,
                  sessionInfo.currentUser.username,
                  schedule._id,
                  schedule.doctor,
                  stepToUpdate,
                  steps[stepToUpdate - 1]?.name || `Step ${stepToUpdate}`,
                  `Step ${stepToUpdate} edited by user`
                );
                
                // Track thumbnail-related activities for steps 4 and 5 editing
                if (stepToUpdate === 4) {
                  // Step 4: Thumbnails Editing
                  await trackThumbnailActivity(
                    sessionInfo.currentUser.userId,
                    sessionInfo.currentUser.username,
                    `workflow_${workflowId}_step4_edit`, // Use workflow ID as thumbnail ID for workflow steps
                    schedule.doctor,
                    'workflow_edit',
                    {
                      description: 'Thumbnails editing workflow step edited',
                      stepName: 'Thumbnails Editing',
                      stepNumber: 4,
                      workflowId: workflowId,
                      department: schedule.department,
                      editTime: new Date().toISOString(),
                      editReason: formData.reason || 'User edited step'
                    }
                  );
                } else if (stepToUpdate === 5) {
                  // Step 5: Thumbnail & Spell Check
                  await trackThumbnailActivity(
                    sessionInfo.currentUser.userId,
                    sessionInfo.currentUser.username,
                    `workflow_${workflowId}_step5_edit`, // Use workflow ID as thumbnail ID for workflow steps
                    schedule.doctor,
                    'workflow_check',
                    {
                      description: 'Thumbnail & Spell Check workflow step edited',
                      stepName: 'Thumbnail & Spell Check',
                      stepNumber: 5,
                      workflowId: workflowId,
                      department: schedule.department,
                      editTime: new Date().toISOString(),
                      editReason: formData.reason || 'User edited step'
                    }
                  );
                }
              }
            } catch (error) {
              console.warn('⚠️ Failed to track workflow step edit:', error);
            }
            
            alert(`Step ${stepToUpdate} updated successfully!`);
            // Go back to current step after editing
            goToCurrentStep();
          } else {
            console.log('✅ Step completed successfully in database');
            console.log('📊 Database response:', data);
            
            // Track workflow step completion
            try {
              const sessionInfo = getCurrentSessionInfo();
              if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
                await trackWorkflowStepComplete(
                  sessionInfo.currentUser.userId,
                  sessionInfo.currentUser.username,
                  schedule._id,
                  schedule.doctor,
                  stepToUpdate,
                  steps[stepToUpdate - 1]?.name || `Step ${stepToUpdate}`
                );
                
                // Track thumbnail-related activities for steps 4 and 5
                if (stepToUpdate === 4) {
                  // Step 4: Thumbnails Editing
                  await trackThumbnailActivity(
                    sessionInfo.currentUser.userId,
                    sessionInfo.currentUser.username,
                    `workflow_${workflowId}_step4`, // Use workflow ID as thumbnail ID for workflow steps
                    schedule.doctor,
                    'workflow_edit',
                    {
                      description: 'Thumbnails editing workflow step completed',
                      stepName: 'Thumbnails Editing',
                      stepNumber: 4,
                      workflowId: workflowId,
                      department: schedule.department,
                      completionTime: new Date().toISOString()
                    }
                  );
                } else if (stepToUpdate === 5) {
                  // Step 5: Thumbnail & Spell Check
                  await trackThumbnailActivity(
                    sessionInfo.currentUser.userId,
                    sessionInfo.currentUser.username,
                    `workflow_${workflowId}_step5`, // Use workflow ID as thumbnail ID for workflow steps
                    schedule.doctor,
                    'workflow_check',
                    {
                      description: 'Thumbnail & Spell Check workflow step completed',
                      stepName: 'Thumbnail & Spell Check',
                      stepNumber: 5,
                      workflowId: workflowId,
                      department: schedule.department,
                      completionTime: new Date().toISOString()
                    }
                  );
                }
              }
            } catch (error) {
              console.warn('⚠️ Failed to track workflow step completion:', error);
            }
            
            // Update local state
            setCompletedSteps(prev => {
              const newValue = prev + 1;
              console.log('🔄 Updating completedSteps from', prev, 'to', newValue);
              return newValue;
            });
            
             // If step 2 is completed, automatically update step 1 status to "completed"
             if (stepToUpdate === 2) {
               console.log('🔄 Step 2 completed, automatically updating step 1 status to completed');
               // Update step 1 status in the database to "completed"
               updateStep1Status();
             }
             
             // Reset form for next step - keep languages if moving to step 2
            setFormData({
              name: '',
               languages: stepToUpdate === 2 ? formData.languages : [],
              date: '',
              status: '',
              reason: ''
            });
            
            // Show success message
             if (stepToUpdate === 2) {
               alert(`Step ${stepToUpdate} completed successfully! Step 1 has been automatically updated to "completed" status. Moving to next step.`);
             } else {
            alert(`Step ${stepToUpdate} completed successfully! Moving to next step.`);
             }
            
            // If all steps are completed, show completion message
            if (stepToUpdate >= steps.length) {
              // Track schedule completion
              try {
                const sessionInfo = getCurrentSessionInfo();
                if (sessionInfo.currentUser && sessionInfo.currentUser.userId) {
                  const totalDuration = Date.now() - new Date(sessionInfo.sessionStart).getTime();
                  await trackScheduleComplete(
                    sessionInfo.currentUser.userId,
                    sessionInfo.currentUser.username,
                    schedule._id,
                    schedule.doctor,
                    totalDuration,
                    stepToUpdate,
                    steps[stepToUpdate - 1]?.name || `Step ${stepToUpdate}`
                  );
                }
              } catch (error) {
                console.warn('⚠️ Failed to track schedule completion:', error);
              }
              
              setTimeout(() => {
                alert('Congratulations! All workflow steps have been completed!');
                // Emit event when workflow is completed
                window.dispatchEvent(new CustomEvent('workflowCompleted', { 
                  detail: { 
                    scheduleId: schedule._id,
                    doctorName: schedule.doctor 
                  } 
                }));
                onClose();
              }, 1000);
            }
          }
        } else {
          console.error('❌ API Error Response:', data);
          throw new Error(data.error || 'Failed to update workflow');
        }
      } catch (err) {
        console.error('Error updating workflow:', err);
        setError(err.message);
        alert(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please fill in all required fields before submitting.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl max-h-[90vh] overflow-y-auto backdrop-blur-sm">
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-2xl p-6 border-b border-indigo-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                
              </div>
              <h2 className="text-2xl font-bold">Workflow Tracking</h2>
            </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 text-white hover:text-gray-200 transition-all duration-200 flex items-center justify-center hover:scale-110"
                  title="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
          </div>
        </div>

        {/* Schedule Details Section */}
        {schedule && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Schedule Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-semibold text-gray-700">Doctor Name</span>
                </div>
                <p className="text-gray-800 text-lg">{schedule.doctor}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-semibold text-gray-700">Department</span>
                </div>
                <p className="text-gray-800 text-lg">{schedule.department}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-gray-700">Questions ({schedule.question ? schedule.question.length : 0})</span>
                </div>
                <div className="space-y-2">
                  {schedule.question && Array.isArray(schedule.question) ? (
                    schedule.question.map((q, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{q}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No questions available</p>
                  )}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="font-semibold text-gray-700">Languages</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {schedule.languages && Array.isArray(schedule.languages) ? (
                    schedule.languages.map((lang, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {lang}
                      </span>
                    ))
                  ) : schedule.languages ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {schedule.languages}
                    </span>
                  ) : (
                    <p className="text-gray-500 italic">No languages specified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-6 sm:mb-8 text-center">Current Progress</h3>
          
          {/* Loading State */}
          {loading && (
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-blue-100 border border-blue-200 rounded-full">
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-700 font-medium text-sm sm:text-base">Initializing workflow...</span>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-100 border border-red-200 rounded-full">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 font-medium text-sm sm:text-base">Error: {error}</span>
              </div>
            </div>
          )}
          
          {/* Progress Info */}
          {!loading && !error && (
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-100 border border-blue-200 rounded-full">
                <span className="text-blue-700 font-medium text-sm sm:text-base">
                  {completedSteps === 0 ? 'Starting workflow...' : 
                   completedSteps === steps.length ? 'All steps completed!' :
                   `Step ${completedSteps + 1} of ${steps.length} - ${steps[completedSteps].name}`}
                </span>
              </div>
              
              {/* Debug Info */}
              {/* <div className="mt-2 text-xs text-gray-500">
                Debug: completedSteps = {completedSteps}, workflowId = {workflowId ? 'Set' : 'Not Set'}
              </div> */}
            </div>
          )}
          
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8 flex-wrap justify-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center mb-4">
                  {/* Step Circle */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 mb-2 sm:mb-3 ${
                    getStepStatus(step.id) === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-200' : 
                    getStepStatus(step.id) === 'going' ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-200' :
                    getStepStatus(step.id) === 'active' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-200 animate-pulse' : 
                    getStepStatus(step.id) === 'failed' ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-red-200' :
                    'bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-200'
                  }`}>
                    {getStepStatus(step.id) === 'completed' && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {getStepStatus(step.id) === 'going' && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {getStepStatus(step.id) === 'active' && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {getStepStatus(step.id) === 'failed' && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs font-medium text-center max-w-20 sm:max-w-24 transition-all duration-300 ${
                    getStepStatus(step.id) === 'completed' ? 'bg-green-100 border border-green-200 text-green-700' :
                     getStepStatus(step.id) === 'going' ? 'bg-orange-100 border border-orange-200 text-orange-700' :
                    getStepStatus(step.id) === 'active' ? 'bg-blue-100 border border-blue-200 text-blue-700' :
                    getStepStatus(step.id) === 'failed' ? 'bg-red-100 border border-red-200 text-red-700' :
                    'bg-gray-100 border border-gray-200 text-gray-600'
                  }`}>
                    {step.name}
                     {/* Show status indicator for completed steps */}
                     {getStepStatus(step.id) === 'completed' && (
                       <div className="text-xs text-green-600 mt-1">
                         ✓ Completed
                       </div>
                     )}
                     {getStepStatus(step.id) === 'going' && (
                       <div className="text-xs text-orange-600 mt-1">
                         🔄 Going
                       </div>
                     )}
                  </div>
                  
                  {/* Edit Button for completed steps */}
                  {getStepStatus(step.id) === 'completed' && (
                    <button
                      onClick={() => editStep(step.id)}
                      className="mt-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200"
                      title={`Edit Step ${step.id}`}
                    >
                      Edit
                    </button>
                  )}
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-12 lg:w-16 h-0.5 rounded-full transition-all duration-300 ${
                      getStepStatus(step.id) === 'completed' ? 'bg-green-400' : 
                       getStepStatus(step.id) === 'going' ? 'bg-orange-400' :
                      getStepStatus(step.id) === 'failed' ? 'bg-red-400' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 bg-white">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center">
            {currentEditingStep > 0 ? `Editing Step ${currentEditingStep}: ${steps[currentEditingStep - 1].name}` :
             completedSteps === 0 ? 'Workflow Details - Step 1' : 
             completedSteps === steps.length ? 'All Steps Completed!' :
             `Workflow Details - Step ${completedSteps + 1}: ${steps[completedSteps].name}`}
          </h3>
          
          {/* Show edit mode indicator and back button */}
          {currentEditingStep > 0 && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-100 border border-blue-200 rounded-lg">
                <span className="text-blue-700 text-sm font-medium">
                  📝 Editing Step {currentEditingStep}
                </span>
                <button
                  type="button"
                  onClick={goToCurrentStep}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors duration-200"
                >
                  Back to Current Step
                </button>
              </div>
            </div>
          )}
          
          {/* Show completion message if all steps are done */}
          {completedSteps === steps.length && (
            <div className="text-center mb-6 sm:mb-8 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-green-800 mb-2">🎉 Workflow Completed!</h4>
              <p className="text-green-600 text-sm sm:text-base">All workflow steps have been successfully completed.</p>
            </div>
          )}
          
          {/* Hide form if all steps are completed */}
          {completedSteps < steps.length && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    <span className="text-indigo-600">*</span> Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {/* Languages Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    <span className="text-indigo-600">*</span> Languages
                     {(completedSteps === 0 || currentEditingStep === 1) && (
                       <span className="ml-2 text-xs text-gray-500">
                         {currentEditingStep === 1 ? '(Not available for Step 1)' : '(Available from Step 2)'}
                       </span>
                     )}
                  </label>
                  <select
                    name="languages"
                     multiple
                    value={formData.languages}
                     onChange={(e) => {
                       const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                       setFormData(prev => ({
                         ...prev,
                         languages: selectedOptions
                       }));
                     }}
                     disabled={completedSteps === 0 || (currentEditingStep === 1)}
                     className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl transition-all duration-200 ${
                       (completedSteps === 0 || currentEditingStep === 1)
                         ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' 
                         : 'border-gray-200 bg-gray-50 hover:bg-white cursor-pointer focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500'
                     }`}
                    required
                  >
                    {schedule && schedule.languages && Array.isArray(schedule.languages) ? (
                      schedule.languages.map((lang, index) => (
                        <option key={index} value={lang}>{lang}</option>
                      ))
                    ) : schedule && schedule.languages ? (
                      <option value={schedule.languages}>{schedule.languages}</option>
                    ) : (
                      <>
                        <option value="telugu">Telugu</option>
                        <option value="english">English</option>
                        <option value="hindi">Hindi</option>
                      </>
                    )}
                  </select>
                  <p className="text-xs text-gray-500">
                    Hold Ctrl (or Cmd on Mac) to select multiple languages
                  </p>
                </div>

                {/* Date Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    <span className="text-indigo-600">*</span> Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white cursor-pointer"
                    required
                  />
                </div>

                {/* Status Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    <span className="text-indigo-600">*</span> Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="going">Going</option>
                    <option value="completed">Completed</option>
                    <option value="incomplete">In Complete</option>
                  </select>
                </div>
              </div>

                             {/* Reason Field */}
               <div className="mt-6 sm:mt-8 space-y-2">
                 <label className="block text-sm font-semibold text-gray-700">
                   <span className="text-indigo-600">*</span> Reason
                 </label>
                 
                 {/* Reason field with integrated microphone */}
                 <div className="relative">
                   <textarea
                     name="reason"
                     value={formData.reason}
                     onChange={handleInputChange}
                     rows="4"
                     className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                     placeholder="Please provide a detailed reason for this workflow status..."
                     required
                   />
                   
                   {/* Microphone button inside the textarea */}
                   <button
                     type="button"
                     onClick={isRecording ? stopRecording : startRecording}
                     disabled={!recognition}
                     className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                       isRecording 
                         ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                         : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                     } ${!recognition ? 'opacity-50 cursor-not-allowed' : ''}`}
                     title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                   >
                     {isRecording ? (
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-2 0v4a1 1 0 001 1h4a1 1 0 001-1V7a1 1 0 00-2 0v3H8V7z" clipRule="evenodd" />
                       </svg>
                     ) : (
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                       </svg>
                     )}
                   </button>
                 </div>
                 
                 {/* Recording indicator below the field */}
                 {isRecording && (
                   <div className="flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-200 rounded-lg">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                     <span className="text-red-700 text-sm font-medium">Recording... Click the microphone again to stop</span>
                   </div>
                 )}
                 
                 {/* Voice-to-text status */}
                 {!recognition && (
                   <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                     <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                     </svg>
                     Voice-to-text is not supported in your browser. Please use Chrome or Edge for this feature.
                   </div>
                 )}
               </div>

              {/* Submit Button */}
              <div className="mt-8 sm:mt-10 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl focus:ring-4 focus:ring-indigo-200 ${
                    loading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    currentEditingStep > 0 ? 'Update Step' :
                    completedSteps === steps.length - 1 ? 'Complete Final Step' : 'Submit & Continue'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default StartPage;
