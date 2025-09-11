"use client"

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LandingPage = () => {
    const router = useRouter();

    useEffect(() => {
        // Redirect to login page after 2 seconds
        const timer = setTimeout(() => {
            router.push('/login');
        }, 2000);

        // Cleanup timer on component unmount
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                {/* Logo/Brand */}
                <div className="mb-8">
                    <img 
                        src="/logo.png" 
                        alt="HVC Portal Logo" 
                        className="mx-auto h-24 w-24 mb-4"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                        }}
                    />
                    <div className="fallback-logo" style={{display: 'none'}}>
                        <div className="mx-auto h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                            <span className="text-white text-2xl font-bold">HVC</span>
                        </div>
                    </div>
                </div>

                {/* Welcome Message */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to HVC Portal
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Hi9 Health Video Content Portal
                </p>

                {/* Loading Animation */}
                <div className="flex justify-center items-center space-x-2 mb-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Redirecting to login...</span>
                </div>

                {/* Countdown */}
                {/* <div className="text-sm text-gray-500">
                    Redirecting in <span className="font-semibold text-blue-600">2</span> seconds
                </div> */}

                {/* Decorative Elements */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-20 right-20 w-16 h-16 bg-indigo-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-24 h-24 bg-cyan-200 rounded-full opacity-20 animate-pulse"></div>
            </div>
        </div>
    );
};

export default LandingPage;
