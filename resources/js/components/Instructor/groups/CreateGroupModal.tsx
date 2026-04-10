import { router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronDown, Search, UserPlus, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import instructorGroups from '../../../routes/instructor/groups';
import instructorProgramSets from '../../../routes/instructor/program-sets';
import { crossSetSearch } from '../../../routes/instructor/students';

type ProgramSetSummary = {
    id: number;
    name: string;
    program?: string | null;
    school_year?: string | null;
};

type StudentOption = {
    id: number;
    firstName?: string;
    lastName?: string;
    name: string;
    email: string;
    program?: string | null;
    isGrouped?: boolean;
};

type CrossSetProgramSet = {
    id: number;
    name: string;
};

type CrossSetStudentOption = {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    programSets?: CrossSetProgramSet[];
    program_sets?: CrossSetProgramSet[];
    is_self_managed?: boolean;
    isSelfManaged?: boolean;
};

type PendingCrossSetAction = {
    student: CrossSetStudentOption;
    action: 'direct_add' | 'request';
};

type SelectedMember = {
    student: StudentOption;
    role: GroupRole;
};

type GroupRole = 'Project Manager' | 'Programmer' | 'Documentarian' | 'Data Analyst';

type CreateGroupModalProps = {
    open: boolean;
    onClose: () => void;
    programSets: ProgramSetSummary[];
};

type CreateGroupForm = {
    program_set_id: number | null;
    members: {
        student_id: number;
        role: GroupRole;
    }[];
};

type InertiaSuccessPayload = {
    props?: {
        flash?: {
            created_group_id?: number | string | null;
        };
    };
};

const roleOptions: GroupRole[] = ['Project Manager', 'Programmer', 'Documentarian', 'Data Analyst'];

const CreateGroupModal = ({ open, onClose, programSets }: CreateGroupModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedProgramSetId, setSelectedProgramSetId] = React.useState<number | null>(null);
    const [availableStudents, setAvailableStudents] = React.useState<StudentOption[]>([]);
    const [selectedMembers, setSelectedMembers] = React.useState<SelectedMember[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = React.useState(false);
    const [studentError, setStudentError] = React.useState('');
    const [isCrossSetSectionOpen, setIsCrossSetSectionOpen] = React.useState(false);
    const [crossSetSearchQuery, setCrossSetSearchQuery] = React.useState('');
    const [crossSetSearchResults, setCrossSetSearchResults] = React.useState<CrossSetStudentOption[]>([]);
    const [isCrossSetSearching, setIsCrossSetSearching] = React.useState(false);
    const [crossSetSearchError, setCrossSetSearchError] = React.useState('');
    const [selectedCrossSetMembers, setSelectedCrossSetMembers] = React.useState<PendingCrossSetAction[]>([]);

    const groupForm = useForm<CreateGroupForm>({
        program_set_id: null,
        members: [],
    });
    const {
        errors: groupFormErrors,
        post: postGroupForm,
        processing: isGroupFormProcessing,
        reset: resetGroupForm,
        setData: setGroupFormData,
    } = groupForm;

    React.useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            setSearchQuery('');
            setSelectedProgramSetId(null);
            setAvailableStudents([]);
            setSelectedMembers([]);
            setStudentError('');
            setIsCrossSetSectionOpen(false);
            setCrossSetSearchQuery('');
            setCrossSetSearchResults([]);
            setIsCrossSetSearching(false);
            setCrossSetSearchError('');
            setSelectedCrossSetMembers([]);
            resetGroupForm();
            return;
        }

        setIsAppearing(true);
    }, [open, resetGroupForm]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        if (selectedProgramSetId === null && programSets.length === 1) {
            setSelectedProgramSetId(programSets[0].id);
        }
    }, [open, programSets, selectedProgramSetId]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isGroupFormProcessing) {
                onClose();
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose, isGroupFormProcessing]);

    React.useEffect(() => {
        if (!open || selectedProgramSetId === null) {
            return;
        }

        const controller = new AbortController();
        let isActive = true;

        const fetchStudents = async () => {
            setIsLoadingStudents(true);
            setStudentError('');
            setAvailableStudents([]);
            setSelectedMembers([]);
            setSelectedCrossSetMembers([]);
            setCrossSetSearchQuery('');
            setCrossSetSearchResults([]);
            setCrossSetSearchError('');

            try {
                const response = await fetch(instructorProgramSets.enrolledStudents.url({ programSet: selectedProgramSetId }), {
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch students.');
                }

                const payload = await response.json();
                if (!isActive) {
                    return;
                }

                setAvailableStudents(Array.isArray(payload.students) ? payload.students : []);
            } catch {
                if (!isActive || controller.signal.aborted) {
                    return;
                }

                setStudentError('Unable to load students for this program set.');
            } finally {
                if (isActive) {
                    setIsLoadingStudents(false);
                }
            }
        };

        fetchStudents();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [open, selectedProgramSetId]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        setGroupFormData('program_set_id', selectedProgramSetId);
    }, [open, selectedProgramSetId, setGroupFormData]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        setGroupFormData(
            'members',
            selectedMembers.map((member) => ({
                student_id: member.student.id,
                role: member.role,
            })),
        );
    }, [open, selectedMembers, setGroupFormData]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const query = crossSetSearchQuery.trim();
        if (query.length === 0) {
            setCrossSetSearchResults([]);
            setCrossSetSearchError('');
            setIsCrossSetSearching(false);
            return;
        }

        if (selectedProgramSetId === null) {
            setCrossSetSearchResults([]);
            setCrossSetSearchError('Select a program set first to search students from other sets.');
            setIsCrossSetSearching(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setIsCrossSetSearching(true);
            setCrossSetSearchError('');

            try {
                const response = await fetch(
                    crossSetSearch.url({
                        query: {
                            q: query,
                            program_set_id: selectedProgramSetId,
                        },
                    }),
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to search students.');
                }

                const payload = await response.json();
                setCrossSetSearchResults(Array.isArray(payload.students) ? payload.students : []);
            } catch {
                if (controller.signal.aborted) {
                    return;
                }

                setCrossSetSearchError('Unable to search students from other sets right now.');
            } finally {
                if (!controller.signal.aborted) {
                    setIsCrossSetSearching(false);
                }
            }
        }, 350);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [open, crossSetSearchQuery, selectedProgramSetId]);

    const selectedProgramSet = programSets.find((set) => set.id === selectedProgramSetId);
    const programSetLabel = selectedProgramSet
        ? [selectedProgramSet.name, selectedProgramSet.program, selectedProgramSet.school_year].filter(Boolean).join(' • ')
        : 'Select a program set';
    const hasSelectedProgramSet = selectedProgramSetId !== null;

    const resolveStudentName = (student: StudentOption): string => {
        const fallbackName = typeof student.name === 'string' ? student.name.trim() : '';
        const firstName = typeof student.firstName === 'string' ? student.firstName.trim() : '';
        const lastName = typeof student.lastName === 'string' ? student.lastName.trim() : '';
        const combined = [firstName, lastName].filter(Boolean).join(' ').trim();

        return fallbackName || combined || 'Unknown Student';
    };

    const resolveCrossSetStudentName = (student: CrossSetStudentOption): string => {
        const firstName = typeof student.first_name === 'string' ? student.first_name.trim() : '';
        const lastName = typeof student.last_name === 'string' ? student.last_name.trim() : '';
        const combined = [firstName, lastName].filter(Boolean).join(' ').trim();

        return combined || 'Unknown Student';
    };

    const resolveCrossSetProgramSetName = (student: CrossSetStudentOption): string => {
        const relatedProgramSets = Array.isArray(student.programSets)
            ? student.programSets
            : Array.isArray(student.program_sets)
              ? student.program_sets
              : [];

        return relatedProgramSets[0]?.name ?? 'Unassigned Set';
    };

    const resolveCrossSetActionType = (student: CrossSetStudentOption): PendingCrossSetAction['action'] => {
        const isSelfManaged = student.is_self_managed ?? student.isSelfManaged ?? false;

        return isSelfManaged ? 'direct_add' : 'request';
    };

    const filteredStudents = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return [];
        }

        return availableStudents.filter((student) => {
            const name = resolveStudentName(student).toLowerCase();
            const email = (student.email ?? '').toLowerCase();
            const program = (student.program ?? '').toLowerCase();

            return name.includes(query) || email.includes(query) || program.includes(query);
        });
    }, [availableStudents, searchQuery]);

    const handleAddMember = (student: StudentOption) => {
        if (student.isGrouped) {
            return;
        }

        setSelectedMembers((previous) => {
            if (previous.some((member) => member.student.id === student.id)) {
                return previous;
            }

            return [...previous, { student, role: 'Programmer' }];
        });
        setSearchQuery('');
    };

    const handleStageCrossSetAction = (student: CrossSetStudentOption) => {
        const action = resolveCrossSetActionType(student);

        setSelectedCrossSetMembers((previous) => {
            if (previous.some((candidate) => candidate.student.id === student.id)) {
                return previous;
            }

            return [...previous, { student, action }];
        });

        setCrossSetSearchQuery('');
    };

    const handleRemoveCrossSetRequest = (studentId: number) => {
        setSelectedCrossSetMembers((previous) => previous.filter((item) => item.student.id !== studentId));
    };

    const handleRemoveMember = (studentId: number) => {
        setSelectedMembers((previous) => previous.filter((member) => member.student.id !== studentId));
    };

    const handleRoleChange = (studentId: number, role: GroupRole) => {
        setSelectedMembers((previous) =>
            previous.map((member) => {
                if (member.student.id === studentId) {
                    return { ...member, role };
                }

                if (role === 'Project Manager' && member.role === 'Project Manager') {
                    return { ...member, role: 'Programmer' };
                }

                return member;
            }),
        );
    };

    const resolveCreatedGroupId = (payload?: InertiaSuccessPayload): number | null => {
        const rawGroupId = payload?.props?.flash?.created_group_id;
        if (typeof rawGroupId === 'number') {
            return rawGroupId;
        }

        if (typeof rawGroupId === 'string') {
            const parsedGroupId = Number(rawGroupId);

            return Number.isFinite(parsedGroupId) ? parsedGroupId : null;
        }

        return null;
    };

    const submitCrossSetRequests = async (groupId: number): Promise<void> => {
        if (selectedCrossSetMembers.length === 0) {
            return;
        }

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

        await Promise.all(
            selectedCrossSetMembers.map(async ({ student }) => {
                const response = await fetch(instructorGroups.crossSetRequest.store.url(), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    },
                    body: JSON.stringify({
                        group_id: groupId,
                        student_id: student.id,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Unable to submit cross-set request.');
                }
            }),
        );
    };

    const leaderMember = selectedMembers.find((member) => member.role === 'Project Manager');
    const leaderLastName = leaderMember?.student.lastName?.trim() ?? '';
    const leaderNameFallback = leaderMember ? resolveStudentName(leaderMember.student) : '';
    const extractLastName = (fullName: string): string => {
        const trimmed = fullName.trim();
        if (!trimmed) {
            return '';
        }

        const parts = trimmed.split(/\s+/);
        return parts[parts.length - 1] ?? '';
    };
    const baseGroupName = leaderLastName || (leaderNameFallback ? extractLastName(leaderNameFallback) : '');
    const groupName = baseGroupName ? `${baseGroupName} Group` : '—';

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedProgramSetId || selectedMembers.length < 2 || !leaderMember) {
            return;
        }

        postGroupForm(instructorGroups.store.url(), {
            preserveScroll: true,
            onSuccess: async (payload) => {
                const createdGroupId = resolveCreatedGroupId(payload as InertiaSuccessPayload);

                if (createdGroupId !== null) {
                    try {
                        await submitCrossSetRequests(createdGroupId);
                    } catch {
                        setCrossSetSearchError('Group created, but one or more cross-set actions could not be completed.');
                    }
                }

                router.reload({ only: ['groups', 'crossSetRequests', 'crossSetMemberGroups'] });
                onClose();
            },
        });
    };

    const shouldRender = open || isAppearing;
    if (!shouldRender || typeof document === 'undefined') {
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
                if (event.target === event.currentTarget && !isGroupFormProcessing) {
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
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-800" />
                        <div>
                            <p className="text-sm font-semibold text-emerald-900">Create Group</p>
                            <p className="text-xs text-emerald-700">Build a capstone group from enrolled students.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isGroupFormProcessing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submitForm} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                    <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Program Set</p>
                            <p className="mt-2 text-sm font-semibold text-slate-800">{programSetLabel}</p>
                            {groupFormErrors.program_set_id ? <p className="mt-2 text-xs text-rose-600">{groupFormErrors.program_set_id}</p> : null}
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">Group Name</p>
                            <p className="mt-2 text-lg font-bold text-emerald-900">{groupName}</p>
                            <p className="mt-1 text-xs text-emerald-700">Based on the Project Manager's last name.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Available Students</p>
                                <p className="text-xs text-slate-500">{programSetLabel}</p>
                            </div>

                            {studentError ? (
                                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{studentError}</div>
                            ) : null}

                            <div className="mt-4">
                                <label className="text-xs font-semibold text-slate-600">Search Student</label>
                                <div className="relative mt-1.5">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Search by name or email..."
                                        disabled={!hasSelectedProgramSet || isLoadingStudents}
                                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-10 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </div>

                                {!hasSelectedProgramSet ? (
                                    <p className="mt-2 text-xs text-slate-500">Select a program set to load students.</p>
                                ) : null}
                                {hasSelectedProgramSet && isLoadingStudents ? (
                                    <p className="mt-2 text-xs text-slate-500">Loading students...</p>
                                ) : null}
                                {hasSelectedProgramSet && !isLoadingStudents && searchQuery.trim() === '' && availableStudents.length > 0 ? (
                                    <p className="mt-2 text-xs text-slate-500">Start typing to search for enrolled students.</p>
                                ) : null}

                                {hasSelectedProgramSet && searchQuery.trim() !== '' ? (
                                    <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                        {filteredStudents.length === 0 ? (
                                            <p className="px-4 py-3 text-sm text-slate-500">No students found.</p>
                                        ) : (
                                            filteredStudents.map((student) => {
                                                const isSelected = selectedMembers.some((member) => member.student.id === student.id);
                                                const displayName = resolveStudentName(student);
                                                const isDisabled = isSelected || student.isGrouped;

                                                return (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => handleAddMember(student)}
                                                        disabled={isDisabled}
                                                        className={`flex w-full flex-col border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-b-0 ${
                                                            student.isGrouped
                                                                ? 'cursor-not-allowed bg-amber-50/60'
                                                                : isSelected
                                                                  ? 'cursor-not-allowed bg-emerald-50/80'
                                                                  : 'hover:bg-emerald-50'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-medium text-slate-800">{displayName}</span>
                                                        <span className="text-xs text-slate-500">{student.email}</span>
                                                        {student.isGrouped ? (
                                                            <span className="text-xs font-semibold text-amber-700">Already grouped</span>
                                                        ) : null}
                                                        {isSelected ? <span className="text-xs font-semibold text-emerald-700">Added</span> : null}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                ) : null}
                            </div>

                            <div className="mt-4 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCrossSetSectionOpen((previous) => !previous)}
                                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    <span>Add students from other sets</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isCrossSetSectionOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCrossSetSectionOpen ? (
                                    <div className="mt-3 space-y-3">
                                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                            Students from your own handled sets can be added directly. Students from other instructors require
                                            approval.
                                        </p>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Search students from other sets</label>
                                            <div className="relative mt-1.5">
                                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    value={crossSetSearchQuery}
                                                    onChange={(event) => setCrossSetSearchQuery(event.target.value)}
                                                    disabled={!hasSelectedProgramSet || isGroupFormProcessing}
                                                    placeholder="Search by name or email..."
                                                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-10 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                />
                                            </div>
                                        </div>

                                        {crossSetSearchError ? (
                                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                                {crossSetSearchError}
                                            </div>
                                        ) : null}

                                        {crossSetSearchQuery.trim() !== '' ? (
                                            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                                {isCrossSetSearching ? (
                                                    <p className="px-4 py-3 text-sm text-slate-500">Searching...</p>
                                                ) : crossSetSearchResults.length === 0 ? (
                                                    <p className="px-4 py-3 text-sm text-slate-500">No students found.</p>
                                                ) : (
                                                    crossSetSearchResults.map((student) => {
                                                        const isAlreadyQueued = selectedCrossSetMembers.some(
                                                            (pending) => pending.student.id === student.id,
                                                        );
                                                        const displayName = resolveCrossSetStudentName(student);
                                                        const programSetName = resolveCrossSetProgramSetName(student);
                                                        const actionType = resolveCrossSetActionType(student);
                                                        const actionLabel = actionType === 'direct_add' ? 'Add Member' : 'Request';

                                                        return (
                                                            <div
                                                                key={student.id}
                                                                className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 last:border-b-0"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-slate-800">{displayName}</p>
                                                                    {student.email ? (
                                                                        <p className="truncate text-[11px] text-slate-500">{student.email}</p>
                                                                    ) : null}
                                                                    <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                                        {programSetName}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStageCrossSetAction(student)}
                                                                    disabled={isAlreadyQueued || isGroupFormProcessing}
                                                                    className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {isAlreadyQueued ? 'Added' : actionLabel}
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Selected Members</p>
                                    <p className="text-xs text-slate-500">Assign roles for the group.</p>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    {selectedMembers.length + selectedCrossSetMembers.length} selected
                                </span>
                            </div>

                            <div className="mt-4 space-y-2">
                                {selectedMembers.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-slate-500">Add students to build the group.</div>
                                ) : null}

                                {selectedMembers.map((member) => (
                                    <div
                                        key={member.student.id}
                                        className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-800">{resolveStudentName(member.student)}</p>
                                                <p className="text-slate-500">{member.student.email}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMember(member.student.id)}
                                                className="rounded-full border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Role</label>
                                            <select
                                                value={member.role}
                                                onChange={(event) => handleRoleChange(member.student.id, event.target.value as GroupRole)}
                                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                                            >
                                                {roleOptions.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                            {member.role === 'Project Manager' ? (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                    Leader
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}

                                {selectedCrossSetMembers.map((item) => (
                                    <div
                                        key={`cross-set-${item.student.id}`}
                                        className="flex flex-col gap-2 rounded-lg border border-sky-200 bg-sky-50/40 px-3 py-2 text-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-800">{resolveCrossSetStudentName(item.student)}</p>
                                                <p className="text-slate-500">{item.student.email ?? '—'}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCrossSetRequest(item.student.id)}
                                                className="rounded-full border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                                                {item.action === 'direct_add' ? 'Cross-Set Member' : 'Cross-Set Request'}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {item.action === 'direct_add'
                                                    ? 'Will be added right after group creation.'
                                                    : 'Will send approval request after group creation.'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {groupFormErrors.members ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{groupFormErrors.members}</div>
                    ) : null}

                    {!leaderMember && selectedMembers.length > 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                            Select one member as the Project Manager to finalize the group.
                        </div>
                    ) : null}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isGroupFormProcessing}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isGroupFormProcessing || !selectedProgramSetId || selectedMembers.length < 2 || !leaderMember}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            {isGroupFormProcessing ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>,
        document.body,
    );
};

export default CreateGroupModal;
