import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Eye, GraduationCap, Search, Settings, SlidersHorizontal, Trash2, UserCheck, Users } from 'lucide-react';
import React from 'react';
import AssignmentRequestApproveModal from '../../components/Adviser/AssignmentRequestApproveModal';
import AssignmentRequestConfirmModal from '../../components/Adviser/AssignmentRequestConfirmModal';
import GroupDetailsModal from '../../components/Adviser/GroupDetailsModal';
import adviserRoutes from '../../routes/adviser';
import AdviserLayout from './_layout';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type GroupMemberRow = {
    id: number;
    name: string;
    email: string;
    role?: string | null;
    is_leader?: boolean;
};

type AssignedGroupRow = {
    id: number;
    name: string;
    program_set_id?: number | null;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
    members_count?: number;
    members?: GroupMemberRow[];
};

type AssignmentRequestRow = {
    id: number;
    request_type: string;
    group_id?: number | null;
    group_name: string;
    program_set_id?: number | null;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    requested_by?: string | null;
    requested_at?: string | null;
    current_adviser_name?: string | null;
};

type ProgramSetOption = {
    value: string;
    label: string;
    academicYear: string | null;
};

type AdviserGroupsPageProps = {
    assignedGroups?: AssignedGroupRow[];
    assignmentRequests?: AssignmentRequestRow[];
    academicYears?: AcademicYearOption[];
    utilities?: AdviserUtilitiesSummary;
};

type AdviserUtilityProgram = {
    program: string;
    max_groups: number;
    assigned_count: number;
    pending_count: number;
};

type AdviserUtilitiesSummary = {
    is_available: boolean;
    programs: AdviserUtilityProgram[];
};

type CombinedRow = {
    key: string;
    rowType: 'assigned' | 'request' | 'reassign';
    groupId?: number | null;
    requestId?: number | null;
    groupName: string;
    programSetName?: string | null;
    schoolYear?: string | null;
    leaderName?: string | null;
    membersCount?: number;
    requestedBy?: string | null;
    requestedAt?: string | null;
    currentAdviserName?: string | null;
};

const parseDateTime = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
};

