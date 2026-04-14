import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Filter, FolderOpen, Eye } from 'lucide-react';
import React from 'react';

import DeanLayout from './_layout';

type ProjectRow = {
    id: number;
    group_name: string;
    title: string;
    program_set_id?: number | null;
    program_set_name?: string | null;
    program?: string | null;
    adviser_name?: string | null;
    instructor_name?: string | null;
    leader_name?: string | null;
    members_count?: number;
    approved_at?: string | null;
};

type ProgramSetOption = {
    id: number;
    name: string;
};

type DeanProjectsPageProps = {
    projects?: ProjectRow[];
    programSetOptions?: ProgramSetOption[];
    instructorOptions?: string[];
    adviserOptions?: string[];
};

const DeanProjects = () => {
    const page = usePage<DeanProjectsPageProps>();
    const { props } = page;
    const projects = React.useMemo(() => props.projects ?? [], [props.projects]);
    const programSetOptions = React.useMemo(() => props.programSetOptions ?? [], [props.programSetOptions]);
    const instructorOptions = React.useMemo(() => props.instructorOptions ?? [], [props.instructorOptions]);
    const adviserOptions = React.useMemo(() => props.adviserOptions ?? [], [props.adviserOptions]);
    const [selectedProgramSet, setSelectedProgramSet] = React.useState('All');
    const [selectedInstructor, setSelectedInstructor] = React.useState('All');
    const [selectedAdviser, setSelectedAdviser] = React.useState('All');
    const [searchKeyword, setSearchKeyword] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    React.useEffect(() => {
        if (selectedProgramSet !== 'All' && !programSetOptions.some((option) => String(option.id) === selectedProgramSet)) {
            setSelectedProgramSet('All');
        }
    }, [programSetOptions, selectedProgramSet]);

    React.useEffect(() => {
        if (selectedInstructor !== 'All' && !instructorOptions.includes(selectedInstructor)) {
            setSelectedInstructor('All');
        }
    }, [instructorOptions, selectedInstructor]);

    React.useEffect(() => {
        if (selectedAdviser !== 'All' && !adviserOptions.includes(selectedAdviser)) {
            setSelectedAdviser('All');
        }
    }, [adviserOptions, selectedAdviser]);

    const filteredProjects = React.useMemo(() => {
        const search = searchKeyword.trim().toLowerCase();

        return projects.filter((project) => {
            const matchesProgramSet = selectedProgramSet === 'All' || String(project.program_set_id ?? '') === selectedProgramSet;
            const matchesInstructor = selectedInstructor === 'All' || (project.instructor_name ?? '') === selectedInstructor;
            const matchesAdviser = selectedAdviser === 'All' || (project.adviser_name ?? '') === selectedAdviser;
            const matchesSearch =
                search === '' ||
                project.title.toLowerCase().includes(search) ||
                project.group_name.toLowerCase().includes(search) ||
                (project.program_set_name ?? '').toLowerCase().includes(search) ||
                (project.instructor_name ?? '').toLowerCase().includes(search) ||
                (project.adviser_name ?? '').toLowerCase().includes(search);

            return matchesProgramSet && matchesInstructor && matchesAdviser && matchesSearch;
        });
    }, [projects, selectedProgramSet, selectedInstructor, selectedAdviser, searchKeyword]);

    const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage((pageNumber) => Math.min(pageNumber, totalPages));
    }, [totalPages]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedProgramSet, selectedInstructor, selectedAdviser, searchKeyword]);

    const paginatedProjects = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;

        return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProjects, currentPage]);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    return (
        <DeanLayout title="Capstone Projects" subtitle="Approved concept titles from BSIT and BSIS groups">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/dean/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Projects
                    </span>
                </nav>

                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                        value={searchKeyword}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                        placeholder="Search title, group, set, adviser, instructor..."
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:min-w-[280px]"
                    />
                    <div className="relative">
                        <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedProgramSet}
                            onChange={(event) => setSelectedProgramSet(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="All">All Program Sets</option>
                            {programSetOptions.map((programSetOption) => (
                                <option key={programSetOption.id} value={String(programSetOption.id)}>
                                    {programSetOption.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedInstructor}
                            onChange={(event) => setSelectedInstructor(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="All">All Instructors</option>
                            {instructorOptions.map((instructorName) => (
                                <option key={instructorName} value={instructorName}>
                                    {instructorName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedAdviser}
                            onChange={(event) => setSelectedAdviser(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="All">All Advisers</option>
                            {adviserOptions.map((adviserName) => (
                                <option key={adviserName} value={adviserName}>
                                    {adviserName}
                                </option>
                            ))}
                        </select>
                    </div>

                    
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Group</th>
                                    <th className="px-6 py-4">Program</th>
                                    <th className="px-6 py-4">Program Set</th>
                                    <th className="px-6 py-4">Adviser</th>
                                    <th className="px-6 py-4">Instructor</th>
                                    <th className="px-6 py-4 text-center">Members</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedProjects.map((project, index) => (
                                    <tr key={project.id} className={`transition-colors hover:bg-emerald-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{project.title}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{project.group_name}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{project.program || '—'}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{project.program_set_name || 'Unassigned Set'}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{project.adviser_name || 'Unassigned'}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{project.instructor_name || 'Unassigned'}</td>
                                        <td className="px-6 py-3.5 text-center font-semibold text-slate-800">{project.members_count ?? 0}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <Link
                                                href={`/dean/project-details?group=${project.id}`}
                                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                                            >
                                                <Eye className="h-3 w-3" />
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-xs text-slate-500">
                            <FolderOpen className="h-8 w-8 text-slate-300" />
                            No approved concept titles found for the selected filters.
                        </div>
                    ) : null}
                </div>

                {filteredProjects.length > 0 ? (
                    <div className="flex flex-col items-center justify-between gap-4 px-1 pb-2 md:flex-row">
                        <p className="text-xs font-medium text-slate-500">
                            Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
                        </p>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((pageNumber) => Math.max(1, pageNumber - 1))}
                                disabled={currentPage === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronRight size={16} className="rotate-180" />
                            </button>

                            <div className="flex items-center gap-1">
                                {pages.map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`h-8 min-w-[32px] rounded-lg text-xs font-bold transition-all ${
                                            pageNumber === currentPage
                                                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentPage((pageNumber) => Math.min(totalPages, pageNumber + 1))}
                                disabled={currentPage === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ) : null}
            </motion.section>
        </DeanLayout>
    );
};

export default DeanProjects;
