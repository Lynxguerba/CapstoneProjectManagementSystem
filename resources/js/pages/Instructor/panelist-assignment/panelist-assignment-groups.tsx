import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, GraduationCap, LayoutGrid, List, Search, SlidersHorizontal, UserCheck, Users } from 'lucide-react';
import React from 'react';
import AssignPanelistModal from '../../../components/Instructor/panelist/AssignPanelistModal';
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

type PanelistProgramSummary = {
    program: string;
    max_groups: number;
    assigned_count: number;
    assigned_by_year?: Record<string, number>;
};

type PanelistSummary = {
    id: number;
    name: string;
    email: string;
    workloads?: PanelistWorkload[];
    programs?: PanelistProgramSummary[];
    is_available?: boolean;
};

type PanelistAssignment = {
    id: number;
    name?: string | null;
    email?: string | null;
    slot: number;
    role?: 'chairman' | 'member' | null;
};

type PanelRole = 'chairman' | 'member';

type PanelistSlot = {
    id?: number;
    name?: string | null;
    email?: string | null;
    slot: number;
    role?: PanelRole | null;
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
    panelists?: PanelistSummary[];
    groups?: GroupRow[];
    academicYears?: AcademicYearOption[];
    selectedAcademicYear?: string | null;
};

const MAX_PANELS = 3;
const PANEL_ROLE_OPTIONS: PanelRole[] = ['chairman', 'member'];

const formatPanelRole = (role?: PanelRole | null): string => {
    if (role === 'chairman') {
        return 'Panel Chairman';
    }

    return 'Panel Member';
};

const panelRoleBadgeClasses = (role?: PanelRole | null): string => {
    if (role === 'chairman') {
        return 'bg-indigo-100 text-indigo-700';
    }

    return 'bg-slate-100 text-slate-600';
};

