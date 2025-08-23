
"use client"

import React, { useState } from 'react'
import { loginAction } from '@/app/serverActions/loginAction';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const UserLogin = () => {
    const[email, setEmail] = useState("");
    const[password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter()

    const loginHandler = async (e) => {
        e.preventDefault()

        const loginDetails = {email, password}
        console.log(loginDetails)

        try {
            const response = await loginAction(loginDetails)
            if(response.success) {
                // Store user data in localStorage for session management
                localStorage.setItem('user', JSON.stringify(response.user))
                localStorage.setItem('isLoggedIn', 'true')
                
                // Show welcome message
                alert(`Welcome back, ${response.user.username}! Redirecting to dashboard...`)
                
                // Redirect to dashboard
                router.push("/dashboard")
            } else {
                setError(response.message || "Login failed")
            }
        } catch (error) {
            setError(error.message) 
        }
    }

  return (
    <div className="formContainer">
        <h1>Login Form</h1>
        <form onSubmit={loginHandler} className="formSection">
            {error && <p style={{color:'red'}}>{error}</p>}
                <h3>Email</h3>
                <input type="email" name="email" onChange={(e) => setEmail(e.target.value)} />
                <h3>Password</h3>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        onChange={(e) => setPassword(e.target.value)} 
                        autoComplete="current-password"
                        data-form-type="other"
                        data-lpignore="true"
                        data-1p-ignore="true"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A1.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
                <br/> <br/>
                <button type="submit">Login</button>
            </form>
            <Link href='/register'>
            If not registered? Register here
            </Link>
    </div>
  )
}

export default UserLogin