import { motion } from 'framer-motion';
import { RefreshCcw, Users, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type GroupDetails = {
    id: number;
    name: string;
    program?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
};

type GroupMember = {
    id: number;
    fullName: string;
    email?: string;
    program?: string | null;
    role: string;
};

type GroupDetailsModalProps = {
    open: boolean;
    groupId?: number | null;
    onClose: () => void;
};

const GroupDetailsModal = ({ open, groupId, onClose }: GroupDetailsModalProps) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [group, setGroup] = React.useState<GroupDetails | null>(null);
    const [members, setMembers] = React.useState<GroupMember[]>([]);

    React.useEffect(() => {
        if (!open || !groupId) {
            return;
        }

        let isActive = true;
        const controller = new AbortController();

        const loadDetails = async () => {
            setIsLoading(true);
            setErrorMessage('');
            setGroup(null);
            setMembers([]);

            try {
                const response = await fetch(`/instructor/groups/${groupId}/details`, {
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Failed to load group details.');
                }

                const payload = await response.json();
                if (!isActive) {
                    return;
                }

                setGroup(payload.group ?? null);
                setMembers(Array.isArray(payload.members) ? payload.members : []);
            } catch (error) {
                if (!isActive || controller.signal.aborted) {
                    return;
                }

                setErrorMessage('Unable to load group details right now.');
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        loadDetails();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [open, groupId]);

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
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Group Details</p>
                            <h2 className="text-lg font-semibold text-slate-900">{group?.name ?? 'Loading...'}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (!groupId) {
                                    return;
                                }

                                setIsLoading(true);
                                fetch(`/instructor/groups/${groupId}/details`, {
                                    headers: {
                                        Accept: 'application/json',
                                    },
                                })
                                    .then((response) => {
                                        if (!response.ok) {
                                            throw new Error('Failed to load group details.');
                                        }

                                        return response.json();
                                    })
                                    .then((payload) => {
                                        setGroup(payload.group ?? null);
                                        setMembers(Array.isArray(payload.members) ? payload.members : []);
                                    })
                                    .catch(() => {
                                        setErrorMessage('Unable to load group details right now.');
                                    })
                                    .finally(() => {
                                        setIsLoading(false);
                                    });
                            }}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                    {errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
                    ) : null}

                    <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Program</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{group?.program ?? '—'}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase">School Year</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{group?.school_year ?? '—'}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Project Manager</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{group?.leader_name ?? '—'}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Group Members</p>
                            <p className="text-xs font-semibold text-slate-500">{members.length} total</p>
                        </div>
                        <div className="max-h-[45vh] overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Fullname</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Program</th>
                                        <th className="px-4 py-3">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {members.map((member) => (
                                        <tr key={member.id} className="hover:bg-emerald-50/40">
                                            <td className="px-4 py-3 font-semibold text-slate-800">{member.fullName}</td>
                                            <td className="px-4 py-3 text-slate-500">{member.email ?? '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{member.program ?? 'Unassigned'}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                                    {member.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!isLoading && members.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-500">No members assigned yet.</div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
};

export default GroupDetailsModal;
