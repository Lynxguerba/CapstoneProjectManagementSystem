import React from 'react';
import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Upload, UserPlus } from 'lucide-react';
import AdminLayout from '../_layout';

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';

type CreateUserForm = {
    name: string;
    email: string;
    role: UserRole;
    password: string;
};

type AdminUsersCreateProps = {
    availableRoles?: UserRole[];
};

const AdminUsersCreate = ({ availableRoles = ['admin', 'student', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'] }: AdminUsersCreateProps) => {
    const userForm = useForm<CreateUserForm>({
        name: '',
        email: '',
        role: availableRoles[0] ?? 'student',
        password: '',
    });

    const [bulkFileName, setBulkFileName] = React.useState('');

    const submitSingleUser = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        userForm.post('/admin/users');
    };

    return (
        <AdminLayout title="Create Users" subtitle="Add individual accounts or upload accounts in bulk">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <UserPlus className="h-5 w-5 text-slate-700" />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Add New User</h3>
                            <p className="text-sm text-slate-500">Single-account creation form.</p>
                        </div>
                    </div>

                    <form onSubmit={submitSingleUser} className="mt-6 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Full name</label>
                            <input
                                value={userForm.data.name}
                                onChange={(event) => userForm.setData('name', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                placeholder="Juan Dela Cruz"
                            />
                            {userForm.errors.name ? <p className="mt-1 text-xs text-rose-600">{userForm.errors.name}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Email</label>
                            <input
                                type="email"
                                value={userForm.data.email}
                                onChange={(event) => userForm.setData('email', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                placeholder="user@campus.edu"
                            />
                            {userForm.errors.email ? <p className="mt-1 text-xs text-rose-600">{userForm.errors.email}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Role</label>
                            <select
                                value={userForm.data.role}
                                onChange={(event) => userForm.setData('role', event.target.value as UserRole)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm capitalize focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                {availableRoles.map((role) => (
                                    <option key={role} value={role} className="capitalize">
                                        {role}
                                    </option>
                                ))}
                            </select>
                            {userForm.errors.role ? <p className="mt-1 text-xs text-rose-600">{userForm.errors.role}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Temporary password</label>
                            <input
                                type="password"
                                value={userForm.data.password}
                                onChange={(event) => userForm.setData('password', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                placeholder="At least 8 characters"
                            />
                            {userForm.errors.password ? <p className="mt-1 text-xs text-rose-600">{userForm.errors.password}</p> : null}
                        </div>

                        <button
                            type="submit"
                            disabled={userForm.processing}
                            className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {userForm.processing ? 'Creating...' : 'Create account'}
                        </button>
                    </form>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <Upload className="h-5 w-5 text-slate-700" />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Bulk Upload</h3>
                            <p className="text-sm text-slate-500">Upload a CSV file to import multiple users.</p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
                            <span className="text-sm font-semibold text-slate-700">Choose CSV file</span>
                            <span className="text-xs text-slate-500">Expected columns: name, email, role, password</span>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    setBulkFileName(file ? file.name : '');
                                }}
                            />
                            <span className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Browse file</span>
                        </label>
                    </div>

                    <p className="mt-4 text-sm text-slate-600">Selected file: {bulkFileName || 'None'}</p>

                    <button
                        type="button"
                        className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        Upload and import
                    </button>
                </motion.section>
            </div>
        </AdminLayout>
    );
};

export default AdminUsersCreate;
