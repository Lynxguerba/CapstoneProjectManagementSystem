import React, { useState } from 'react';
import {
    X,
    LogOut,
    AlertTriangle,
} from 'lucide-react';

interface SignOutModalProps {
    open: boolean;
    onClose: () => void;
}

const SignOutModal = ({ open, onClose }: SignOutModalProps) => {
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <LogOut className="w-5 h-5 text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-800">Sign Out</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:bg-gray-200 rounded-lg p-1.5 transition-all duration-200 hover:rotate-90"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full w-10 h-10 flex items-center justify-center text-white shadow-sm">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-900">
                                    Are you sure you want to sign out?
                                </p>
                                <p className="text-xs text-red-800">
                                    You will be redirected to the login page and cannot go back to this page.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-gray-200">
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all duration-200 font-medium hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSignOut}
                            disabled={loading}
                            className="group relative overflow-hidden px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed z-10 flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {/* Shine layer */}
                            <span
                                className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                            />
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing Out...
                                </>
                            ) : (
                                <>
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignOutModal;