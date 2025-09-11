import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import Language from '@/app/utils/models/Language';

// GET - Fetch all languages
export async function GET() {
  try {
    await DBConnection();
    const languages = await Language.find({}).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      languages: languages
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}

// POST - Create a new language
export async function POST(request) {
  try {
    await DBConnection();
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Language name is required' },
        { status: 400 }
      );
    }

    // Check if language already exists
    const existingLanguage = await Language.findOne({ name: name.trim() });
    if (existingLanguage) {
      return NextResponse.json(
        { success: false, error: 'Language already exists' },
        { status: 400 }
      );
    }

    const newLanguage = new Language({
      name: name.trim(),
      status: 'Active'
    });

    const savedLanguage = await newLanguage.save();
    console.log('Language saved successfully:', savedLanguage);

    return NextResponse.json({
      success: true,
      language: savedLanguage,
      message: 'Language created successfully'
    });
  } catch (error) {
    console.error('Error creating language:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create language' },
      { status: 500 }
    );
  }
}

// PUT - Update language name
export async function PUT(request) {
  try {
    await DBConnection();
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Language ID and name are required' },
        { status: 400 }
      );
    }

    // Check if language already exists with the new name
    const existingLanguage = await Language.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingLanguage) {
      return NextResponse.json(
        { success: false, error: 'Language name already exists' },
        { status: 400 }
      );
    }

    const updatedLanguage = await Language.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedLanguage) {
      return NextResponse.json(
        { success: false, error: 'Language not found' },
        { status: 404 }
      );
    }

    console.log('Language updated successfully:', updatedLanguage);

    return NextResponse.json({
      success: true,
      language: updatedLanguage,
      message: 'Language updated successfully'
    });
  } catch (error) {
    console.error('Error updating language:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update language' },
      { status: 500 }
    );
  }
}

// PATCH - Update language status
export async function PATCH(request) {
  try {
    await DBConnection();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['Active', 'Inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Language ID and valid status are required' },
        { status: 400 }
      );
    }

    const updatedLanguage = await Language.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedLanguage) {
      return NextResponse.json(
        { success: false, error: 'Language not found' },
        { status: 404 }
      );
    }

    console.log('Language status updated successfully:', updatedLanguage);

    return NextResponse.json({
      success: true,
      language: updatedLanguage,
      message: 'Language status updated successfully'
    });
  } catch (error) {
    console.error('Error updating language status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update language status' },
      { status: 500 }
    );
  }
}

// DELETE - Delete language
export async function DELETE(request) {
  try {
    await DBConnection();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Language ID is required' },
        { status: 400 }
      );
    }

    const deletedLanguage = await Language.findByIdAndDelete(id);

    if (!deletedLanguage) {
      return NextResponse.json(
        { success: false, error: 'Language not found' },
        { status: 404 }
      );
    }

    console.log('Language deleted successfully:', deletedLanguage);

    return NextResponse.json({
      success: true,
      message: 'Language deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting language:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete language' },
      { status: 500 }
    );
  }
}
