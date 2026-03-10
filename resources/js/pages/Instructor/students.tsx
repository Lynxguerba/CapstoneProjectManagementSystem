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
    BookOpen,
    GraduationCap,
    Grid3X3,
    List,
    LayoutGrid
} from 'lucide-react';
import React, { useState } from 'react';
import InstructorLayout from './_layout';

const InstructorStudents = () => {
    // Sample data for student sets/programs
    const studentSets = [
        {
            id: 1,
            name: 'BSIT Capstone 2025-2026',
            program: 'Bachelor of Science in Information Technology',
            schoolYear: '2025-2026',
            setNumber: 'Set A',
            totalStudents: 45,
            groups: 9,
            status: 'Active',
            description: 'Information Technology Capstone Projects'
        },
        {
            id: 2,
            name: 'BSIS Capstone 2025-2026',
            program: 'Bachelor of Science in Information Systems',
            schoolYear: '2025-2026',
            setNumber: 'Set B',
            totalStudents: 38,
            groups: 8,
            status: 'Active',
            description: 'Information Systems Capstone Projects'
        },
        {
            id: 3,
            name: 'BSIT Capstone 2024-2025',
            program: 'Bachelor of Science in Information Technology',
            schoolYear: '2024-2025',
            setNumber: 'Set A',
            totalStudents: 42,
            groups: 8,
            status: 'Completed',
            description: 'Information Technology Capstone Projects'
        },
        {
            id: 4,
            name: 'BSIS Capstone 2024-2025',
            program: 'Bachelor of Science in Information Systems',
            schoolYear: '2024-2025',
            setNumber: 'Set B',
            totalStudents: 35,
            groups: 7,
            status: 'Completed',
            description: 'Information Systems Capstone Projects'
        },
        {
            id: 5,
            name: 'BSIT Capstone 2023-2024',
            program: 'Bachelor of Science in Information Technology',
            schoolYear: '2023-2024',
            setNumber: 'Set A',
            totalStudents: 48,
            groups: 10,
            status: 'Completed',
            description: 'Information Technology Capstone Projects'
        },
        {
            id: 6,
            name: 'BSIS Capstone 2023-2024',
            program: 'Bachelor of Science in Information Systems',
            schoolYear: '2023-2024',
            setNumber: 'Set B',
            totalStudents: 41,
            groups: 8,
            status: 'Completed',
            description: 'Information Systems Capstone Projects'
        }
    ];

    // Filter states
    const [selectedSchoolYear, setSelectedSchoolYear] = useState('All');
    const [selectedSet, setSelectedSet] = useState('All');
    const [selectedProgram, setSelectedProgram] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Filter options
    const schoolYears = ['All', '2025-2026', '2024-2025', '2023-2024'];
    const sets = ['All', 'Set A', 'Set B', 'Set C'];
    const programs = [
        'All',
        'Bachelor of Science in Information Technology',
        'Bachelor of Science in Information Systems'
    ];

    // Filter the student sets
    const filteredSets = studentSets.filter(set => {
        const matchesYear = selectedSchoolYear === 'All' || set.schoolYear === selectedSchoolYear;
        const matchesSet = selectedSet === 'All' || set.setNumber === selectedSet;
        const matchesProgram = selectedProgram === 'All' || set.program === selectedProgram;
        const matchesSearch = set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            set.program.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesYear && matchesSet && matchesProgram && matchesSearch;
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
    }, [searchTerm, selectedSchoolYear, selectedSet, selectedProgram]);

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
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                {schoolYears.map(year => (
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
                                value={selectedSet}
                                onChange={(e) => setSelectedSet(e.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs capitalize shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                {sets.map(set => (
                                    <option key={set} value={set}>
                                        {set === 'All' ? 'All Sets' : set}
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
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                {programs.map(program => (
                                    <option key={program} value={program}>
                                        {program === 'All' ? 'BSIT, BSIS' : program.split(' ').slice(0, 3).join(' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                         <button
                            type="button"
                            onClick={() => {
                                setSelectedSchoolYear('All');
                                setSelectedSet('All');
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
                                    viewMode === 'card'
                                        ? 'bg-green-700 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-green-700 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>

                       

                        <button
                            type="button"
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
                                            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-green-600 transition-colors">
                                                {set.setNumber}
                                            </h3>
                                            <p className="text-xs text-slate-600 mt-1">{set.description}</p>
                                        </div>
                                    </div>

                                    {/* Program Info */}
                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            <span className="font-medium">{set.program}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{set.schoolYear}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            <span>{set.setNumber}</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-4 p-2 bg-slate-50 rounded-lg">
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
                                        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700">
                                            <Eye className="h-3 w-3" />
                                            View
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-700 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-green-800 active:scale-95">
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
                                    <th className="px-6 py-4">Set</th>
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
                                                <div className="font-semibold text-slate-800">{set.setNumber}</div>
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
                        <Users className="h-8 w-8 text-slate-400 mb-3" />
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">No student sets found</h3>
                        <p className="text-slate-600 mb-4 text-xs">Try adjusting your filters or create a new program set.</p>
                        <button className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-green-800 active:scale-95">
                            <Plus className="h-3.5 w-3.5" />
                            Add Program/Set
                        </button>
                    </motion.div>
                )}

                {/* Results Summary */}
                {filteredSets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-xs font-medium text-slate-500"
                    >
                        Showing {paginatedSets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredSets.length)} of{' '}
                        {filteredSets.length} student sets
                    </motion.div>
                )}

                {/* Pagination */}
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

export default InstructorStudents;
