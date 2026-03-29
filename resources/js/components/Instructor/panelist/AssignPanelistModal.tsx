import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Search, UserCheck, Users, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import panelistAssignment from '../../../routes/instructor/panelist-assignment';

type PanelRole = 'chairman' | 'member';

type PanelistProgramSummary = {
    program: string;
    max_groups: number;
    assigned_count: number;
    assigned_by_year?: Record<string, number>;
};

type PanelistOption = {
    id: number;
    name?: string | null;
    email?: string | null;
    is_available?: boolean;
    programs?: PanelistProgramSummary[];
};

type PanelistAssignment = {
    id: number;
    name?: string | null;
    email?: string | null;
    slot: number;
    role?: PanelRole | null;
};

type AssignPanelistModalProps = {
    open: boolean;
    groupId?: number | null;
    groupName?: string | null;
    programSetName?: string | null;
    groupProgram?: string | null;
    groupSchoolYear?: string | null;
    assignments?: PanelistAssignment[];
    currentPanelistId?: number | null;
    panelists: PanelistOption[];
    onClose: () => void;
};

const MAX_PANELS = 3;
const PANEL_ROLE_OPTIONS: PanelRole[] = ['chairman', 'member'];

const formatPanelRole = (role?: PanelRole | null): string => {
    if (role === 'chairman') {
        return 'Panel Chairman';
    }

    return 'Panel Member';
};

const resolveCapacityStatus = (
    panelist: PanelistOption,
    groupProgram?: string | null,
    groupSchoolYear?: string | null,
): {
    assigned: number;
    maxGroups: number;
    isClosed: boolean;
    isFull: boolean;
    label: string;
    classes: string;
} => {
    const normalizedProgram = typeof groupProgram === 'string' ? groupProgram.trim() : '';
    const isClosed = panelist.is_available !== true;
    const programSummary = (panelist.programs ?? []).find((program) => program.program === normalizedProgram);
    const maxGroups = programSummary?.max_groups ?? 5;
    const assigned =
        typeof groupSchoolYear === 'string' && groupSchoolYear !== ''
            ? (programSummary?.assigned_by_year?.[groupSchoolYear] ?? 0)
            : (programSummary?.assigned_count ?? 0);
    const isFull = assigned >= maxGroups;

    if (isClosed) {
        return {
            assigned,
            maxGroups,
            isClosed,
            isFull,
            label: 'Closed',
            classes: 'bg-rose-100 text-rose-700',
        };
    }

    if (isFull) {
        return {
            assigned,
            maxGroups,
            isClosed,
            isFull,
            label: 'Full',
            classes: 'bg-rose-100 text-rose-700',
        };
    }

    if (maxGroups - assigned <= 1) {
        return {
            assigned,
            maxGroups,
            isClosed,
            isFull,
            label: 'Partial',
            classes: 'bg-amber-100 text-amber-700',
        };
    }

    return {
        assigned,
        maxGroups,
        isClosed,
        isFull,
        label: 'Available',
        classes: 'bg-emerald-100 text-emerald-700',
    };
};

