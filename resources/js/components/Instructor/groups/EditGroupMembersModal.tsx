import { router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronDown, RefreshCcw, Search, Trash2, Users, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import instructorGroups from '../../../routes/instructor/groups';
import instructorProgramSets from '../../../routes/instructor/program-sets';
import { crossSetSearch } from '../../../routes/instructor/students';
import DeleteGroupModal from '../students/DeleteGroupModal';

type GroupInfo = {
    id: number;
    name: string;
    program_set_id: number;
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
    program?: string | null;
    programSets?: CrossSetProgramSet[];
    program_sets?: CrossSetProgramSet[];
    is_self_managed?: boolean;
    isSelfManaged?: boolean;
};

type EditableMember = GroupMember & {
    isRemoved?: boolean;
};

type GroupDetailsPayload = {
    group?: GroupInfo | null;
    members?: GroupMember[];
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
    const [availableStudents, setAvailableStudents] = React.useState<StudentOption[]>([]);
    const [isLoadingAvailableStudents, setIsLoadingAvailableStudents] = React.useState(false);
    const [availableStudentsError, setAvailableStudentsError] = React.useState('');
    const [memberSearchQuery, setMemberSearchQuery] = React.useState('');
    const [isCrossSetSectionOpen, setIsCrossSetSectionOpen] = React.useState(false);
    const [crossSetSearchQuery, setCrossSetSearchQuery] = React.useState('');
    const [crossSetSearchResults, setCrossSetSearchResults] = React.useState<CrossSetStudentOption[]>([]);
    const [isCrossSetSearching, setIsCrossSetSearching] = React.useState(false);
    const [crossSetSearchError, setCrossSetSearchError] = React.useState('');
    const [requestedCrossSetStudentIds, setRequestedCrossSetStudentIds] = React.useState<number[]>([]);
    const [submittingCrossSetStudentIds, setSubmittingCrossSetStudentIds] = React.useState<number[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeletingGroup, setIsDeletingGroup] = React.useState(false);

    const editForm = useForm<EditGroupForm>({
        members: [],
    });
    const {
        errors: editFormErrors,
        processing: isSavingMembers,
        put: putEditForm,
        setData: setEditFormData,
    } = editForm;

    const isSubmittingCrossSetRequests = submittingCrossSetStudentIds.length > 0;
    const isBusy = isSavingMembers || isDeletingGroup || isSubmittingCrossSetRequests;

    const loadAvailableStudents = React.useCallback(async (programSetId: number, signal?: AbortSignal): Promise<StudentOption[]> => {
        const response = await fetch(instructorProgramSets.enrolledStudents.url({ programSet: programSetId }), {
            headers: {
                Accept: 'application/json',
            },
            signal,
        });

        if (!response.ok) {
            throw new Error('Failed to load students.');
        }

        const payload = await response.json();

        return Array.isArray(payload.students) ? payload.students : [];
    }, []);

    const hydrateGroupDetails = React.useCallback(
        async (targetGroupId: number, signal?: AbortSignal): Promise<void> => {
            const response = await fetch(instructorGroups.details.url({ group: targetGroupId }), {
                headers: {
                    Accept: 'application/json',
                },
                signal,
            });

            if (!response.ok) {
                throw new Error('Failed to load group details.');
            }

            const payload = (await response.json()) as GroupDetailsPayload;
            const loadedMembers = Array.isArray(payload.members) ? payload.members : [];
            const loadedGroup = payload.group ?? null;

            setGroup(loadedGroup);
            setMembers(loadedMembers.map((member: GroupMember) => ({ ...member, isRemoved: false })));
            setMemberSearchQuery('');
            setIsCrossSetSectionOpen(false);
            setCrossSetSearchQuery('');
            setCrossSetSearchResults([]);
            setIsCrossSetSearching(false);
            setCrossSetSearchError('');
            setRequestedCrossSetStudentIds([]);
            setSubmittingCrossSetStudentIds([]);

            if (!loadedGroup?.program_set_id) {
                setAvailableStudents([]);
                setAvailableStudentsError('');
                return;
            }

            setIsLoadingAvailableStudents(true);
            setAvailableStudentsError('');

            try {
                const students = await loadAvailableStudents(loadedGroup.program_set_id, signal);
                setAvailableStudents(students);
            } catch {
                if (!signal?.aborted) {
                    setAvailableStudents([]);
                    setAvailableStudentsError('Unable to load additional students right now.');
                }
            } finally {
                if (!signal?.aborted) {
                    setIsLoadingAvailableStudents(false);
                }
            }
        },
        [loadAvailableStudents],
    );

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
            setAvailableStudents([]);
            setAvailableStudentsError('');
            setMemberSearchQuery('');
            setIsCrossSetSectionOpen(false);
            setCrossSetSearchQuery('');
            setCrossSetSearchResults([]);
            setIsCrossSetSearching(false);
            setCrossSetSearchError('');
            setRequestedCrossSetStudentIds([]);
            setSubmittingCrossSetStudentIds([]);

            try {
                await hydrateGroupDetails(groupId, controller.signal);
            } catch {
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
    }, [open, groupId, hydrateGroupDetails]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isBusy) {
                onClose();
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose, isBusy]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const activeMembers = members.filter((member) => !member.isRemoved);
        setEditFormData(
            'members',
            activeMembers.map((member) => ({
                student_id: member.id,
                role: member.role,
            })),
        );
    }, [open, members, setEditFormData]);

    React.useEffect(() => {
        if (!open || !isCrossSetSectionOpen) {
            return;
        }

        const query = crossSetSearchQuery.trim();
        if (query.length === 0) {
            setCrossSetSearchResults([]);
            setCrossSetSearchError('');
            setIsCrossSetSearching(false);
            return;
        }

        const sourceProgramSetId = group?.program_set_id ?? null;
        if (sourceProgramSetId === null) {
            setCrossSetSearchResults([]);
            setCrossSetSearchError('Unable to determine the current group program set.');
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
                            program_set_id: sourceProgramSetId,
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
                if (!controller.signal.aborted) {
                    setCrossSetSearchResults(Array.isArray(payload.students) ? payload.students : []);
                }
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
    }, [open, isCrossSetSectionOpen, crossSetSearchQuery, group?.program_set_id]);

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

    const resolveCrossSetProgramSetName = React.useCallback((student: CrossSetStudentOption): string => {
        const relatedProgramSets = Array.isArray(student.programSets)
            ? student.programSets
            : Array.isArray(student.program_sets)
              ? student.program_sets
              : [];

        return relatedProgramSets[0]?.name ?? 'Unassigned Set';
    }, []);

    const resolveCrossSetActionType = React.useCallback((student: CrossSetStudentOption): 'direct_add' | 'request' => {
        const isSelfManaged = student.is_self_managed ?? student.isSelfManaged ?? false;

        return isSelfManaged ? 'direct_add' : 'request';
    }, []);

    const toggleRemove = (memberId: number) => {
        setMembers((previous) => previous.map((member) => (member.id === memberId ? { ...member, isRemoved: !member.isRemoved } : member)));
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

    const handleAddMember = (student: StudentOption) => {
        setMembers((previous) => {
            if (previous.some((member) => member.id === student.id)) {
                return previous;
            }

            return [
                ...previous,
                {
                    id: student.id,
                    fullName: resolveStudentName(student),
                    email: student.email,
                    program: student.program ?? null,
                    role: 'Programmer',
                    isRemoved: false,
                },
            ];
        });
        setMemberSearchQuery('');
    };

    const submitCrossSetRequests = async (targetGroupId: number, students: CrossSetStudentOption[]): Promise<void> => {
        if (students.length === 0) {
            return;
        }

        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

        await Promise.all(
            students.map(async (student) => {
                const response = await fetch(instructorGroups.crossSetRequest.store.url(), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    },
                    body: JSON.stringify({
                        group_id: targetGroupId,
                        student_id: student.id,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Unable to submit cross-set request.');
                }
            }),
        );
    };

    const handleAddCrossSetMember = (student: CrossSetStudentOption) => {
        setMembers((previous) => {
            const existingMember = previous.find((member) => member.id === student.id);

            if (existingMember) {
                return previous.map((member) => (member.id === student.id ? { ...member, isRemoved: false } : member));
            }

            return [
                ...previous,
                {
                    id: student.id,
                    fullName: resolveCrossSetStudentName(student),
                    email: student.email ?? undefined,
                    program: student.program ?? null,
                    role: 'Programmer',
                    isRemoved: false,
                },
            ];
        });

        setCrossSetSearchQuery('');
        setCrossSetSearchError('');
    };

    const handleRequestCrossSetMember = async (student: CrossSetStudentOption) => {
        if (!groupId) {
            return;
        }

        setSubmittingCrossSetStudentIds((previous) => {
            if (previous.includes(student.id)) {
                return previous;
            }

            return [...previous, student.id];
        });

        setCrossSetSearchError('');

        try {
            await submitCrossSetRequests(groupId, [student]);
            setRequestedCrossSetStudentIds((previous) => {
                if (previous.includes(student.id)) {
                    return previous;
                }

                return [...previous, student.id];
            });
            setCrossSetSearchQuery('');
        } catch {
            setCrossSetSearchError('Unable to submit cross-set request right now.');
        } finally {
            setSubmittingCrossSetStudentIds((previous) => previous.filter((id) => id !== student.id));
        }
    };

    const activeMembers = members.filter((member) => !member.isRemoved);
    const leaderCount = activeMembers.filter((member) => member.role === 'Project Manager').length;
    const hasLeader = leaderCount === 1;
    const hasMinimumMembers = activeMembers.length >= 2;

    const addableStudents = React.useMemo(() => {
        const query = memberSearchQuery.trim().toLowerCase();
        const existingMemberIds = new Set(members.map((member) => member.id));

        return availableStudents.filter((student) => {
            if (student.isGrouped || existingMemberIds.has(student.id)) {
                return false;
            }

            if (query === '') {
                return true;
            }

            const name = resolveStudentName(student).toLowerCase();
            const email = (student.email ?? '').toLowerCase();
            const program = (student.program ?? '').toLowerCase();

            return name.includes(query) || email.includes(query) || program.includes(query);
        });
    }, [availableStudents, memberSearchQuery, members]);

    const availableStudentCount = React.useMemo(() => {
        const existingMemberIds = new Set(members.map((member) => member.id));

        return availableStudents.filter((student) => !student.isGrouped && !existingMemberIds.has(student.id)).length;
    }, [availableStudents, members]);

    const crossSetSearchCandidates = React.useMemo(() => {
        const activeMemberIds = new Set(activeMembers.map((member) => member.id));
        const requestedIds = new Set(requestedCrossSetStudentIds);
        const processingIds = new Set(submittingCrossSetStudentIds);

        return crossSetSearchResults.map((student) => {
            const programSetName = resolveCrossSetProgramSetName(student);
            const actionType = resolveCrossSetActionType(student);
            const isRequested = requestedIds.has(student.id);
            const isRequesting = processingIds.has(student.id);
            const isAlreadyActiveMember = activeMemberIds.has(student.id);

            return {
                student,
                programSetName,
                actionType,
                isRequested,
                isRequesting,
                isAlreadyActiveMember,
            };
        });
    }, [activeMembers, crossSetSearchResults, requestedCrossSetStudentIds, submittingCrossSetStudentIds, resolveCrossSetActionType, resolveCrossSetProgramSetName]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!groupId || !hasLeader || !hasMinimumMembers || isDeletingGroup) {
            return;
        }

        setErrorMessage('');
        setCrossSetSearchError('');

        putEditForm(instructorGroups.members.update.url({ group: groupId }), {
            preserveScroll: true,
            onSuccess: async () => {
                router.reload({ only: ['groups', 'crossSetRequests', 'crossSetMemberGroups'] });
                onClose();
            },
        });
    };

    const handleDeleteGroup = () => {
        if (!groupId) {
            return;
        }

        setIsDeletingGroup(true);

        router.delete(instructorGroups.destroy.url({ group: groupId }), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                onClose();
            },
            onError: () => {
                setErrorMessage('Unable to delete group right now.');
            },
            onFinish: () => {
                setIsDeletingGroup(false);
            },
        });
    };

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !isBusy) {
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
                                <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">Edit Group</p>
                                <h2 className="text-lg font-semibold text-emerald-900">{group?.name ?? 'Loading...'}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!groupId || isDeletingGroup) {
                                        return;
                                    }

                                    const controller = new AbortController();
                                    setIsLoading(true);
                                    setErrorMessage('');

                                    hydrateGroupDetails(groupId, controller.signal)
                                        .catch(() => {
                                            if (!controller.signal.aborted) {
                                                setErrorMessage('Unable to load group details right now.');
                                            }
                                        })
                                        .finally(() => {
                                            if (!controller.signal.aborted) {
                                                setIsLoading(false);
                                            }
                                        });
                                }}
                                disabled={isLoading || isBusy}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isBusy}
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
                                    <thead className="sticky top-0 bg-white text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Student</th>
                                            <th className="px-4 py-3">Program</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr className="bg-emerald-50/40">
                                            <td className="px-4 py-3" colSpan={4}>
                                                <div className="space-y-3">
                                                    <p className="text-[11px] font-semibold tracking-wider text-emerald-700 uppercase">Add Another Member</p>
                                                    <p className="text-[11px] text-slate-500">Search students managed in your current program set.</p>

                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <div className="relative flex-1">
                                                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                value={memberSearchQuery}
                                                                onChange={(event) => setMemberSearchQuery(event.target.value)}
                                                                disabled={isBusy || isLoadingAvailableStudents}
                                                                placeholder="Search ungrouped students by name or email..."
                                                                className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-8 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const firstCandidate = addableStudents[0];
                                                                if (firstCandidate) {
                                                                    handleAddMember(firstCandidate);
                                                                }
                                                            }}
                                                            disabled={isBusy || isLoadingAvailableStudents || memberSearchQuery.trim() === '' || addableStudents.length === 0}
                                                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>

                                                    {isLoadingAvailableStudents ? (
                                                        <p className="text-[11px] text-slate-500">Loading students...</p>
                                                    ) : null}
                                                    {availableStudentsError ? (
                                                        <p className="text-[11px] text-rose-600">{availableStudentsError}</p>
                                                    ) : null}
                                                    {!isLoadingAvailableStudents && !availableStudentsError && memberSearchQuery.trim() === '' ? (
                                                        <p className="text-[11px] text-slate-500">{availableStudentCount} ungrouped students available to add.</p>
                                                    ) : null}

                                                    {memberSearchQuery.trim() !== '' ? (
                                                        <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                                            {addableStudents.length === 0 ? (
                                                                <p className="px-3 py-2 text-[11px] text-slate-500">No matching ungrouped students found.</p>
                                                            ) : (
                                                                addableStudents.slice(0, 6).map((student) => (
                                                                    <button
                                                                        key={student.id}
                                                                        type="button"
                                                                        onClick={() => handleAddMember(student)}
                                                                        disabled={isBusy}
                                                                        className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 last:border-b-0"
                                                                    >
                                                                        <div>
                                                                            <p className="text-xs font-semibold text-slate-800">{resolveStudentName(student)}</p>
                                                                            <p className="text-[10px] text-slate-500">{student.email}</p>
                                                                        </div>
                                                                        <span className="text-[10px] font-semibold text-emerald-700">Add</span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    ) : null}

                                                    <div className="border-t border-slate-200 pt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCrossSetSectionOpen((previous) => !previous)}
                                                            disabled={isBusy}
                                                            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <span>Add students from other sets</span>
                                                            <ChevronDown className={`h-4 w-4 transition-transform ${isCrossSetSectionOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {isCrossSetSectionOpen ? (
                                                            <div className="mt-3 space-y-3">
                                                                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                                                                    Students from your own handled sets can be added directly. Students from other instructors require approval.
                                                                </p>

                                                                <div>
                                                                    <label className="text-[11px] font-semibold text-slate-600">Search students from other sets</label>
                                                                    <div className="relative mt-1.5">
                                                                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                                        <input
                                                                            value={crossSetSearchQuery}
                                                                            onChange={(event) => setCrossSetSearchQuery(event.target.value)}
                                                                            disabled={isBusy}
                                                                            placeholder="Search by name or email..."
                                                                            className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-8 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {crossSetSearchError ? (
                                                                    <p className="text-[11px] text-rose-600">{crossSetSearchError}</p>
                                                                ) : null}

                                                                {crossSetSearchQuery.trim() !== '' ? (
                                                                    <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                                                        {isCrossSetSearching ? (
                                                                            <p className="px-3 py-2 text-[11px] text-slate-500">Searching...</p>
                                                                        ) : crossSetSearchCandidates.length === 0 ? (
                                                                            <p className="px-3 py-2 text-[11px] text-slate-500">No students found.</p>
                                                                        ) : (
                                                                            crossSetSearchCandidates.map(
                                                                                ({ student, programSetName, actionType, isRequested, isRequesting, isAlreadyActiveMember }) => (
                                                                                <div
                                                                                    key={student.id}
                                                                                    className="flex items-center justify-between border-b border-slate-100 px-3 py-2 last:border-b-0"
                                                                                >
                                                                                    <div className="min-w-0">
                                                                                        <p className="truncate text-xs font-semibold text-slate-800">
                                                                                            {resolveCrossSetStudentName(student)}
                                                                                        </p>
                                                                                        {student.email ? <p className="text-[10px] text-slate-500">{student.email}</p> : null}
                                                                                        <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                                                            {programSetName}
                                                                                        </span>
                                                                                    </div>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            if (actionType === 'direct_add') {
                                                                                                handleAddCrossSetMember(student);
                                                                                                return;
                                                                                            }

                                                                                            void handleRequestCrossSetMember(student);
                                                                                        }}
                                                                                        disabled={isBusy || isRequesting || isRequested || isAlreadyActiveMember}
                                                                                        className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                                                    >
                                                                                        {isAlreadyActiveMember
                                                                                            ? 'Member'
                                                                                            : isRequesting
                                                                                              ? 'Processing...'
                                                                                              : isRequested
                                                                                                ? 'Requested'
                                                                                              : actionType === 'direct_add'
                                                                                                ? 'Add Member'
                                                                                                : 'Request'}
                                                                                    </button>
                                                                                </div>
                                                                            ),
                                                                        )
                                                                        )}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

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
                                                        disabled={member.isRemoved || isBusy}
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
                                                        disabled={isBusy}
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
                                {!isLoading && members.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">No members found.</div> : null}
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

                        {editFormErrors.members ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{editFormErrors.members}</div>
                        ) : null}

                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isBusy}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={isBusy || !groupId}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Group
                            </button>
                            <button
                                type="submit"
                                disabled={isBusy || !hasLeader || !hasMinimumMembers}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSavingMembers ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>

            <DeleteGroupModal
                open={isDeleteModalOpen}
                groupName={group?.name ?? 'Selected Group'}
                memberCount={activeMembers.length}
                processing={isDeletingGroup}
                onClose={() => {
                    if (!isDeletingGroup) {
                        setIsDeleteModalOpen(false);
                    }
                }}
                onConfirm={handleDeleteGroup}
            />
        </>,
        document.body,
    );
};

export default EditGroupMembersModal;
