import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, LayoutGrid, List, Search, SlidersHorizontal, UserCheck, Users } from 'lucide-react';
import React from 'react';
import PanelistGroupsModal from '../../components/Instructor/panelist/PanelistGroupsModal';
import instructorRoutes from '../../routes/instructor';
import panelistAssignment from '../../routes/instructor/panelist-assignment';
import InstructorLayout from './_layout';

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

type PanelistRow = {
    id: number;
    name: string;
    email: string;
    workloads?: PanelistWorkload[];
    programs?: PanelistProgramSummary[];
    is_available?: boolean;
};

type PanelistAssignmentPageProps = {
    panelists?: PanelistRow[];
    academicYears?: AcademicYearOption[];
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

const mergeProgramSummaries = (programs?: PanelistProgramSummary[]): PanelistProgramSummary[] => {
    const tracker = new Map<string, PanelistProgramSummary>();

    (programs ?? []).forEach((program) => {
        const key = normalizeProgramKey(program.program);
        if (key === '') {
            return;
        }

        const existing = tracker.get(key);
        const incomingAssignedByYear = program.assigned_by_year ?? {};

        if (!existing) {
            tracker.set(key, {
                program: key,
                max_groups: program.max_groups ?? 0,
                assigned_count: program.assigned_count ?? 0,
                assigned_by_year: { ...incomingAssignedByYear },
            });
            return;
        }

        const mergedAssignedByYear = { ...(existing.assigned_by_year ?? {}) };
        Object.entries(incomingAssignedByYear).forEach(([year, count]) => {
            mergedAssignedByYear[year] = (mergedAssignedByYear[year] ?? 0) + (count ?? 0);
        });

        tracker.set(key, {
            program: key,
            max_groups: resolveMaxGroups(existing.max_groups ?? 0, program.max_groups ?? 0),
            assigned_count: (existing.assigned_count ?? 0) + (program.assigned_count ?? 0),
            assigned_by_year: mergedAssignedByYear,
        });
    });

    return Array.from(tracker.values()).sort((first, second) => first.program.localeCompare(second.program));
};

const PanelistAssignmentPage = ({ panelists = [], academicYears = [] }: PanelistAssignmentPageProps) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const currentAcademicYearLabel = academicYears.find((year) => year.is_current)?.label ?? null;
    const currentAcademicYear = currentAcademicYearLabel ?? academicYears[0]?.label ?? 'All';
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(currentAcademicYear || 'All');
    const [viewMode, setViewMode] = React.useState<'card' | 'list'>('list');
    const [selectedPanelist, setSelectedPanelist] = React.useState<PanelistRow | null>(null);
    const [isGroupsModalOpen, setIsGroupsModalOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'available' | 'partial' | 'full' | 'closed'>('all');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 9;
    const getPanelistPrograms = React.useCallback((panelist: PanelistRow): PanelistProgramSummary[] => {
        return mergeProgramSummaries(panelist.programs);
    }, []);

    const academicYearOptions = React.useMemo(() => {
        const years = academicYears.map((year) => year.label);
        return ['All', ...years];
    }, [academicYears]);

    const getAssignedForYear = React.useCallback(
        (panelist: PanelistRow, yearLabel?: string | null): number => {
            const workloads = panelist.workloads ?? [];

            if (yearLabel && yearLabel !== 'All') {
                return workloads.find((workload) => workload.academic_year === yearLabel)?.groups_count ?? 0;
            }

            if (workloads.length > 0) {
                return workloads.reduce((total, workload) => total + (workload.groups_count ?? 0), 0);
            }

            return getPanelistPrograms(panelist).reduce((total, program) => total + (program.assigned_count ?? 0), 0);
        },
        [getPanelistPrograms],
    );

    const getProgramTotals = React.useCallback(
        (panelist: PanelistRow, yearLabel?: string | null) => {
            const programs = getPanelistPrograms(panelist);
            const totalAssigned = getAssignedForYear(panelist, yearLabel);
            const totalCapacity = programs.reduce((total, program) => total + (program.max_groups ?? 0), 0);
            const remaining = Math.max(0, totalCapacity - totalAssigned);

            return {
                programs,
                totalAssigned,
                totalCapacity,
                remaining,
                isAvailable: panelist.is_available === true,
            };
        },
        [getAssignedForYear, getPanelistPrograms],
    );

    const getTotalAssignedGroups = React.useCallback(
        (panelist: PanelistRow, yearLabel?: string | null): number => {
            const { totalAssigned } = getProgramTotals(panelist, yearLabel);
            return totalAssigned;
        },
        [getProgramTotals],
    );

    const getStatusMeta = React.useCallback(
        (panelist: PanelistRow, yearLabel?: string | null) => {
            const { remaining, totalCapacity, isAvailable } = getProgramTotals(panelist, yearLabel);
            const hasCapacity = totalCapacity > 0;

            if (!isAvailable) {
                return { status: 'Closed', statusClasses: 'bg-rose-100 text-rose-700' };
            }

            if (hasCapacity && remaining <= 0) {
                return { status: 'Full', statusClasses: 'bg-rose-100 text-rose-700' };
            }

            if (hasCapacity && remaining <= 1) {
                return { status: 'Partial', statusClasses: 'bg-amber-100 text-amber-700' };
            }

            return { status: 'Available', statusClasses: 'bg-emerald-100 text-emerald-700' };
        },
        [getProgramTotals],
    );

    const getProgramAssignedCount = React.useCallback(
        (program: PanelistProgramSummary): number => {
            if (selectedAcademicYear !== 'All') {
                const yearCount = program.assigned_by_year?.[selectedAcademicYear];
                return typeof yearCount === 'number' ? yearCount : 0;
            }

            return program.assigned_count ?? 0;
        },
        [selectedAcademicYear],
    );

    const sortedPanelists = React.useMemo(() => {
        return [...panelists].sort((first, second) => {
            const workloadDelta = getTotalAssignedGroups(second, selectedAcademicYear) - getTotalAssignedGroups(first, selectedAcademicYear);

            if (workloadDelta !== 0) {
                return workloadDelta;
            }

            return first.name.localeCompare(second.name);
        });
    }, [panelists, getTotalAssignedGroups, selectedAcademicYear]);

    const filteredPanelists = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return sortedPanelists.filter((panelist) => {
            const matchesSearch = !query || panelist.name.toLowerCase().includes(query) || panelist.email.toLowerCase().includes(query);

            if (!matchesSearch) {
                return false;
            }

            if (statusFilter === 'all') {
                return true;
            }

            const { status } = getStatusMeta(panelist, selectedAcademicYear);
            const normalizedStatus = status.toLowerCase();

            return normalizedStatus === statusFilter;
        });
    }, [sortedPanelists, searchTerm, statusFilter, getStatusMeta, selectedAcademicYear]);

    const totalPages = Math.max(1, Math.ceil(filteredPanelists.length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    const paginatedPanelists = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPanelists.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPanelists, currentPage]);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedAcademicYear, statusFilter]);

    return (
        <InstructorLayout title="Panelist Assignment" subtitle="Assign and manage panelist workloads by program">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={instructorRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Panelist Assignment
                    </span>
                </nav>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search panelist name or email..."
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
                            <SlidersHorizontal className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'available' | 'partial' | 'full' | 'closed')}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm transition outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                <option value="all">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="partial">Partial</option>
                                <option value="full">Full</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
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

                {viewMode === 'card' ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {paginatedPanelists.map((panelist) => {
                            const { programs, totalAssigned, totalCapacity } = getProgramTotals(panelist, selectedAcademicYear);
                            const progress = totalCapacity > 0 ? Math.min(100, Math.round((totalAssigned / totalCapacity) * 100)) : 0;
                            const { status, statusClasses } = getStatusMeta(panelist, selectedAcademicYear);
                            const assignHref = panelistAssignment.manage.url(
                                { panelist: panelist.id },
                                selectedAcademicYear === 'All' ? undefined : { query: { academic_year: selectedAcademicYear } },
                            );

                            return (
                                <div
                                    key={panelist.id}
                                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex-1 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-green-600">
                                                    {panelist.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500">{panelist.email}</p>
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>{status}</span>
                                        </div>

                                        <div className="mt-4 space-y-1 text-xs text-slate-600">
                                            <p className="font-semibold text-slate-700">Program Capacity</p>
                                            {programs.length > 0 ? (
                                                programs.map((program) => (
                                                    <div key={program.program} className="flex items-center justify-between">
                                                        <span>{program.program}</span>
                                                        <span className="font-semibold text-slate-700">
                                                            {getProgramAssignedCount(program)} / {program.max_groups}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[11px] text-slate-500">No program utilities configured yet.</p>
                                            )}
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <Link
                                                href={assignHref}
                                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                            >
                                                <UserCheck className="h-3.5 w-3.5" />
                                                Assign
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPanelist(panelist);
                                                    setIsGroupsModalOpen(true);
                                                }}
                                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                            >
                                                <Users className="h-3.5 w-3.5" />
                                                View Groups
                                            </button>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100">
                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            );
                        })}

                        {filteredPanelists.length === 0 ? (
                            <div className="col-span-full rounded-xl border border-slate-200 bg-white py-12 text-center text-xs text-slate-500">
                                No panelists match your search.
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Panelist</th>
                                    <th className="px-6 py-4">Load</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedPanelists.map((panelist) => {
                                    const { programs, totalAssigned, totalCapacity } = getProgramTotals(panelist, selectedAcademicYear);
                                    const progress = totalCapacity > 0 ? Math.min(100, Math.round((totalAssigned / totalCapacity) * 100)) : 0;
                                    const { status, statusClasses } = getStatusMeta(panelist, selectedAcademicYear);
                                    const assignHref = panelistAssignment.manage.url(
                                        { panelist: panelist.id },
                                        selectedAcademicYear === 'All' ? undefined : { query: { academic_year: selectedAcademicYear } },
                                    );

                                    return (
                                        <tr key={panelist.id} className="transition-colors hover:bg-green-50/30">
                                            <td className="px-6 py-3.5">
                                                <div>
                                                    <div className="font-semibold text-slate-800">{panelist.name}</div>
                                                    <div className="text-[10px] text-slate-500">{panelist.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="space-y-1 text-[11px] text-slate-600">
                                                    {programs.length > 0 ? (
                                                        programs.map((program) => (
                                                            <div key={program.program} className="flex items-center justify-between">
                                                                <span>{program.program}</span>
                                                                <span className="font-semibold text-slate-700">
                                                                    {getProgramAssignedCount(program)} / {program.max_groups}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-500">No program utilities</span>
                                                    )}
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="inline-flex gap-2">
                                                    <Link
                                                        href={assignHref}
                                                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                                    >
                                                        <UserCheck className="h-3 w-3" />
                                                        Assign
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPanelist(panelist);
                                                            setIsGroupsModalOpen(true);
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                    >
                                                        <Users className="h-3 w-3" />
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredPanelists.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-500">No panelists match your search.</div>
                        ) : null}
                    </div>
                )}

                {filteredPanelists.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-medium text-slate-500">
                        Showing {paginatedPanelists.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredPanelists.length)} of {filteredPanelists.length} panelists
                    </motion.div>
                )}

                {filteredPanelists.length > 0 && (
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
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </motion.section>

            <PanelistGroupsModal
                open={isGroupsModalOpen}
                panelistId={selectedPanelist?.id ?? null}
                panelistName={selectedPanelist?.name ?? null}
                academicYear={selectedAcademicYear}
                onClose={() => {
                    setIsGroupsModalOpen(false);
                    setSelectedPanelist(null);
                }}
            />
        </InstructorLayout>
    );
};

export default PanelistAssignmentPage;
