import { Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type GroupMemberRow = {
    id: number;
    name: string;
    email: string;
    role?: string | null;
    is_leader?: boolean;
};

type GroupDetailsModalProps = {
    open: boolean;
    groupName?: string | null;
    programSetName?: string | null;
    schoolYear?: string | null;
    members?: GroupMemberRow[];
    onClose: () => void;
};

const GroupDetailsModal = ({ open, groupName, programSetName, schoolYear, members = [], onClose }: GroupDetailsModalProps) => {
    const [isAppearing, setIsAppearing] = useState(false);

    const orderedMembers = useMemo(() => {
        return [...members].sort((first, second) => {
            const leaderSort = Number(Boolean(second.is_leader)) - Number(Boolean(first.is_leader));
            if (leaderSort !== 0) {
                return leaderSort;
            }

            return first.name.localeCompare(second.name);
        });
    }, [members]);

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
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-800" />
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900">Group Details</h2>
                            <p className="text-xs text-emerald-700">{groupName ?? 'Selected group'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Members</p>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                {orderedMembers.length} total
                            </span>
                        </div>

                        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                            {orderedMembers.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-slate-500">No members found for this group.</div>
                            ) : (
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-2.5">Name</th>
                                            <th className="px-4 py-2.5">Email</th>
                                            <th className="px-4 py-2.5">Program Set</th>
                                            <th className="px-4 py-2.5 text-right">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {orderedMembers.map((member) => {
                                            const roleLabel = member.is_leader ? 'Leader' : member.role ? member.role : 'Member';
                                            const badgeClasses = member.is_leader ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600';
                                            const rowClasses = member.is_leader ? 'bg-emerald-50/60' : 'bg-white';

                                            return (
                                                <tr key={member.id} className={rowClasses}>
                                                    <td className="px-4 py-2.5 font-semibold text-slate-800">{member.name || 'Unnamed student'}</td>
                                                    <td className="px-4 py-2.5 text-slate-500">{member.email || 'No email on file'}</td>
                                                    <td className="px-4 py-2.5 text-slate-600">
                                                        <div className="font-semibold text-slate-700">{programSetName ?? 'Program set'}</div>
                                                        <div className="text-[10px] text-slate-500">{schoolYear ?? 'Academic year not set'}</div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClasses}`}>
                                                            {roleLabel}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default GroupDetailsModal;
