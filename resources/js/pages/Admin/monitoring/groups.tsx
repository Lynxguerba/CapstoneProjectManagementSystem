import { Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Filter, Search, Users } from 'lucide-react';
import React from 'react';
import AdminLayout from '../_layout';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type PanelistSummary = {
    id?: number | null;
    name?: string | null;
};

type GroupRow = {
    id: number;
    name: string;
    program_set_name?: string | null;
    program_set_id?: number | null;
    program?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
    adviser_name?: string | null;
    members_count?: number;
    panelists?: PanelistSummary[];
};

type ProgramSetOption = {
    id: number;
    name: string;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type MonitoringGroupsProps = {
    groups?: GroupRow[];
    academicYears?: AcademicYearOption[];
    programOptions?: string[];
    programSets?: ProgramSetOption[];
    filters?: {
        search?: string;
        program?: string;
        academic_year?: string;
        program_set?: string;
    };
    pagination?: PaginationMeta;
};

const buildQuery = (params: Record<string, string | number | undefined>): Record<string, string | number> => {
    const query: Record<string, string | number> = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === '') {
            return;
        }

        query[key] = value;
    });

    return query;
};

const MonitoringGroupsPage = ({
    groups = [],
    academicYears = [],
    programOptions = [],
    programSets = [],
    filters,
    pagination,
}: MonitoringGroupsProps) => {
    const currentAcademicYear = academicYears.find((year) => year.is_current)?.label ?? academicYears[0]?.label ?? 'All';
    const fallbackAcademicYear = currentAcademicYear || 'All';
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(filters?.academic_year ?? fallbackAcademicYear);
    const [selectedProgram, setSelectedProgram] = React.useState(filters?.program ?? 'All');
    const [selectedProgramSet, setSelectedProgramSet] = React.useState(filters?.program_set ?? 'All');
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');

    React.useEffect(() => {
        setSelectedAcademicYear(filters?.academic_year ?? fallbackAcademicYear);
        setSelectedProgram(filters?.program ?? 'All');
        setSelectedProgramSet(filters?.program_set ?? 'All');
        setSearchTerm(filters?.search ?? '');
    }, [filters?.academic_year, filters?.program, filters?.program_set, filters?.search, fallbackAcademicYear]);

    const availablePrograms = React.useMemo(() => {
        if (programOptions.length > 0) {
            return ['All', ...programOptions];
        }

        const set = new Set<string>();
        groups.forEach((group) => {
            if (group.program) {
                set.add(group.program);
            }
        });

        return ['All', ...Array.from(set).sort()];
    }, [programOptions, groups]);

    const academicYearOptions = React.useMemo(() => {
        if (academicYears.length > 0) {
            return ['All', ...academicYears.map((year) => year.label)];
        }

        const set = new Set<string>();
        groups.forEach((group) => {
            if (group.school_year) {
                set.add(group.school_year);
            }
        });

        return ['All', ...Array.from(set).sort()];
    }, [academicYears, groups]);

    const pageMeta: PaginationMeta = pagination ?? { current_page: 1, last_page: 1, per_page: 10, total: groups.length };
    const totalPages = Math.max(1, pageMeta.last_page || 1);
    const currentPage = Math.min(pageMeta.current_page || 1, totalPages);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    const syncFilters = (overrides: { search?: string; program?: string; academic_year?: string; program_set?: string; page?: number }) => {
        router.get(
            '/admin/monitoring/groups',
            buildQuery({
                search: overrides.search ?? searchTerm,
                program: (overrides.program ?? selectedProgram) !== 'All' ? (overrides.program ?? selectedProgram) : undefined,
                academic_year:
                    (overrides.academic_year ?? selectedAcademicYear) !== 'All' ? (overrides.academic_year ?? selectedAcademicYear) : undefined,
                program_set: (overrides.program_set ?? selectedProgramSet) !== 'All' ? (overrides.program_set ?? selectedProgramSet) : undefined,
                page: overrides.page ?? 1,
            }),
            { preserveState: true, replace: true },
        );
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        syncFilters({ search: value, page: 1 });
    };

    const handleProgramChange = (value: string) => {
        setSelectedProgram(value);
        syncFilters({ program: value, page: 1 });
    };

    const handleAcademicYearChange = (value: string) => {
        setSelectedAcademicYear(value);
        syncFilters({ academic_year: value, page: 1 });
    };

    const handleProgramSetChange = (value: string) => {
        setSelectedProgramSet(value);
        syncFilters({ program_set: value, page: 1 });
    };

    const handleClearFilters = () => {
        setSelectedAcademicYear('All');
        setSelectedProgram('All');
        setSelectedProgramSet('All');
        setSearchTerm('');
        syncFilters({ search: '', program: 'All', academic_year: 'All', program_set: 'All', page: 1 });
    };

    const handlePageChange = (page: number) => {
        syncFilters({ page });
    };

    const startItem = pageMeta.total === 0 ? 0 : (currentPage - 1) * pageMeta.per_page + 1;
    const endItem = Math.min(currentPage * pageMeta.per_page, pageMeta.total);

    const formatPanelists = (panelists: PanelistSummary[] | undefined): string => {
        if (!panelists || panelists.length === 0) {
            return '—';
        }

        const names = panelists.map((panelist) => panelist.name).filter((name): name is string => Boolean(name && name.trim() !== ''));

        if (names.length === 0) {
            return '—';
        }

        const visible = names.slice(0, 2);
        const remaining = names.length - visible.length;

        return remaining > 0 ? `${visible.join(', ')} +${remaining} more` : visible.join(', ');
    };

    return (
        <AdminLayout title="Groups Monitoring" subtitle="Review all capstone groups and assignments">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/admin/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
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
                                placeholder="Search groups, leaders, or advisers..."
                                value={searchTerm}
                                onChange={(event) => handleSearchChange(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:w-64"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedAcademicYear}
                                onChange={(event) => handleAcademicYearChange(event.target.value)}
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
                            <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedProgram}
                                onChange={(event) => handleProgramChange(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                {availablePrograms.map((program) => (
                                    <option key={program} value={program}>
                                        {program === 'All' ? 'All Programs' : program}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedProgramSet}
                                onChange={(event) => handleProgramSetChange(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="All">All Program Sets</option>
                                {programSets.map((set) => (
                                    <option key={set.id} value={String(set.id)}>
                                        {set.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Group</th>
                                <th className="px-6 py-4">Program Set</th>
                                <th className="px-6 py-4">Program</th>
                                <th className="px-6 py-4">Academic Year</th>
                                <th className="px-6 py-4">Leader</th>
                                <th className="px-6 py-4">Adviser</th>
                                <th className="px-6 py-4 text-center">Members</th>
                                <th className="px-6 py-4">Panelists</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {groups.map((group, index) => (
                                <tr
                                    key={group.id}
                                    className={`transition-colors hover:bg-emerald-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                >
                                    <td className="px-6 py-3.5 font-semibold text-slate-800">{group.name}</td>
                                    <td className="px-6 py-3.5 text-slate-600">{group.program_set_name ?? '—'}</td>
                                    <td className="px-6 py-3.5 text-slate-600">{group.program ?? '—'}</td>
                                    <td className="px-6 py-3.5 text-slate-600">{group.school_year ?? '—'}</td>
                                    <td className="px-6 py-3.5 text-slate-600">{group.leader_name ?? '—'}</td>
                                    <td className="px-6 py-3.5 text-slate-600">{group.adviser_name ?? 'Unassigned'}</td>
                                    <td className="px-6 py-3.5 text-center font-semibold text-slate-800">{group.members_count ?? 0}</td>
                                    <td className="px-6 py-3.5 text-slate-600">{formatPanelists(group.panelists)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-xs text-slate-500">
                            <Users className="h-8 w-8 text-slate-300" />
                            No groups found for the selected filters.
                        </div>
                    ) : null}
                </div>

                {pageMeta.total > 0 ? (
                    <div className="flex flex-col items-center justify-between gap-4 px-1 pb-2 md:flex-row">
                        <p className="text-xs font-medium text-slate-500">
                            Showing <span className="text-slate-900">{startItem}</span> to <span className="text-slate-900">{endItem}</span> of{' '}
                            <span className="text-slate-900">{pageMeta.total}</span> groups
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                                        onClick={() => handlePageChange(page)}
                                        className={`h-8 min-w-[32px] rounded-lg text-xs font-bold transition-all ${
                                            page === currentPage
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ) : null}
            </motion.section>
        </AdminLayout>
    );
};

export default MonitoringGroupsPage;
