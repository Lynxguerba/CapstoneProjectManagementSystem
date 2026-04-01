import { useForm } from '@inertiajs/react';
import { Check, Circle, CircleOff, Search, UserPlus, X } from 'lucide-react';
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
    program_set_id: number;
    rows: Array<{
        student_id: number;
    }>;
};

type StudentStatus = {
    programMatches: boolean;
    programMismatch: boolean;
    enrolledElsewhere: boolean;
    selectable: boolean;
    normalizedProgram: string;
};

const normalizeProgram = (program?: string | null): string => {
    if (!program) {
        return '';
    }

    return program.trim().toUpperCase();
};

const resolveStudentName = (student: StudentOption): string => {
    const fallbackName = typeof student.name === 'string' ? student.name.trim() : '';
    const firstName = typeof student.firstName === 'string' ? student.firstName.trim() : '';
    const lastName = typeof student.lastName === 'string' ? student.lastName.trim() : '';
    const combined = [firstName, lastName].filter(Boolean).join(' ').trim();

    return fallbackName || combined || 'Unknown Student';
};

const EnrollStudentModal = ({ open, onClose, programSetId, programSetName, programSetProgram, availableStudents = [] }: EnrollStudentModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

    const enrollForm = useForm<EnrollStudentForm>({
        program_set_id: programSetId,
        rows: [],
    });

    const normalizedSectionProgram = normalizeProgram(programSetProgram);
    const programMatchedStudents = useMemo(() => {
        if (normalizedSectionProgram === '') {
            return availableStudents;
        }

        return availableStudents.filter((student) => normalizeProgram(student.program) === normalizedSectionProgram);
    }, [availableStudents, normalizedSectionProgram]);

    const statusByStudentId = useMemo(() => {
        const statusMap = new Map<number, StudentStatus>();

        programMatchedStudents.forEach((student) => {
            const normalizedStudentProgram = normalizeProgram(student.program);
            const hasSectionProgram = normalizedSectionProgram !== '';
            const hasStudentProgram = normalizedStudentProgram !== '';
            const programMatches = !hasSectionProgram || (hasStudentProgram && normalizedStudentProgram === normalizedSectionProgram);
            const programMismatch = hasSectionProgram && !programMatches;
            const enrolledElsewhere = student.isEnrolledInOtherSet === true;
            const selectable = !programMismatch && !enrolledElsewhere;

            statusMap.set(student.id, {
                programMatches,
                programMismatch,
                enrolledElsewhere,
                selectable,
                normalizedProgram: normalizedStudentProgram,
            });
        });

        return statusMap;
    }, [programMatchedStudents, normalizedSectionProgram]);

    const studentById = useMemo(() => {
        return new Map(programMatchedStudents.map((student) => [student.id, student]));
    }, [programMatchedStudents]);

    const selectedStudents = useMemo(() => {
        return selectedStudentIds
            .map((studentId) => studentById.get(studentId))
            .filter((student): student is StudentOption => student !== undefined);
    }, [selectedStudentIds, studentById]);

    const selectedStudentIdSet = useMemo(() => {
        return new Set(selectedStudentIds);
    }, [selectedStudentIds]);

    const filteredStudents = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (query === '') {
            return programMatchedStudents;
        }

        return programMatchedStudents.filter((student) => {
            const name = resolveStudentName(student).toLowerCase();
            const firstName = (student.firstName ?? '').toLowerCase();
            const lastName = (student.lastName ?? '').toLowerCase();
            const email = (student.email ?? '').toLowerCase();

            return name.includes(query) || firstName.includes(query) || lastName.includes(query) || email.includes(query);
        });
    }, [programMatchedStudents, searchQuery]);

    const selectedPreview = useMemo(() => {
        if (selectedStudents.length === 0) {
            return 'No students selected.';
        }

        const previewNames = selectedStudents.slice(0, 3).map((student) => resolveStudentName(student));
        const extraCount = selectedStudents.length - previewNames.length;

        if (extraCount > 0) {
            return `${previewNames.join(', ')}, +${extraCount} more`;
        }

        return previewNames.join(', ');
    }, [selectedStudents]);

    useEffect(() => {
        if (open) {
            enrollForm.setData('program_set_id', programSetId);
        }
    }, [open, programSetId, enrollForm]);

    useEffect(() => {
        const validSelectedRows = selectedStudentIds
            .filter((studentId) => statusByStudentId.get(studentId)?.selectable === true)
            .map((studentId) => ({
                student_id: studentId,
            }));

        enrollForm.setData('rows', validSelectedRows);
    }, [enrollForm, selectedStudentIds, statusByStudentId]);

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
            setSelectedStudentIds([]);
            enrollForm.reset();

            return;
        }

        setIsAppearing(true);
    }, [open, enrollForm]);

    const toggleStudentSelection = (student: StudentOption) => {
        if (enrollForm.processing) {
            return;
        }

        const status = statusByStudentId.get(student.id);
        if (status === undefined) {
            return;
        }

        setSelectedStudentIds((previousSelected) => {
            const alreadySelected = previousSelected.includes(student.id);

            if (alreadySelected) {
                return previousSelected.filter((studentId) => studentId !== student.id);
            }

            if (!status.selectable) {
                return previousSelected;
            }

            return [...previousSelected, student.id];
        });
    };

    const deselectStudent = (studentId: number) => {
        setSelectedStudentIds((previousSelected) => previousSelected.filter((id) => id !== studentId));
    };

    const clearAllSelected = () => {
        setSelectedStudentIds([]);
    };

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (enrollForm.data.rows.length === 0) {
            return;
        }

        enrollForm.post('/instructor/students/bulk-enroll', {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                enrollForm.reset();
                setSearchQuery('');
                setSelectedStudentIds([]);
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
                className={`max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">Enroll Students</h2>
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

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Student Search</label>
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
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-slate-700">Program Verification</p>
                                    <span className="text-[11px] text-slate-500">
                                        Section: <span className="font-semibold text-slate-700">{programSetProgram || 'Unassigned'}</span>
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Only students matching this section program are shown. Students already enrolled in another set cannot be selected.
                                </p>
                            </div>

                            <div className="max-h-[44vh] overflow-y-auto rounded-xl border border-slate-200 bg-white">
                                {filteredStudents.length === 0 ? (
                                    <p className="px-4 py-3 text-sm text-slate-500">No students found.</p>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const status = statusByStudentId.get(student.id);
                                        const isSelected = selectedStudentIdSet.has(student.id);

                                        if (!status) {
                                            return null;
                                        }

                                        const programBadgeClassName = status.programMatches
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700';
                                        const enrollmentBadgeClassName = status.enrolledElsewhere
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-slate-100 text-slate-600';

                                        return (
                                            <button
                                                key={student.id}
                                                type="button"
                                                onClick={() => toggleStudentSelection(student)}
                                                disabled={enrollForm.processing || (!status.selectable && !isSelected)}
                                                className={`flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 ${
                                                    isSelected
                                                        ? 'bg-emerald-50'
                                                        : status.selectable
                                                          ? 'hover:bg-emerald-50/60'
                                                          : 'cursor-not-allowed bg-rose-50/40'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-slate-800">{resolveStudentName(student)}</p>
                                                    <p className="truncate text-xs text-slate-500">{student.email}</p>
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${programBadgeClassName}`}
                                                        >
                                                            {status.normalizedProgram || 'Unassigned'}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${enrollmentBadgeClassName}`}
                                                        >
                                                            {status.enrolledElsewhere ? 'Enrolled Elsewhere' : 'Available'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full border text-[10px] font-bold ${
                                                        isSelected
                                                            ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                                                            : status.selectable
                                                              ? 'border-slate-300 bg-white text-slate-500'
                                                              : 'border-rose-200 bg-rose-100 text-rose-600'
                                                    }`}
                                                >
                                                    {isSelected ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : status.selectable ? (
                                                        <Circle className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <CircleOff className="h-3.5 w-3.5" />
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Selected Students</p>
                                    <p className="text-xs text-slate-500">{selectedStudents.length} selected for enrollment</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearAllSelected}
                                    disabled={enrollForm.processing || selectedStudents.length === 0}
                                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Clear All
                                </button>
                            </div>

                            <div className="max-h-[44vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                                {selectedStudents.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                                        No students selected yet. Add students from the left pane.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-200">
                                        {selectedStudents.map((student) => (
                                            <div key={student.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-800">{resolveStudentName(student)}</p>
                                                    <p className="truncate text-xs text-slate-500">{student.email}</p>
                                                    <p className="mt-1 text-[11px] text-slate-600">
                                                        Program: <span className="font-semibold text-slate-700">{student.program ?? 'Unassigned'}</span>
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => deselectStudent(student.id)}
                                                    disabled={enrollForm.processing}
                                                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    aria-label={`Remove ${resolveStudentName(student)} from selected students`}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {enrollForm.errors.rows ? <p className="text-xs text-rose-600">{enrollForm.errors.rows}</p> : null}

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={enrollForm.processing}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <div className="space-y-1 text-right">
                            <button
                                type="submit"
                                disabled={enrollForm.processing || enrollForm.data.rows.length === 0}
                                className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {enrollForm.processing
                                    ? `Enrolling ${enrollForm.data.rows.length} student${enrollForm.data.rows.length === 1 ? '' : 's'}...`
                                    : `Enroll Selected (${enrollForm.data.rows.length})`}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
};

export default EnrollStudentModal;
