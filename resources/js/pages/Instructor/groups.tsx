import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Calendar,
    ChevronRight,
    Filter,
    GraduationCap,
    LayoutGrid,
    List,
    Search,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import InstructorLayout from './_layout';

type ProgramSetSummary = {
    id: number;
    name: string;
    program: string;
    school_year: string;
    students_count?: number;
    groups_count?: number;
};

const InstructorGroups = () => {
    const { props } = usePage<any>();
    const programSets = (props.programSets ?? []) as ProgramSetSummary[];

    const groupSets = programSets.map((ps) => ({
        id: ps.id,
        name: ps.name ?? `${ps.program} ${ps.school_year}`,
        program: ps.program,
        schoolYear: ps.school_year,
        totalStudents: ps.students_count ?? 0,
        totalGroups: ps.groups_count ?? 0,
        description:
            ps.program === 'BSIT'
                ? 'Information Technology Capstone Groups'
                : ps.program === 'BSIS'
                ? 'Information System Capstone Groups'
                : '',
    }));

    const schoolYearOptions = Array.from(new Set(programSets.map((ps) => ps.school_year).filter(Boolean)));
    const schoolYears = ['All', ...schoolYearOptions];
    const programs = ['All', 'BSIT', 'BSIS'];

    const [selectedSchoolYear, setSelectedSchoolYear] = useState('All');
    const [selectedProgram, setSelectedProgram] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const filteredSets = groupSets.filter((set) => {
        const matchesYear = selectedSchoolYear === 'All' || set.schoolYear === selectedSchoolYear;
        const matchesProgram = selectedProgram === 'All' || set.program === selectedProgram;
        const matchesSearch =
            set.name.toLowerCase().includes(searchTerm.toLowerCase()) || set.program.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesYear && matchesProgram && matchesSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredSets.length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    const paginatedSets = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSets.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSets, currentPage]);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSchoolYear, selectedProgram]);

    return (
        <InstructorLayout title="Groups Management" subtitle="Organize capstone groups by program set">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
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
                                placeholder="Search program set..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 md:w-56"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedSchoolYear}
                                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                {schoolYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year === 'All' ? 'All Years' : year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <ChevronRight size={12} className="rotate-90" />
                            </div>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                {programs.map((program) => (
                                    <option key={program} value={program}>
                                        {program === 'All' ? 'All Programs' : program}
                                    </option>
                                ))}
                            </select>
                        </div>                        

                        <button
                            type="button"
                            onClick={() => {
                                setSelectedSchoolYear('All');
                                setSelectedProgram('All');
                                setSearchTerm('');
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                        >
                            Clear Filters
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                    viewMode === 'card' ? 'bg-green-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                    viewMode === 'list' ? 'bg-green-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
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
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {paginatedSets.map((set, idx) => (
                            <motion.div
                                key={set.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="p-5">
                                    <div className="mb-3">
                                        <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-green-600">
                                            {set.name}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-600">{set.description}</p>
                                    </div>

                                    <div className="mb-3 space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            <span className="font-medium">{set.program}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{set.schoolYear}</span>
                                        </div>
                                    </div>

                                    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-2">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">{set.totalStudents}</div>
                                            <div className="text-[10px] text-slate-600">Students</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">{set.totalGroups}</div>
                                            <div className="text-[10px] text-slate-600">Groups</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/instructor/groups/${set.id}/manage`}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-green-800 active:scale-95"
                                        >
                                            <Users className="h-3 w-3" />
                                            Groups
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Set Name</th>
                                    <th className="px-6 py-4">School Year</th>
                                    <th className="px-6 py-4">Students</th>
                                    <th className="px-6 py-4">Groups</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedSets.map((set, index) => (
                                    <tr
                                        key={set.id}
                                        className={`transition-colors hover:bg-green-50/30 ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                        }`}
                                    >
                                        <td className="px-6 py-3.5">
                                            <div>
                                                <div className="font-semibold text-slate-800">{set.name}</div>
                                                <div className="text-[10px] text-slate-500">{set.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">{set.schoolYear}</td>
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{set.totalStudents}</td>
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{set.totalGroups}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <Link
                                                href={`/instructor/groups/${set.id}/manage`}
                                                className="inline-flex items-center gap-1 rounded-md bg-green-700 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-green-800 active:scale-95"
                                            >
                                                <Users className="h-3 w-3" />
                                                Groups
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredSets.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-sm font-medium text-slate-400">No program sets found for the current filters.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'card' && paginatedSets.length === 0 && filteredSets.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm"
                    >
                        <Users className="mb-3 h-8 w-8 text-slate-400" />
                        <h3 className="mb-2 text-sm font-semibold text-slate-800">No program sets found</h3>
                        <p className="mb-4 text-xs text-slate-600">Create a program set to start building groups.</p>
                    </motion.div>
                )}

                {filteredSets.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-medium text-slate-500">
                        Showing {paginatedSets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredSets.length)} of {filteredSets.length} program sets
                    </motion.div>
                )}

                {filteredSets.length > 0 && (
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
        </InstructorLayout>
    );
};

export default InstructorGroups;
