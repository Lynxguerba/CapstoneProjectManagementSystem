import { router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import backgroundImg from '../assets/background.jpg';
import loginCoverImg from '../assets/loginright.jpg';
import cpmsLogo from '../assets/logo-cpms.png';
import RegisterPanel from '../components/register-panel';
import { ROLE_REDIRECTS, normalizeRole } from '../types/auth';
import '../../css/pages/login.css';

type LoginPageProps = {
    auth?: {
        user?: {
            role?: string;
            roles?: string[];
        };
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

type AuthView = 'login' | 'register';

const primaryButtonClassName =
    'group relative isolate inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-700 px-5 py-3.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-green-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50';

const paneSwitchTransition: Transition = {
    type: 'spring',
    stiffness: 260,
    damping: 28,
    mass: 0.9,
};

const BrandPanel = ({ className = '' }: { className?: string }) => {
    return (
        <motion.div layout transition={paneSwitchTransition} className={`relative hidden md:block md:w-1/2 ${className}`}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginCoverImg})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-green-900/90" />

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-scale-in flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_10px_rgba(5,68,32,0.4)] hover:ring-2 hover:ring-gray-500 hover:ring-offset-2">
                    <img src={cpmsLogo} alt="DNSC-IC Logo" className="h-full w-full rounded-full object-cover" />
                </div>
            </div>

            <div className="animate-slide-up absolute right-0 bottom-0 left-0 p-12 text-center">
                <h1 className="text-2xl font-bold text-white uppercase drop-shadow-lg">Capstone Projects Management System</h1>
            </div>
        </motion.div>
    );
};

