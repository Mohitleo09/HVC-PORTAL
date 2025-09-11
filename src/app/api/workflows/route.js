import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import Workflow from '../../utils/models/Workflow';
import Schedule from '../../utils/models/Schedule';
import ScheduleActivity from '../../utils/models/ScheduleActivity';
import { initializeServerDatabase } from '../../utils/config/initServer';
import { NODE_ENV } from '../../utils/config/environment.js';

// GET all workflows
export async function GET(request) {
  try {
    console.log('🔍 GET /api/workflows - Starting request...');
    
    // Get query parameters for user tracking
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const doctorName = searchParams.get('doctorName');
    
    // Simple health check first
    console.log('🏥 API route is accessible');
    
    // Ensure database is initialized
    try {
      await initializeServerDatabase();
      console.log('✅ Database initialization verified');
    } catch (initError) {
      console.warn('⚠️ Database initialization warning:', initError.message);
    }
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    await DBConnection();
    console.log('✅ Database connection successful');
    
    // Test if Workflow model is available
    if (!Workflow) {
      console.error('❌ Workflow model is not available');
      return NextResponse.json(
        { success: false, error: 'Workflow model not available' },
        { status: 500 }
      );
    }
    
    console.log('🔍 Fetching workflows from database...');
    let workflows = await Workflow.find({})
      .populate('scheduleId', 'doctor department question languages')
      .sort({ lastUpdated: -1 });
    
    console.log(`✅ Found ${workflows.length} workflows`);
    
    // Filter out workflows with invalid scheduleId references
    const validWorkflows = workflows.filter(workflow => {
      if (!workflow.scheduleId) {
        console.warn('⚠️ Workflow has no scheduleId:', workflow._id);
        return false;
      }
      return true;
    });
    
    console.log(`✅ Valid workflows (with scheduleId): ${validWorkflows.length}`);
    
    // Log invalid workflows for debugging
    const invalidWorkflows = workflows.filter(workflow => !workflow.scheduleId);
    if (invalidWorkflows.length > 0) {
      console.warn('⚠️ Found workflows with invalid scheduleId references:', 
        invalidWorkflows.map(w => ({ _id: w._id, doctorName: w.doctorName, departmentName: w.departmentName }))
      );
    }
    
    // Log some workflow details for debugging
    if (validWorkflows.length > 0) {
      console.log('🔍 Sample workflow scheduleId:', {
        workflowId: validWorkflows[0]._id,
        scheduleId: validWorkflows[0].scheduleId,
        scheduleIdType: typeof validWorkflows[0].scheduleId,
        scheduleIdIsObject: validWorkflows[0].scheduleId && typeof validWorkflows[0].scheduleId === 'object',
        hasScheduleId: !!validWorkflows[0].scheduleId
      });
    }
    
    // Use only valid workflows
    workflows = validWorkflows;

    // Track workflow view activity if user information is provided
    if (userId && username) {
      try {
        const scheduleActivity = new ScheduleActivity({
          userId: userId,
          username: username,
          scheduleId: 'all_workflows',
          doctorName: doctorName || username,
          action: 'workflow_view',
          details: {
            page: 'workflow_management',
            notes: `Viewed all workflows (${workflows.length} workflows found)`,
            workflowData: {
              totalWorkflows: workflows.length,
              validWorkflows: workflows.length,
              invalidWorkflows: invalidWorkflows.length,
              timestamp: new Date().toISOString()
            }
          },
          status: 'success'
        });
        
        await scheduleActivity.save();
        console.log('✅ Workflow view activity tracked for user:', username);
      } catch (activityError) {
        console.error('❌ Failed to track workflow view activity:', activityError);
        // Don't fail the main operation if activity tracking fails
      }
    }
    
    // Add metadata about data quality
    const responseData = {
      success: true, 
      workflows,
      count: workflows.length,
      metadata: {
        totalFound: workflows.length + invalidWorkflows.length,
        validCount: workflows.length,
        invalidCount: invalidWorkflows.length,
        hasDataQualityIssues: invalidWorkflows.length > 0
      }
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Error in GET /api/workflows:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return proper error response
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch workflows: ${error.message}`,
        details: NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new workflow
export async function POST(request) {
  try {
    // Ensure database is initialized
    await initializeServerDatabase();
    
    await DBConnection();
    const body = await request.json();
    
    console.log('📥 Creating workflow with data:', body);
    
    const { scheduleId, doctorName, departmentName } = body;
    
    // Validate required fields
    if (!scheduleId || !doctorName || !departmentName) {
      console.error('❌ Missing required fields:', { scheduleId, doctorName, departmentName });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: scheduleId, doctorName, departmentName' },
        { status: 400 }
      );
    }
    
        // Initialize workflow steps
    const steps = [
      { stepId: 1, stepName: 'Going To Shoot', status: 'pending' },
      { stepId: 2, stepName: 'Shoot Completed', status: 'pending' },
      { stepId: 3, stepName: 'Video/Shorts Editing', status: 'pending' },
      { stepId: 4, stepName: 'Thumbnails Editing', status: 'pending' },
      { stepId: 5, stepName: 'Thumbnail & Spell Check', status: 'pending' },
      { stepId: 6, stepName: 'SEO Keywords', status: 'pending' },
      { stepId: 7, stepName: 'Upload Videos', status: 'pending' }
    ];
    
    // Set first step as active
    steps[0].status = 'active';
    
    console.log('📋 Creating workflow with steps:', steps);
    
    // Use findOneAndUpdate with upsert: true to handle race conditions atomically
    // This ensures only one workflow is created even if multiple requests arrive simultaneously
    let workflow;
    try {
      workflow = await Workflow.findOneAndUpdate(
        { 
          scheduleId, 
          doctorName 
        },
        {
          scheduleId,
          doctorName,
          departmentName,
          steps,
          workflowStatus: 'in_progress',
          currentStep: 0,
          lastUpdated: new Date()
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    } catch (dbError) {
      // Handle potential duplicate key errors (race condition)
      if (dbError.code === 11000) {
        console.log('🔄 Duplicate key error detected, fetching existing workflow...');
        workflow = await Workflow.findOne({ scheduleId, doctorName });
        if (!workflow) {
          throw new Error('Failed to create or retrieve workflow after duplicate key error');
        }
      } else {
        throw dbError;
      }
    }
    
    console.log('✅ Workflow created/updated successfully:', workflow._id);

    // Track workflow creation/start activity
    try {
      const scheduleActivity = new ScheduleActivity({
        userId: doctorName,
        username: doctorName,
        scheduleId: scheduleId,
        doctorName: doctorName,
        action: 'workflow_start',
        details: {
          page: 'workflow_management',
          notes: `Started workflow for ${departmentName} department`,
          workflowData: {
            workflowId: workflow._id.toString(),
            scheduleId: scheduleId,
            doctorName: doctorName,
            departmentName: departmentName,
            currentStep: workflow.currentStep,
            totalSteps: workflow.steps.length,
            workflowStatus: workflow.workflowStatus,
            timestamp: new Date().toISOString()
          }
        },
        workflowId: workflow._id.toString(),
        stepNumber: workflow.currentStep,
        stepName: workflow.steps[workflow.currentStep]?.stepName || 'Workflow Start',
        status: 'success'
      });
      
      await scheduleActivity.save();
      console.log('✅ Workflow start activity tracked');
    } catch (activityError) {
      console.error('❌ Failed to track workflow start activity:', activityError);
      // Don't fail the main operation if activity tracking fails
    }
    
    return NextResponse.json({ 
      success: true, 
      workflow,
      message: workflow.createdAt === workflow.updatedAt ? 'Workflow created successfully for this doctor' : 'Workflow already existed and was retrieved'
    });
  } catch (error) {
    console.error('❌ Error creating workflow:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { success: false, error: `Failed to create workflow: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT update workflow
export async function PUT(request) {
  try {
    await initializeServerDatabase();
    await DBConnection();
    const body = await request.json();
    
    const { workflowId, updates } = body;
    
    if (!workflowId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Workflow ID and updates are required' },
        { status: 400 }
      );
    }
    
    const updatedWorkflow = await Workflow.findByIdAndUpdate(
      workflowId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!updatedWorkflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Workflow updated successfully:', updatedWorkflow._id);
    
    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating workflow:', error);
    return NextResponse.json(
      { success: false, error: `Failed to update workflow: ${error.message}` },
      { status: 500 }
    );
  }
}

// PATCH update workflow step
export async function PATCH(request) {
  try {
    await initializeServerDatabase();
    await DBConnection();
    const body = await request.json();
    
    const { workflowId, stepId, status } = body;
    
    if (!workflowId || !stepId || !status) {
      return NextResponse.json(
        { success: false, error: 'Workflow ID, step ID, and status are required' },
        { status: 400 }
      );
    }
    
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    // Find and update the specific step
    const step = workflow.steps.find(s => s.stepId === stepId);
    if (!step) {
      return NextResponse.json(
        { success: false, error: 'Step not found' },
        { status: 404 }
      );
    }
    
    step.status = status;
    
    // Update workflow status based on step completion
    if (status === 'completed') {
      const allStepsCompleted = workflow.steps.every(s => s.status === 'completed');
      if (allStepsCompleted) {
        workflow.workflowStatus = 'completed';
      }
    }
    
    await workflow.save();
    
    console.log('✅ Workflow step updated successfully:', { workflowId, stepId, status });

    // Track workflow step update activity
    try {
      const scheduleActivity = new ScheduleActivity({
        userId: workflow.doctorName,
        username: workflow.doctorName,
        scheduleId: workflow.scheduleId?.toString() || 'unknown',
        doctorName: workflow.doctorName,
        action: 'workflow_step_complete',
        details: {
          page: 'workflow_management',
          notes: `Updated step ${stepId} to ${status} for ${workflow.doctorName}`,
          workflowData: {
            workflowId: workflowId,
            stepId: stepId,
            stepName: step.stepName,
            status: status,
            workflowStatus: workflow.workflowStatus,
            currentStep: workflow.currentStep,
            totalSteps: workflow.steps.length,
            timestamp: new Date().toISOString()
          }
        },
        workflowId: workflowId,
        stepNumber: stepId,
        stepName: step.stepName,
        status: status === 'completed' ? 'completed' : 'in_progress'
      });
      
      await scheduleActivity.save();
      console.log('✅ Workflow step update activity tracked');
    } catch (activityError) {
      console.error('❌ Failed to track workflow step update activity:', activityError);
      // Don't fail the main operation if activity tracking fails
    }
    
    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow step updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating workflow step:', error);
    return NextResponse.json(
      { success: false, error: `Failed to update workflow step: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE all workflows (for testing)
export async function DELETE() {
  try {
    await initializeServerDatabase();
    await DBConnection();
    console.log('🗑️ Clearing all workflows from database...');
    
    const result = await Workflow.deleteMany({});
    
    console.log('✅ Cleared workflows:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${result.deletedCount} workflows`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing workflows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear workflows' },
      { status: 500 }
    );
  }
}
