import { AlertTriangle, Clock, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LockoutModalProps {
    open: boolean;
    onClose: () => void;
    lockoutUntil: number | null;
}

const LockoutModal = ({ open, onClose, lockoutUntil }: LockoutModalProps) => {
    const [isAppearing, setIsAppearing] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [open]);

    useEffect(() => {
        if (!open || !lockoutUntil) return;

        const updateTimer = () => {
            const now = Date.now();
            const diff = lockoutUntil - now;

            if (diff <= 0) {
                setTimeLeft('0:00');
                onClose();
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [open, lockoutUntil, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h2 className="text-lg font-bold text-gray-800">Account Locked</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <Clock className="h-10 w-10" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Too Many Attempts</h3>
                            <p className="text-sm text-gray-600">
                                For security reasons, your account has been temporarily locked due to multiple failed login attempts.
                            </p>
                        </div>

                        <div className="w-full rounded-xl bg-emerald-50/50 p-4 border border-emerald-100">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">Please wait</p>
                            <p className="text-3xl font-mono font-bold text-emerald-900">{timeLeft}</p>
                        </div>

                        <p className="text-xs text-gray-500">
                            You can try again once the timer expires.
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="group relative isolate inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-700 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:from-emerald-500 hover:to-green-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 active:scale-[0.98]"
                        >
                            <span className="relative z-10">Got it</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default LockoutModal;
