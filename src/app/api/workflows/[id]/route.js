import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import Workflow from '../../../utils/models/Workflow';

// GET specific workflow by ID
export async function GET(request, { params }) {
  try {
    await DBConnection();
    const { id } = params;
    
    const workflow = await Workflow.findById(id)
      .populate('scheduleId', 'doctor department question languages');
    
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      workflow 
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

// PUT update workflow step
export async function PUT(request, { params }) {
  try {
    console.log('🔍 PUT /api/workflows/[id] - Starting...');
    
    await DBConnection();
    console.log('✅ Database connection established');
    
    const { id } = params;
    const body = await request.json();
    
    const { stepId, formData } = body;
    
    console.log('🔍 PUT /api/workflows/[id] - Updating workflow:', { id, stepId, formData });
    
    if (!stepId || !formData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: stepId and formData' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Looking for workflow with ID:', id);
    const workflow = await Workflow.findById(id);
    console.log('🔍 Workflow found:', workflow ? 'Yes' : 'No');
    console.log('🔍 Workflow model schema:', Workflow.schema ? 'Available' : 'Not available');
    
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    console.log('🔍 Found workflow:', { 
      currentStep: workflow.currentStep, 
      totalSteps: workflow.totalSteps,
      workflowStatus: workflow.workflowStatus 
    });
    
    // Initialize steps array if it doesn't exist
    if (!workflow.steps || workflow.steps.length === 0) {
      workflow.steps = [
        { stepId: 1, stepName: 'Going To Shoot', status: 'pending' },
        { stepId: 2, stepName: 'Shoot Completed', status: 'pending' },
        { stepId: 3, stepName: 'Video/Shorts Editing', status: 'pending' },
        { stepId: 4, stepName: 'Thumbnails Editing', status: 'pending' },
        { stepId: 5, stepName: 'Thumbnail & Spell Check', status: 'pending' },
        { stepId: 6, stepName: 'SEO Keywords', status: 'pending' },
        { stepId: 7, stepName: 'Upload Videos', status: 'pending' }
      ];
    } else {
      // Ensure all existing steps have the correct schema structure
      workflow.steps.forEach(step => {
        if (step.formData && step.formData.languages && !Array.isArray(step.formData.languages)) {
          console.log(`🔧 Fixing languages field for step ${step.stepId} from:`, step.formData.languages);
          step.formData.languages = [step.formData.languages];
        }
      });
    }
    
    // Complete the current step
    console.log('🔍 About to complete step with formData:', formData);
    console.log('🔍 Languages field type:', typeof formData.languages, 'Value:', formData.languages);
    
    // Ensure languages is always an array
    if (formData.languages && !Array.isArray(formData.languages)) {
      formData.languages = [formData.languages];
    }
    
    // Create a clean formData object to ensure schema compliance
    const cleanFormData = {
      name: formData.name || '',
      languages: Array.isArray(formData.languages) ? formData.languages : (formData.languages ? [formData.languages] : []),
      date: formData.date || null,
      status: formData.status || '',
      reason: formData.reason || ''
    };
    
    console.log('🔍 Clean formData for step:', cleanFormData);
    
    workflow.completeStep(stepId, cleanFormData);
    
    console.log('✅ Step completed, new currentStep:', workflow.currentStep);
    
    // Debug the completed step data
    const completedStep = workflow.steps.find(s => s.stepId === stepId);
    console.log('🔍 Step data after completion:', completedStep);
    if (completedStep && completedStep.formData) {
      console.log('🔍 FormData languages type:', typeof completedStep.formData.languages);
      console.log('🔍 FormData languages value:', completedStep.formData.languages);
      console.log('🔍 FormData languages isArray:', Array.isArray(completedStep.formData.languages));
    }
    
    // Validate the workflow before saving
    try {
      await workflow.validate();
      console.log('✅ Workflow validation passed');
    } catch (validationError) {
      console.error('❌ Workflow validation failed:', validationError);
      
      // If validation fails due to languages field, try to fix it
      if (validationError.message.includes('languages') && validationError.message.includes('Cast to string failed')) {
        console.log('🔧 Attempting to fix languages field validation issue...');
        
        // Find and fix the problematic step
        const problematicStep = workflow.steps.find(s => s.stepId === stepId);
        if (problematicStep && problematicStep.formData && problematicStep.formData.languages) {
          if (!Array.isArray(problematicStep.formData.languages)) {
            problematicStep.formData.languages = [problematicStep.formData.languages];
          }
          
          // Try validation again
          try {
            await workflow.validate();
            console.log('✅ Workflow validation passed after fix');
          } catch (retryError) {
            console.error('❌ Workflow validation still failed after fix:', retryError);
            throw new Error(`Validation failed after fix: ${retryError.message}`);
          }
        }
      } else {
        throw new Error(`Validation failed: ${validationError.message}`);
      }
    }
    
    await workflow.save();
    
    return NextResponse.json({ 
      success: true, 
      workflow,
      message: `Step ${stepId} completed successfully`,
      currentStep: workflow.currentStep,
      workflowStatus: workflow.workflowStatus
    });
  } catch (error) {
    console.error('❌ Error updating workflow:', error);
    return NextResponse.json(
      { success: false, error: `Failed to update workflow: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE workflow
export async function DELETE(request, { params }) {
  try {
    await DBConnection();
    const { id } = params;
    
    const workflow = await Workflow.findByIdAndDelete(id);
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Workflow deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