const AssignPanelistModal = ({
    open,
    groupId,
    groupName,
    programSetName,
    groupProgram,
    groupSchoolYear,
    assignments = [],
    currentPanelistId = null,
    panelists,
    onClose,
}: AssignPanelistModalProps) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedRole, setSelectedRole] = React.useState<PanelRole>('member');
    const [isAssigning, setIsAssigning] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');

    const assignedPanelistIds = React.useMemo(() => {
        return new Set(assignments.map((assignment) => assignment.id).filter((id): id is number => Number.isFinite(id)));
    }, [assignments]);

    const availablePanelists = React.useMemo(() => {
        return panelists.filter((panelist) => {
            if (currentPanelistId && panelist.id === currentPanelistId) {
                return false;
            }

            return !assignedPanelistIds.has(panelist.id);
        });
    }, [panelists, assignedPanelistIds, currentPanelistId]);

    const filteredPanelists = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return availablePanelists;
        }

        return availablePanelists.filter((panelist) => {
            const name = panelist.name?.toLowerCase() ?? '';
            const email = panelist.email?.toLowerCase() ?? '';

            return name.includes(query) || email.includes(query);
        });
    }, [availablePanelists, searchQuery]);

    const hasChairman = assignments.some((assignment) => assignment.role === 'chairman');
    const memberCount = assignments.filter((assignment) => (assignment.role ?? 'member') === 'member').length;
    const allowedRoles = React.useMemo<PanelRole[]>(() => {
        if (hasChairman) {
            return ['member'];
        }

        if (memberCount >= 2) {
            return ['chairman'];
        }

        return PANEL_ROLE_OPTIONS;
    }, [hasChairman, memberCount]);
    const effectiveRole = allowedRoles.includes(selectedRole) ? selectedRole : allowedRoles[0];
    const openSlots = Math.max(0, MAX_PANELS - assignments.length);

    React.useEffect(() => {
        if (!open) {
            setSearchQuery('');
            setSelectedRole('member');
            setIsAssigning(false);
            setErrorMessage('');
            return;
        }

        setSearchQuery('');
        setErrorMessage('');
        setSelectedRole((current) => (allowedRoles.includes(current) ? current : allowedRoles[0]));
    }, [open, groupId, hasChairman, memberCount, allowedRoles]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isAssigning) {
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
    }, [open, onClose, isAssigning]);

    const assignPanelist = (panelistId: number) => {
        if (!groupId || isAssigning || openSlots === 0) {
            return;
        }

        setIsAssigning(true);
        setErrorMessage('');

        router.post(
            panelistAssignment.assign.url(),
            {
                group_id: groupId,
                panelist_id: panelistId,
                panel_role: effectiveRole,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.panelist_id) {
                        setErrorMessage(errors.panelist_id);
                    } else if (errors.panel_role) {
                        setErrorMessage(errors.panel_role);
                    } else {
                        setErrorMessage('Unable to assign the panelist right now.');
                    }
                },
                onSuccess: () => {
                    router.reload({ only: ['groups', 'panelist', 'panelists'] });
                    onClose();
                },
                onFinish: () => {
                    setIsAssigning(false);
                },
            },
        );
    };

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isAssigning) {
                    onClose();
                }
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">Assign Panelist</p>
                            <h2 className="text-lg font-semibold text-emerald-900">{groupName ?? 'Selected Group'}</h2>
                            <p className="text-xs text-emerald-700">{programSetName ?? 'Program set'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isAssigning}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            Open slots: {openSlots} / {MAX_PANELS}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                            Role: {formatPanelRole(effectiveRole)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                            Program: {groupProgram ?? '—'} {groupSchoolYear ? `• ${groupSchoolYear}` : ''}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                            <span className="font-semibold">Role for this assignment</span>
                            {hasChairman ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    Chairman already set
                                </span>
                            ) : memberCount >= 2 ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    Chairman required
                                </span>
                            ) : null}
                        </div>
                        <select
                            value={selectedRole}
                            onChange={(event) => setSelectedRole(event.target.value as PanelRole)}
                            disabled={allowedRoles.length === 1}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 disabled:cursor-not-allowed"
                        >
                            {allowedRoles.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                    {formatPanelRole(roleOption)}
                                </option>
                            ))}
                        </select>
                        <span className="text-[10px] text-slate-500">Only one chairman and two members are allowed.</span>
                    </div>

                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search panelist by name or email"
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-10 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
                    ) : null}

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Panelist</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Program Capacity</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPanelists.map((panelistOption) => {
                                    const capacityStatus = resolveCapacityStatus(panelistOption, groupProgram, groupSchoolYear);
                                    const isAssignable = !capacityStatus.isClosed && !capacityStatus.isFull;

                                    return (
                                        <tr key={panelistOption.id} className="transition-colors hover:bg-emerald-50/30">
                                            <td className="px-6 py-3.5 font-semibold text-slate-800">{panelistOption.name ?? 'Panelist'}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{panelistOption.email ?? '—'}</td>
                                            <td className="px-6 py-3.5 font-semibold text-slate-700">
                                                {capacityStatus.assigned} / {capacityStatus.maxGroups}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${capacityStatus.classes}`}>
                                                    {capacityStatus.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => assignPanelist(panelistOption.id)}
                                                    disabled={isAssigning || openSlots === 0 || !isAssignable}
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                                                        isAssignable
                                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'border border-slate-200 bg-slate-100 text-slate-500'
                                                    } ${isAssigning || openSlots === 0 || !isAssignable ? 'cursor-not-allowed opacity-60' : ''}`}
                                                >
                                                    <UserCheck className="h-3 w-3" />
                                                    Assign
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredPanelists.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                            No available panelists match your search.
                        </div>
                    ) : null}
                </div>
            </motion.div>
        </div>,
        document.body,
    );
};

export default AssignPanelistModal;
