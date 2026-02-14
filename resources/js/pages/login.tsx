import React from 'react';
import backgroundImg from '../assets/background.jpg';
import loginCoverImg from '../assets/loginright.jpg';
import cpmsLogo from '../assets/logo-cpms.png';
import '../../css/pages/login.css';
import { ROLE_OPTIONS } from '../types/auth';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function LoginPage() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        role: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post('/login');
    };

    const roles = ROLE_OPTIONS;


    // VIEW TOGGLE STATE FOR PASSWORD
    const [showPassword, setShowPassword] = useState(false);

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
                        <div className="animate-scale-in flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_10px_rgba(5,68,32,0.4)] hover:ring-2 hover:ring-gray-500 hover:ring-offset-2">
                            <img src={cpmsLogo} alt="DNSC-IC Logo" className="h-full w-full rounded-full object-cover" />
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
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 bg-gray-50/50 px-3 py-3 text-sm text-gray-900 transition-all duration-300 hover:border-green-200 hover:bg-white focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                    >
                                        <option value="" disabled hidden></option>
                                        {roles.map((roleOption) => (
                                            <option key={roleOption.value} value={roleOption.value} className="py-2 text-sm">
                                                {roleOption.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Floating Label — updated to match email/password style */}
                                    <label
                                        htmlFor="role"
                                        className={`pointer-events-none absolute left-3 transition-all duration-300 ${data.role
                                            ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                            : 'top-1/2 -translate-y-1/2 text-sm text-gray-500 peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                            }`}
                                    >
                                        Select Role
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
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                    placeholder="Email Address"
                                />
                                <label
                                    htmlFor="email"
                                    className={`pointer-events-none absolute left-3 transition-all duration-300 ${data.email
                                        ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                        : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                        }`}
                                >
                                    Email Address
                                </label>
                            </div>

                            {/* Password Input - Smaller with Toggle */}
                            <div className="animate-fade-in-up relative" style={{ animationDelay: '0.3s' }}>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 pr-10 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                        placeholder="Password"
                                    />

                                    {/* Floating Label */}
                                    <label
                                        htmlFor="password"
                                        className={`pointer-events-none absolute left-3 transition-all duration-300 ${data.password
                                                ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                            }`}
                                    >
                                        Password
                                    </label>

                                    {/* Toggle Button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-green-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            // Eye Off Icon
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7 1.02-2.29 2.86-4.22 5.13-5.44M9.88 9.88A3 3 0 1114.12 14.12M6.1 6.1L17.9 17.9" />
                                            </svg>
                                        ) : (
                                            // Eye Icon
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button - Smaller */}
                            <div className="animate-fade-in-up pt-1" style={{ animationDelay: '0.5s' }}>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group relative flex w-full justify-center overflow-hidden rounded-lg border border-transparent bg-gradient-to-r from-green-600 to-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-green-700 hover:to-green-800 hover:shadow-xl focus:ring-4 focus:ring-green-500/50 focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {/* Shine effect */}
                                    <span className="animate-shine absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                                    {processing ? 'Signing In...' : 'Sign In'}
                                </button>
                            </div>
                        </form>

                        {/* Error Messages */}
                        {errors.email && (
                            <div className="text-xs text-red-600 text-center">{errors.email}</div>
                        )}
                        {errors.password && (
                            <div className="text-xs text-red-600 text-center">{errors.password}</div>
                        )}
                        {errors.role && (
                            <div className="text-xs text-red-600 text-center">{errors.role}</div>
                        )}

                        {/* Sign up link - Smaller */}
                        <div className="animate-fade-in-up pt-1 text-center" style={{ animationDelay: '0.6s' }}>
                            <p className="text-xs text-gray-600">
                                Don't have an account?{' '}
                                <a href="#" className="font-medium text-green-600 transition-all duration-300 hover:text-green-700 hover:underline">
                                    Contact your administrator
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* DNSC Institute Text - Outside Container */}
            <p className="relative z-10 mt-6 text-center text-xs text-white sm:text-sm">DNSC - Institute of Computing</p>
        </div>
    );
}
