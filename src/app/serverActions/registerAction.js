

"use server"

import DBConnection from "../utils/config/db"
import UserModel from "../utils/models/User"
import bcrypt from "bcryptjs"

export async function registerAction(registerDetails){
    try {
        await DBConnection()
        
        console.log("regAction details:", registerDetails)

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email: registerDetails.email })
        if (existingUser) {
            return { success: false, message: "User already exists with this email" }
        }

        // Hash password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(registerDetails.password, saltRounds)

        // Create user with hashed password
        await UserModel.create({
            username: registerDetails.username,
            email: registerDetails.email,   
            password: hashedPassword,
        })
        
        return { success: true, message: "User registered successfully" }
    } catch (error) {
        console.log("Registration error:", error)
        return { success: false, message: "Registration failed: " + error.message }
    }
}