import { UserPlus, X, HelpCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface UnregisteredEmailModalProps {
    open: boolean;
    onClose: () => void;
    onRegister: () => void;
}

const UnregisteredEmailModal = ({ open, onClose, onRegister }: UnregisteredEmailModalProps) => {
    const [isAppearing, setIsAppearing] = useState(false);

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
                        <HelpCircle className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-gray-800">Account Not Found</h2>
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
                            <UserPlus className="h-10 w-10" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Email Not Registered</h3>
                            <p className="text-sm text-gray-600">
                                The email address you entered is not registered in our system. Double-check the spelling or open the registration form to create an account.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={onRegister}
                            className="group relative isolate inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-700 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:from-emerald-500 hover:to-green-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 active:scale-[0.98]"
                        >
                            <span className="relative z-10">Open Registration Form</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 transition duration-200 hover:bg-gray-200 active:scale-[0.98]"
                        >
                            Try Another Email
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default UnregisteredEmailModal;