export default function LoginPage() {
    const { auth, flash } = usePage<LoginPageProps>().props;
    const activeRole = auth?.user?.role ?? auth?.user?.roles?.[0];
    const [authView, setAuthView] = useState<AuthView>('login');
    const [registrationMessage, setRegistrationMessage] = useState(flash?.success ?? '');
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    useEffect(() => {
        if (!activeRole) {
            return;
        }

        const redirectPath = ROLE_REDIRECTS[normalizeRole(activeRole)];
        if (redirectPath) {
            router.visit(redirectPath, { replace: true, preserveScroll: false });
        }
    }, [activeRole]);

    useEffect(() => {
        setRegistrationMessage(flash?.success ?? '');

        if (flash?.success) {
            setAuthView('login');
        }
    }, [flash?.success]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        post('/login', {
            replace: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-3 py-6 sm:px-4">
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${backgroundImg})` }}>
                <div className="absolute inset-0 backdrop-blur-md" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/80" />
            </div>

            <div className="relative z-10 w-full max-w-4xl">
                <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/95 shadow-[0_40px_120px_rgba(15,23,42,0.28)] backdrop-blur">
                    <motion.div layout transition={paneSwitchTransition} className="flex min-h-[420px] flex-col md:h-[420px] md:flex-row">
                        <BrandPanel className={authView === 'register' ? 'md:order-2' : 'md:order-1'} />

                        <motion.div
                            layout
                            transition={paneSwitchTransition}
                            className={`flex w-full overflow-x-hidden bg-white md:w-1/2 ${authView === 'register' ? 'md:order-1' : 'md:order-2'}`}
                        >
                            <div className="h-full w-full px-6 py-6 sm:px-8 md:px-10 md:py-7">
                                <div className="h-full overflow-x-hidden overflow-y-hidden">
                                    <div className="h-full overflow-x-hidden overflow-y-auto pr-1">
                                        <AnimatePresence mode="wait" initial={false}>
                                            {authView === 'login' ? (
                                                <motion.div
                                                    key="login-pane"
                                                    initial={{ opacity: 0, x: 18 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -18 }}
                                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                                    className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center"
                                                >
                                                    <div className="space-y-4">
                                                        <div className="animate-fade-in-down text-center">
                                                            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                                                        </div>

                                                        {registrationMessage !== '' ? (
                                                            <div
                                                                className="animate-fade-in-up rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                                                                style={{ animationDelay: '0.1s' }}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                    </div>
                                                                    <p className="leading-6">{registrationMessage}</p>
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        {flash?.error ? (
                                                            <div
                                                                className="animate-fade-in-up rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                                                                style={{ animationDelay: '0.1s' }}
                                                            >
                                                                {flash.error}
                                                            </div>
                                                        ) : null}

                                                        <form className="space-y-4" onSubmit={handleSubmit}>
                                                            <div className="animate-fade-in-up relative" style={{ animationDelay: '0.2s' }}>
                                                                <input
                                                                    id="email"
                                                                    name="email"
                                                                    type="email"
                                                                    autoComplete="email"
                                                                    required
                                                                    value={data.email}
                                                                    onChange={(event) => setData('email', event.target.value)}
                                                                    className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                                                    placeholder="Email Address"
                                                                />
                                                                <label
                                                                    htmlFor="email"
                                                                    className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                                                        data.email
                                                                            ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                                            : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                                                    }`}
                                                                >
                                                                    Email Address
                                                                </label>
                                                                {errors.email ? <p className="mt-2 text-xs text-rose-600">{errors.email}</p> : null}
                                                            </div>

                                                            <div className="animate-fade-in-up relative" style={{ animationDelay: '0.3s' }}>
                                                                <div className="relative">
                                                                    <input
                                                                        id="password"
                                                                        name="password"
                                                                        type={showPassword ? 'text' : 'password'}
                                                                        autoComplete="current-password"
                                                                        required
                                                                        value={data.password}
                                                                        onChange={(event) => setData('password', event.target.value)}
                                                                        className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 pr-10 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                                                        placeholder="Password"
                                                                    />
                                                                    <label
                                                                        htmlFor="password"
                                                                        className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                                                            data.password
                                                                                ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                                                : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                                                        }`}
                                                                    >
                                                                        Password
                                                                    </label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowPassword((previousState) => !previousState)}
                                                                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-green-600 focus:outline-none"
                                                                    >
                                                                        {showPassword ? (
                                                                            <svg
                                                                                className="h-5 w-5"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                                strokeWidth={2}
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7 1.02-2.29 2.86-4.22 5.13-5.44M9.88 9.88A3 3 0 1114.12 14.12M6.1 6.1L17.9 17.9"
                                                                                />
                                                                            </svg>
                                                                        ) : (
                                                                            <svg
                                                                                className="h-5 w-5"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                                strokeWidth={2}
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                                />
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                                />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                {errors.password ? (
                                                                    <p className="mt-2 text-xs text-rose-600">{errors.password}</p>
                                                                ) : null}
                                                            </div>

                                                            <button
                                                                type="submit"
                                                                disabled={processing}
                                                                className={`${primaryButtonClassName} animate-fade-in-up`}
                                                                style={{ animationDelay: '0.4s' }}
                                                            >
                                                                <span className="animate-shine pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                                                <span className="relative z-10 flex items-center gap-2">
                                                                    {processing ? 'Signing In...' : 'Sign In'}
                                                                    <ArrowRight className="h-4 w-4" />
                                                                </span>
                                                            </button>
                                                        </form>

                                                        <div className="animate-fade-in-up pt-1 text-center" style={{ animationDelay: '0.6s' }}>
                                                            <p className="text-xs text-gray-600">
                                                                Don't have an account?{' '}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setRegistrationMessage('');
                                                                        setAuthView('register');
                                                                    }}
                                                                    className="cursor-pointer font-medium text-green-600 transition-all duration-300 hover:text-green-700 hover:underline"
                                                                >
                                                                    Register Account
                                                                </button>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="register-pane"
                                                    initial={{ opacity: 0, x: -18 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 18 }}
                                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                                    className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center"
                                                >
                                                    <RegisterPanel
                                                        onBack={() => setAuthView('login')}
                                                        onRegistered={(message) => {
                                                            setRegistrationMessage(message);
                                                            setAuthView('login');
                                                        }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                <p className="relative z-10 mt-6 text-center text-xs text-white sm:text-sm">DNSC - Institute of Computing</p>
            </div>
        </div>
    );
}
