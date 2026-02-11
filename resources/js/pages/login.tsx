import React, { useState } from 'react';
import backgroundImg from '../assets/background.jpg';
import loginCoverImg from '../assets/loginright.jpg';
import dnscLogo from '../assets/DNSC-IC.jpg';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Login submitted:', { email, password, role, rememberMe });
    };

    const roles = [
        { value: 'student', label: 'Student' },
        { value: 'faculty', label: 'Faculty Member' },
        { value: 'coordinator', label: 'CS Coordinator' },
        { value: 'panelist', label: 'Panelist' },
    ];

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
            {/* Background Image with Blur */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${backgroundImg})` }}>
                <div className="absolute inset-0 backdrop-blur-md"></div>
                {/* Dark gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/80"></div>
            </div>

            {/* Login Container - Wider on mobile */}
            <div className="animate-fade-in relative z-10 mx-2 flex h-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl sm:mx-4">
                {/* Left Section - Image Cover */}
                <div className="relative hidden w-1/2 md:block">
                    {/* Cover Image */}
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginCoverImg})` }}></div>

                    {/* Green gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-green-900/90"></div>

                    {/* Logo in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-scale-in rounded-full bg-white p-4 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_10px_rgba(5,68,32,0.4)] hover:ring-4 hover:ring-gray-500 hover:ring-offset-2">
                            <img src={dnscLogo} alt="DNSC-IC Logo" className="h-20 w-20 rounded-full object-cover" />
                        </div>
                    </div>

                    {/* Text at bottom */}
                    <div className="animate-slide-up absolute right-0 bottom-0 left-0 p-12 text-center">
                        <h1 className="text-2xl font-bold text-white uppercase drop-shadow-lg">Capstone Projects Management System</h1>
                    </div>
                </div>

                {/* Right Section - Login Form */}
                <div className="flex w-full items-center justify-center bg-white p-6 sm:p-8 md:w-1/2 md:p-12 lg:p-16">
                    <div className="w-full max-w-md space-y-4">
                        {/* Header - Smaller */}
                        <div className="animate-fade-in-down text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                        </div>

                        {/* Form - Reduced spacing */}
                        <form className="space-y-3.5" onSubmit={handleSubmit}>
                            {/* Role Selection - Smaller */}
                            <div className="animate-fade-in-up relative" style={{ animationDelay: '0.1s' }}>
                                <div className="group relative w-full">
                                    <select
                                        id="role"
                                        name="role"
                                        required
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 bg-gray-50/50 px-3 pt-5 pb-1.5 text-sm text-gray-900 transition-all duration-300 hover:border-green-200 hover:bg-white focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                    >
                                        <option value="" disabled hidden></option>
                                        {roles.map((roleOption) => (
                                            <option key={roleOption.value} value={roleOption.value} className="py-2 text-sm">
                                                {roleOption.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Floating Label */}
                                    <label
                                        htmlFor="role"
                                        className={`pointer-events-none absolute left-3 transition-all duration-300 ease-in-out ${
                                            role
                                                ? 'top-1.5 text-xs font-medium text-green-600'
                                                : 'top-1/2 -translate-y-1/2 text-sm text-gray-500 peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                        }`}
                                    >
                                        Select Your Role
                                    </label>

                                    {/* Custom Arrow Icon */}
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-transform duration-300 peer-focus:rotate-180 peer-focus:text-green-500">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Email Input - Smaller */}
                            <div className="animate-fade-in-up relative" style={{ animationDelay: '0.2s' }}>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                    placeholder="Email Address"
                                />
                                <label
                                    htmlFor="email"
                                    className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                        email
                                            ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                            : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                    }`}
                                >
                                    Email Address
                                </label>
                            </div>

                            {/* Password Input - Smaller */}
                            <div className="animate-fade-in-up relative" style={{ animationDelay: '0.3s' }}>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                    placeholder="Password"
                                />
                                <label
                                    htmlFor="password"
                                    className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                        password
                                            ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                            : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                    }`}
                                >
                                    Password
                                </label>
                            </div>

                            {/* Submit Button - Smaller */}
                            <div className="animate-fade-in-up pt-1" style={{ animationDelay: '0.5s' }}>
                                <button
                                    type="submit"
                                    className="group relative flex w-full justify-center overflow-hidden rounded-lg border border-transparent bg-gradient-to-r from-green-600 to-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-green-700 hover:to-green-800 hover:shadow-xl focus:ring-4 focus:ring-green-500/50 focus:outline-none active:scale-[0.98]"
                                >
                                    {/* Shine effect */}
                                    <span className="animate-shine absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                                    Sign In
                                </button>
                            </div>
                        </form>

                        {/* Sign up link - Smaller */}
                        <div className="animate-fade-in-up pt-1 text-center" style={{ animationDelay: '0.6s' }}>
                            <p className="text-xs text-gray-600">
                                Don't have an account?{' '}
                                <a href="#" className="font-medium text-green-600 transition-all duration-300 hover:text-green-700 hover:underline">
                                    Contact your administrator
                                </a>
                            </p>
                        </div>

                        {/* Mobile Logo - HIDDEN on small screens */}
                        {/* Removed the mobile logo section as requested */}
                    </div>
                </div>
            </div>

            {/* DNSC Institute Text - Outside Container */}
            <p className="relative z-10 mt-6 text-center text-xs text-white sm:text-sm">DNSC - Institute of Computing</p>

            {/* CSS Animations */}
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes fade-in-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes shine {
                    to {
                        transform: translateX(200%);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-fade-in-down {
                    animation: fade-in-down 0.6s ease-out;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out;
                    animation-fill-mode: both;
                }

                .animate-slide-up {
                    animation: slide-up 0.8s ease-out 0.3s;
                    animation-fill-mode: both;
                }

                .animate-scale-in {
                    animation: scale-in 0.8s ease-out 0.2s;
                    animation-fill-mode: both;
                }

                .animate-shine {
                    animation: shine 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
