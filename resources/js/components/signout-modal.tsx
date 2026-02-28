import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LogOut, AlertTriangle } from 'lucide-react';

interface SignOutModalProps {
    open: boolean;
    onClose: () => void;
}

const SignOutModal = ({ open, onClose }: SignOutModalProps) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
            });

            if (response.redirected) {
                window.location.replace(response.url);
            } else {
                // Fallback
                window.location.replace('/');
            }
        } catch (error) {
            console.error('Sign out failed', error);
            // Fallback
            window.location.replace('/');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <LogOut className="h-5 w-5 text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-800">Sign Out</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                        disabled={loading}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-900">Are you sure you want to sign out?</p>
                                <p className="text-xs text-red-800">You will be redirected to the login page and cannot go back to this page.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSignOut}
                            disabled={loading}
                            className="group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg bg-red-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {/* Shine layer */}
                            <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Signing Out...
                                </>
                            ) : (
                                <>
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default SignOutModal;
