import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, GraduationCap, LayoutGrid, List, Search, Settings, SlidersHorizontal, User, Users } from 'lucide-react';
import React from 'react';
import GroupStudentsAdviserModal from '@/components/Panelist/GroupStudentsAdviserModal';
import PanelLayout from './_layout';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type PanelRole = 'chairman' | 'member';

type AssignedPanelist = {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    slot?: number;
    role?: PanelRole | null;
};

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

type AssignedGroupRow = {
    id: number;
    name: string;
    program_set_id?: number | null;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
    members_count?: number;
    panel_role?: PanelRole | null;
    panel_slot?: number | null;
    students?: GroupStudent[];
    adviser?: GroupAdviser;
    panelists?: AssignedPanelist[];
};

type UtilityProgram = {
    program: string;
    max_groups: number;
    assigned_count: number;
};

type PanelistUtilitiesSummary = {
    is_available?: boolean;
    programs?: UtilityProgram[];
};

type ProgramSetOption = {
    value: string;
    label: string;
    academicYear: string | null;
};

type PanelistAssignedGroupsProps = {
    academicYears?: AcademicYearOption[];
    assignedGroups?: AssignedGroupRow[];
    selectedAcademicYear?: string | null;
    utilities?: PanelistUtilitiesSummary;
};

const formatGroupName = (name: string): string => {
    const trimmed = name.trim();
    if (trimmed === '') {
        return 'Group';
    }

    return trimmed.toLowerCase().endsWith(' group') ? trimmed : `${trimmed} Group`;
};

const getProgramSetKey = (group: AssignedGroupRow): string => {
    if (group.program_set_id !== null && group.program_set_id !== undefined) {
        return `id:${group.program_set_id}`;
    }

    const name = group.program_set_name ?? '';
    const year = group.school_year ?? '';

    return `name:${name}::${year}`;
};

const normalizeProgramKey = (program?: string | null): string => {
    if (typeof program !== 'string') {
        return '';
    }

    return program.trim().toUpperCase();
};

const resolveMaxGroups = (currentValue: number, incomingValue: number): number => {
    if (currentValue === 5 && incomingValue !== 5) {
        return incomingValue;
    }

    if (currentValue !== 5 && incomingValue === 5) {
        return currentValue;
    }

    return incomingValue;
};

const formatPanelRole = (role?: PanelRole | null): string => {
    if (role === 'chairman') {
        return 'Panel Chairman';
    }

    return 'Panel Member';
};

const roleBadgeClasses = (role?: PanelRole | null): string => {
    if (role === 'chairman') {
        return 'bg-indigo-100 text-indigo-700';
    }

    return 'bg-slate-100 text-slate-600';
};

