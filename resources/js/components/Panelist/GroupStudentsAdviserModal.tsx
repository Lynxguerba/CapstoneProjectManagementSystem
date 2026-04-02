import { GraduationCap, Mail, UserRound, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type GroupStudent = {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
};

type GroupAdviser = {
    id?: number | null;
    name?: string | null;
    email?: string | null;
} | null;

type GroupSummary = {
    id: number;
    name: string;
    program_set_name?: string | null;
    school_year?: string | null;
    students?: GroupStudent[];
    adviser?: GroupAdviser;
};

type GroupStudentsAdviserModalProps = {
    open: boolean;
    onClose: () => void;
    group: GroupSummary | null;
};

const GroupStudentsAdviserModal = ({ open, onClose, group }: GroupStudentsAdviserModalProps) => {
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

    if (!open || !group || typeof document === 'undefined') {
        return null;
    }

    const students = group.students ?? [];
    const adviser = group.adviser ?? null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[10010] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
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
                className={`max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-800" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Group Details</h2>
                            <p className="text-xs text-slate-600">
                                {group.name} · {group.program_set_name ?? 'Program set'} · {group.school_year ?? 'A.Y N/A'}
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
                            <p className="text-sm font-semibold text-slate-800">Students</p>
                        </div>
                        {students.length === 0 ? (
                            <div className="px-4 py-8 text-center text-xs text-slate-500">No students found for this group.</div>
                        ) : (
                            <div className="max-h-[48vh] overflow-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-slate-200 bg-white text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Student</th>
                                            <th className="px-4 py-3 font-semibold">Role</th>
                                            <th className="px-4 py-3 font-semibold">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map((student) => (
                                            <tr key={`${student.id ?? student.name ?? 'student'}`} className="hover:bg-emerald-50/40">
                                                <td className="px-4 py-3 text-slate-800">{student.name ?? 'Unnamed student'}</td>
                                                <td className="px-4 py-3 text-slate-600">{student.role ?? 'Member'}</td>
                                                <td className="px-4 py-3 text-slate-600">{student.email ?? 'No email'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-emerald-700" />
                            <p className="text-sm font-semibold text-emerald-900">Adviser Handle</p>
                        </div>

                        {adviser ? (
                            <div className="mt-3 space-y-2 text-xs text-emerald-900">
                                <p className="inline-flex items-center gap-2">
                                    <UserRound className="h-3.5 w-3.5 text-emerald-700" />
                                    <span>{adviser.name ?? 'Unnamed adviser'}</span>
                                </p>
                                <p className="inline-flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-emerald-700" />
                                    <span>{adviser.email ?? 'No email'}</span>
                                </p>
                            </div>
                        ) : (
                            <p className="mt-3 text-xs text-emerald-700">No adviser assigned yet.</p>
                        )}
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

export default GroupStudentsAdviserModal;
