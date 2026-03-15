import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, LayoutGrid, List, Search, SlidersHorizontal, UserCheck, Users } from 'lucide-react';
import React from 'react';
import AdviserGroupsModal from '../../components/Instructor/adviser/AdviserGroupsModal';
import instructorRoutes from '../../routes/instructor';
import adviserAssignment from '../../routes/instructor/adviser-assignment';
import InstructorLayout from './_layout';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type AdviserWorkload = {
    academic_year: string;
    groups_count: number;
};

type AdviserRow = {
    id: number;
    name: string;
    email: string;
    workloads?: AdviserWorkload[];
};

type AdviserAssignmentPageProps = {
    advisers?: AdviserRow[];
    academicYears?: AcademicYearOption[];
};

const MAX_LOAD = 5;

const AdviserAssignmentPage = ({ advisers = [], academicYears = [] }: AdviserAssignmentPageProps) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const currentAcademicYear = academicYears.find((year) => year.is_current)?.label ?? academicYears[0]?.label ?? 'All';
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(currentAcademicYear || 'All');
    const [viewMode, setViewMode] = React.useState<'card' | 'list'>('card');
    const [selectedAdviser, setSelectedAdviser] = React.useState<AdviserRow | null>(null);
    const [isGroupsModalOpen, setIsGroupsModalOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'available' | 'partial' | 'full'>('all');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 9;

    const academicYearOptions = React.useMemo(() => {
        const years = academicYears.map((year) => year.label);
        return ['All', ...years];
    }, [academicYears]);

    const getLoadForYear = React.useCallback(
        (adviser: AdviserRow, academicYear: string): number => {
            const workloads = adviser.workloads ?? [];

            if (academicYear === 'All') {
                return workloads.reduce((total, item) => total + (item.groups_count ?? 0), 0);
            }

            return workloads.find((item) => item.academic_year === academicYear)?.groups_count ?? 0;
        },
        [],
    );

    const getStatusMeta = (load: number) => {
        const isFull = load >= MAX_LOAD;
        const status = isFull ? 'Full' : load >= MAX_LOAD - 1 ? 'Partial' : 'Available';
        const statusClasses = isFull
            ? 'bg-rose-100 text-rose-700'
            : status === 'Partial'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-emerald-100 text-emerald-700';

        return { status, statusClasses, isFull };
    };

    const filteredAdvisers = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        const isAllYears = selectedAcademicYear === 'All';

        return advisers.filter((adviser) => {
            const matchesSearch =
                !query || adviser.name.toLowerCase().includes(query) || adviser.email.toLowerCase().includes(query);

            if (!matchesSearch) {
                return false;
            }

            if (isAllYears || statusFilter === 'all') {
                return true;
            }

            const load = getLoadForYear(adviser, selectedAcademicYear);
            const { status } = getStatusMeta(load);
            const normalizedStatus = status.toLowerCase();

            return normalizedStatus === statusFilter;
        });
    }, [advisers, searchTerm, selectedAcademicYear, statusFilter, getLoadForYear]);

    const totalPages = Math.max(1, Math.ceil(filteredAdvisers.length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    const paginatedAdvisers = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAdvisers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAdvisers, currentPage]);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedAcademicYear, statusFilter]);

    React.useEffect(() => {
        if (selectedAcademicYear === 'All') {
            setStatusFilter('all');
        }
    }, [selectedAcademicYear]);

    return (
        <InstructorLayout title="Adviser Assignment" subtitle="Assign and manage adviser workloads by academic year">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link
                        href={instructorRoutes.dashboard.url()}
                        className="font-medium text-slate-600 transition-colors hover:text-slate-900"
                    >
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Adviser Assignment
                    </span>
                </nav>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search adviser name or email..."
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
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'available' | 'partial' | 'full')}
                                disabled={selectedAcademicYear === 'All'}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                <option value="all">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="partial">Partial</option>
                                <option value="full">Full</option>
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
                        {paginatedAdvisers.map((adviser) => {
                            const isAllYears = selectedAcademicYear === 'All';
                            const load = getLoadForYear(adviser, selectedAcademicYear);
                            const progress = isAllYears ? 100 : Math.min(100, Math.round((load / MAX_LOAD) * 100));
                            const { status, statusClasses } = isAllYears
                                ? { status: 'Summary', statusClasses: 'bg-slate-100 text-slate-600' }
                                : getStatusMeta(load);
                            const assignHref = adviserAssignment.manage.url(
                                { adviser: adviser.id },
                                selectedAcademicYear === 'All' ? undefined : { query: { academic_year: selectedAcademicYear } },
                            );

                            return (
                                <div
                                    key={adviser.id}
                                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex-1 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-green-600">
                                                    {adviser.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500">{adviser.email}</p>
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>
                                                {status}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-1 text-xs text-slate-600">
                                            <p className="font-semibold text-slate-700">
                                                Load ({selectedAcademicYear}): {load}
                                                {isAllYears ? '' : ` / ${MAX_LOAD}`}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {isAllYears ? 'Select an academic year to see the per-year limit.' : 'Limit resets per academic year.'}
                                            </p>
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
                                                    setSelectedAdviser(adviser);
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
                                        <div
                                            className={`h-full rounded-full ${isAllYears ? 'bg-slate-300' : 'bg-emerald-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {filteredAdvisers.length === 0 ? (
                            <div className="col-span-full rounded-xl border border-slate-200 bg-white py-12 text-center text-xs text-slate-500">
                                No advisers match your search.
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Adviser</th>
                                    <th className="px-6 py-4">Load</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedAdvisers.map((adviser) => {
                                    const isAllYears = selectedAcademicYear === 'All';
                                    const load = getLoadForYear(adviser, selectedAcademicYear);
                                    const progress = isAllYears ? 100 : Math.min(100, Math.round((load / MAX_LOAD) * 100));
                                    const { status, statusClasses } = isAllYears
                                        ? { status: 'Summary', statusClasses: 'bg-slate-100 text-slate-600' }
                                        : getStatusMeta(load);
                                    const assignHref = adviserAssignment.manage.url(
                                        { adviser: adviser.id },
                                        selectedAcademicYear === 'All' ? undefined : { query: { academic_year: selectedAcademicYear } },
                                    );

                                    return (
                                        <tr key={adviser.id} className="transition-colors hover:bg-green-50/30">
                                            <td className="px-6 py-3.5">
                                                <div>
                                                    <div className="font-semibold text-slate-800">{adviser.name}</div>
                                                    <div className="text-[10px] text-slate-500">{adviser.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                                    <span>
                                                        {load}
                                                        {isAllYears ? '' : ` / ${MAX_LOAD}`}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">{selectedAcademicYear}</span>
                                                </div>
                                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full ${isAllYears ? 'bg-slate-300' : 'bg-emerald-500'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <Link
                                                    href={assignHref}
                                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                                >
                                                    <UserCheck className="h-3 w-3" />
                                                    Assign
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedAdviser(adviser);
                                                        setIsGroupsModalOpen(true);
                                                    }}
                                                    className="ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                >
                                                    <Users className="h-3 w-3" />
                                                    View Groups
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredAdvisers.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-500">No advisers match your search.</div>
                        ) : null}
                    </div>
                )}

                {filteredAdvisers.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-medium text-slate-500">
                        Showing {paginatedAdvisers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredAdvisers.length)} of {filteredAdvisers.length} advisers
                    </motion.div>
                )}

                {filteredAdvisers.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-4 px-1 pb-2 md:flex-row">
                        <p className="text-xs font-medium text-slate-500">
                            Page <span className="text-slate-900">{currentPage}</span> of{' '}
                            <span className="text-slate-900">{totalPages}</span>
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
            </motion.section>

            <AdviserGroupsModal
                open={isGroupsModalOpen}
                adviserId={selectedAdviser?.id ?? null}
                adviserName={selectedAdviser?.name ?? null}
                academicYear={selectedAcademicYear}
                onClose={() => {
                    setIsGroupsModalOpen(false);
                    setSelectedAdviser(null);
                }}
            />
        </InstructorLayout>
    );
};

const AdviserAssignmentPageWrapper = () => {
    const { props } = usePage<AdviserAssignmentPageProps>();

    return <AdviserAssignmentPage advisers={props.advisers ?? []} academicYears={props.academicYears ?? []} />;
};

export default AdviserAssignmentPageWrapper;
