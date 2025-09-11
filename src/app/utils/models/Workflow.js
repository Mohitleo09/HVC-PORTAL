import mongoose from 'mongoose';

const workflowStepSchema = new mongoose.Schema({
  stepId: {
    type: Number,
    required: true
  },
  stepName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'failed'],
    default: 'pending'
  },
  completedAt: {
    type: Date,
    default: null
  },
  formData: {
    name: String,
    languages: [String],
    date: Date,
    status: String,
    reason: String
  }
});

const workflowSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  departmentName: {
    type: String,
    required: true
  },
  currentStep: {
    type: Number,
    default: 0
  },
  totalSteps: {
    type: Number,
    default: 7
  },
  workflowStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  steps: [workflowStepSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to update lastUpdated and fix data types
workflowSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  
  // Ensure all steps have correct data types
  if (this.steps && Array.isArray(this.steps)) {
    this.steps.forEach(step => {
      if (step.formData && step.formData.languages) {
        // Ensure languages is always an array
        if (!Array.isArray(step.formData.languages)) {
          step.formData.languages = [step.formData.languages];
        }
      }
    });
  }
  
  next();
});

// Method to get current step status
workflowSchema.methods.getCurrentStepStatus = function() {
  if (this.currentStep === 0) return 'not_started';
  if (this.currentStep >= this.totalSteps) return 'completed';
  return 'in_progress';
};

// Method to complete a step
workflowSchema.methods.completeStep = function(stepId, formData) {
  const step = this.steps.find(s => s.stepId === stepId);
  if (step) {
    step.status = 'completed';
    step.completedAt = new Date();
    step.formData = formData;
    this.currentStep = stepId;
    this.lastUpdated = new Date();
    
    if (this.currentStep >= this.totalSteps) {
      this.workflowStatus = 'completed';
      this.completedAt = new Date();
      
      // Create media records when workflow is completed
      this.createMediaRecords();
    } else {
      this.workflowStatus = 'in_progress';
    }
  }
  return this;
};

// Method to create media records when workflow is completed
workflowSchema.methods.createMediaRecords = async function() {
  try {
    // Import models dynamically to avoid circular dependencies
    const Video = mongoose.models.Video || require('./Video.js').default;
    const Short = mongoose.models.Short || require('./Short.js').default;
    
    // Create a video record
    const videoData = {
      title: `Video - ${this.doctorName} - ${this.departmentName}`,
      status: 'completed',
      doctorName: this.doctorName,
      departmentName: this.departmentName,
      scheduleId: this.scheduleId,
      completedAt: this.completedAt,
      description: `Completed workflow for ${this.doctorName} in ${this.departmentName}`,
      tags: [this.departmentName, this.doctorName, 'workflow-completed']
    };
    
    // Create a short record
    const shortData = {
      title: `Short - ${this.doctorName} - ${this.departmentName}`,
      status: 'completed',
      doctorName: this.doctorName,
      departmentName: this.departmentName,
      scheduleId: this.scheduleId,
      completedAt: this.completedAt,
      description: `Completed workflow for ${this.doctorName} in ${this.departmentName}`,
      tags: [this.departmentName, this.doctorName, 'workflow-completed']
    };
    
    // Save both records
    await Video.create(videoData);
    await Short.create(shortData);
    
    console.log(`✅ Created media records for completed workflow: ${this.doctorName} - ${this.departmentName}`);
    
    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mediaUpdated', {
        detail: { workflowId: this._id, doctorName: this.doctorName }
      }));
    }
    
  } catch (error) {
    console.error('❌ Error creating media records:', error);
  }
};

// Static method to create media records for existing completed workflows
workflowSchema.statics.createMediaForCompletedWorkflows = async function() {
  try {
    const Video = mongoose.models.Video || require('./Video.js').default;
    const Short = mongoose.models.Short || require('./Short.js').default;
    
    // Find all completed workflows that don't have media records yet
    const completedWorkflows = await this.find({ 
      workflowStatus: 'completed',
      completedAt: { $exists: true }
    });
    
    console.log(`🔍 Found ${completedWorkflows.length} completed workflows to process`);
    
    for (const workflow of completedWorkflows) {
      try {
        // Check if media records already exist for this workflow
        const existingVideo = await Video.findOne({ 
          scheduleId: workflow.scheduleId,
          doctorName: workflow.doctorName,
          status: 'completed'
        });
        
        const existingShort = await Short.findOne({ 
          scheduleId: workflow.scheduleId,
          doctorName: workflow.doctorName,
          status: 'completed'
        });
        
        // Only create if they don't exist
        if (!existingVideo) {
          const videoData = {
            title: `Video - ${workflow.doctorName} - ${workflow.departmentName}`,
            status: 'completed',
            doctorName: workflow.doctorName,
            departmentName: workflow.departmentName,
            scheduleId: workflow.scheduleId,
            completedAt: workflow.completedAt,
            description: `Completed workflow for ${workflow.doctorName} in ${workflow.departmentName}`,
            tags: [workflow.departmentName, workflow.doctorName, 'workflow-completed']
          };
          await Video.create(videoData);
          console.log(`✅ Created video record for existing completed workflow: ${workflow.doctorName}`);
        }
        
        if (!existingShort) {
          const shortData = {
            title: `Short - ${workflow.doctorName} - ${workflow.departmentName}`,
            status: 'completed',
            doctorName: workflow.doctorName,
            departmentName: workflow.departmentName,
            scheduleId: workflow.scheduleId,
            completedAt: workflow.completedAt,
            description: `Completed workflow for ${workflow.doctorName} in ${workflow.departmentName}`,
            tags: [workflow.departmentName, workflow.doctorName, 'workflow-completed']
          };
          await Short.create(shortData);
          console.log(`✅ Created short record for existing completed workflow: ${workflow.doctorName}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing workflow ${workflow._id}:`, error);
      }
    }
    
    console.log(`✅ Finished processing ${completedWorkflows.length} completed workflows`);
    
  } catch (error) {
    console.error('❌ Error in createMediaForCompletedWorkflows:', error);
  }
};

// Create unique compound index to prevent duplicate workflows for the same doctor and schedule
workflowSchema.index({ scheduleId: 1, doctorName: 1 }, { unique: true });

const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);

export default Workflow;
