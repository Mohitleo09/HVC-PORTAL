

'use server'

import DBConnection from "../utils/config/db"
import UserModel from "../utils/models/User"
import bcrypt from "bcryptjs"
import { validateConfig } from "../utils/config/environment.js"

export async function loginAction(loginDetails){
    try {
        // Validate configuration first
        validateConfig();
        
        // Try to connect to database
        let dbConnected = false;
        try {
            await DBConnection();
            dbConnected = true;
        } catch (dbError) {
            console.warn("⚠️ Database connection warning:", dbError.message);
            // Continue with fallback authentication
        }

        // Input validation
        if (!loginDetails.email || !loginDetails.password) {
            return { success: false, message: "Email and password are required" }
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(loginDetails.email)) {
            return { success: false, message: "Invalid email format" }
        }

        // Password length validation
        if (loginDetails.password.length < 6) {
            return { success: false, message: "Password must be at least 6 characters long" }
        }

        console.log("🔐 Login attempt for:", loginDetails.email)

        // Hardcoded admin user for testing (in production, this should be in database)
        if (loginDetails.email === 'admin@hvc.com' && loginDetails.password === 'admin123') {
            console.log("✅ Admin login successful")
            return { 
                success: true, 
                message: "Login successful",
                user: {
                    id: "admin-001",
                    username: "Admin User",
                    email: "admin@hvc.com",
                    role: "admin"
                }
            }
        }

        // If database is not connected, only allow admin login
        if (!dbConnected) {
            return { 
                success: false, 
                message: "Database is initializing. Only admin login is available at this time. Please try again in a few moments." 
            }
        }

        // Find user by email
        const user = await UserModel.findOne({ email: loginDetails.email })
        
        if (!user) {
            return { success: false, message: "User not found" }
        }

        // Check if user is deactivated
        if (user.status === 'deactivated') {
            console.log("❌ Login blocked: User is deactivated")
            return { success: false, message: "Account is deactivated. Please contact administrator." }
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(loginDetails.password, user.password)
        
        if (!isPasswordValid) {
            console.log("❌ Invalid password for user:", loginDetails.email)
            return { success: false, message: "Invalid password" }
        }

        console.log("✅ User authenticated successfully:", user.email)

        return { 
            success: true, 
            message: "Login successful",
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status
            }
        }
    } catch (error) {
        console.error("❌ Login error:", error)
        
        // Handle specific database errors
        if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
            return { 
                success: false, 
                message: "Database is initializing. Please wait a moment and try again." 
            }
        }
        
        return { success: false, message: "Login failed: " + error.message }
    }
}