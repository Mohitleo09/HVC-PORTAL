import { NextResponse } from 'next/server';
import DBConnection from '@/app/utils/config/db';
import Department from '@/app/utils/models/Department';

// GET - Fetch all departments
export async function GET() {
  try {
    await DBConnection();
    const departments = await Department.find({}).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      departments: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST - Create a new department
export async function POST(request) {
  try {
    await DBConnection();
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Department name is required' },
        { status: 400 }
      );
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({ name: name.trim() });
    if (existingDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department already exists' },
        { status: 400 }
      );
    }

    const newDepartment = new Department({
      name: name.trim(),
      status: 'Active'
    });

    const savedDepartment = await newDepartment.save();
    console.log('Department saved successfully:', savedDepartment);

    return NextResponse.json({
      success: true,
      department: savedDepartment,
      message: 'Department created successfully'
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create department' },
      { status: 500 }
    );
  }
}

// PUT - Update department name
export async function PUT(request) {
  try {
    await DBConnection();
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Department ID and name are required' },
        { status: 400 }
      );
    }

    // Check if department already exists with the new name
    const existingDepartment = await Department.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department name already exists' },
        { status: 400 }
      );
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    console.log('Department updated successfully:', updatedDepartment);

    return NextResponse.json({
      success: true,
      department: updatedDepartment,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

// PATCH - Update department status
export async function PATCH(request) {
  try {
    await DBConnection();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['Active', 'Inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Department ID and valid status are required' },
        { status: 400 }
      );
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    console.log('Department status updated successfully:', updatedDepartment);

    return NextResponse.json({
      success: true,
      department: updatedDepartment,
      message: 'Department status updated successfully'
    });
  } catch (error) {
    console.error('Error updating department status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update department status' },
      { status: 500 }
    );
  }
}

// DELETE - Delete department
export async function DELETE(request) {
  try {
    await DBConnection();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Department ID is required' },
        { status: 400 }
      );
    }

    const deletedDepartment = await Department.findByIdAndDelete(id);

    if (!deletedDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    console.log('Department deleted successfully:', deletedDepartment);

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
