import { router } from '@inertiajs/react';
import { AlertTriangle, ChevronUp, LogOut, Repeat, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface SignOutModalProps {
    open: boolean;
    onClose: () => void;
    activeRole: string;
    assignedRoles: string[];
}

const formatRoleLabel = (role: string): string => {
    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const SignOutModal = ({ open, onClose, activeRole, assignedRoles }: SignOutModalProps) => {
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);
    const [showRoleTooltip, setShowRoleTooltip] = useState(false);

    const uniqueRoles = useMemo(() => {
        return [...new Set(assignedRoles.filter((role) => role.trim() !== ''))];
    }, [assignedRoles]);
    const canSwitchRole = uniqueRoles.length > 1;

    useEffect(() => {
        if (!open) {
            setShowRoleTooltip(false);
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (showRoleTooltip) {
                    setShowRoleTooltip(false);
                    return;
                }

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
    }, [open, onClose, showRoleTooltip]);

    const handleSignOut = () => {
        setIsSigningOut(true);

        router.post('/logout', undefined, {
            preserveScroll: true,
            onFinish: () => {
                setIsSigningOut(false);
            },
        });
    };

    const handleSwitchRole = (role: string) => {
        if (role === activeRole) {
            setShowRoleTooltip(false);
            return;
        }

        setIsSwitchingRole(true);

        router.post(
            '/switch-role',
            { role },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSwitchingRole(false);
                    setShowRoleTooltip(false);
                },
            },
        );
    };

    if (!open) {
        return null;
    }

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSigningOut && !isSwitchingRole) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <LogOut className="h-5 w-5 text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-800">Sign Out</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                        disabled={isSigningOut || isSwitchingRole}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

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

                <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                        {canSwitchRole ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowRoleTooltip((previousState) => !previousState)}
                                    disabled={isSigningOut || isSwitchingRole}
                                    className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-2 font-medium text-blue-700 transition-all duration-200 hover:bg-blue-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Repeat className="h-4 w-4" />
                                    Switch Role
                                    <ChevronUp className={`h-4 w-4 transition-transform ${showRoleTooltip ? 'rotate-0' : 'rotate-180'}`} />
                                </button>

                                {showRoleTooltip ? (
                                    <div className="absolute right-0 bottom-12 z-20 w-56 rounded-xl border border-blue-200 bg-white p-2 shadow-xl">
                                        <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Assigned Roles</p>
                                        <div className="space-y-1">
                                            {uniqueRoles.map((role) => {
                                                const isActive = role === activeRole;

                                                return (
                                                    <button
                                                        key={role}
                                                        type="button"
                                                        onClick={() => handleSwitchRole(role)}
                                                        disabled={isSwitchingRole || isActive}
                                                        className={`w-full rounded-lg px-2 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                                                            isActive
                                                                ? 'bg-emerald-50 font-semibold text-emerald-700'
                                                                : 'text-slate-700 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        {formatRoleLabel(role)}
                                                        {isActive ? ' (Current)' : ''}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <button
                            type="button"
                            onClick={handleSignOut}
                            disabled={isSigningOut || isSwitchingRole}
                            className="group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg bg-red-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                            {isSigningOut ? (
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
