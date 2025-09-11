

"use client"

import React, { useState } from 'react'
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { trackLogin, initializeSessionTracking } from '../utils/activityTracker';

const UserLogin = () => {
    const[email, setEmail] = useState("");
    const[password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { data: session } = useSession();

    // Redirect if already logged in
    React.useEffect(() => {
        if (session?.user) {
            console.log("Session updated:", session.user);
            
            // Track login activity for regular users
            if (session.user.role !== 'admin' && session.user.email !== 'admin@hvc.com') {
                try {
                    trackLogin(session.user.id || session.user.email, session.user.username || session.user.name);
                    initializeSessionTracking(session.user.id || session.user.email, session.user.username || session.user.name);
                } catch (error) {
                    console.warn('⚠️ Failed to track login activity:', error);
                }
            }
            
            if (session.user.role === 'admin' || session.user.email === 'admin@hvc.com') {
                console.log("Redirecting admin to /admin");
                router.push('/admin');
            } else {
                console.log("Redirecting user to /Userdashboard");
                router.push('/Userdashboard');
            }
        }
    }, [session, router]);

    const loginHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            console.log("Attempting login with:", { email, password: '***' });
            
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            console.log("SignIn result:", result);

            if (result?.error) {
                console.error("SignIn error:", result.error);
                let errorMessage = "Login failed";
                
                // Handle specific error types
                if (result.error === "CredentialsSignin") {
                    errorMessage = "Invalid email or password. Please check your credentials and try again.";
                } else if (result.error.includes("User not found")) {
                    errorMessage = "No user found with this email address. Please check your email or create a new account.";
                } else if (result.error.includes("User account is deactivated")) {
                    errorMessage = "Your account has been deactivated. Please contact an administrator.";
                } else if (result.error.includes("Invalid password")) {
                    errorMessage = "Incorrect password. Please check your password and try again.";
                } else if (result.error.includes("Database connection failed")) {
                    errorMessage = "Database connection error. Please try again later.";
                } else if (result.error.includes("Authentication failed")) {
                    errorMessage = "Authentication failed. Please check your credentials.";
                } else {
                    errorMessage = `Login failed: ${result.error}`;
                }
                
                setError(errorMessage);
            } else if (result?.ok) {
                // Success - NextAuth will handle the session
                toast.success("Login successful! Redirecting...", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                
                // Track login activity
                try {
                    if (email === 'admin@hvc.com') {
                        await trackLogin('admin-001', 'Admin User');
                        initializeSessionTracking('admin-001', 'Admin User');
                    } else {
                        // For regular users, we'll track after getting user info
                        // This will be handled in the useEffect when session is available
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to track login activity:', error);
                }
                
                // Force immediate redirect for admin users
                if (email === 'admin@hvc.com') {
                    setTimeout(() => {
                        router.push('/admin');
                    }, 1000);
                }
                // For regular users, the redirect will be handled by the useEffect above
            }
        } catch (error) {
            console.error("Login error:", error);
            setError(`An error occurred during login: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className="auth-container">
        {/* Left side - Abstract composition */}
        <div className="abstract-left">
            {/* Enhanced Mini Auto-scrolling Image Carousel */}
            <div className="mini-carousel">
                <div className="mini-carousel-track">
                    <div className="mini-carousel-item">
                        <img 
                            src="/img1.png" 
                            alt="Medical Innovation"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="fallback-content" style={{display: 'none'}}>
                            <div className="icon-container">
                                <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <span className="text-blue-400 text-sm font-medium">Medical Innovation</span>
                        </div>
                    </div>
                    <div className="mini-carousel-item">
                        <img 
                            src="/img2.png" 
                            alt="Medical Research"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="fallback-content" style={{display: 'none'}}>
                            <div className="icon-container">
                                <svg className="w-16 h-16 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <span className="text-cyan-400 text-sm font-medium">Medical Research</span>
                        </div>
                    </div>
                    <div className="mini-carousel-item">
                        <img 
                            src="/img3.png" 
                            alt="Patient Care"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="fallback-content" style={{display: 'none'}}>
                            <div className="icon-container">
                                <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <span className="text-green-400 text-sm font-medium">Patient Care</span>
                        </div>
                    </div>
                    <div className="mini-carousel-item">
                        <img 
                            src="/img4.png" 
                            alt="Innovation"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="fallback-content" style={{display: 'none'}}>
                            <div className="icon-container">
                                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-purple-400 text-sm font-medium">Innovation</span>
                        </div>
                    </div>
                    {/* Duplicate for seamless loop */}
                    <div className="mini-carousel-item">
                        <img 
                            src="/img1.png" 
                            alt="Medical Innovation"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="fallback-content" style={{display: 'none'}}>
                            <div className="icon-container">
                                <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <span className="text-blue-400 text-sm font-medium">Medical Innovation</span>
                        </div>
                    </div>
                    <div className="mini-carousel-item">
                        <img 
                            src="/img2.png" 
                            alt="Medical Research"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="fallback-content" style={{display: 'none'}}>
                            <div className="icon-container">
                                <svg className="w-16 h-16 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <span className="text-cyan-400 text-sm font-medium">Medical Research</span>
                        </div>
                    </div>
                    <div className="mini-carousel-item">
                        <img 
                            src="/img3.png" 
                            alt="Patient Care"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="fallback-content" style={{display: 'none'}}>
                            <div className="icon-container">
                                <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <span className="text-green-400 text-sm font-medium">Patient Care</span>
                        </div>
                    </div>
                    <div className="mini-carousel-item">
                        <img 
                            src="/img4.png" 
                            alt="Innovation"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                            }}
                        />
                        <div className="fallback-content" style={{display: 'none'}}>
                            <div className="icon-container">
                                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-purple-400 text-sm font-medium">Innovation</span>
                        </div>
                    </div>
                </div>
                
                {/* Enhanced Carousel Navigation Dots */}
                <div className="carousel-dots">
                    <div className="dot active" data-slide="0"></div>
                    <div className="dot" data-slide="1"></div>
                    <div className="dot" data-slide="2"></div>
                    <div className="dot" data-slide="3"></div>
                </div>
                
                {/* Carousel Progress Bar */}
                <div className="carousel-progress">
                    <div className="progress-bar"></div>
                </div>
            </div>
            
            {/* Glowing orb */}
            <div className="glow-orb"></div>
            
            {/* Floating particles */}
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            
            {/* Flowing curve bands */}
            <div className="flowing-curve">
                <div className="curve-band curve-band-1"></div>
                <div className="curve-band curve-band-2"></div>
                <div className="curve-band curve-band-3"></div>
                <div className="curve-band curve-band-4"></div>
            </div>
        </div>

        {/* Right side - Login form */}
        <div className="forms-right">
            <div className="formContainer">
                <h1>HVC Portal</h1>
                <form onSubmit={loginHandler} className="formSection">
                    {error && <p className="error-text">{error}</p>}
                    <h3>Email</h3>
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Enter your email address" 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                    <h3>Password</h3>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            placeholder="Enter your password"
                            onChange={(e) => setPassword(e.target.value)} 
                            autoComplete="current-password"
                            data-form-type="other"
                            data-lpignore="true"
                            data-1p-ignore="true"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
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
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                        {isLoading ? 'Signing In...' : 'SIGN IN'}
                    </button>
                </form>
                {/* <Link href='/register'>
                    Don't have an account? Sign up here
                </Link> */}
            </div>
        </div>
    </div>
  )
}

export default UserLogin