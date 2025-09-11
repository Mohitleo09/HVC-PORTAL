import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import Schedule from '@/app/utils/models/Schedule';
import ScheduleActivity from '@/app/utils/models/ScheduleActivity';
import { MONGODB_URI } from '@/app/utils/config/environment.js';

export async function GET(request) {
  try {
    console.log('GET /api/schedule - Starting request...');
    
    // Get query parameters for user tracking
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    
    if (!MONGODB_URI) {
      return NextResponse.json({ 
        success: false,
        error: 'Database not configured' 
      }, { status: 500 });
    }
    
    try {
      console.log('MONGODB_URI found, attempting MongoDB connection...');
      await DBConnection();
      const schedules = await Schedule.find({ status: "Active" }).sort({ createdAt: -1 });
      
      console.log('GET /api/schedule - MongoDB: Current schedules count:', schedules.length);
      console.log('MongoDB schedules:', schedules);

      // Track schedule view activity if user information is provided
      if (userId && username) {
        try {
          const scheduleActivity = new ScheduleActivity({
            userId: userId,
            username: username,
            scheduleId: 'all_schedules',
            doctorName: username,
            action: 'schedule_view',
            details: {
              page: 'schedule_management',
              notes: `Viewed all schedules (${schedules.length} schedules found)`,
              scheduleData: {
                totalSchedules: schedules.length,
                activeSchedules: schedules.filter(s => s.status === 'Active').length,
                timestamp: new Date().toISOString()
              }
            },
            status: 'success'
          });
          
          await scheduleActivity.save();
          console.log('✅ Schedule view activity tracked for user:', username);
        } catch (activityError) {
          console.error('❌ Failed to track schedule view activity:', activityError);
          // Don't fail the main operation if activity tracking fails
        }
      }
      
      return NextResponse.json({ 
        success: true,
        schedules: schedules,
        count: schedules.length,
        timestamp: new Date().toISOString(),
        source: 'mongodb'
      });
    } catch (dbError) {
      console.error('MongoDB connection failed:', dbError);
      console.error('MongoDB error details:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed',
        details: dbError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/schedule:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch schedules',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('POST /api/schedule - Starting schedule creation...');
    
    const body = await request.json();
    console.log('Request body received:', body);
    
    const { department, doctor, languages, question, date } = body;

    // Validate required fields
    if (!department || !doctor || !languages || !question || !date) {
      console.error('Missing required fields:', { department, doctor, languages, question, date });
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate arrays
    if (!Array.isArray(languages) || languages.length === 0) {
      console.error('Languages must be a non-empty array:', languages);
      return NextResponse.json(
        { error: 'Languages must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(question) || question.length === 0) {
      console.error('Questions must be a non-empty array:', question);
      return NextResponse.json(
        { error: 'Questions must be a non-empty array' },
        { status: 400 }
      );
    }

    // Filter out empty questions and languages
    const filteredQuestions = question.filter(q => q && q.trim() !== '');
    const filteredLanguages = languages.filter(l => l && l.trim() !== '');

    if (filteredQuestions.length === 0) {
      console.error('No valid questions after filtering:', question);
      return NextResponse.json(
        { error: 'At least one valid question is required' },
        { status: 400 }
      );
    }

    if (filteredLanguages.length === 0) {
      console.error('No valid languages after filtering:', languages);
      return NextResponse.json(
        { error: 'At least one valid language is required' },
        { status: 400 }
      );
    }

    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    try {
      console.log('MONGODB_URI found, attempting MongoDB connection...');
      await DBConnection();
      console.log('Database connected successfully');
      
      console.log('Creating new schedule with MongoDB:', {
        department,
        doctor,
        languages,
        question,
        date,
        status: "Active"
      });

      const newSchedule = new Schedule({
        department,
        doctor,
        languages: filteredLanguages,
        question: filteredQuestions,
        date,
        status: "Active"
      });

      console.log('Schedule model instance created:', newSchedule);

      const savedSchedule = await newSchedule.save();
      console.log('Schedule saved to MongoDB successfully:', savedSchedule);

      // Track schedule creation activity
      try {
        const scheduleActivity = new ScheduleActivity({
          userId: doctor, // Using doctor as userId for now
          username: doctor,
          scheduleId: savedSchedule._id.toString(),
          doctorName: doctor,
          action: 'schedule_create',
          details: {
            page: 'schedule_management',
            notes: `Created schedule for ${department} department`,
            scheduleData: {
              department: department,
              doctor: doctor,
              languages: filteredLanguages,
              questions: filteredQuestions,
              date: date,
              timestamp: new Date().toISOString()
            }
          },
          status: 'success'
        });
        
        await scheduleActivity.save();
        console.log('✅ Schedule creation activity tracked');
      } catch (activityError) {
        console.error('❌ Failed to track schedule creation activity:', activityError);
        // Don't fail the main operation if activity tracking fails
      }

      return NextResponse.json(
        { 
          message: 'Schedule created successfully', 
          schedule: savedSchedule 
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('MongoDB save failed:', dbError);
      console.error('MongoDB error details:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code
      });
      return NextResponse.json(
        { error: 'Database save failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/schedule:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create schedule';
    if (error.name === 'ValidationError') {
      errorMessage = `Validation error: ${error.message}`;
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage = `Database error: ${error.message}`;
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate schedule entry';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, department, doctor, languages, question, date } = body;

    // Validate required fields
    if (!id || !department || !doctor || !languages || !question || !date) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    try {
      await DBConnection();
      
      // Get the existing schedule before updating
      const existingSchedule = await Schedule.findById(id);
      if (!existingSchedule) {
        return NextResponse.json(
          { error: 'Schedule not found' },
          { status: 404 }
        );
      }

      const updatedSchedule = await Schedule.findByIdAndUpdate(
        id,
        {
          department,
          doctor,
          languages,
          question,
          date,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      console.log('Schedule updated in MongoDB:', updatedSchedule);

      // Track schedule update activity
      try {
        const scheduleActivity = new ScheduleActivity({
          userId: doctor,
          username: doctor,
          scheduleId: id,
          doctorName: doctor,
          action: 'schedule_update',
          details: {
            page: 'schedule_management',
            notes: `Updated schedule for ${department} department`,
            scheduleData: {
              department: department,
              doctor: doctor,
              languages: languages,
              questions: question,
              date: date,
              timestamp: new Date().toISOString()
            },
            changes: {
              department: existingSchedule.department !== department,
              doctor: existingSchedule.doctor !== doctor,
              languages: JSON.stringify(existingSchedule.languages) !== JSON.stringify(languages),
              question: JSON.stringify(existingSchedule.question) !== JSON.stringify(question),
              date: existingSchedule.date !== date
            }
          },
          previousValues: {
            department: existingSchedule.department,
            doctor: existingSchedule.doctor,
            languages: existingSchedule.languages,
            question: existingSchedule.question,
            date: existingSchedule.date
          },
          newValues: {
            department: department,
            doctor: doctor,
            languages: languages,
            question: question,
            date: date
          },
          status: 'success'
        });
        
        await scheduleActivity.save();
        console.log('✅ Schedule update activity tracked');
      } catch (activityError) {
        console.error('❌ Failed to track schedule update activity:', activityError);
        // Don't fail the main operation if activity tracking fails
      }

      return NextResponse.json(
        { 
          message: 'Schedule updated successfully', 
          schedule: updatedSchedule 
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('MongoDB update failed:', dbError);
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Try MongoDB first
    if (MONGODB_URI) {
      try {
        await DBConnection();
        
        // Get schedule details before deletion for activity tracking
        const scheduleToDelete = await Schedule.findById(id);
        
        if (!scheduleToDelete) {
          return NextResponse.json(
            { error: 'Schedule not found' },
            { status: 404 }
          );
        }

        const deletedSchedule = await Schedule.findByIdAndDelete(id);
        
        console.log('Schedule deleted from MongoDB:', deletedSchedule);

        // Track schedule deletion activity
        try {
          const scheduleActivity = new ScheduleActivity({
            userId: scheduleToDelete.doctor,
            username: scheduleToDelete.doctor,
            scheduleId: id,
            doctorName: scheduleToDelete.doctor,
            action: 'schedule_delete',
            details: {
              page: 'schedule_management',
              notes: `Deleted schedule for ${scheduleToDelete.department} department`,
              scheduleData: {
                department: scheduleToDelete.department,
                doctor: scheduleToDelete.doctor,
                languages: scheduleToDelete.languages,
                questions: scheduleToDelete.question,
                date: scheduleToDelete.date,
                timestamp: new Date().toISOString()
              }
            },
            status: 'success'
          });
          
          await scheduleActivity.save();
          console.log('✅ Schedule deletion activity tracked');
        } catch (activityError) {
          console.error('❌ Failed to track schedule deletion activity:', activityError);
          // Don't fail the main operation if activity tracking fails
        }

        return NextResponse.json(
          { 
            message: 'Schedule deleted successfully', 
            schedule: deletedSchedule 
          },
          { status: 200 }
        );
      } catch (dbError) {
        console.error('MongoDB delete failed:', dbError);
        return NextResponse.json(
          { error: 'Database delete failed' },
          { status: 500 }
        );
      }
    }
    
    // If we reach here, it means MONGODB_URI is not set
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}

// Test endpoint to debug MongoDB connection
export async function PATCH(request) {
  try {
    console.log('PATCH /api/schedule - Testing MongoDB connection...');
    
    if (!MONGODB_URI) {
      return NextResponse.json({ 
        success: false, 
        error: 'MONGODB_URI not found',
        message: 'Please check your environment variables'
      }, { status: 500 });
    }
    
    try {
      await DBConnection();
      console.log('MongoDB connection test successful');
      
      // Test a simple query
      const count = await Schedule.countDocuments();
      
      return NextResponse.json({ 
        success: true, 
        message: 'MongoDB connection successful',
        documentCount: count,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('MongoDB connection test failed:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'MongoDB connection failed',
        details: {
          name: dbError.name,
          message: dbError.message,
          code: dbError.code
        },
        message: 'Check your MongoDB connection string and network connection'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test endpoint error',
      details: error.message
    }, { status: 500 });
  }
}
