import { motion } from 'framer-motion';
import { Filter, Search, Settings, Upload } from 'lucide-react';
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
    program: StudentProgram;
    status: StudentStatus;
    createdAt: string;
};

type AdminStudentsProps = {
    students?: StudentRow[];
    filters?: {
        search?: string;
    };
};

const AdminStudents = ({ students = [], filters }: AdminStudentsProps) => {
    const initialStudents = React.useMemo(() => {
        return Array.isArray(students) ? students : [];
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
            const matchesQuery =
                !query ||
                user.fullName.toLowerCase().includes(query) ||
                user.program.toLowerCase().includes(query) ||
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
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-64 rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={program}
                                onChange={(event) => setProgram(event.target.value as StudentFilterProgram)}
                                className="w-36 rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Programs</option>
                                <option value="BSIT">BSIT</option>
                                <option value="BSIS">BSIS</option>
                            </select>
                        </div>
                        <div className="relative">
                            <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value as StudentFilterStatus)}
                                className="w-36 rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm capitalize focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsBulkUploadModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            <Upload className="h-4 w-4" />
                            Bulk Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddUserModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Add Student
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                                <th className="px-6 py-3 font-semibold">Fullname</th>
                                <th className="px-6 py-3 font-semibold">Email</th>
                                <th className="px-6 py-3 font-semibold">Program</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold">Created</th>
                                <th className="px-6 py-3 text-right font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="transition-colors hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium text-slate-900">{user.fullName}</td>
                                    <td className="px-6 py-3 text-slate-600">{user.email ?? 'N/A'}</td>
                                    <td className="px-6 py-3 text-slate-700">{user.program}</td>
                                    <td className="px-6 py-3">
                                        <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                                                user.status === 'active'
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : 'border-slate-300 bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-600">{user.createdAt}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => openManageStudentModal(user)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                        >
                                            <Settings className="h-3 w-3" />
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        No students found for the current filters.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">
                            Showing {(currentPage - 1) * usersPerPage + 1}-{Math.min(currentPage * usersPerPage, filteredUsers.length)} of{' '}
                            {filteredUsers.length} students
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((previousPage) => Math.max(1, previousPage - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                            </button>
                            {pages[0] !== 1 && <span className="px-1 text-sm text-slate-500">...</span>}
                            {pages.map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`rounded-lg px-3 py-1.5 text-sm ${
                                        page === currentPage ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            {pages[pages.length - 1] !== totalPages && <span className="px-1 text-sm text-slate-500">...</span>}
                            <button
                                type="button"
                                onClick={() => setCurrentPage((previousPage) => Math.min(totalPages, previousPage + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
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
                submitUrl={selectedStudent ? `/admin/users/students/${selectedStudent.id}` : ''}
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
