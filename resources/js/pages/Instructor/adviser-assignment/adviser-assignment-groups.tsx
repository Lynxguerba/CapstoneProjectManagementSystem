import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, LayoutGrid, List, Search, SlidersHorizontal, UserCheck } from 'lucide-react';
import React from 'react';
import instructorRoutes from '../../../routes/instructor';
import adviserAssignment from '../../../routes/instructor/adviser-assignment';
import InstructorLayout from '../_layout';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type AdviserWorkload = {
    academic_year: string;
    groups_count: number;
};

type AdviserSummary = {
    id: number;
    name: string;
    email: string;
    workloads?: AdviserWorkload[];
};

type GroupRow = {
    id: number;
    name: string;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
    adviser_id?: number | null;
    adviser_name?: string | null;
    members_count?: number;
};

type AdviserAssignmentGroupsProps = {
    adviser: AdviserSummary;
    groups?: GroupRow[];
    academicYears?: AcademicYearOption[];
    selectedAcademicYear?: string | null;
};

const MAX_LOAD = 5;

const AdviserAssignmentGroups = ({
    adviser,
    groups = [],
    academicYears = [],
    selectedAcademicYear: requestedAcademicYear = null,
}: AdviserAssignmentGroupsProps) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const currentAcademicYear = academicYears.find((year) => year.is_current)?.label ?? academicYears[0]?.label ?? 'All';
    const [viewMode, setViewMode] = React.useState<'card' | 'list'>('card');
    const [assigningGroupId, setAssigningGroupId] = React.useState<number | null>(null);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'unassigned' | 'assigned' | 'reassign'>('all');

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

    const getLoadForYear = React.useCallback(
        (academicYear: string): number => {
            const workloads = adviser.workloads ?? [];

            if (academicYear === 'All') {
                return workloads.reduce((total, item) => total + (item.groups_count ?? 0), 0);
            }

            return workloads.find((item) => item.academic_year === academicYear)?.groups_count ?? 0;
        },
        [adviser.workloads],
    );

    const totalLoad = getLoadForYear('All');
    const selectedYearLoad = selectedAcademicYear === 'All' ? totalLoad : getLoadForYear(selectedAcademicYear);

    const filteredGroups = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return groups.filter((group) => {
            if (selectedAcademicYear !== 'All' && group.school_year !== selectedAcademicYear) {
                return false;
            }

            if (!query) {
                if (statusFilter === 'all') {
                    return true;
                }

                const isAssignedToAdviser = group.adviser_id === adviser.id;
                const isReassign = !isAssignedToAdviser && Boolean(group.adviser_id);

                if (statusFilter === 'assigned') {
                    return isAssignedToAdviser;
                }

                if (statusFilter === 'reassign') {
                    return isReassign;
                }

                return !group.adviser_id;
            }

            const groupName = group.name.toLowerCase();
            const leaderName = (group.leader_name ?? '').toLowerCase();
            const programSetName = (group.program_set_name ?? '').toLowerCase();

            const matchesSearch = groupName.includes(query) || leaderName.includes(query) || programSetName.includes(query);
            if (!matchesSearch) {
                return false;
            }

            if (statusFilter === 'all') {
                return true;
            }

            const isAssignedToAdviser = group.adviser_id === adviser.id;
            const isReassign = !isAssignedToAdviser && Boolean(group.adviser_id);

            if (statusFilter === 'assigned') {
                return isAssignedToAdviser;
            }

            if (statusFilter === 'reassign') {
                return isReassign;
            }

            return !group.adviser_id;
        });
    }, [groups, searchTerm, selectedAcademicYear, statusFilter, adviser.id]);

    const orderedGroups = React.useMemo(() => {
        return [...filteredGroups].sort((first, second) => {
            const firstReassign = first.adviser_id !== adviser.id && Boolean(first.adviser_id);
            const secondReassign = second.adviser_id !== adviser.id && Boolean(second.adviser_id);

            return Number(firstReassign) - Number(secondReassign);
        });
    }, [filteredGroups, adviser.id]);

    // ── Pagination logic (mirrors students.tsx) ──────────────────────────────
    const totalPages = Math.max(1, Math.ceil(orderedGroups.length / itemsPerPage));

    // Clamp currentPage when totalPages shrinks
    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    // Reset to page 1 whenever filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedAcademicYear, statusFilter]);

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

    const assignGroup = (groupId: number) => {
        if (assigningGroupId !== null) {
            return;
        }

        setAssigningGroupId(groupId);
        setErrorMessage('');

        router.post(
            adviserAssignment.assign.url(),
            {
                group_id: groupId,
                adviser_id: adviser.id,
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.adviser_id) {
                        setErrorMessage(errors.adviser_id);
                    } else {
                        setErrorMessage('Unable to assign the group right now.');
                    }
                },
                onSuccess: () => {
                    router.reload({ only: ['groups', 'adviser'] });
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
        <InstructorLayout title="Assign Groups" subtitle={`Manage groups handled by ${adviser.name}`}>
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={instructorRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link
                        href={instructorRoutes.adviserAssignment.url()}
                        className="font-medium text-slate-600 transition-colors hover:text-slate-900"
                    >
                        Adviser Assignment
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        {adviser.name}
                    </span>
                </nav>

                {/* Adviser + Handled Groups: side by side in one row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Adviser card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Adviser</p>
                                <h2 className="text-lg font-semibold text-slate-900">{adviser.name}</h2>
                                <p className="text-xs text-slate-500">{adviser.email}</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                Max {MAX_LOAD} groups per A.Y
                            </span>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>{selectedAcademicYear === 'All' ? 'Total handled groups' : `Handled groups in ${selectedAcademicYear}`}</span>
                                <span className="font-semibold text-slate-800">
                                    {selectedYearLoad}
                                    {selectedAcademicYear === 'All' ? '' : ` / ${MAX_LOAD}`}
                                </span>
                            </div>
                            {selectedAcademicYear !== 'All' ? (
                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{ width: `${Math.min(100, Math.round((selectedYearLoad / MAX_LOAD) * 100))}%` }}
                                    />
                                </div>
                            ) : (
                                <p className="mt-2 text-[11px] text-slate-500">Select an academic year to see the per-year limit indicator.</p>
                            )}
                        </div>
                    </div>

                    {/* Handled Groups summary card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Handled Groups</p>
                                <p className="text-xs text-slate-500">Filtered by academic year</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {filteredGroups.filter((group) => group.adviser_id === adviser.id).length} assigned
                            </span>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>Total groups shown</span>
                                <span className="font-semibold text-slate-800">{filteredGroups.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Total adviser load</span>
                                <span className="font-semibold text-slate-800">{totalLoad}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Groups section: full width below */}
                <div className="flex min-w-0 flex-col gap-4">
                    {/* Toolbar */}
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
                                <SlidersHorizontal className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value as 'all' | 'unassigned' | 'assigned' | 'reassign')
                                    }
                                    className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="unassigned">Unassigned</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="reassign">Reassign</option>
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

                    {/* Groups grid / list — uses paginatedGroups */}
                    {viewMode === 'card' ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {paginatedGroups.map((group) => {
                                const groupYear = group.school_year ?? 'Unassigned';
                                const loadForYear = getLoadForYear(groupYear);
                                const isAssignedToAdviser = group.adviser_id === adviser.id;
                                const isAtLimit = loadForYear >= MAX_LOAD;
                                const isDisabled = assigningGroupId !== null || (isAtLimit && !isAssignedToAdviser);
                                const isReassign = !isAssignedToAdviser && group.adviser_id;

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
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        isAssignedToAdviser
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : group.adviser_id
                                                              ? 'bg-amber-100 text-amber-700'
                                                              : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {isAssignedToAdviser ? 'Handled' : group.adviser_id ? 'Assigned' : 'Unassigned'}
                                                </span>
                                            </div>

                                            <div className="mt-3 space-y-1 text-xs text-slate-600">
                                                <p>Leader: {group.leader_name ?? '—'}</p>
                                                <p>Members: {group.members_count ?? 0}</p>
                                                <p>A.Y: {groupYear}</p>
                                                {group.adviser_name && !isAssignedToAdviser ? (
                                                    <p className="text-[11px] text-slate-500">Current: {group.adviser_name}</p>
                                                ) : null}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => assignGroup(group.id)}
                                                disabled={isDisabled || isAssignedToAdviser}
                                                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold shadow-sm transition ${
                                                    isAssignedToAdviser
                                                        ? 'border border-slate-200 bg-slate-100 text-slate-500'
                                                        : isReassign
                                                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                                            >
                                                <UserCheck className="h-3.5 w-3.5" />
                                                {isAssignedToAdviser ? 'Assigned' : isReassign ? 'Reassign' : 'Assign'}
                                            </button>
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
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedGroups.map((group) => {
                                        const groupYear = group.school_year ?? 'Unassigned';
                                        const loadForYear = getLoadForYear(groupYear);
                                        const isAssignedToAdviser = group.adviser_id === adviser.id;
                                        const isAtLimit = loadForYear >= MAX_LOAD;
                                        const isDisabled = assigningGroupId !== null || (isAtLimit && !isAssignedToAdviser);
                                        const isReassign = !isAssignedToAdviser && group.adviser_id;
                                        const status = isAssignedToAdviser ? 'Handled' : group.adviser_id ? 'Assigned' : 'Unassigned';
                                        const statusClasses = isAssignedToAdviser
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : group.adviser_id
                                              ? 'bg-amber-100 text-amber-700'
                                              : 'bg-slate-100 text-slate-600';

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
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => assignGroup(group.id)}
                                                        disabled={isDisabled || isAssignedToAdviser}
                                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold shadow-sm transition ${
                                                            isAssignedToAdviser
                                                                ? 'border border-slate-200 bg-slate-100 text-slate-500'
                                                                : isReassign
                                                                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                        } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
                                                    >
                                                        <UserCheck className="h-3 w-3" />
                                                        {isAssignedToAdviser ? 'Assigned' : isReassign ? 'Reassign' : 'Assign'}
                                                    </button>
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

                    {/* Results Summary */}
                    {filteredGroups.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-medium text-slate-500">
                            Showing {paginatedGroups.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                            {Math.min(currentPage * itemsPerPage, filteredGroups.length)} of {filteredGroups.length} groups
                        </motion.div>
                    )}

                    {/* Pagination */}
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

const AdviserAssignmentGroupsPage = () => {
    const { props } = usePage<AdviserAssignmentGroupsProps>();

    return (
        <AdviserAssignmentGroups
            adviser={props.adviser}
            groups={props.groups ?? []}
            academicYears={props.academicYears ?? []}
            selectedAcademicYear={props.selectedAcademicYear ?? null}
        />
    );
};

export default AdviserAssignmentGroupsPage;
