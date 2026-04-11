import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Eye, Filter, Users } from 'lucide-react';
import React from 'react';

import ProgramChairpersonLayout from './_layout';

type GroupRow = {
    id: number;
    name: string;
    program_set_id?: number | null;
    program_set_name?: string | null;
    adviser_name?: string | null;
    instructor_name?: string | null;
    leader_name?: string | null;
    members_count?: number;
};

type ProgramSetOption = {
    id: number;
    name: string;
};

type ProgramChairConceptTitlesProps = {
    groups?: GroupRow[];
    programSetOptions?: ProgramSetOption[];
    instructorOptions?: string[];
    adviserOptions?: string[];
    assignedProgram?: string | null;
};

const ProgramChairpersonConceptTitlesPage = () => {
    const page = usePage<ProgramChairConceptTitlesProps>();
    const { props } = page;
    const groups = props.groups ?? [];
    const programSetOptions = props.programSetOptions ?? [];
    const instructorOptions = props.instructorOptions ?? [];
    const adviserOptions = props.adviserOptions ?? [];
    const assignedProgram = typeof props.assignedProgram === 'string' && props.assignedProgram !== '' ? props.assignedProgram : null;
    const [selectedProgramSet, setSelectedProgramSet] = React.useState('All');
    const [selectedInstructor, setSelectedInstructor] = React.useState('All');
    const [selectedAdviser, setSelectedAdviser] = React.useState('All');
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

    const filteredGroups = React.useMemo(() => {
        return groups.filter((group) => {
            const matchesProgramSet = selectedProgramSet === 'All' || String(group.program_set_id ?? '') === selectedProgramSet;
            const matchesInstructor = selectedInstructor === 'All' || (group.instructor_name ?? '') === selectedInstructor;
            const matchesAdviser = selectedAdviser === 'All' || (group.adviser_name ?? '') === selectedAdviser;

            return matchesProgramSet && matchesInstructor && matchesAdviser;
        });
    }, [groups, selectedProgramSet, selectedInstructor, selectedAdviser]);

    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedProgramSet, selectedInstructor, selectedAdviser]);

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
        <ProgramChairpersonLayout title="Concept Titles" subtitle="List of groups for your assigned program">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/program_chairperson/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Concept Titles
                    </span>
                </nav>

                <div className="">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
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
                                    {instructorOptions.map((instructorName) => (
                                        <option key={instructorName} value={instructorName}>
                                            {instructorName === 'All' ? 'All Instructors' : instructorName}
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
                    </div>
                </div>

                {assignedProgram === null ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-amber-900">Program assignment is required.</h3>
                        <p className="mt-2 text-sm text-amber-800">
                            No `program` is assigned to this Program Chairperson account yet. Ask an administrator to assign `BSIT` or `BSIS`.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Group</th>
                                        <th className="px-6 py-4">Program Set</th>
                                        <th className="px-6 py-4">Adviser</th>
                                        <th className="px-6 py-4">Instructor</th>
                                        <th className="px-6 py-4">Leader</th>
                                        <th className="px-6 py-4 text-center">Members</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedGroups.map((group, index) => (
                                        <tr
                                            key={group.id}
                                            className={`transition-colors hover:bg-emerald-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                        >
                                            <td className="px-6 py-3.5 font-semibold text-slate-800">{group.name}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{group.program_set_name || 'Unassigned Set'}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{group.adviser_name || 'Unassigned'}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{group.instructor_name || 'Unassigned'}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{group.leader_name || '—'}</td>
                                            <td className="px-6 py-3.5 text-center font-semibold text-slate-800">{group.members_count ?? 0}</td>
                                            <td className="px-6 py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => alert('UI only: view and manage group details')}
                                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    View & Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-xs text-slate-500">
                                <Users className="h-8 w-8 text-slate-300" />
                                No groups found for the selected filters.
                            </div>
                        ) : null}
                    </div>
                )}

                {filteredGroups.length > 0 ? (
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
                ) : null}
            </motion.section>
        </ProgramChairpersonLayout>
    );
};

export default ProgramChairpersonConceptTitlesPage;