const PanelistAssignedGroups = () => {
    const { props } = usePage<PanelistAssignedGroupsProps>();
    const academicYears = React.useMemo(() => props.academicYears ?? [], [props.academicYears]);
    const assignedGroups = React.useMemo(() => props.assignedGroups ?? [], [props.assignedGroups]);
    const selectedAcademicYearProp = props.selectedAcademicYear ?? null;
    const utilities = props.utilities;
    const utilityPrograms = React.useMemo(() => utilities?.programs ?? [], [utilities?.programs]);
    const isAvailable = utilities?.is_available === true;

    const [searchTerm, setSearchTerm] = React.useState('');
    const [viewMode, setViewMode] = React.useState<'card' | 'list'>('list');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'chairman' | 'member'>('all');
    const [selectedProgramSet, setSelectedProgramSet] = React.useState('All');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedGroupForModal, setSelectedGroupForModal] = React.useState<AssignedGroupRow | null>(null);
    const itemsPerPage = 6;

    const currentAcademicYear = academicYears.find((year) => year.is_current)?.label ?? academicYears[0]?.label ?? 'All';
    const resolvedAcademicYear = React.useMemo(() => {
        if (selectedAcademicYearProp === 'All') {
            return 'All';
        }

        if (typeof selectedAcademicYearProp === 'string' && selectedAcademicYearProp !== '') {
            const exists = academicYears.some((year) => year.label === selectedAcademicYearProp);
            if (exists) {
                return selectedAcademicYearProp;
            }
        }

        return currentAcademicYear || 'All';
    }, [selectedAcademicYearProp, academicYears, currentAcademicYear]);

    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(resolvedAcademicYear);

    React.useEffect(() => {
        setSelectedAcademicYear(resolvedAcademicYear);
    }, [resolvedAcademicYear]);

    const academicYearOptions = React.useMemo(() => {
        const years = academicYears.map((year) => year.label);
        return ['All', ...years];
    }, [academicYears]);

    const programSetOptions = React.useMemo((): ProgramSetOption[] => {
        const options = new Map<string, ProgramSetOption>();

        assignedGroups.forEach((group) => {
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
    }, [assignedGroups, selectedAcademicYear]);

    React.useEffect(() => {
        if (selectedProgramSet === 'All') {
            return;
        }

        const isStillAvailable = programSetOptions.some((option) => option.value === selectedProgramSet);
        if (!isStillAvailable) {
            setSelectedProgramSet('All');
        }
    }, [programSetOptions, selectedProgramSet]);

    const assignedByProgramYear = React.useMemo(() => {
        const tracker = new Map<string, Map<string, number>>();

        assignedGroups.forEach((group) => {
            const program = normalizeProgramKey(group.program);
            if (program === '') {
                return;
            }

            const year = group.school_year ?? 'Unspecified';
            const yearMap = tracker.get(program) ?? new Map<string, number>();
            yearMap.set(year, (yearMap.get(year) ?? 0) + 1);
            tracker.set(program, yearMap);
        });

        return tracker;
    }, [assignedGroups]);

    const utilityMap = React.useMemo(() => {
        const normalizedUtilities = new Map<string, UtilityProgram>();

        utilityPrograms.forEach((utility) => {
            const normalizedProgram = normalizeProgramKey(utility.program);
            if (normalizedProgram === '') {
                return;
            }

            const existing = normalizedUtilities.get(normalizedProgram);
            if (!existing) {
                normalizedUtilities.set(normalizedProgram, {
                    ...utility,
                    program: normalizedProgram,
                });
                return;
            }

            normalizedUtilities.set(normalizedProgram, {
                ...existing,
                program: normalizedProgram,
                max_groups: resolveMaxGroups(existing.max_groups ?? 0, utility.max_groups ?? 0),
                assigned_count: (existing.assigned_count ?? 0) + (utility.assigned_count ?? 0),
            });
        });

        return normalizedUtilities;
    }, [utilityPrograms]);

    const selectedYearPrograms = React.useMemo(() => {
        const programs = new Set([
            ...utilityPrograms.map((utility) => normalizeProgramKey(utility.program)).filter((program) => program !== ''),
            ...assignedGroups.map((group) => normalizeProgramKey(group.program)).filter((program) => program !== ''),
        ]);

        return Array.from(programs)
            .sort((first, second) => first.localeCompare(second))
            .map((program) => {
                const maxGroups = utilityMap.get(program)?.max_groups ?? 5;
                const assignedCount =
                    selectedAcademicYear === 'All'
                        ? assignedGroups.filter((group) => normalizeProgramKey(group.program) === program).length
                        : (assignedByProgramYear.get(program)?.get(selectedAcademicYear) ?? 0);

                return {
                    program,
                    max_groups: maxGroups,
                    assigned_count: assignedCount,
                };
            });
    }, [assignedByProgramYear, assignedGroups, selectedAcademicYear, utilityMap, utilityPrograms]);

    const totalAssigned =
        selectedAcademicYear === 'All' ? assignedGroups.length : assignedGroups.filter((group) => group.school_year === selectedAcademicYear).length;
    const totalCapacity = selectedYearPrograms.reduce((total, utility) => total + (utility.max_groups ?? 0), 0);

    const getAssignedForProgramYear = React.useCallback(
        (program?: string | null, year?: string | null): number => {
            const resolvedProgram = normalizeProgramKey(program);
            if (resolvedProgram === '') {
                return 0;
            }

            const resolvedYear = year ?? 'Unspecified';

            return assignedByProgramYear.get(resolvedProgram)?.get(resolvedYear) ?? 0;
        },
        [assignedByProgramYear],
    );

    const getMaxForProgram = React.useCallback(
        (program?: string | null): number => {
            const resolvedProgram = normalizeProgramKey(program);
            if (resolvedProgram === '') {
                return 5;
            }

            return utilityMap.get(resolvedProgram)?.max_groups ?? 5;
        },
        [utilityMap],
    );

    const filteredGroups = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return assignedGroups.filter((group) => {
            if (selectedAcademicYear !== 'All' && group.school_year !== selectedAcademicYear) {
                return false;
            }

            if (selectedProgramSet !== 'All' && getProgramSetKey(group) !== selectedProgramSet) {
                return false;
            }

            if (statusFilter === 'chairman' && group.panel_role !== 'chairman') {
                return false;
            }

            if (statusFilter === 'member' && (group.panel_role ?? 'member') !== 'member') {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = [group.name, group.leader_name, group.program_set_name, group.program].filter(Boolean).join(' ').toLowerCase();

            return haystack.includes(query);
        });
    }, [assignedGroups, searchTerm, selectedAcademicYear, selectedProgramSet, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedAcademicYear, selectedProgramSet, statusFilter]);

    const paginatedGroups = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredGroups.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredGroups, currentPage]);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    return (
        <PanelLayout title="Assigned Groups" subtitle="Manage your assigned groups and program capacities">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/panelist/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Assigned Groups
                    </span>
                </nav>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Panelist Capacity</p>
                                <h2 className="text-lg font-semibold text-slate-900">Program Capacity</h2>
                                <p className="text-xs text-slate-500">
                                    {selectedAcademicYear === 'All' ? 'All academic years' : selectedAcademicYear}
                                </p>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                    isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}
                            >
                                {isAvailable ? 'Open for assignments' : 'Closed for assignments'}
                            </span>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-slate-600">
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
                                <span>Total assigned groups</span>
                                <span className="font-semibold text-slate-800">
                                    {totalAssigned}
                                    {totalCapacity > 0 ? ` / ${totalCapacity}` : ''}
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${totalCapacity > 0 ? Math.min(100, Math.round((totalAssigned / totalCapacity) * 100)) : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Assigned Groups Overview</p>
                                <p className="text-xs text-slate-500">Filtered by academic year, program set, and role</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {filteredGroups.length} shown
                            </span>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>Chairman assignments</span>
                                <span className="font-semibold text-slate-800">
                                    {filteredGroups.filter((group) => group.panel_role === 'chairman').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Member assignments</span>
                                <span className="font-semibold text-slate-800">
                                    {filteredGroups.filter((group) => (group.panel_role ?? 'member') === 'member').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search group, leader, or program set..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:w-64"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedAcademicYear}
                                onChange={(event) => setSelectedAcademicYear(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'chairman' | 'member')}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">All Roles</option>
                                <option value="chairman">Panel Chairman</option>
                                <option value="member">Panel Member</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/panelist/utilities"
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <Settings className="h-3.5 w-3.5" />
                            Capacity Settings
                        </Link>
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setViewMode('card')}
                                className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                    viewMode === 'card' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                    viewMode === 'list' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'card' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {paginatedGroups.map((group, index) => {
                            const groupYear = group.school_year ?? 'Unspecified';
                            const loadForYear = getAssignedForProgramYear(group.program, groupYear);
                            const maxForProgram = getMaxForProgram(group.program);

                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.07 * index }}
                                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex-1 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-emerald-600">
                                                    {formatGroupName(group.name)}
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500">{group.program_set_name ?? 'Program set'}</p>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadgeClasses(group.panel_role)}`}
                                            >
                                                {formatPanelRole(group.panel_role)}
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-1 text-xs text-slate-600">
                                            <p>Leader: {group.leader_name ?? '—'}</p>
                                            <p>Members: {group.members_count ?? 0}</p>
                                            <p>A.Y: {groupYear}</p>
                                            <p className="font-semibold text-slate-700">
                                                Program Capacity: {loadForYear} / {maxForProgram}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedGroupForModal(group)}
                                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                            >
                                                <Users className="h-3 w-3" />
                                                View
                                            </button>
                                            <Link
                                                href="/panelist/documents"
                                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                            >
                                                <User className="h-3 w-3" />
                                                Review Docs
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Group</th>
                                    <th className="px-6 py-4">Leader</th>
                                    <th className="px-6 py-4">Program Capacity</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">A.Y</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedGroups.map((group) => {
                                    const groupYear = group.school_year ?? 'Unspecified';
                                    const loadForYear = getAssignedForProgramYear(group.program, groupYear);
                                    const maxForProgram = getMaxForProgram(group.program);

                                    return (
                                        <tr key={group.id} className="transition-colors hover:bg-emerald-50/30">
                                            <td className="px-6 py-3.5">
                                                <div>
                                                    <div className="font-semibold text-slate-800">{formatGroupName(group.name)}</div>
                                                    <div className="text-[10px] text-slate-500">{group.program_set_name ?? 'Program set'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{group.leader_name ?? '—'}</td>
                                            <td className="px-6 py-3.5 font-semibold text-slate-700">
                                                {loadForYear} / {maxForProgram}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadgeClasses(group.panel_role)}`}
                                                >
                                                    {formatPanelRole(group.panel_role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{groupYear}</td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="inline-flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedGroupForModal(group)}
                                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                    >
                                                        <Users className="h-3 w-3" />
                                                        View
                                                    </button>
                                                    <Link
                                                        href="/panelist/documents"
                                                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                                    >
                                                        Review
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {filteredGroups.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-xs text-slate-500">
                        No assigned groups match your filters.
                    </div>
                ) : null}

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
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                                                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <GroupStudentsAdviserModal
                    open={selectedGroupForModal !== null}
                    onClose={() => setSelectedGroupForModal(null)}
                    group={selectedGroupForModal}
                />
            </motion.section>
        </PanelLayout>
    );
};

export default PanelistAssignedGroups;
