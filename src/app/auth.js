


import NextAuth from "next-auth"
import CredentialProvider from "next-auth/providers/credentials"
import UserModel from "./utils/models/User"
import bcrypt from "bcryptjs"
import DBConnection from "./utils/config/db"
import { NEXTAUTH_SECRET, NEXTAUTH_URL, validateConfig } from "./utils/config/environment.js"

// Validate configuration
validateConfig();

// Debug environment variables
console.log("NextAuth Config - NEXTAUTH_SECRET:", NEXTAUTH_SECRET ? "Set" : "NOT SET");
console.log("NextAuth Config - NEXTAUTH_URL:", NEXTAUTH_URL ? "Set" : "NOT SET");

export const {auth, signIn, signOut, handlers:{GET,POST}} = NextAuth({
    providers: [
        CredentialProvider({
            name: 'credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    console.log("🔐 Auth attempt for email:", credentials?.email);
                    
                    // Check for hardcoded admin user first
                    if (credentials?.email === 'admin@hvc.com' && credentials?.password === 'admin123') {
                        console.log("✅ Admin login successful via NextAuth");
                        return {
                            id: "admin-001",
                            name: "Admin User",
                            email: "admin@hvc.com",
                            role: "admin"
                        };
                    }

                    console.log("🔍 Checking database for user:", credentials?.email);
                    
                    // Ensure database connection before using UserModel
                    try {
                        await DBConnection();
                        console.log("✅ Database connected successfully");
                    } catch (dbError) {
                        console.error("❌ Database connection failed:", dbError);
                        // Instead of throwing an error, return null to allow fallback to hardcoded admin
                        console.log("⚠️ Using fallback authentication due to database connection issue");
                        return null;
                    }
                    
                    const user = await UserModel.findOne({email: credentials?.email})
                    console.log("🔍 User found:", user ? "YES" : "NO");
                    
                    if(!user){
                        console.log("❌ User not found in database");
                        throw new Error("User not found");
                    }
                    
                    // Check if user is deactivated
                    if(user.status === 'deactivated'){
                        console.log("❌ Login blocked: User is deactivated");
                        throw new Error("User account is deactivated");
                    }
                    
                    console.log("🔐 Comparing passwords...");
                    // Compare password with hashed password
                    const isPasswordValid = await bcrypt.compare(credentials?.password, user.password)
                    console.log("🔐 Password valid:", isPasswordValid ? "YES" : "NO");
                    
                    if(!isPasswordValid){
                        console.log("❌ Password validation failed");
                        throw new Error("Invalid password");
                    }   

                    console.log("✅ User authenticated successfully:", user.email);
                    return {
                        id: user._id.toString(),
                        name: user.username,
                        email: user.email,
                        role: user.role
                    }
                } catch (error) {
                    console.error("❌ Auth error:", error)
                    // Return null instead of throwing error to allow graceful fallback
                    return null;
                }
            }
        })
    ],
    secret: NEXTAUTH_SECRET || "fallback-secret-key-for-development",
    pages: {
        signIn: '/login',
        error: '/login' 
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id;
                token.username = user.name;
                token.role = user.role;
                token.email = user.email;
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    ...session.user,
                    id: token.userId,
                    username: token.username,
                    role: token.role,
                    email: token.email
                };
            }
            return session
        }
    },
    debug: process.env.NODE_ENV === 'development',
})