const PanelistAssignmentGroups = ({
    panelist,
    panelists = [],
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
    const [roleSelections, setRoleSelections] = React.useState<Record<number, PanelRole>>({});
    const [isAssignPanelistModalOpen, setIsAssignPanelistModalOpen] = React.useState(false);
    const [activeGroupForPanelist, setActiveGroupForPanelist] = React.useState<GroupRow | null>(null);

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
    const panelistPrograms = React.useMemo(() => panelist.programs ?? [], [panelist.programs]);
    const panelistIsAvailable = panelist.is_available === true;

    const selectedYearPrograms = React.useMemo(() => {
        return panelistPrograms.map((program) => ({
            ...program,
            assigned_count:
                selectedAcademicYear === 'All'
                    ? program.assigned_count ?? 0
                    : typeof program.assigned_by_year?.[selectedAcademicYear] === 'number'
                      ? (program.assigned_by_year?.[selectedAcademicYear] ?? 0)
                      : 0,
        }));
    }, [panelistPrograms, selectedAcademicYear]);

    const getAssignedForProgramYear = React.useCallback(
        (program?: string | null, year?: string | null): number => {
            const resolvedProgram = typeof program === 'string' ? program : '';
            const matchedProgram = panelistPrograms.find((item) => item.program === resolvedProgram);

            if (!matchedProgram) {
                return 0;
            }

            if (typeof year === 'string' && year !== '') {
                return matchedProgram.assigned_by_year?.[year] ?? 0;
            }

            return matchedProgram.assigned_count ?? 0;
        },
        [panelistPrograms],
    );

    const getMaxForProgram = React.useCallback(
        (program?: string | null): number => {
            if (!program) {
                return 5;
            }

            return panelistPrograms.find((item) => item.program === program)?.max_groups ?? 5;
        },
        [panelistPrograms],
    );

    const getSlotAssignments = React.useCallback((group: GroupRow): PanelistSlot[] => {
        const assignments = group.panelists ?? [];

        return [1, 2, 3].map((slot) => {
            const match = assignments.find((assignment) => assignment.slot === slot);
            return match ?? { slot };
        });
    }, []);

    const getAllowedRoles = React.useCallback(
        (group: GroupRow): PanelRole[] => {
            const panelistAssignments = group.panelists ?? [];
            const currentAssignment = panelistAssignments.find((assignment) => assignment.id === panelist.id);
            const hasChairman = panelistAssignments.some((assignment) => assignment.role === 'chairman');
            const currentIsChairman = currentAssignment?.role === 'chairman';
            const memberCount = panelistAssignments.filter((assignment) => (assignment.role ?? 'member') === 'member').length;

            if (hasChairman && !currentIsChairman) {
                return ['member'];
            }

            if (!hasChairman && !currentAssignment && memberCount >= 2) {
                return ['chairman'];
            }

            if (currentIsChairman && memberCount >= 2) {
                return ['chairman'];
            }

            return PANEL_ROLE_OPTIONS;
        },
        [panelist.id],
    );

    const resolveRoleSelection = React.useCallback(
        (group: GroupRow): PanelRole => {
            const allowedRoles = getAllowedRoles(group);
            const storedRole = roleSelections[group.id];
            const currentAssignment = (group.panelists ?? []).find((assignment) => assignment.id === panelist.id);
            const hasChairman = (group.panelists ?? []).some((assignment) => assignment.role === 'chairman');
            const defaultRole = hasChairman ? 'member' : 'chairman';
            const preferredRole = storedRole ?? currentAssignment?.role ?? defaultRole;

            return allowedRoles.includes(preferredRole) ? preferredRole : allowedRoles[0];
        },
        [roleSelections, panelist.id, getAllowedRoles],
    );

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

    const assignPanelist = (groupId: number, panelRole: PanelRole, replacePanelistId?: number | null) => {
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
                panel_role: panelRole,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.panelist_id) {
                        setErrorMessage(errors.panelist_id);
                    } else if (errors.panel_role) {
                        setErrorMessage(errors.panel_role);
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

    const openAssignPanelistModal = (group: GroupRow) => {
        setActiveGroupForPanelist(group);
        setIsAssignPanelistModalOpen(true);
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
                                <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Panelist</p>
                                <h2 className="text-lg font-semibold text-slate-900">{panelist.name}</h2>
                                <p className="text-xs text-slate-500">{panelist.email}</p>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                    panelistIsAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}
                            >
                                {panelistIsAvailable ? 'Open for assignments' : 'Closed for assignments'}
                            </span>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-slate-600">
                            <p className="font-semibold text-slate-700">
                                Program capacity {selectedAcademicYear === 'All' ? '(all years)' : `(${selectedAcademicYear})`}
                            </p>
                            {selectedYearPrograms.length > 0 ? (
                                selectedYearPrograms.map((program) => (
                                    <div key={program.program} className="flex items-center justify-between">
                                        <span>{program.program}</span>
                                        <span className="font-semibold text-slate-800">
                                            {program.assigned_count} / {program.max_groups}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[11px] text-slate-500">No program utilities configured yet.</p>
                            )}
                            <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
                                <span>Total panelist load</span>
                                <span className="font-semibold text-slate-800">
                                    {selectedYearLoad}
                                    {panelistPrograms.length > 0 ? ` / ${panelistPrograms.reduce((total, program) => total + program.max_groups, 0)}` : ''}
                                </span>
                            </div>
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
                                {
                                    (filteredGroups ?? []).filter((group) =>
                                        (group.panelists ?? []).some((assignment) => assignment.id === panelist.id),
                                    ).length
                                }{' '}
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
                                    onChange={(event) => setStatusFilter(event.target.value as 'all' | 'assigned' | 'available' | 'full')}
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
                                const loadForYear = getAssignedForProgramYear(group.program, groupYear);
                                const maxForProgram = getMaxForProgram(group.program);
                                const panelistAssignments = group.panelists ?? [];
                                const isAssignedToPanelist = panelistAssignments.some((assignment) => assignment.id === panelist.id);
                                const openSlots = Math.max(0, MAX_PANELS - panelistAssignments.length);
                                const hasOpenSlots = openSlots > 0;
                                const isAtProgramLimit = loadForYear >= maxForProgram;
                                const canTakeNewGroup = !isAtProgramLimit || isAssignedToPanelist;
                                const canAssignToGroup = panelistIsAvailable && canTakeNewGroup;
                                const isBusy = assigningGroupId !== null;
                                const selectedRole = resolveRoleSelection(group);
                                const allowedRoles = getAllowedRoles(group);
                                const availablePanelistsCount = panelists.filter(
                                    (option) => option.id !== panelist.id && !panelistAssignments.some((assignment) => assignment.id === option.id),
                                ).length;

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
                                                <p className="font-semibold text-slate-700">
                                                    Program Capacity: {loadForYear} / {maxForProgram}
                                                </p>
                                                {!panelistIsAvailable ? (
                                                    <p className="text-[11px] text-rose-600">Panelist is closed for new assignments.</p>
                                                ) : null}
                                                {isAtProgramLimit && !isAssignedToPanelist ? (
                                                    <p className="text-[11px] text-rose-600">Program capacity reached for this academic year.</p>
                                                ) : null}
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                {panelistAssignments.length > 0 ? (
                                                    panelistAssignments.map((assignment) => {
                                                        const isCurrentPanelist = assignment.id === panelist.id;
                                                        const canReplace = !isCurrentPanelist && !isAssignedToPanelist && canTakeNewGroup && panelistIsAvailable;
                                                        const assignmentRole = assignment.role ?? 'member';
                                                        const isRoleUnchanged = selectedRole === assignmentRole;

                                                        return (
                                                            <div
                                                                key={`${group.id}-panel-${assignment.slot}`}
                                                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                                            >
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <p className="font-semibold text-slate-700">Panel {assignment.slot}</p>
                                                                        <span
                                                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${panelRoleBadgeClasses(
                                                                                assignmentRole,
                                                                            )}`}
                                                                        >
                                                                            {formatPanelRole(assignmentRole)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-500">{assignment.name ?? 'Panelist'}</p>
                                                                </div>
                                                                {isCurrentPanelist ? (
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <select
                                                                            value={selectedRole}
                                                                            onChange={(event) =>
                                                                                setRoleSelections((previous) => ({
                                                                                    ...previous,
                                                                                    [group.id]: event.target.value as PanelRole,
                                                                                }))
                                                                            }
                                                                            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600"
                                                                        >
                                                                            {allowedRoles.map((roleOption) => (
                                                                                <option key={roleOption} value={roleOption}>
                                                                                    {formatPanelRole(roleOption)}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => assignPanelist(group.id, selectedRole)}
                                                                            disabled={isBusy || isRoleUnchanged}
                                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                                                                                isRoleUnchanged
                                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                                    : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                                            } ${isBusy || isRoleUnchanged ? 'cursor-not-allowed opacity-60' : ''}`}
                                                                        >
                                                                            <UserCheck className="h-3 w-3" />
                                                                            {isRoleUnchanged ? 'Assigned' : 'Update Role'}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => assignPanelist(group.id, assignmentRole, assignment.id)}
                                                                        disabled={isBusy || !canReplace}
                                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                                                                            isCurrentPanelist
                                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                                : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                        } ${isBusy || !canReplace ? 'cursor-not-allowed opacity-60' : ''}`}
                                                                    >
                                                                        <UserCheck className="h-3 w-3" />
                                                                        Replace
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                                        No panelists assigned yet.
                                                    </div>
                                                )}

                                                {hasOpenSlots ? (
                                                    <div className="space-y-2">
                                                        {!isAssignedToPanelist ? (
                                                            <>
                                                                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600">
                                                                    <span>Role for this assignment</span>
                                                                    <select
                                                                        value={selectedRole}
                                                                        onChange={(event) =>
                                                                            setRoleSelections((previous) => ({
                                                                                ...previous,
                                                                                [group.id]: event.target.value as PanelRole,
                                                                            }))
                                                                        }
                                                                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600"
                                                                    >
                                                                        {allowedRoles.map((roleOption) => (
                                                                            <option key={roleOption} value={roleOption}>
                                                                                {formatPanelRole(roleOption)}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => assignPanelist(group.id, selectedRole)}
                                                                    disabled={isBusy || !canAssignToGroup}
                                                                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 ${
                                                                        isBusy || !canAssignToGroup ? 'cursor-not-allowed opacity-60' : ''
                                                                    }`}
                                                                >
                                                                    <UserCheck className="h-3.5 w-3.5" />
                                                                    Assign to Open Slot
                                                                </button>
                                                            </>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() => openAssignPanelistModal(group)}
                                                            disabled={isBusy || availablePanelistsCount === 0}
                                                            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 ${
                                                                isBusy || availablePanelistsCount === 0 ? 'cursor-not-allowed opacity-60' : ''
                                                            }`}
                                                        >
                                                            <Users className="h-3.5 w-3.5" />
                                                            Assign another panelist
                                                        </button>
                                                        {availablePanelistsCount === 0 ? (
                                                            <p className="text-[10px] text-slate-500">No available panelists to assign.</p>
                                                        ) : null}
                                                    </div>
                                                ) : null}

                                                {!hasOpenSlots ? (
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
                                        <th className="px-6 py-4">Program Capacity</th>
                                        <th className="px-6 py-4">Panel Slots</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedGroups.map((group) => {
                                        const groupYear = group.school_year ?? 'Unassigned';
                                        const loadForYear = getAssignedForProgramYear(group.program, groupYear);
                                        const maxForProgram = getMaxForProgram(group.program);
                                        const panelistAssignments = group.panelists ?? [];
                                        const isAssignedToPanelist = panelistAssignments.some((assignment) => assignment.id === panelist.id);
                                        const openSlots = Math.max(0, MAX_PANELS - panelistAssignments.length);
                                        const hasOpenSlots = openSlots > 0;
                                        const isAtProgramLimit = loadForYear >= maxForProgram;
                                        const canTakeNewGroup = !isAtProgramLimit || isAssignedToPanelist;
                                        const canAssignToGroup = panelistIsAvailable && canTakeNewGroup;
                                        const isBusy = assigningGroupId !== null;
                                        const slots = getSlotAssignments(group);
                                        const selectedRole = resolveRoleSelection(group);
                                        const allowedRoles = getAllowedRoles(group);
                                        const availablePanelistsCount = panelists.filter(
                                            (option) =>
                                                option.id !== panelist.id && !panelistAssignments.some((assignment) => assignment.id === option.id),
                                        ).length;

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
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-slate-700">
                                                            {loadForYear} / {maxForProgram}
                                                        </p>
                                                        {!panelistIsAvailable ? (
                                                            <p className="text-[10px] text-rose-600">Closed</p>
                                                        ) : null}
                                                        {isAtProgramLimit && !isAssignedToPanelist ? (
                                                            <p className="text-[10px] text-rose-600">Limit reached</p>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="space-y-2">
                                                        {slots.map((slot) => {
                                                            const isCurrentPanelist = slot.id === panelist.id;
                                                            const panelistId = slot.id;
                                                            const hasPanelist = panelistId !== undefined;
                                                            const canReplace = hasPanelist && !isCurrentPanelist && !isAssignedToPanelist && canTakeNewGroup && panelistIsAvailable;
                                                            const slotRole = slot.role ?? 'member';
                                                            const isRoleUnchanged = selectedRole === slotRole;

                                                            return (
                                                                <div
                                                                    key={`${group.id}-slot-${slot.slot}`}
                                                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                                                                >
                                                                    <div>
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <p className="text-[11px] font-semibold text-slate-700">
                                                                                Panel {slot.slot}
                                                                            </p>
                                                                            {hasPanelist ? (
                                                                                <span
                                                                                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${panelRoleBadgeClasses(
                                                                                        slotRole,
                                                                                    )}`}
                                                                                >
                                                                                    {formatPanelRole(slotRole)}
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-500">{slot.name ?? 'Open slot'}</p>
                                                                    </div>
                                                                    {hasPanelist ? (
                                                                        isCurrentPanelist ? (
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <select
                                                                                    value={selectedRole}
                                                                                    onChange={(event) =>
                                                                                        setRoleSelections((previous) => ({
                                                                                            ...previous,
                                                                                            [group.id]: event.target.value as PanelRole,
                                                                                        }))
                                                                                    }
                                                                                    className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-600"
                                                                                >
                                                                                    {allowedRoles.map((roleOption) => (
                                                                                        <option key={roleOption} value={roleOption}>
                                                                                            {formatPanelRole(roleOption)}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => assignPanelist(group.id, selectedRole)}
                                                                                    disabled={isBusy || isRoleUnchanged}
                                                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                                                                                        isRoleUnchanged
                                                                                            ? 'bg-emerald-100 text-emerald-700'
                                                                                            : 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                                                    } ${isBusy || isRoleUnchanged ? 'cursor-not-allowed opacity-60' : ''}`}
                                                                                >
                                                                                    <UserCheck className="h-3 w-3" />
                                                                                    {isRoleUnchanged ? 'Assigned' : 'Update Role'}
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => assignPanelist(group.id, slotRole, panelistId)}
                                                                                disabled={isBusy || !canReplace}
                                                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                                                                                    isCurrentPanelist
                                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                                        : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                                } ${isBusy || !canReplace ? 'cursor-not-allowed opacity-60' : ''}`}
                                                                            >
                                                                                <UserCheck className="h-3 w-3" />
                                                                                Replace
                                                                            </button>
                                                                        )
                                                                    ) : (
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <select
                                                                                value={selectedRole}
                                                                                onChange={(event) =>
                                                                                    setRoleSelections((previous) => ({
                                                                                        ...previous,
                                                                                        [group.id]: event.target.value as PanelRole,
                                                                                    }))
                                                                                }
                                                                                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-600"
                                                                            >
                                                                                {allowedRoles.map((roleOption) => (
                                                                                    <option key={roleOption} value={roleOption}>
                                                                                        {formatPanelRole(roleOption)}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => assignPanelist(group.id, selectedRole)}
                                                                                disabled={isBusy || isAssignedToPanelist || !canAssignToGroup}
                                                                                className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 ${
                                                                                    isBusy || isAssignedToPanelist || !canAssignToGroup
                                                                                        ? 'cursor-not-allowed opacity-60'
                                                                                        : ''
                                                                                }`}
                                                                            >
                                                                                <UserCheck className="h-3 w-3" />
                                                                                Assign
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        {hasOpenSlots ? (
                                                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-[10px] font-semibold text-slate-600">
                                                                        Assign another panelist
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openAssignPanelistModal(group)}
                                                                        disabled={isBusy || availablePanelistsCount === 0}
                                                                        className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 ${
                                                                            isBusy || availablePanelistsCount === 0
                                                                                ? 'cursor-not-allowed opacity-60'
                                                                                : ''
                                                                        }`}
                                                                    >
                                                                        <Users className="h-3 w-3" />
                                                                        Assign
                                                                    </button>
                                                                </div>
                                                                {availablePanelistsCount === 0 ? (
                                                                    <p className="mt-1 text-[9px] text-slate-500">
                                                                        No available panelists to assign.
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
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

                <AssignPanelistModal
                    open={isAssignPanelistModalOpen}
                    groupId={activeGroupForPanelist?.id ?? null}
                    groupName={activeGroupForPanelist ? formatGroupName(activeGroupForPanelist.name) : null}
                    programSetName={activeGroupForPanelist?.program_set_name ?? null}
                    groupProgram={activeGroupForPanelist?.program ?? null}
                    groupSchoolYear={activeGroupForPanelist?.school_year ?? null}
                    assignments={activeGroupForPanelist?.panelists ?? []}
                    currentPanelistId={panelist.id}
                    panelists={panelists}
                    onClose={() => {
                        setIsAssignPanelistModalOpen(false);
                        setActiveGroupForPanelist(null);
                    }}
                />
            </motion.section>
        </InstructorLayout>
    );
};

const PanelistAssignmentGroupsPage = () => {
    const { props } = usePage<PanelistAssignmentGroupsProps>();

    return (
        <PanelistAssignmentGroups
            panelist={props.panelist}
            panelists={props.panelists ?? []}
            groups={props.groups ?? []}
            academicYears={props.academicYears ?? []}
            selectedAcademicYear={props.selectedAcademicYear ?? null}
        />
    );
};

export default PanelistAssignmentGroupsPage;
