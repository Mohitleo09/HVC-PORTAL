

"use server"

import DBConnection from "../utils/config/db"
import UserModel from "../utils/models/User"
import bcrypt from "bcryptjs"
import { validateConfig } from "../utils/config/environment.js"

export async function registerAction(registerDetails){
    try {
        // Validate configuration first
        validateConfig();
        
        await DBConnection()
        
        console.log("📝 Registration attempt for:", registerDetails.email)

        // Input validation
        if (!registerDetails.username || !registerDetails.email || !registerDetails.password) {
            return { success: false, message: "All fields are required" }
        }

        // Username validation
        if (registerDetails.username.trim().length < 3) {
            return { success: false, message: "Username must be at least 3 characters long" }
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(registerDetails.email)) {
            return { success: false, message: "Invalid email format" }
        }

        // Password validation
        if (registerDetails.password.length < 6) {
            return { success: false, message: "Password must be at least 6 characters long" }
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ 
            $or: [
                { email: registerDetails.email.trim().toLowerCase() },
                { username: registerDetails.username.trim() }
            ]
        })
        
        if (existingUser) {
            if (existingUser.email === registerDetails.email.trim().toLowerCase()) {
                return { success: false, message: "User already exists with this email" }
            } else {
                return { success: false, message: "Username already taken" }
            }
        }

        // Hash password
        const saltRounds = 12
        const hashedPassword = await bcrypt.hash(registerDetails.password, saltRounds)

        // Create user with hashed password
        const newUser = await UserModel.create({
            username: registerDetails.username.trim(),
            email: registerDetails.email.trim().toLowerCase(),   
            password: hashedPassword,
            role: 'user',
            status: 'active'
        })
        
        console.log("✅ User registered successfully:", newUser.email)
        
        return { 
            success: true, 
            message: "User registered successfully",
            user: {
                id: newUser._id.toString(),
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        }
    } catch (error) {
        console.error("❌ Registration error:", error)
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return { success: false, message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` }
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return { success: false, message: `Validation failed: ${validationErrors.join(', ')}` }
        }
        
        if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
            return { success: false, message: "Database connection failed. Please try again." }
        }
        
        return { success: false, message: "Registration failed: " + error.message }
    }
}