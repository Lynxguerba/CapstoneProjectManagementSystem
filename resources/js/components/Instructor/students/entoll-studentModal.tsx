import { useForm } from '@inertiajs/react';
import { Search, UserPlus, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type StudentOption = {
    id: number;
    firstName?: string;
    lastName?: string;
    name: string;
    email: string;
    program?: string | null;
    isEnrolledInOtherSet?: boolean;
};

type EnrollStudentModalProps = {
    open: boolean;
    onClose: () => void;
    programSetId: number;
    programSetName: string;
    programSetProgram: string;
    availableStudents?: StudentOption[];
};

type EnrollStudentForm = {
    student_id: number | null;
    program_set_id: number;
};

const EnrollStudentModal = ({
    open,
    onClose,
    programSetId,
    programSetName,
    programSetProgram,
    availableStudents = [],
}: EnrollStudentModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

    const enrollForm = useForm<EnrollStudentForm>({
        student_id: null,
        program_set_id: programSetId,
    });

    useEffect(() => {
        if (open) {
            enrollForm.setData('program_set_id', programSetId);
        }
    }, [open, programSetId, enrollForm]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !enrollForm.processing) {
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
    }, [open, onClose, enrollForm.processing]);

    useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            setSearchQuery('');
            setSelectedStudent(null);
            enrollForm.reset();
            return;
        }

        setIsAppearing(true);
    }, [open, enrollForm]);

    const resolveStudentName = (student: StudentOption): string => {
        const fallbackName = typeof student.name === 'string' ? student.name.trim() : '';
        const firstName = typeof student.firstName === 'string' ? student.firstName.trim() : '';
        const lastName = typeof student.lastName === 'string' ? student.lastName.trim() : '';
        const combined = [firstName, lastName].filter(Boolean).join(' ').trim();

        return fallbackName || combined || 'Unknown Student';
    };

    const filteredStudents = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return availableStudents;

        return availableStudents.filter((student) => {
            const name = resolveStudentName(student).toLowerCase();
            const firstName = (student.firstName ?? '').toLowerCase();
            const lastName = (student.lastName ?? '').toLowerCase();
            const email = (student.email ?? '').toLowerCase();

            return (
                name.includes(query) ||
                firstName.includes(query) ||
                lastName.includes(query) ||
                email.includes(query)
            );
        });
    }, [availableStudents, searchQuery]);

    const handleSelectStudent = (student: StudentOption) => {
        setSelectedStudent(student);
        enrollForm.setData('student_id', student.id);
        setSearchQuery('');
    };

    const handleDeselectStudent = () => {
        setSelectedStudent(null);
        enrollForm.setData('student_id', null);
    };

    const normalizedSectionProgram = programSetProgram.trim().toUpperCase();
    const normalizedStudentProgram = (selectedStudent?.program ?? '').trim().toUpperCase();
    const hasSectionProgram = normalizedSectionProgram !== '';
    const hasStudentProgram = normalizedStudentProgram !== '';
    const programMatches = hasSectionProgram && hasStudentProgram && normalizedStudentProgram === normalizedSectionProgram;
    const programMismatch = selectedStudent !== null && hasSectionProgram && (!hasStudentProgram || !programMatches);
    const enrolledElsewhere = selectedStudent?.isEnrolledInOtherSet === true;

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!enrollForm.data.student_id || programMismatch || enrolledElsewhere) {
            return;
        }

        enrollForm.post('/instructor/students/enroll', {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                enrollForm.reset();
                setSelectedStudent(null);
                setSearchQuery('');
                onClose();
            },
        });
    };

    const shouldRender = open || isAppearing;

    if (!shouldRender) {
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
                if (event.target === event.currentTarget && !enrollForm.processing) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[90vh] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">Enroll Student</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={enrollForm.processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submitForm} className="space-y-4 p-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Enrolling to</p>
                        <p className="text-sm font-semibold text-slate-800">{programSetName}</p>
                    </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Search Student</label>
                            {selectedStudent ? (
                                <div className="mt-1.5 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5">
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900">{resolveStudentName(selectedStudent)}</p>
                                        <p className="text-xs text-emerald-700">{selectedStudent.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                    onClick={handleDeselectStudent}
                                    disabled={enrollForm.processing}
                                    className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-200"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative mt-1.5">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search by name or email..."
                                    disabled={enrollForm.processing}
                                    className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-10 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                                />
                            </div>
                        )}

                        {!selectedStudent && searchQuery.trim() && (
                            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                {filteredStudents.length === 0 ? (
                                    <p className="px-4 py-3 text-sm text-slate-500">No students found.</p>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => handleSelectStudent(student)}
                                            disabled={enrollForm.processing || student.isEnrolledInOtherSet === true}
                                            className={`flex w-full flex-col border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-b-0 ${
                                                student.isEnrolledInOtherSet === true ? 'cursor-not-allowed bg-rose-50/60' : 'hover:bg-emerald-50'
                                            }`}
                                        >
                                            <span className="text-sm font-medium text-slate-800">{resolveStudentName(student)}</span>
                                            <span className="text-xs text-slate-500">{student.email}</span>
                                            {student.isEnrolledInOtherSet ? (
                                                <span className="text-xs font-semibold text-rose-600">Already enrolled in another set</span>
                                            ) : null}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {!selectedStudent && !searchQuery.trim() && availableStudents.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">Start typing to search for available students.</p>
                        )}

                        {enrollForm.errors.student_id ? (
                            <p className="mt-1 text-xs text-rose-600">{enrollForm.errors.student_id}</p>
                        ) : null}

                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-700">Program Verification</p>
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                        selectedStudent
                                            ? programMatches
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-700'
                                            : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {selectedStudent ? (programMatches ? 'Match' : 'Mismatch') : 'Pending'}
                                </span>
                            </div>
                            <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                                <p>
                                    Section program: <span className="font-semibold text-slate-700">{programSetProgram || 'Unassigned'}</span>
                                </p>
                                <p>
                                    Student program:{' '}
                                    <span className="font-semibold text-slate-700">
                                        {selectedStudent?.program ?? 'Unassigned'}
                                    </span>
                                </p>
                                {selectedStudent && programMismatch ? (
                                    <p className="text-rose-600">Student program does not match the selected section.</p>
                                ) : null}
                                {selectedStudent && enrolledElsewhere ? (
                                    <p className="text-rose-600">Student is already enrolled in another program set.</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={enrollForm.processing}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={enrollForm.processing || !selectedStudent || programMismatch || enrolledElsewhere}
                            className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {enrollForm.processing ? 'Enrolling...' : 'Enroll Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
};

export default EnrollStudentModal;
