import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import User from '../../utils/models/User';
import bcrypt from 'bcryptjs';
import { MONGODB_URI, NODE_ENV } from '../../utils/config/environment.js';

// Test endpoint to verify API is working
export async function HEAD() {
  return NextResponse.json({ status: 'Users API is working' });
}

// GET all users
export async function GET() {
  try {
    console.log('🔍 GET /api/users - Starting request...');
    console.log('🔧 Environment check:', {
      hasMongoURI: !!MONGODB_URI,
      mongoURILength: MONGODB_URI ? MONGODB_URI.length : 0,
      nodeEnv: NODE_ENV
    });
    
    try {
      await DBConnection();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      console.error('❌ Error details:', {
        name: dbError.name,
        message: dbError.message,
        stack: dbError.stack
      });
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    const users = await User.find({}).select('-password').sort({ role: -1, createdAt: -1 });
    console.log(`✅ Found ${users.length} users`);
    
    // Log sample user data for debugging (without sensitive info)
    if (users.length > 0) {
      console.log('📋 Sample user data:', users.slice(0, 2).map(u => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status
      })));
    }
    
    return NextResponse.json({ 
      success: true, 
      users,
      count: users.length 
    });
  } catch (error) {
    console.error('❌ Error in GET /api/users:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch users: ${error.message}`,
        details: NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request) {
  try {
    await DBConnection();
    const body = await request.json();
    
    console.log('📥 Creating user with data:', body);
    
    const { username, email, password, role = 'user' } = body;
    
    // Validate required fields
    if (!username || !email || !password) {
      console.error('❌ Missing required fields:', { username, email, hasPassword: !!password });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: username, email, password' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      console.log('❌ User already exists with:', { username, email });
      return NextResponse.json(
        { success: false, error: 'User with this username or email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password before saving
    const saltRounds = 10;
    console.log('🔐 Hashing password with bcrypt...');
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');
    
    // Create new user with hashed password
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role
    });
    
    console.log('💾 Saving user to database...');
    await newUser.save();
    
    console.log('✅ User created successfully:', newUser._id);
    
    // Return user without password
    const safeUser = newUser.toObject();
    delete safeUser.password;
    
    return NextResponse.json({ 
      success: true, 
      user: safeUser,
      message: 'User created successfully! They can now log in with their email and password.' 
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { success: false, error: `Failed to create user: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates are required' },
        { status: 400 }
      );
    }

    await DBConnection();
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user fields (excluding sensitive fields)
    Object.keys(updates).forEach(key => {
      if (key !== 'password' && key !== '_id' && key !== '__v') {
        if (key === 'email') {
          user[key] = updates[key].trim().toLowerCase();
        } else if (key === 'username') {
          user[key] = updates[key].trim();
        } else {
          user[key] = updates[key];
        }
      }
    });

    await user.save();
    
    // Return updated user without password
    const safeUser = user.toSafeObject();
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await DBConnection();
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User deleted successfully:', { username: user.username, email: user.email });
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
