import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, GraduationCap, LayoutGrid, List, Search, SlidersHorizontal, UserCheck } from 'lucide-react';
import React from 'react';
import instructorRoutes from '../../../routes/instructor';
import panelistAssignment from '../../../routes/instructor/panelist-assignment';
import InstructorLayout from '../_layout';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type PanelistWorkload = {
    academic_year: string;
    groups_count: number;
};

type PanelistSummary = {
    id: number;
    name: string;
    email: string;
    workloads?: PanelistWorkload[];
};

type PanelistAssignment = {
    id: number;
    name?: string | null;
    email?: string | null;
    slot: number;
};

type PanelistSlot =
    | PanelistAssignment
    | {
          id?: undefined;
          name?: null;
          email?: null;
          slot: number;
      };

type GroupRow = {
    id: number;
    name: string;
    program_set_id?: number | null;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
    members_count?: number;
    panelists?: PanelistAssignment[];
};

type ProgramSetOption = {
    value: string;
    label: string;
    academicYear: string | null;
};

type PanelistAssignmentGroupsProps = {
    panelist: PanelistSummary;
    groups?: GroupRow[];
    academicYears?: AcademicYearOption[];
    selectedAcademicYear?: string | null;
};

const MAX_PANELS = 3;

const PanelistAssignmentGroups = ({
    panelist,
    groups = [],
    academicYears = [],
    selectedAcademicYear: requestedAcademicYear = null,
}: PanelistAssignmentGroupsProps) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const currentAcademicYear = academicYears.find((year) => year.is_current)?.label ?? academicYears[0]?.label ?? 'All';
    const [viewMode, setViewMode] = React.useState<'card' | 'list'>('card');
    const [assigningGroupId, setAssigningGroupId] = React.useState<number | null>(null);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'assigned' | 'available' | 'full'>('all');
    const [selectedProgramSet, setSelectedProgramSet] = React.useState('All');

    // ── Pagination ──────────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 6;
    // ────────────────────────────────────────────────────────────────────────

    const academicYearOptions = React.useMemo(() => {
        const years = academicYears.map((year) => year.label);
        return ['All', ...years];
    }, [academicYears]);

    const resolvedAcademicYear = React.useMemo(() => {
        if (requestedAcademicYear === 'All') {
            return 'All';
        }

        if (typeof requestedAcademicYear === 'string' && requestedAcademicYear !== '') {
            const matchesExistingYear = academicYears.some((year) => year.label === requestedAcademicYear);
            if (matchesExistingYear) {
                return requestedAcademicYear;
            }
        }

        return currentAcademicYear || 'All';
    }, [requestedAcademicYear, academicYears, currentAcademicYear]);

    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(resolvedAcademicYear);

    React.useEffect(() => {
        setSelectedAcademicYear(resolvedAcademicYear);
    }, [resolvedAcademicYear]);

    const getProgramSetKey = React.useCallback((group: GroupRow): string => {
        if (group.program_set_id !== null && group.program_set_id !== undefined) {
            return `id:${group.program_set_id}`;
        }

        const name = group.program_set_name ?? '';
        const year = group.school_year ?? '';

        return `name:${name}::${year}`;
    }, []);

    const programSetOptions = React.useMemo((): ProgramSetOption[] => {
        const options = new Map<string, ProgramSetOption>();

        groups.forEach((group) => {
            const label = (group.program_set_name ?? '').trim();

            if (!label) {
                return;
            }

            const value = getProgramSetKey(group);
            if (!options.has(value)) {
                options.set(value, {
                    value,
                    label,
                    academicYear: group.school_year ?? null,
                });
            }
        });

        const allOptions = Array.from(options.values());
        const filteredOptions =
            selectedAcademicYear === 'All' ? allOptions : allOptions.filter((option) => option.academicYear === selectedAcademicYear);

        return filteredOptions.sort((first, second) => first.label.localeCompare(second.label));
    }, [groups, getProgramSetKey, selectedAcademicYear]);

    React.useEffect(() => {
        if (selectedProgramSet === 'All') {
            return;
        }

        const isStillAvailable = programSetOptions.some((option) => option.value === selectedProgramSet);
        if (!isStillAvailable) {
            setSelectedProgramSet('All');
        }
    }, [programSetOptions, selectedProgramSet]);

    const getLoadForYear = React.useCallback(
        (academicYear: string): number => {
            const workloads = panelist.workloads ?? [];

            if (academicYear === 'All') {
                return workloads.reduce((total, item) => total + (item.groups_count ?? 0), 0);
            }

            return workloads.find((item) => item.academic_year === academicYear)?.groups_count ?? 0;
        },
        [panelist.workloads],
    );

    const totalLoad = getLoadForYear('All');
    const selectedYearLoad = selectedAcademicYear === 'All' ? totalLoad : getLoadForYear(selectedAcademicYear);

    const getSlotAssignments = React.useCallback((group: GroupRow): PanelistSlot[] => {
        const assignments = group.panelists ?? [];

        return [1, 2, 3].map((slot) => {
            const match = assignments.find((assignment) => assignment.slot === slot);
            return match ?? { slot };
        });
    }, []);

    const filteredGroups = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return groups.filter((group) => {
            if (selectedAcademicYear !== 'All' && group.school_year !== selectedAcademicYear) {
                return false;
            }

            if (selectedProgramSet !== 'All' && getProgramSetKey(group) !== selectedProgramSet) {
                return false;
            }

            const panelistAssignments = group.panelists ?? [];
            const isAssignedToPanelist = panelistAssignments.some((assignment) => assignment.id === panelist.id);
            const isFull = panelistAssignments.length >= MAX_PANELS;

            if (statusFilter !== 'all') {
                if (statusFilter === 'assigned' && !isAssignedToPanelist) {
                    return false;
                }

                if (statusFilter === 'available' && (isAssignedToPanelist || isFull)) {
                    return false;
                }

                if (statusFilter === 'full' && (isAssignedToPanelist || !isFull)) {
                    return false;
                }
            }

            if (!query) {
                return true;
            }

            const groupName = group.name.toLowerCase();
            const leaderName = (group.leader_name ?? '').toLowerCase();
            const programSetName = (group.program_set_name ?? '').toLowerCase();

            return groupName.includes(query) || leaderName.includes(query) || programSetName.includes(query);
        });
    }, [groups, searchTerm, selectedAcademicYear, selectedProgramSet, statusFilter, panelist.id, getProgramSetKey]);

    const orderedGroups = React.useMemo(() => {
        return [...filteredGroups].sort((first, second) => {
            const firstAssigned = (first.panelists ?? []).some((assignment) => assignment.id === panelist.id);
            const secondAssigned = (second.panelists ?? []).some((assignment) => assignment.id === panelist.id);

            return Number(secondAssigned) - Number(firstAssigned);
        });
    }, [filteredGroups, panelist.id]);

    // ── Pagination logic ─────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(orderedGroups.length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedAcademicYear, selectedProgramSet, statusFilter]);

    const paginatedGroups = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return orderedGroups.slice(startIndex, startIndex + itemsPerPage);
    }, [orderedGroups, currentPage]);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));
        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);
    // ────────────────────────────────────────────────────────────────────────

    const assignPanelist = (groupId: number, replacePanelistId?: number | null) => {
        if (assigningGroupId !== null) {
            return;
        }

        setAssigningGroupId(groupId);
        setErrorMessage('');

        router.post(
            panelistAssignment.assign.url(),
            {
                group_id: groupId,
                panelist_id: panelist.id,
                replace_panelist_id: replacePanelistId ?? null,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.panelist_id) {
                        setErrorMessage(errors.panelist_id);
                    } else if (errors.replace_panelist_id) {
                        setErrorMessage(errors.replace_panelist_id);
                    } else {
                        setErrorMessage('Unable to assign the panelist right now.');
                    }
                },
                onSuccess: () => {
                    router.reload({ only: ['groups', 'panelist'] });
                },
                onFinish: () => {
                    setAssigningGroupId(null);
                },
            },
        );
    };

    const formatGroupName = (name: string): string => {
        const trimmed = name.trim();
        if (trimmed === '') {
            return 'Group';
        }

        return trimmed.toLowerCase().endsWith(' group') ? trimmed : `${trimmed} Group`;
    };

    return (
        <InstructorLayout title="Assign Panelists" subtitle={`Manage panelist assignments for ${panelist.name}`}>
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={instructorRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link
                        href={instructorRoutes.panelistAssignment.url()}
                        className="font-medium text-slate-600 transition-colors hover:text-slate-900"
                    >
                        Panelist Assignment
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        {panelist.name}
                    </span>
                </nav>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Panelist</p>
                                <h2 className="text-lg font-semibold text-slate-900">{panelist.name}</h2>
                                <p className="text-xs text-slate-500">{panelist.email}</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                {MAX_PANELS} panel slots per group
                            </span>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>{selectedAcademicYear === 'All' ? 'Total assigned groups' : `Assigned groups in ${selectedAcademicYear}`}</span>
                                <span className="font-semibold text-slate-800">{selectedYearLoad}</span>
                            </div>
                            {selectedAcademicYear === 'All' ? (
                                <p className="mt-2 text-[11px] text-slate-500">Select an academic year to narrow down assignments.</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Groups Overview</p>
                                <p className="text-xs text-slate-500">
                                    {selectedProgramSet === 'All' ? 'Filtered by academic year' : 'Filtered by academic year and program set'}
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {(filteredGroups ?? []).filter((group) => (group.panelists ?? []).some((assignment) => assignment.id === panelist.id)).length}{' '}
                                assigned
                            </span>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>Total groups shown</span>
                                <span className="font-semibold text-slate-800">{filteredGroups.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Total panelist load</span>
                                <span className="font-semibold text-slate-800">{totalLoad}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search group or leader..."
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:w-56"
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
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value as 'all' | 'assigned' | 'available' | 'full')
                                    }
                                    className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="available">Available Slots</option>
                                    <option value="full">Full Groups</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center self-start rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setViewMode('card')}
                                className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                    viewMode === 'card' ? 'bg-green-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                    viewMode === 'list' ? 'bg-green-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                            {errorMessage}
                        </div>
                    ) : null}

                    {viewMode === 'card' ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {paginatedGroups.map((group) => {
                                const groupYear = group.school_year ?? 'Unassigned';
                                const panelistAssignments = group.panelists ?? [];
                                const isAssignedToPanelist = panelistAssignments.some((assignment) => assignment.id === panelist.id);
                                const openSlots = Math.max(0, MAX_PANELS - panelistAssignments.length);
                                const hasOpenSlots = openSlots > 0;
                                const isDisabled = assigningGroupId !== null;

                                return (
                                    <div
                                        key={group.id}
                                        className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className="flex-1 p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-green-600">
                                                        {formatGroupName(group.name)}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-slate-500">{group.program_set_name ?? 'Program set'}</p>
                                                </div>
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                    {panelistAssignments.length}/{MAX_PANELS} panelists
                                                </span>
                                            </div>

                                            <div className="mt-3 space-y-1 text-xs text-slate-600">
                                                <p>Leader: {group.leader_name ?? '—'}</p>
                                                <p>Members: {group.members_count ?? 0}</p>
                                                <p>A.Y: {groupYear}</p>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                {panelistAssignments.length > 0 ? (
                                                    panelistAssignments.map((assignment) => {
                                                        const isCurrentPanelist = assignment.id === panelist.id;
                                                        const canReplace = !isCurrentPanelist && !isAssignedToPanelist;

                                                        return (
                                                            <div
                                                                key={`${group.id}-panel-${assignment.slot}`}
                                                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                                            >
                                                                <div>
                                                                    <p className="font-semibold text-slate-700">Panel {assignment.slot}</p>
                                                                    <p className="text-[11px] text-slate-500">{assignment.name ?? 'Panelist'}</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => assignPanelist(group.id, assignment.id)}
                                                                    disabled={isDisabled || !canReplace}
                                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                                                                        isCurrentPanelist
                                                                            ? 'bg-emerald-100 text-emerald-700'
                                                                            : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                    } ${isDisabled || !canReplace ? 'cursor-not-allowed opacity-60' : ''}`}
                                                                >
                                                                    <UserCheck className="h-3 w-3" />
                                                                    {isCurrentPanelist ? 'Assigned' : 'Replace'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                                        No panelists assigned yet.
                                                    </div>
                                                )}

                                                {hasOpenSlots && !isAssignedToPanelist ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => assignPanelist(group.id)}
                                                        disabled={isDisabled}
                                                        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 ${
                                                            isDisabled ? 'cursor-not-allowed opacity-60' : ''
                                                        }`}
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5" />
                                                        Assign to Open Slot
                                                    </button>
                                                ) : null}

                                                {!hasOpenSlots && !isAssignedToPanelist ? (
                                                    <p className="text-[11px] text-slate-500">Group is full. Replace a panelist to assign.</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredGroups.length === 0 ? (
                                <div className="col-span-full rounded-xl border border-slate-200 bg-white py-12 text-center text-xs text-slate-500">
                                    No groups match your search.
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Group</th>
                                        <th className="px-6 py-4">Leader</th>
                                        <th className="px-6 py-4">A.Y</th>
                                        <th className="px-6 py-4">Panel Slots</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedGroups.map((group) => {
                                        const groupYear = group.school_year ?? 'Unassigned';
                                        const panelistAssignments = group.panelists ?? [];
                                        const isAssignedToPanelist = panelistAssignments.some((assignment) => assignment.id === panelist.id);
                                        const isDisabled = assigningGroupId !== null;
                                        const slots = getSlotAssignments(group);

                                        return (
                                            <tr key={group.id} className="transition-colors hover:bg-green-50/30">
                                                <td className="px-6 py-3.5">
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{formatGroupName(group.name)}</div>
                                                        <div className="text-[10px] text-slate-500">{group.program_set_name ?? 'Program set'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-slate-600">{group.leader_name ?? '—'}</td>
                                                <td className="px-6 py-3.5 text-slate-600">{groupYear}</td>
                                                <td className="px-6 py-3.5">
                                                    <div className="space-y-2">
                                                        {slots.map((slot) => {
                                                            const isCurrentPanelist = slot.id === panelist.id;
                                                            const panelistId = slot.id;
                                                            const hasPanelist = panelistId !== undefined;
                                                            const canReplace = hasPanelist && !isCurrentPanelist && !isAssignedToPanelist;

                                                            return (
                                                                <div
                                                                    key={`${group.id}-slot-${slot.slot}`}
                                                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                                                                >
                                                                    <div>
                                                                        <p className="text-[11px] font-semibold text-slate-700">Panel {slot.slot}</p>
                                                                        <p className="text-[10px] text-slate-500">{slot.name ?? 'Open slot'}</p>
                                                                    </div>
                                                                    {hasPanelist ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => assignPanelist(group.id, panelistId)}
                                                                            disabled={isDisabled || !canReplace}
                                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                                                                                isCurrentPanelist
                                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                                    : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                            } ${isDisabled || !canReplace ? 'cursor-not-allowed opacity-60' : ''}`}
                                                                        >
                                                                            <UserCheck className="h-3 w-3" />
                                                                            {isCurrentPanelist ? 'Assigned' : 'Replace'}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => assignPanelist(group.id)}
                                                                            disabled={isDisabled || isAssignedToPanelist}
                                                                            className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 ${
                                                                                isDisabled || isAssignedToPanelist ? 'cursor-not-allowed opacity-60' : ''
                                                                            }`}
                                                                        >
                                                                            <UserCheck className="h-3 w-3" />
                                                                            Assign
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {filteredGroups.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-500">No groups match your search.</div>
                            ) : null}
                        </div>
                    )}

                    {filteredGroups.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-medium text-slate-500">
                            Showing {paginatedGroups.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                            {Math.min(currentPage * itemsPerPage, filteredGroups.length)} of {filteredGroups.length} groups
                        </motion.div>
                    )}

                    {filteredGroups.length > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 px-1 pb-2 md:flex-row">
                            <p className="text-xs font-medium text-slate-500">
                                Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                                >
                                    <ChevronRight size={16} className="rotate-180" />
                                </button>

                                <div className="flex items-center gap-1">
                                    {pages.map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={`h-8 min-w-[32px] rounded-lg text-xs font-bold transition-all ${
                                                page === currentPage
                                                    ? 'bg-green-700 text-white shadow-md shadow-green-700/20'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.section>
        </InstructorLayout>
    );
};

const PanelistAssignmentGroupsPage = () => {
    const { props } = usePage<PanelistAssignmentGroupsProps>();

    return (
        <PanelistAssignmentGroups
            panelist={props.panelist}
            groups={props.groups ?? []}
            academicYears={props.academicYears ?? []}
            selectedAcademicYear={props.selectedAcademicYear ?? null}
        />
    );
};

export default PanelistAssignmentGroupsPage;
