import { motion } from 'framer-motion';
import { ClipboardList, RefreshCcw, Users, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import panelistAssignment from '../../../routes/instructor/panelist-assignment';

type PanelistGroupRow = {
    id: number;
    name: string;
    program_set_name?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
    members_count?: number;
    panel_role?: 'chairman' | 'member' | null;
};

type PanelistGroupsSummary = {
    assigned_count: number;
    academic_year: string | null;
};

type PanelistGroupsModalProps = {
    open: boolean;
    panelistId?: number | null;
    panelistName?: string | null;
    academicYear?: string;
    onClose: () => void;
};

const PanelistGroupsModal = ({ open, panelistId, panelistName, academicYear, onClose }: PanelistGroupsModalProps) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [groups, setGroups] = React.useState<PanelistGroupRow[]>([]);
    const [summary, setSummary] = React.useState<PanelistGroupsSummary | null>(null);

    const loadGroups = React.useCallback(
        async (signal?: AbortSignal) => {
            if (!panelistId) {
                return;
            }

            setIsLoading(true);
            setErrorMessage('');

            try {
                const url = panelistAssignment.groups.url(
                    { panelist: panelistId },
                    academicYear && academicYear !== 'All' ? { query: { academic_year: academicYear } } : undefined,
                );
                const response = await fetch(url, {
                    headers: {
                        Accept: 'application/json',
                    },
                    signal,
                });

                if (!response.ok) {
                    throw new Error('Failed to load panelist groups.');
                }

                const payload = await response.json();
                const nextGroups = Array.isArray(payload.groups) ? payload.groups : [];

                setGroups(nextGroups);
                setSummary(payload.summary ?? null);
            } catch (error) {
                if (signal?.aborted) {
                    return;
                }

                setErrorMessage('Unable to load panelist groups right now.');
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [panelistId, academicYear],
    );

    React.useEffect(() => {
        if (!open || !panelistId) {
            return;
        }

        const controller = new AbortController();
        loadGroups(controller.signal);

        return () => {
            controller.abort();
        };
    }, [open, panelistId, academicYear, loadGroups]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
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

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const displayAcademicYear = summary?.academic_year ?? (academicYear && academicYear !== '' ? academicYear : 'All');
    const assignedCount = summary?.assigned_count ?? groups.length;
    const formatPanelRole = (role?: 'chairman' | 'member' | null): string => (role === 'chairman' ? 'Panel Chairman' : 'Panel Member');

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Panelist Groups</p>
                            <h2 className="text-lg font-semibold text-emerald-900">{panelistName ?? 'Selected Panelist'}</h2>
                            <p className="text-xs text-emerald-700">Academic Year: {displayAcademicYear}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => loadGroups()}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            <ClipboardList className="h-3 w-3" />
                            Assigned: {assignedCount}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                            Groups listed for {displayAcademicYear === 'All' ? 'all academic years' : displayAcademicYear}
                        </span>
                    </div>

                    {errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Group</th>
                                    <th className="px-6 py-4">Leader</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Members</th>
                                    <th className="px-6 py-4">A.Y</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {groups.map((group) => (
                                    <tr key={group.id} className="transition-colors hover:bg-emerald-50/40">
                                        <td className="px-6 py-3.5">
                                            <div>
                                                <div className="font-semibold text-slate-800">{group.name}</div>
                                                <div className="text-[10px] text-slate-500">{group.program_set_name ?? 'Program set'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">{group.leader_name ?? '—'}</td>
                                        <td className="px-6 py-3.5">
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                                                {formatPanelRole(group.panel_role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{group.members_count ?? 0}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{group.school_year ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {!isLoading && groups.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-500">No groups assigned for this panelist.</div>
                        ) : null}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
};

export default PanelistGroupsModal;
