


import NextAuth from "next-auth"
import CredentialProvider from"next-auth/providers/credentials"
import UserModel from "./utils/models/User"
import bcrypt from "bcryptjs"

export const {auth, signIn, signOut, handlers:{GET,POST}} = NextAuth({
    providers: [
        CredentialProvider({
            name: 'credentials',

            async authorize(credentials) {
                try {
                    const user = await UserModel.findOne({email: credentials?.email})
                    if(!user){
                        return null;
                    }
                    
                    // Compare password with hashed password
                    const isPasswordValid = await bcrypt.compare(credentials?.password, user.password)
                    if(!isPasswordValid){
                        return null;
                    }   

                    return {
                        id: user._id.toString(),
                        name: user.username,
                        email: user.email,
                        role: user.role
                    }
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
                }
            }
        })
    ],
    secret: process.env.SECRET_KEY,
    pages: {
        signIn: '/login',
        error: '/login'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role
            }
            return session
        }
    }
})

