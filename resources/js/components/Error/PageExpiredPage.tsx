import { router } from '@inertiajs/react';
import { Home, RefreshCcw } from 'lucide-react';

const refreshPage = (): void => {
    router.reload();
};

const goHome = (): void => {
    router.visit('/', { preserveScroll: false, replace: true });
};

export default function PageExpiredPage() {
    return (
        <>
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-100 px-4 sm:px-6 lg:px-8">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-[-8rem] right-[-5rem] h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
                    <div className="absolute bottom-[-10rem] left-[-6rem] h-96 w-96 rounded-full bg-green-400/15 blur-3xl" />
                </div>

                <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-emerald-100/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(21,128,61,0.16)] backdrop-blur-sm sm:p-12">
                    <div className="mb-8 flex justify-center">
                        <div className="relative h-64 w-64">
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-300/50 animate-spin-slow-green" />
                            <div className="absolute inset-8 rounded-full border-4 border-green-400/40 animate-spin-reverse-green" />
                            <div className="absolute inset-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-700 animate-pulse-slow-green" />

                            <div className="absolute inset-0 flex items-center justify-center">
                                <h1 className="animate-float-green bg-gradient-to-r from-green-900 via-emerald-800 to-green-700 bg-clip-text text-7xl font-black text-transparent">
                                    419
                                </h1>
                            </div>

                            <div className="absolute top-8 left-8 h-3 w-3 rounded-full bg-emerald-500/80 animate-float-particle-1-green" />
                            <div className="absolute top-16 right-12 h-2 w-2 rounded-full bg-green-600/80 animate-float-particle-2-green" />
                            <div className="absolute bottom-16 left-16 h-4 w-4 rounded-full bg-emerald-400/80 animate-float-particle-3-green" />
                            <div className="absolute right-8 bottom-8 h-2 w-2 rounded-full bg-green-700/80 animate-float-particle-4-green" />
                        </div>
                    </div>

                    <div className="mb-8 text-center">
                        <h2 className="mb-4 bg-gradient-to-r from-green-900 via-emerald-800 to-green-700 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                            Page Expired
                        </h2>
                        <p className="mx-auto max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
                            Your session token expired. Refresh the page to continue, or return to the home screen.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <button
                            type="button"
                            onClick={refreshPage}
                            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-green-800 bg-white px-8 py-3 font-semibold text-green-900 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-800/20 active:scale-[0.98] sm:w-auto"
                        >
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-green-900/0 via-green-900/10 to-green-900/0 transition-transform duration-1000 group-hover:translate-x-full" />
                            <RefreshCcw className="relative z-10 h-5 w-5 transition-transform duration-200 group-hover:rotate-180" />
                            <span className="relative z-10">Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={goHome}
                            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-700 via-green-700 to-green-900 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-emerald-600 hover:via-green-600 hover:to-green-800 hover:shadow-xl hover:shadow-green-900/40 active:scale-[0.98] sm:w-auto"
                        >
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 transition-transform duration-1000 group-hover:translate-x-full" />
                            <Home className="relative z-10 h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                            <span className="relative z-10">Go Home</span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin-slow-green {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @keyframes spin-reverse-green {
                    from {
                        transform: rotate(360deg);
                    }
                    to {
                        transform: rotate(0deg);
                    }
                }

                @keyframes pulse-slow-green {
                    0%,
                    100% {
                        opacity: 0.62;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.86;
                        transform: scale(1.05);
                    }
                }

                @keyframes float-green {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes float-particle-1-green {
                    0%,
                    100% {
                        transform: translate(0, 0);
                    }
                    50% {
                        transform: translate(-14px, -18px);
                    }
                }

                @keyframes float-particle-2-green {
                    0%,
                    100% {
                        transform: translate(0, 0);
                    }
                    50% {
                        transform: translate(12px, -13px);
                    }
                }

                @keyframes float-particle-3-green {
                    0%,
                    100% {
                        transform: translate(0, 0);
                    }
                    50% {
                        transform: translate(-10px, 18px);
                    }
                }

                @keyframes float-particle-4-green {
                    0%,
                    100% {
                        transform: translate(0, 0);
                    }
                    50% {
                        transform: translate(13px, 14px);
                    }
                }

                .animate-spin-slow-green {
                    animation: spin-slow-green 8s linear infinite;
                }

                .animate-spin-reverse-green {
                    animation: spin-reverse-green 6s linear infinite;
                }

                .animate-pulse-slow-green {
                    animation: pulse-slow-green 3s ease-in-out infinite;
                }

                .animate-float-green {
                    animation: float-green 3s ease-in-out infinite;
                }

                .animate-float-particle-1-green {
                    animation: float-particle-1-green 4s ease-in-out infinite;
                }

                .animate-float-particle-2-green {
                    animation: float-particle-2-green 5s ease-in-out infinite;
                }

                .animate-float-particle-3-green {
                    animation: float-particle-3-green 4.5s ease-in-out infinite;
                }

                .animate-float-particle-4-green {
                    animation: float-particle-4-green 5.5s ease-in-out infinite;
                }
            `}</style>
        </>
    );
}
