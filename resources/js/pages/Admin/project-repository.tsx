import { motion } from 'framer-motion';
import { Calendar, ChevronRight, ExternalLink, FileText, Filter, FolderArchive, Search } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import React from 'react';
import AdminLayout from './_layout';

type ProjectRepositoryRow = {
    id: number;
    title: string;
    academicYear: string;
    status: 'Archived' | 'Approved';
    dateAdded: string;
};

type AdminProjectRepositoryProps = {
    projects?: ProjectRepositoryRow[];
};

const AdminProjectRepository = () => {
    const { props } = usePage<AdminProjectRepositoryProps>();
    const projects = props.projects ?? [];
    const [search, setSearch] = React.useState('');
    const [selectedYear, setSelectedYear] = React.useState('all');
    const [currentPage, setCurrentPage] = React.useState(1);
    const projectsPerPage = 10;

    const academicYearOptions = React.useMemo(() => {
        return Array.from(new Set(projects.map((project) => project.academicYear))).filter((year) => year.trim() !== '');
    }, [projects]);

    const filteredProjects = React.useMemo(() => {
        const query = search.trim().toLowerCase();

        return projects.filter((project) => {
            const matchesQuery = query === '' || project.title.toLowerCase().includes(query);
            const matchesYear = selectedYear === 'all' || project.academicYear === selectedYear;

            return matchesQuery && matchesYear;
        });
    }, [projects, search, selectedYear]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedYear]);

    const totalPages = Math.max(1, Math.ceil(filteredProjects.length / projectsPerPage));

    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    const paginatedProjects = React.useMemo(() => {
        const startIndex = (currentPage - 1) * projectsPerPage;

        return filteredProjects.slice(startIndex, startIndex + projectsPerPage);
    }, [filteredProjects, currentPage]);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 3;
        const startPage = Math.max(1, Math.min(currentPage - 1, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    return (
        <AdminLayout title="Project Repository" subtitle="Centralized archive of finalized capstone project records">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/admin/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Project Repository
                    </span>
                </nav>

                {/* Action Bar - Matching Faculty.tsx design scale */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search titles..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 md:w-80"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedYear}
                                onChange={(event) => setSelectedYear(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs capitalize shadow-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10"
                            >
                                <option value="all">All Years</option>
                                {academicYearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="/admin/project-repository/export"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                        >
                            <FolderArchive className="h-3.5 w-3.5" />
                            Export Archive
                        </a>
                    </div>
                </div>

                {/* Project Table - Matching Striped Table scale */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Capstone Title</th>
                                <th className="px-6 py-4">Authors / Group Members</th>
                                <th className="px-6 py-4">Adviser</th>
                                <th className="px-6 py-4">AY / Term</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedProjects.map((project, index) => (
                                <tr
                                    key={project.id}
                                    className={`transition-colors hover:bg-green-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                                >
                                    <td className="max-w-xs px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 rounded bg-green-100 p-1.5 text-green-700">
                                                <FileText size={14} />
                                            </div>
                                            <span className="leading-relaxed font-semibold text-slate-800">{project.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">—</td>
                                    <td className="px-6 py-4 text-slate-400">—</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                            <Calendar size={10} />
                                            {project.academicYear}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700">
                                            <ExternalLink className="h-3 w-3" />
                                            View Records
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                                        No title repository records available yet.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>

                {filteredProjects.length > 0 ? (
                    <div className="flex flex-col items-center justify-between gap-4 px-1 pb-2 md:flex-row">
                        <p className="text-xs font-medium text-slate-500">
                            Showing <span className="text-slate-900">{(currentPage - 1) * projectsPerPage + 1}</span> to{' '}
                            <span className="text-slate-900">{Math.min(currentPage * projectsPerPage, filteredProjects.length)}</span> of{' '}
                            <span className="text-slate-900">{filteredProjects.length}</span> records
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((previousPage) => Math.max(1, previousPage - 1))}
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
                                onClick={() => setCurrentPage((previousPage) => Math.min(totalPages, previousPage + 1))}
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

export default AdminProjectRepository;
