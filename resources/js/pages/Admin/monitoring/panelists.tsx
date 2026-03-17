import { Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Search, Users } from 'lucide-react';
import React from 'react';
import AdminLayout from '../_layout';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type PanelistWorkload = {
    academic_year: string;
    groups_count: number;
};

type PanelistRow = {
    id: number;
    name: string;
    email: string;
    workloads?: PanelistWorkload[];
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type MonitoringPanelistsProps = {
    panelists?: PanelistRow[];
    academicYears?: AcademicYearOption[];
    filters?: {
        search?: string;
    };
    pagination?: PaginationMeta;
};

const MAX_LOAD = 5;

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

const MonitoringPanelistsPage = ({ panelists = [], academicYears = [], filters, pagination }: MonitoringPanelistsProps) => {
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const currentAcademicYear = academicYears.find((year) => year.is_current)?.label ?? academicYears[0]?.label ?? 'All';
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(currentAcademicYear || 'All');

    React.useEffect(() => {
        setSearchTerm(filters?.search ?? '');
    }, [filters?.search]);

    const academicYearOptions = React.useMemo(() => {
        const years = academicYears.map((year) => year.label);
        return ['All', ...years];
    }, [academicYears]);

    const getLoadForYear = React.useCallback((panelist: PanelistRow, academicYear: string): number => {
        const workloads = panelist.workloads ?? [];

        if (academicYear === 'All') {
            return workloads.reduce((total, item) => total + (item.groups_count ?? 0), 0);
        }

        return workloads.find((item) => item.academic_year === academicYear)?.groups_count ?? 0;
    }, []);

    const getStatusMeta = (load: number) => {
        const isFull = load >= MAX_LOAD;
        const status = isFull ? 'Full' : load >= MAX_LOAD - 1 ? 'Partial' : 'Available';
        const statusClasses = isFull
            ? 'bg-rose-100 text-rose-700'
            : status === 'Partial'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700';

        return { status, statusClasses };
    };

    const pageMeta: PaginationMeta = pagination ?? { current_page: 1, last_page: 1, per_page: 10, total: panelists.length };
    const totalPages = Math.max(1, pageMeta.last_page || 1);
    const currentPage = Math.min(pageMeta.current_page || 1, totalPages);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    const syncFilters = (overrides: { search?: string; page?: number }) => {
        router.get(
            '/admin/monitoring/panelists',
            buildQuery({
                search: overrides.search ?? searchTerm,
                page: overrides.page ?? 1,
            }),
            { preserveState: true, replace: true },
        );
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        syncFilters({ search: value, page: 1 });
    };

    const handlePageChange = (page: number) => {
        syncFilters({ page });
    };

    const startItem = pageMeta.total === 0 ? 0 : (currentPage - 1) * pageMeta.per_page + 1;
    const endItem = Math.min(currentPage * pageMeta.per_page, pageMeta.total);

    return (
        <AdminLayout title="Panelist Monitoring" subtitle="Review panelist assignments and coverage">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/admin/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Panelists
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
                                onChange={(event) => handleSearchChange(event.target.value)}
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
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Panelist</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4 text-center">Groups</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {panelists.map((panelist, index) => {
                                const load = getLoadForYear(panelist, selectedAcademicYear);
                                const { status, statusClasses } = getStatusMeta(load);

                                return (
                                    <tr
                                        key={panelist.id}
                                        className={`transition-colors hover:bg-emerald-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                    >
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{panelist.name}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{panelist.email}</td>
                                        <td className="px-6 py-3.5 text-center font-semibold text-slate-800">{load}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusClasses}`}>
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {panelists.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-xs text-slate-500">
                            <Users className="h-8 w-8 text-slate-300" />
                            No panelists found for the selected filters.
                        </div>
                    ) : null}
                </div>

                {pageMeta.total > 0 ? (
                    <div className="flex flex-col items-center justify-between gap-4 px-1 pb-2 md:flex-row">
                        <p className="text-xs font-medium text-slate-500">
                            Showing <span className="text-slate-900">{startItem}</span> to <span className="text-slate-900">{endItem}</span> of{' '}
                            <span className="text-slate-900">{pageMeta.total}</span> panelists
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

export default MonitoringPanelistsPage;
