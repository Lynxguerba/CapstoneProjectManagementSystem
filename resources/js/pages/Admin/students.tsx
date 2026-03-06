import { motion } from 'framer-motion';
import { Search, Settings, Upload } from 'lucide-react';
import React from 'react';
import AddUserModal from '../../components/Admin/AddUserModal';
import BulkUploadModal from '../../components/Admin/BulkUploadModal';
import AdminLayout from './_layout';

type StudentProgram = 'BSIT' | 'BSIS';

type StudentRow = {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email?: string;
    program: StudentProgram;
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
    const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = React.useState(false);
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

            return matchesQuery;
        });
    }, [managedStudents, search]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search]);

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

    return (
        <AdminLayout title="Students Management" subtitle="Manage student records by program">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-64 rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
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
                                    <td className="px-6 py-3 text-slate-600">{user.createdAt}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            type="button"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-300"
                                        >
                                            <Settings className="h-3 w-3" />
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
                            Showing {(currentPage - 1) * usersPerPage + 1}-
                            {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} students
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
                                        page === currentPage
                                            ? 'bg-slate-900 text-white'
                                            : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            {pages[pages.length - 1] !== totalPages && (
                                <span className="px-1 text-sm text-slate-500">...</span>
                            )}
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
            <BulkUploadModal open={isBulkUploadModalOpen} onClose={() => setIsBulkUploadModalOpen(false)} userType="student" />
        </AdminLayout>
    );
};

export default AdminStudents;
