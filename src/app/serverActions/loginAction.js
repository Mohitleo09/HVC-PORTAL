

'use server'

import DBConnection from "../utils/config/db"
import UserModel from "../utils/models/User"
import bcrypt from "bcryptjs"

export async function loginAction(loginDetails){
    try {
        await DBConnection()

        console.log("sample login", loginDetails)

        // Find user by email
        const user = await UserModel.findOne({ email: loginDetails.email })
        
        if (!user) {
            return { success: false, message: "User not found" }
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(loginDetails.password, user.password)
        
        if (!isPasswordValid) {
            return { success: false, message: "Invalid password" }
        }

        return { 
            success: true, 
            message: "Login successful",
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role
            }
        }
    } catch (error) {
        console.error("Login error:", error)
        return { success: false, message: "Login failed: " + error.message }
    }
}