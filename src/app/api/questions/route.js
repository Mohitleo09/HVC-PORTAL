import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import Question from '@/app/utils/models/Question';
import { MONGODB_URI } from '@/app/utils/config/environment.js';

// GET - Fetch all questions
export async function GET() {
  try {
    console.log('🔍 GET /api/questions - Starting request...');
    
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    await DBConnection();
    
    const questions = await Question.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      questions: questions
    });
  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST - Create a new question
export async function POST(request) {
  try {
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    await DBConnection();
    
    const body = await request.json();
    const { text, department } = body;
    
    // Validate required fields
    if (!text || !department) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: text and department are required' },
        { status: 400 }
      );
    }
    
    // Create new question
    const newQuestion = new Question({
      text: text.trim(),
      department,
      status: 'Active'
    });
    
    const savedQuestion = await newQuestion.save();
    
    console.log('✅ Question saved successfully:', savedQuestion);
    
    return NextResponse.json({
      success: true,
      question: savedQuestion,
      message: 'Question created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

// PUT - Update question text and department
export async function PUT(request) {
  try {
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    await DBConnection();
    
    const body = await request.json();
    const { id, text, department } = body;
    
    console.log('🔍 PUT /api/questions - Updating question:', { id, text, department });
    
    if (!id || !text || !department) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, text, and department are required' },
        { status: 400 }
      );
    }
    
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { 
        text: text.trim(),
        department: department.trim()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Question updated successfully:', {
      id: updatedQuestion._id,
      text: updatedQuestion.text,
      department: updatedQuestion.department
    });
    
    return NextResponse.json({
      success: true,
      question: updatedQuestion,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// PATCH - Update question status
export async function PATCH(request) {
  try {
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    await DBConnection();
    
    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (!['Active', 'Inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!updatedQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      question: updatedQuestion,
      message: 'Question status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating question status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question status' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a question
export async function DELETE(request) {
  try {
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    await DBConnection();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }
    
    const deletedQuestion = await Question.findByIdAndDelete(id);
    
    if (!deletedQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