const formatDateTime = (value?: string | null): string => {
    const date = parseDateTime(value);

    if (!date) {
        return value ?? '';
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const getProgramSetKey = (item: { program_set_id?: number | null; program_set_name?: string | null; school_year?: string | null }): string => {
    if (item.program_set_id !== null && item.program_set_id !== undefined) {
        return `id:${item.program_set_id}`;
    }

    const name = item.program_set_name ?? '';
    const year = item.school_year ?? '';

    return `name:${name}::${year}`;
};

const AdviserGroups = () => {
    const { props } = usePage<AdviserGroupsPageProps>();
    const assignedGroups = props.assignedGroups ?? [];
    const assignmentRequests = props.assignmentRequests ?? [];
    const academicYears = props.academicYears ?? [];
    const utilities = props.utilities;
    const utilityPrograms = utilities?.programs ?? [];

    const pendingRequestGroupIds = React.useMemo(() => {
        return new Set(
            assignmentRequests
                .filter((request) => request.request_type !== 'ReassignNotice')
                .map((request) => request.group_id)
                .filter((groupId): groupId is number => typeof groupId === 'number'),
        );
    }, [assignmentRequests]);

    const approvedAssignedGroups = React.useMemo(() => {
        return assignedGroups.filter((group) => !pendingRequestGroupIds.has(group.id));
    }, [assignedGroups, pendingRequestGroupIds]);

    const currentAcademicYear = academicYears.find((year) => year.is_current)?.label ?? academicYears[0]?.label ?? 'All';
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(currentAcademicYear || 'All');
    const [selectedProgramSet, setSelectedProgramSet] = React.useState('All');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'assigned' | 'pending' | 'reassign'>('all');
    const [processingRequestId, setProcessingRequestId] = React.useState<number | null>(null);
    const [confirmState, setConfirmState] = React.useState<{
        open: boolean;
        request: AssignmentRequestRow | null;
        action: 'dismiss' | 'decline';
    }>({ open: false, request: null, action: 'dismiss' });
    const [approveState, setApproveState] = React.useState<{
        open: boolean;
        request: AssignmentRequestRow | null;
    }>({ open: false, request: null });
    const [detailsState, setDetailsState] = React.useState<{
        open: boolean;
        group: AssignedGroupRow | null;
    }>({ open: false, group: null });

    const approvedAssignedGroupsForYear = React.useMemo(() => {
        if (selectedAcademicYear === 'All') {
            return approvedAssignedGroups;
        }

        return approvedAssignedGroups.filter((group) => group.school_year === selectedAcademicYear);
    }, [approvedAssignedGroups, selectedAcademicYear]);

    const pendingRequestsForYear = React.useMemo(() => {
        if (selectedAcademicYear === 'All') {
            return assignmentRequests;
        }

        return assignmentRequests.filter((request) => request.school_year === selectedAcademicYear);
    }, [assignmentRequests, selectedAcademicYear]);

    const programSummaries = React.useMemo(() => {
        const maxByProgram = new Map(
            utilityPrograms
                .filter((utility) => utility.program)
                .map((utility) => [utility.program, utility.max_groups]),
        );

        const assignedByProgram = new Map<string, number>();
        approvedAssignedGroupsForYear.forEach((group) => {
            if (!group.program) {
                return;
            }

            assignedByProgram.set(group.program, (assignedByProgram.get(group.program) ?? 0) + 1);
        });

        const pendingByProgram = new Map<string, number>();
        pendingRequestsForYear
            .filter((request) => request.request_type !== 'ReassignNotice')
            .forEach((request) => {
                if (!request.program) {
                    return;
                }

                pendingByProgram.set(request.program, (pendingByProgram.get(request.program) ?? 0) + 1);
            });

        const programs = new Set<string>([
            ...maxByProgram.keys(),
            ...assignedByProgram.keys(),
            ...pendingByProgram.keys(),
        ]);

        return Array.from(programs)
            .sort((first, second) => first.localeCompare(second))
            .map((program) => {
                const maxGroups = maxByProgram.get(program) ?? 5;
                const assignedCount = assignedByProgram.get(program) ?? 0;
                const pendingCount = pendingByProgram.get(program) ?? 0;

                return {
                    program,
                    maxGroups,
                    assignedCount,
                    pendingCount,
                };
            });
    }, [approvedAssignedGroupsForYear, pendingRequestsForYear, utilityPrograms]);

    const academicYearOptions = React.useMemo(() => {
        const years = academicYears.map((year) => year.label);
        return ['All', ...years];
    }, [academicYears]);

    const programSetOptions = React.useMemo((): ProgramSetOption[] => {
        const options = new Map<string, ProgramSetOption>();
        const combinedItems = [...assignedGroups, ...assignmentRequests];

        combinedItems.forEach((item) => {
            const label = (item.program_set_name ?? '').trim();

            if (!label) {
                return;
            }

            const value = getProgramSetKey(item);
            if (!options.has(value)) {
                options.set(value, {
                    value,
                    label,
                    academicYear: item.school_year ?? null,
                });
            }
        });

        const allOptions = Array.from(options.values());
        const filteredOptions =
            selectedAcademicYear === 'All' ? allOptions : allOptions.filter((option) => option.academicYear === selectedAcademicYear);

        return filteredOptions.sort((first, second) => first.label.localeCompare(second.label));
    }, [assignedGroups, assignmentRequests, selectedAcademicYear]);

    React.useEffect(() => {
        if (selectedProgramSet === 'All') {
            return;
        }

        const isStillAvailable = programSetOptions.some((option) => option.value === selectedProgramSet);
        if (!isStillAvailable) {
            setSelectedProgramSet('All');
        }
    }, [programSetOptions, selectedProgramSet]);

    const matchesFilters = React.useCallback(
        (item: {
            name?: string | null;
            group_name?: string | null;
            leader_name?: string | null;
            program_set_name?: string | null;
            school_year?: string | null;
        }) => {
            if (selectedAcademicYear !== 'All' && item.school_year !== selectedAcademicYear) {
                return false;
            }

            if (selectedProgramSet !== 'All' && getProgramSetKey(item) !== selectedProgramSet) {
                return false;
            }

            const query = searchTerm.trim().toLowerCase();
            if (!query) {
                return true;
            }

            const haystack = [item.name, item.group_name, item.leader_name, item.program_set_name].filter(Boolean).join(' ').toLowerCase();

            return haystack.includes(query);
        },
        [searchTerm, selectedAcademicYear, selectedProgramSet],
    );

    const filteredAssigned = React.useMemo(() => {
        if (statusFilter === 'pending' || statusFilter === 'reassign') {
            return [];
        }

        return approvedAssignedGroups.filter((group) => matchesFilters(group));
    }, [approvedAssignedGroups, matchesFilters, statusFilter]);

    const filteredRequests = React.useMemo(() => {
        return assignmentRequests.filter((request) => {
            const isReassignNotice = request.request_type === 'ReassignNotice';
            const isPendingRequest = !isReassignNotice;

            if (statusFilter === 'assigned') {
                return false;
            }

            if (statusFilter === 'pending' && !isPendingRequest) {
                return false;
            }

            if (statusFilter === 'reassign' && !isReassignNotice) {
                return false;
            }

            return matchesFilters({
                group_name: request.group_name,
                program_set_name: request.program_set_name,
                school_year: request.school_year,
            });
        });
    }, [assignmentRequests, matchesFilters, statusFilter]);

    const combinedRows = React.useMemo<CombinedRow[]>(() => {
        const rows: CombinedRow[] = [];

        filteredRequests.forEach((request) => {
            const isReassignNotice = request.request_type === 'ReassignNotice';

            rows.push({
                key: `request-${request.id}`,
                rowType: isReassignNotice ? 'reassign' : 'request',
                requestId: request.id,
                groupId: request.group_id,
                groupName: request.group_name,
                programSetName: request.program_set_name,
                schoolYear: request.school_year,
                requestedBy: request.requested_by,
                requestedAt: request.requested_at,
                currentAdviserName: request.current_adviser_name,
            });
        });

        filteredAssigned.forEach((group) => {
            rows.push({
                key: `group-${group.id}`,
                rowType: 'assigned',
                groupId: group.id,
                groupName: group.name,
                programSetName: group.program_set_name,
                schoolYear: group.school_year,
                leaderName: group.leader_name,
                membersCount: group.members_count,
            });
        });

        return rows;
    }, [filteredAssigned, filteredRequests]);

    const handleApprove = (requestId: number, onFinish?: () => void) => {
        if (processingRequestId !== null) {
            return;
        }

        setProcessingRequestId(requestId);

        router.post(
            adviserRoutes.assignmentRequests.approve.url({ assignmentRequest: requestId }),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessingRequestId(null);
                    onFinish?.();
                },
            },
        );
    };

    const openConfirm = (request: AssignmentRequestRow, action: 'dismiss' | 'decline') => {
        setConfirmState({ open: true, request, action });
    };

    const closeConfirm = () => {
        setConfirmState({ open: false, request: null, action: 'dismiss' });
    };

    const openDetails = (group: AssignedGroupRow) => {
        setDetailsState({ open: true, group });
    };

    const closeDetails = () => {
        setDetailsState({ open: false, group: null });
    };

    const openApprove = (request: AssignmentRequestRow) => {
        setApproveState({ open: true, request });
    };

    const closeApprove = () => {
        setApproveState({ open: false, request: null });
    };

    const confirmApprove = () => {
        if (!approveState.request || processingRequestId !== null) {
            return;
        }

        handleApprove(approveState.request.id, closeApprove);
    };

    const confirmDismiss = () => {
        if (!confirmState.request || processingRequestId !== null) {
            return;
        }

        const requestId = confirmState.request.id;
        setProcessingRequestId(requestId);

        router.delete(adviserRoutes.assignmentRequests.dismiss.url({ assignmentRequest: requestId }), {
            preserveScroll: true,
            onFinish: () => {
                setProcessingRequestId(null);
                closeConfirm();
            },
        });
    };

    const pendingCount = pendingRequestsForYear.filter((request) => request.request_type !== 'ReassignNotice').length;

    return (
        <AdviserLayout title="Groups" subtitle="Review assignment requests and manage handled groups">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={adviserRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Groups
                    </span>
                </nav>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search group, leader, or program set..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 md:w-64"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedAcademicYear}
                                onChange={(event) => setSelectedAcademicYear(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                {academicYearOptions.map((year) => {
                                    const isCurrent = academicYears.find((item) => item.label === year)?.is_current;

                                    return (
                                        <option key={year} value={year}>
                                            {year === 'All' ? 'All Academic Years' : `${year}${isCurrent ? ' (current)' : ''}`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="relative">
                            <GraduationCap className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedProgramSet}
                                onChange={(event) => setSelectedProgramSet(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                <option value="All">All Program Sets</option>
                                {programSetOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {selectedAcademicYear === 'All' && option.academicYear
                                            ? `${option.label} (${option.academicYear})`
                                            : option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <SlidersHorizontal className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'assigned' | 'pending' | 'reassign')}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending Approval</option>
                                <option value="reassign">Assigned to Other Adviser</option>
                                <option value="assigned">Assigned Groups</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/adviser/utilities"
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <Settings className="h-3.5 w-3.5" />
                            Capacity Settings
                        </Link>
                    </div>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Assigned Groups</p>
                            <p className="text-xs text-slate-500">Includes pending approvals and reassigned groups in one list.</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                {combinedRows.length} total
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                <Users className="h-3 w-3" />
                                Assigned: {approvedAssignedGroupsForYear.length}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700">
                                <UserCheck className="h-3 w-3" />
                                Pending Approval: {pendingCount}
                            </span>
                            {programSummaries.map((summary) => (
                                <span
                                    key={summary.program}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600"
                                >
                                    {summary.program}: {summary.assignedCount}/{summary.maxGroups}
                                    {summary.pendingCount > 0 ? ` • +${summary.pendingCount}` : ''}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Group</th>
                                    <th className="px-6 py-4">Program Set</th>
                                    <th className="px-6 py-4">A.Y</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {combinedRows.map((row) => {
                                    const isRequest = row.rowType === 'request';
                                    const isReassign = row.rowType === 'reassign';
                                    const isAssigned = row.rowType === 'assigned';
                                    const statusLabel = isRequest ? 'Pending Approval' : isReassign ? 'Assigned to Other Adviser' : 'Assigned';
                                    const statusClasses = isRequest
                                        ? 'bg-amber-100 text-amber-700'
                                        : isReassign
                                          ? 'bg-slate-100 text-slate-600'
                                          : 'bg-emerald-100 text-emerald-700';
                                    const isProcessing = row.requestId !== undefined && processingRequestId === row.requestId;

                                    return (
                                        <tr key={row.key} className="transition-colors hover:bg-emerald-50/40">
                                            <td className="px-6 py-3.5">
                                                <div className="font-semibold text-slate-800">{row.groupName}</div>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{row.programSetName ?? '—'}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{row.schoolYear ?? '—'}</td>
                                            <td className="px-6 py-3.5 text-slate-600">
                                                {isAssigned ? (
                                                    <div className="space-y-1">
                                                        <div>Leader: {row.leaderName ?? '—'}</div>
                                                        <div>Members: {row.membersCount ?? 0}</div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div>
                                                            {isReassign
                                                                ? row.currentAdviserName
                                                                    ? `Assigned to ${row.currentAdviserName}`
                                                                    : 'Assigned to another adviser'
                                                                : 'Waiting for approval'}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500">
                                                            {isReassign
                                                                ? row.requestedBy
                                                                    ? `Updated by ${row.requestedBy}`
                                                                    : 'Reassignment logged'
                                                                : row.requestedBy
                                                                  ? `Requested by ${row.requestedBy}`
                                                                  : 'Request submitted'}
                                                            {row.requestedAt ? ` • ${formatDateTime(row.requestedAt)}` : ''}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                {isRequest && row.requestId ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const request = assignmentRequests.find((item) => item.id === row.requestId);
                                                                if (request) {
                                                                    openConfirm(request, 'decline');
                                                                }
                                                            }}
                                                            disabled={isProcessing}
                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Decline
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const request = assignmentRequests.find((item) => item.id === row.requestId);
                                                                if (request) {
                                                                    openApprove(request);
                                                                }
                                                            }}
                                                            disabled={isProcessing}
                                                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <UserCheck className="h-3 w-3" />
                                                            Approve
                                                        </button>
                                                    </div>
                                                ) : isReassign && row.requestId ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const request = assignmentRequests.find((item) => item.id === row.requestId);
                                                            if (request) {
                                                                openConfirm(request, 'dismiss');
                                                            }
                                                        }}
                                                        disabled={isProcessing}
                                                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Delete
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const group = assignedGroups.find((item) => item.id === row.groupId);
                                                            if (group) {
                                                                openDetails(group);
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        View details
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {combinedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-xs text-slate-500">
                                            No groups match the current filters.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </motion.section>
            </motion.section>

            <AssignmentRequestConfirmModal
                open={confirmState.open}
                action={confirmState.action}
                groupName={confirmState.request?.group_name}
                processing={processingRequestId !== null}
                onClose={closeConfirm}
                onConfirm={confirmDismiss}
            />
            <AssignmentRequestApproveModal
                open={approveState.open}
                groupName={approveState.request?.group_name}
                processing={processingRequestId !== null}
                onClose={closeApprove}
                onConfirm={confirmApprove}
            />
            <GroupDetailsModal
                open={detailsState.open}
                groupName={detailsState.group?.name}
                programSetName={detailsState.group?.program_set_name}
                schoolYear={detailsState.group?.school_year}
                members={detailsState.group?.members ?? []}
                onClose={closeDetails}
            />
        </AdviserLayout>
    );
};

export default AdviserGroups;
