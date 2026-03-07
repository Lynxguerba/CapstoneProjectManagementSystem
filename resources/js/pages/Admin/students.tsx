import { motion } from 'framer-motion';
import { ChevronRight, Filter, Search, Settings, Upload } from 'lucide-react';
import React from 'react';
import AddUserModal from '../../components/Admin/AddUserModal';
import BulkUploadModal from '../../components/Admin/BulkUploadModal';
import ManageUserActionModal from '../../components/Admin/ManageUserActionModal';
import AdminLayout from './_layout';

type StudentProgram = 'BSIT' | 'BSIS';
type StudentStatus = 'active' | 'inactive';
type StudentFilterProgram = StudentProgram | 'all';
type StudentFilterStatus = StudentStatus | 'all';

type StudentRow = {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email?: string;
    program?: StudentProgram;
    status: StudentStatus;
    createdAt: string;
};

type RawStudentRow = Omit<StudentRow, 'program'> & {
    program?: unknown;
};

type AdminStudentsProps = {
    students?: RawStudentRow[];
    filters?: {
        search?: string;
    };
};

const normalizeProgramCode = (value: unknown): StudentProgram | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalizedProgram = value.trim().toUpperCase();

    if (normalizedProgram === 'BSIT' || normalizedProgram === 'BSIS') {
        return normalizedProgram;
    }

    return undefined;
};

const resolveStudentProgram = (student: RawStudentRow): StudentProgram | undefined => {
    const directProgram = normalizeProgramCode(student.program);
    if (directProgram !== undefined) {
        return directProgram;
    }

    if (student.program !== null && typeof student.program === 'object' && 'code' in student.program) {
        return normalizeProgramCode(student.program.code);
    }

    return undefined;
};

const AdminStudents = ({ students = [], filters }: AdminStudentsProps) => {
    const initialStudents = React.useMemo(() => {
        if (!Array.isArray(students)) {
            return [];
        }

        return students.map((student) => ({
            ...student,
            program: resolveStudentProgram(student),
        }));
    }, [students]);

    const [managedStudents, setManagedStudents] = React.useState<StudentRow[]>(initialStudents);
    const [search, setSearch] = React.useState(filters?.search ?? '');
    const [program, setProgram] = React.useState<StudentFilterProgram>('all');
    const [status, setStatus] = React.useState<StudentFilterStatus>('all');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = React.useState(false);
    const [isManageUserModalOpen, setIsManageUserModalOpen] = React.useState(false);
    const [selectedStudent, setSelectedStudent] = React.useState<StudentRow | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const usersPerPage = 10;

    React.useEffect(() => {
        setManagedStudents(initialStudents);
        setCurrentPage(1);
    }, [initialStudents]);

    const filteredUsers = React.useMemo(() => {
        const query = search.trim().toLowerCase();

        return managedStudents.filter((user) => {
            const programCode = (user.program ?? '').toLowerCase();
            const matchesQuery =
                !query ||
                user.fullName.toLowerCase().includes(query) ||
                programCode.includes(query) ||
                (user.email ?? '').toLowerCase().includes(query);
            const matchesProgram = program === 'all' || user.program === program;
            const matchesStatus = status === 'all' || user.status === status;

            return matchesQuery && matchesProgram && matchesStatus;
        });
    }, [managedStudents, search, program, status]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search, program, status]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));

    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

    const paginatedUsers = React.useMemo(() => {
        const startIndex = (currentPage - 1) * usersPerPage;

        return filteredUsers.slice(startIndex, startIndex + usersPerPage);
    }, [filteredUsers, currentPage]);

    const pages = React.useMemo(() => {
        const maxVisiblePages = 5;
        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - (maxVisiblePages - 1)));
        const endPage = Math.min(totalPages, startPage + (maxVisiblePages - 1));

        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
    }, [currentPage, totalPages]);

    const openManageStudentModal = (student: StudentRow) => {
        setSelectedStudent(student);
        setIsManageUserModalOpen(true);
    };

    const saveManagedStudent = (updatedStudent: StudentRow) => {
        setManagedStudents((previousStudents) => previousStudents.map((student) => (student.id === updatedStudent.id ? updatedStudent : student)));
        setIsManageUserModalOpen(false);
        setSelectedStudent(null);
    };

    return (
        <AdminLayout title="Students Management" subtitle="Manage student records by program">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                {/* Action Bar */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 md:w-64"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={program}
                                onChange={(event) => setProgram(event.target.value as StudentFilterProgram)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                <option value="all">All Programs</option>
                                <option value="BSIT">BSIT</option>
                                <option value="BSIS">BSIS</option>
                            </select>
                        </div>

                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <ChevronRight size={12} className="rotate-90" />
                            </div>
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value as StudentFilterStatus)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs capitalize shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsBulkUploadModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Bulk Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddUserModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-800 active:scale-95"
                        >
                            Add Student
                        </button>
                    </div>
                </div>

                {/* Striped Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Fullname</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Program</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedUsers.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className={`transition-colors hover:bg-green-50/30 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                >
                                    <td className="px-6 py-3.5 font-semibold text-slate-800">{user.fullName}</td>
                                    <td className="px-6 py-3.5 text-slate-500">{user.email ?? '—'}</td>
                                    <td className="px-6 py-3.5">
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                                            {user.program ?? 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase ${
                                                user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                            }`}
                                        >
                                        
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-slate-500">{user.createdAt}</td>
                                    <td className="px-6 py-3.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => openManageStudentModal(user)}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                        >
                                            <Settings className="h-3 w-3" />
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-sm font-medium text-slate-400">No students found for the current filters.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filteredUsers.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-4 px-1 pb-2 md:flex-row">
                        <p className="text-xs font-medium text-slate-500">
                            Showing <span className="text-slate-900">{(currentPage - 1) * usersPerPage + 1}</span> to{' '}
                            <span className="text-slate-900">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of{' '}
                            <span className="text-slate-900">{filteredUsers.length}</span> students
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
            <AddUserModal open={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} userType="student" />
            <BulkUploadModal
                open={isBulkUploadModalOpen}
                onClose={() => setIsBulkUploadModalOpen(false)}
                existingUsers={managedStudents}
                userType="student"
            />
            <ManageUserActionModal
                open={isManageUserModalOpen}
                user={selectedStudent}
                mode="student"
                submitUrl={selectedStudent ? `/admin/users/${selectedStudent.id}?from=student` : ''}
                onClose={() => {
                    setIsManageUserModalOpen(false);
                    setSelectedStudent(null);
                }}
                onSave={(updatedUser) => saveManagedStudent(updatedUser as StudentRow)}
            />
        </AdminLayout>
    );
};

export default AdminStudents;
