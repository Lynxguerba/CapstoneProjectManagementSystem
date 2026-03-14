import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { RefreshCcw, Users, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type GroupInfo = {
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

type EditableMember = GroupMember & {
    isRemoved?: boolean;
};

type EditGroupMembersModalProps = {
    open: boolean;
    groupId?: number | null;
    onClose: () => void;
};

type EditGroupForm = {
    members: {
        student_id: number;
        role: string;
    }[];
};

const roleOptions = ['Project Manager', 'Programmer', 'Documentarian', 'Data Analyst'];

const EditGroupMembersModal = ({ open, groupId, onClose }: EditGroupMembersModalProps) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [group, setGroup] = React.useState<GroupInfo | null>(null);
    const [members, setMembers] = React.useState<EditableMember[]>([]);

    const editForm = useForm<EditGroupForm>({
        members: [],
    });

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

                const loadedMembers = Array.isArray(payload.members) ? payload.members : [];
                setGroup(payload.group ?? null);
                setMembers(loadedMembers.map((member: GroupMember) => ({ ...member, isRemoved: false })));
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
            if (event.key === 'Escape' && !editForm.processing) {
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
    }, [open, onClose, editForm.processing]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const activeMembers = members.filter((member) => !member.isRemoved);
        editForm.setData(
            'members',
            activeMembers.map((member) => ({
                student_id: member.id,
                role: member.role,
            })),
        );
    }, [open, members, editForm]);

    const toggleRemove = (memberId: number) => {
        setMembers((previous) =>
            previous.map((member) =>
                member.id === memberId ? { ...member, isRemoved: !member.isRemoved } : member,
            ),
        );
    };

    const updateRole = (memberId: number, role: string) => {
        setMembers((previous) =>
            previous.map((member) => {
                if (member.id === memberId) {
                    return { ...member, role };
                }

                return member;
            }),
        );
    };

    const activeMembers = members.filter((member) => !member.isRemoved);
    const leaderCount = activeMembers.filter((member) => member.role === 'Project Manager').length;
    const hasLeader = leaderCount === 1;
    const hasMinimumMembers = activeMembers.length >= 2;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!groupId || !hasLeader || !hasMinimumMembers) {
            return;
        }

        editForm.put(`/instructor/groups/${groupId}/members`, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
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
                if (event.target === event.currentTarget && !editForm.processing) {
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
                <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Edit Group</p>
                            <h2 className="text-lg font-semibold text-emerald-900">{group?.name ?? 'Loading...'}</h2>
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
                                        const loadedMembers = Array.isArray(payload.members) ? payload.members : [];
                                        setGroup(payload.group ?? null);
                                        setMembers(loadedMembers.map((member: GroupMember) => ({ ...member, isRemoved: false })));
                                    })
                                    .catch(() => {
                                        setErrorMessage('Unable to load group details right now.');
                                    })
                                    .finally(() => {
                                        setIsLoading(false);
                                    });
                            }}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={editForm.processing}
                            className="rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                    {errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</div>
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
                            <p className="text-xs font-semibold text-slate-500 uppercase">Current Leader</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{group?.leader_name ?? '—'}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Members</p>
                            <p className="text-xs font-semibold text-slate-500">{activeMembers.length} active</p>
                        </div>
                        <div className="max-h-[45vh] overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Program</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {members.map((member) => (
                                        <tr key={member.id} className={member.isRemoved ? 'bg-rose-50/40' : 'hover:bg-emerald-50/40'}>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-800">{member.fullName}</p>
                                                <p className="text-[10px] text-slate-500">{member.email ?? '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{member.program ?? 'Unassigned'}</td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={member.role}
                                                    disabled={member.isRemoved}
                                                    onChange={(event) => updateRole(member.id, event.target.value)}
                                                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                >
                                                    {roleOptions.map((role) => (
                                                        <option key={role} value={role}>
                                                            {role}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRemove(member.id)}
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${
                                                        member.isRemoved
                                                            ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                            : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                                    }`}
                                                >
                                                    {member.isRemoved ? 'Undo' : 'Remove'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!isLoading && members.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-500">No members found.</div>
                            ) : null}
                        </div>
                    </div>

                    {!hasLeader ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                            Assign exactly one Project Manager to continue.
                        </div>
                    ) : null}

                    {!hasMinimumMembers ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                            Keep at least two members in the group.
                        </div>
                    ) : null}

                    {editForm.errors.members ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                            {editForm.errors.members}
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={editForm.processing}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing || !hasLeader || !hasMinimumMembers}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {editForm.processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>,
        document.body,
    );
};

export default EditGroupMembersModal;
