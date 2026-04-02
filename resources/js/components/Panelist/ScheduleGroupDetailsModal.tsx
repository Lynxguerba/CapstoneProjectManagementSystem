import { GraduationCap, Mail, UserRound, Users, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

export type GroupMemberDetail = {
    id?: string | number;
    name?: string | null;
    role?: string | null;
    email?: string | null;
};

export type GroupAdviserDetail = {
    id?: string | number;
    name?: string | null;
    email?: string | null;
} | null;

export type GroupPanelistDetail = {
    id?: string | number;
    name?: string | null;
    role?: string | null;
    email?: string | null;
};

export type ScheduleGroupDetails = {
    id: string;
    groupName: string;
    programSetName?: string | null;
    academicYear?: string | null;
    members: GroupMemberDetail[];
    adviser: GroupAdviserDetail;
    coPanelists: GroupPanelistDetail[];
};

type ScheduleGroupDetailsModalProps = {
    open: boolean;
    onClose: () => void;
    group: ScheduleGroupDetails | null;
};

const ScheduleGroupDetailsModal = ({ open, onClose, group }: ScheduleGroupDetailsModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);

    React.useEffect(() => {
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

    if (!open || !group || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className={`fixed inset-0 z-[10020] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
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
                className={`max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-800" />
                        <div>
                            <p className="text-lg font-bold text-gray-800">Group Details</p>
                            <p className="text-xs text-slate-500">
                                {group.groupName} · {group.programSetName ?? 'Program set'} · {group.academicYear ?? 'A.Y N/A'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                        aria-label="Close group details modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-800">Group Members</p>
                        </div>
                        {group.members.length === 0 ? (
                            <div className="px-4 py-8 text-center text-xs text-slate-500">No members available for this group.</div>
                        ) : (
                            <div className="max-h-[42vh] overflow-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-slate-200 bg-white text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Member</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {group.members.map((member) => (
                                            <tr key={`${member.id ?? member.name ?? 'member'}`} className="transition-colors hover:bg-emerald-50/40">
                                                <td className="px-4 py-3 text-slate-800">{member.name ?? 'Unnamed member'}</td>
                                                <td className="px-4 py-3 text-slate-600">{member.role ?? 'Member'}</td>
                                                <td className="px-4 py-3 text-slate-600">{member.email ?? 'No email'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-emerald-700" />
                                <p className="text-xs font-semibold text-emerald-900">Adviser Details</p>
                            </div>
                            {group.adviser ? (
                                <div className="mt-3 space-y-2 text-xs text-emerald-900">
                                    <p className="inline-flex items-center gap-2">
                                        <UserRound className="h-3.5 w-3.5 text-emerald-700" />
                                        <span>{group.adviser.name ?? 'Unnamed adviser'}</span>
                                    </p>
                                    <p className="inline-flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-emerald-700" />
                                        <span>{group.adviser.email ?? 'No email'}</span>
                                    </p>
                                </div>
                            ) : (
                                <p className="mt-3 text-xs text-emerald-700">No adviser assigned yet.</p>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold text-slate-800">Co-Panelists</p>
                            {group.coPanelists.length === 0 ? (
                                <p className="mt-3 text-xs text-slate-500">No co-panelists assigned yet.</p>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {group.coPanelists.map((panelist) => (
                                        <div
                                            key={`${panelist.id ?? panelist.name ?? 'panelist'}`}
                                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                        >
                                            <p className="text-xs font-semibold text-slate-800">{panelist.name ?? 'Unnamed panelist'}</p>
                                            <p className="text-[11px] text-slate-500">
                                                {panelist.role ?? 'Panel Member'}
                                                {panelist.email ? ` · ${panelist.email}` : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border-2 border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ScheduleGroupDetailsModal;
