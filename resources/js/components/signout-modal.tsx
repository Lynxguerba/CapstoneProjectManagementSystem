import { router } from '@inertiajs/react';
import { AlertTriangle, ChevronUp, LogOut, Repeat, Search, Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface SignOutModalProps {
    open: boolean;
    onClose: () => void;
    activeRole: string;
    assignedRoles: string[];
    showDeanAccountTools: boolean;
}

type ImpersonationUserOption = {
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];
    active_role?: string | null;
};

const formatRoleLabel = (role: string): string => {
    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const SignOutModal = ({ open, onClose, activeRole, assignedRoles, showDeanAccountTools }: SignOutModalProps) => {
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);
    const [isSubmittingImpersonation, setIsSubmittingImpersonation] = useState(false);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [showRoleTooltip, setShowRoleTooltip] = useState(false);
    const [impersonationQuery, setImpersonationQuery] = useState('');
    const [impersonationResults, setImpersonationResults] = useState<ImpersonationUserOption[]>([]);
    const [selectedUser, setSelectedUser] = useState<ImpersonationUserOption | null>(null);
    const [impersonationSearchError, setImpersonationSearchError] = useState('');
    const [isAppearing, setIsAppearing] = useState(false);

    const uniqueRoles = useMemo(() => {
        return [...new Set(assignedRoles.filter((role) => role.trim() !== ''))];
    }, [assignedRoles]);
    const canSwitchRole = uniqueRoles.length > 1;
    const canImpersonateUser = showDeanAccountTools;
    const isBusy = isSigningOut || isSwitchingRole || isSubmittingImpersonation;

    useEffect(() => {
        if (!open) {
            setShowRoleTooltip(false);
            setImpersonationQuery('');
            setImpersonationResults([]);
            setSelectedUser(null);
            setImpersonationSearchError('');
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
        if (!open || !canImpersonateUser) {
            setIsSearchingUsers(false);
            setImpersonationResults([]);
            setImpersonationSearchError('');
            return;
        }

        const normalizedQuery = impersonationQuery.trim();

        if (normalizedQuery.length < 2) {
            setIsSearchingUsers(false);
            setImpersonationResults([]);
            setImpersonationSearchError('');
            return;
        }

        const abortController = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setIsSearchingUsers(true);
            setImpersonationSearchError('');

            try {
                const response = await fetch(`/admin/impersonate/search?q=${encodeURIComponent(normalizedQuery)}`, {
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error('Unable to search users right now.');
                }

                const payload = (await response.json().catch(() => null)) as { users?: ImpersonationUserOption[] } | null;
                setImpersonationResults(Array.isArray(payload?.users) ? payload.users : []);
            } catch (error) {
                if (!abortController.signal.aborted) {
                    setImpersonationResults([]);
                    setImpersonationSearchError(error instanceof Error ? error.message : 'Unable to search users right now.');
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsSearchingUsers(false);
                }
            }
        }, 250);
 
        return () => {
            abortController.abort();
            window.clearTimeout(timeoutId);
        };
    }, [canImpersonateUser, impersonationQuery, open]);

    const handleSignOut = () => {
        setIsSigningOut(true);

        router.post('/logout', undefined, {
            preserveScroll: false,
            replace: true,
            onFinish: () => setIsSigningOut(false),
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
                preserveScroll: false,
                replace: true,
                onFinish: () => {
                    setIsSwitchingRole(false);
                    setShowRoleTooltip(false);
                },
            },
        );
    };

    const handleImpersonationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedUser) {
            return;
        }

        setIsSubmittingImpersonation(true);

        router.post(
            '/admin/impersonate',
            { email: selectedUser.email },
            {
                preserveScroll: false,
                replace: true,
                onFinish: () => {
                    setIsSubmittingImpersonation(false);
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
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isBusy) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <LogOut className="h-5 w-5 text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-800">Sign Out</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                        disabled={isBusy}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
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

                    {canImpersonateUser ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-amber-950">Dean account tools</p>
                                            <p className="text-xs text-amber-800">Search by email, first name, or last name to access another account.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleImpersonationSubmit} className="mt-3 space-y-2">
                                        <label htmlFor="impersonation-user-search" className="block text-xs font-semibold tracking-wide text-amber-900 uppercase">
                                            Search User
                                        </label>

                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-amber-500" />
                                            <input
                                                id="impersonation-user-search"
                                                type="text"
                                                value={impersonationQuery}
                                                onChange={(event) => {
                                                    setSelectedUser(null);
                                                    setImpersonationQuery(event.target.value);
                                                }}
                                                disabled={isSigningOut || isSwitchingRole || isSubmittingImpersonation}
                                                placeholder="Search email, first name, or last name..."
                                                className="w-full rounded-lg border border-amber-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-300/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                                            />
                                        </div>

                                        {impersonationQuery.trim().length < 2 ? (
                                            <p className="text-xs text-amber-800">Type at least 2 characters to search accounts.</p>
                                        ) : null}

                                        {impersonationSearchError !== '' ? <p className="text-xs text-rose-600">{impersonationSearchError}</p> : null}

                                        {impersonationQuery.trim().length >= 2 ? (
                                            <div className="max-h-52 overflow-y-auto rounded-xl border border-amber-200 bg-white shadow-sm">
                                                {isSearchingUsers ? (
                                                    <p className="px-4 py-3 text-sm text-slate-500">Searching users...</p>
                                                ) : impersonationResults.length === 0 ? (
                                                    <p className="px-4 py-3 text-sm text-slate-500">No matching users found.</p>
                                                ) : (
                                                    impersonationResults.map((user) => {
                                                        const isSelected = selectedUser?.email === user.email;

                                                        return (
                                                            <button
                                                                key={user.email}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setImpersonationQuery(user.email);
                                                                }}
                                                                disabled={isSigningOut || isSwitchingRole || isSubmittingImpersonation}
                                                                className={`flex w-full flex-col gap-1 border-b border-amber-100 px-4 py-3 text-left transition last:border-b-0 ${
                                                                    isSelected ? 'bg-amber-100/80' : 'hover:bg-amber-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-sm font-semibold text-slate-800">{user.full_name}</span>
                                                                    {user.active_role ? (
                                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                                                            {formatRoleLabel(user.active_role)}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <span className="text-xs text-slate-600">{user.email}</span>
                                                                {user.roles.length > 0 ? (
                                                                    <span className="text-[11px] text-slate-500">
                                                                        {user.roles.map((role) => formatRoleLabel(role)).join(', ')}
                                                                    </span>
                                                                ) : null}
                                                                {isSelected ? <span className="text-[10px] font-semibold text-amber-800">Selected account</span> : null}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        ) : null}

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isSigningOut || isSwitchingRole || isSubmittingImpersonation || selectedUser === null}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isSubmittingImpersonation ? 'Switching...' : 'Switch User'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                        {canSwitchRole ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRoleTooltip((previousState) => !previousState);
                                    }}
                                    disabled={isBusy}
                                    className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-2 font-medium text-blue-700 transition-all duration-200 hover:bg-blue-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Repeat className="h-4 w-4" />
                                    Switch Role
                                    <ChevronUp className={`h-4 w-4 transition-transform ${showRoleTooltip ? 'rotate-0' : 'rotate-180'}`} />
                                </button>

                                {showRoleTooltip ? (
                                    <div className="absolute right-0 bottom-full z-30 mb-2 w-56 rounded-xl border border-blue-200 bg-white p-2 shadow-xl">
                                        <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Assigned Roles</p>
                                        <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
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
                            disabled={isBusy}
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
