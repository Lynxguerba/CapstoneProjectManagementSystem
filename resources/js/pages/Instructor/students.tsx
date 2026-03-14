import { motion } from 'framer-motion';
import {
    ChevronRight,
    Filter,
    Search,
    Settings,
    Upload,
    Plus,
    Eye,
    Edit3,
    Users,
    Calendar,
    GraduationCap,
    List,
    LayoutGrid,
} from 'lucide-react';
import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import AddProgramSetModal from '../../components/Instructor/ProgramSetModal';
import InstructorLayout from './_layout';

const InstructorStudents = () => {
    const { props } = usePage<any>();
    const programSets = (props.programSets ?? []) as {
        id: number;
        name: string;
        program: string;
        school_year: string;
        instructor_name?: string;
    }[];

    // Academic years from backend (same as ProgramSetModal)
    const academicYears = (props.academicYears ?? []) as { id: number; label: string; is_current: boolean }[];

    // Get current academic year label (fallback to first available or empty)
    const currentAcademicYear = academicYears.find((ay) => ay.is_current)?.label ?? academicYears[0]?.label ?? '';

    // Map program sets from server into the client shape used below
    const studentSets = programSets.map((ps) => ({
        id: ps.id,
        name: ps.name ?? `${ps.program} ${ps.school_year}`,
        program: ps.program,
        schoolYear: ps.school_year,
        totalStudents: 0,
        groups: 0,
        status: 'Active',
        description:
            ps.program === 'BSIT'
                ? 'Information Technology Capstone Projects'
                : ps.program === 'BSIS'
                ? 'Information System Capstone Projects'
                : '',
    }));

    // Filter states - default to current academic year instead of 'All'
    const [selectedSchoolYear, setSelectedSchoolYear] = useState(currentAcademicYear || 'All');
    const [selectedProgram, setSelectedProgram] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddProgramSetModalOpen, setIsAddProgramSetModalOpen] = useState(false);
    const itemsPerPage = 6;

    // Filter options - build from academic years data
    const schoolYears = ['All', ...academicYears.map((ay) => ay.label)];
    const programs = ['All', 'BSIT', 'BSIS'];

    // Filter the student sets
    const filteredSets = studentSets.filter((set) => {
        const matchesYear = selectedSchoolYear === 'All' || set.schoolYear === selectedSchoolYear;
        const matchesProgram = selectedProgram === 'All' || set.program === selectedProgram;
        const matchesSearch =
            set.name.toLowerCase().includes(searchTerm.toLowerCase()) || set.program.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesYear && matchesProgram && matchesSearch;
    });

    // Pagination logic
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

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSchoolYear, selectedProgram]);

    return (
        <InstructorLayout title="Students Management" subtitle="Manage student records by program">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                {/* Action Bar */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedSchoolYear}
                                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                {schoolYears.map((year) => {
                                    const isCurrent = academicYears.find((ay) => ay.label === year)?.is_current;
                                    return (
                                        <option key={year} value={year}>
                                            {year === 'All' ? 'All Years' : `${year}${isCurrent ? ' (current)' : ''}`}
                                        </option>
                                    );
                                })}
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
                                {programs.map((program) => {
                                    let displayText;
                                    if (program === 'All') {
                                        displayText = 'All Programs';
                                    } else {
                                        displayText = program;
                                    }
                                    return (
                                        <option key={program} value={program}>
                                            {displayText}
                                        </option>
                                    );
                                })}
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
                        {/* Grid Layout Controller */}
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

                        <button
                            type="button"
                            onClick={() => setIsAddProgramSetModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-800 active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Program/Set
                        </button>
                    </div>
                </div>

                {/* Student Sets Display */}
                {viewMode === 'card' ? (
                    /* Card View */
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
                                    {/* Header */}
                                    <div className="mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-green-600">
                                                {set.name}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-600">{set.description}</p>
                                        </div>
                                    </div>

                                    {/* Program Info */}
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

                                    {/* Stats */}
                                    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-2">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">{set.totalStudents}</div>
                                            <div className="text-[10px] text-slate-600">Students</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">{set.groups}</div>
                                            <div className="text-[10px] text-slate-600">Groups</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700">
                                            <Eye className="h-3 w-3" />
                                            View
                                        </button>
                                        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-green-800 active:scale-95">
                                            <Edit3 className="h-3 w-3" />
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    /* List View */
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
                                        className={`transition-colors hover:bg-green-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                    >
                                        <td className="px-6 py-3.5">
                                            <div>
                                                    <div className="font-semibold text-slate-800">{set.name}</div>
                                                <div className="text-[10px] text-slate-500">{set.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">{set.schoolYear}</td>
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{set.totalStudents}</td>
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{set.groups}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700">
                                                    <Eye className="h-3 w-3" />
                                                    View
                                                </button>
                                                <button className="inline-flex items-center gap-1 rounded-md bg-green-700 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-green-800 active:scale-95">
                                                    <Edit3 className="h-3 w-3" />
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredSets.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-sm font-medium text-slate-400">No student sets found for the current filters.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State for Card View */}
                {viewMode === 'card' && paginatedSets.length === 0 && filteredSets.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm"
                    >
                        <Users className="mb-3 h-8 w-8 text-slate-400" />
                        <h3 className="mb-2 text-sm font-semibold text-slate-800">No student sets found</h3>
                        <p className="mb-4 text-xs text-slate-600">Try adjusting your filters or create a new program set.</p>
                        <button
                            type="button"
                            onClick={() => setIsAddProgramSetModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-800 active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Program/Set
                        </button>
                    </motion.div>
                )}

                {/* Results Summary */}
                {filteredSets.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-medium text-slate-500">
                        Showing {paginatedSets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredSets.length)} of {filteredSets.length} student sets
                    </motion.div>
                )}

                {/* Pagination */}
                {filteredSets.length > 0 && (
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
            </motion.section>
            <AddProgramSetModal open={isAddProgramSetModalOpen} onClose={() => setIsAddProgramSetModalOpen(false)} />
        </InstructorLayout>
    );
};

export default InstructorStudents;
