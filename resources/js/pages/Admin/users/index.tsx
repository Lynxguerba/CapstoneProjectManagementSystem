import { motion } from 'framer-motion';
import { Filter, Search, Settings, UserCog } from 'lucide-react';
import React from 'react';
import AddUserModal from '@/components/Admin/AddUserModal';
import ManageUserActionModal from '@/components/Admin/ManageUserActionModal';
import AdminLayout from '../_layout';

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';
type UserStatus = 'active' | 'inactive';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
};

type AdminUsersIndexProps = {
    users?: UserRow[];
    filters?: {
        search?: string;
        role?: UserRole | 'all';
        status?: UserStatus | 'all';
    };
};

const roleOptions: Array<UserRole | 'all'> = ['all', 'admin', 'student', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];
const statusOptions: Array<UserStatus | 'all'> = ['all', 'active', 'inactive'];

const AdminUsersIndex = ({ users = [], filters }: AdminUsersIndexProps) => {
    const [managedUsers, setManagedUsers] = React.useState<UserRow[]>(users);
    const [search, setSearch] = React.useState(filters?.search ?? '');
    const [role, setRole] = React.useState<UserRole | 'all'>(filters?.role ?? 'all');
    const [status, setStatus] = React.useState<UserStatus | 'all'>(filters?.status ?? 'all');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
    const [isManageUserModalOpen, setIsManageUserModalOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<UserRow | null>(null);

    React.useEffect(() => {
        setManagedUsers(users);
    }, [users]);

    const filteredUsers = React.useMemo(() => {
        const query = search.trim().toLowerCase();

        return managedUsers.filter((user) => {
            const matchesQuery = !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
            const matchesRole = role === 'all' || user.role === role;
            const matchesStatus = status === 'all' || user.status === status;

            return matchesQuery && matchesRole && matchesStatus;
        });
    }, [managedUsers, search, role, status]);

    const openManageUserModal = (user: UserRow) => {
        setSelectedUser(user);
        setIsManageUserModalOpen(true);
    };

    const saveManagedUser = (updatedUser: UserRow) => {
        setManagedUsers((previousUsers) => previousUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
        setIsManageUserModalOpen(false);
        setSelectedUser(null);
    };

    return (
        <AdminLayout title="User Management" subtitle="Manage all accounts and role assignments">
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <UserCog className="h-5 w-5 text-slate-700" />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Accounts</h3>
                            <p className="text-sm text-slate-500">Filter and review all users by role and status.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name or email"
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="relative w-full sm:w-48">
                            <Filter className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <select
                                value={role}
                                onChange={(event) => setRole(event.target.value as UserRole | 'all')}
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm capitalize focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                {roleOptions.map((option) => (
                                    <option key={option} value={option} className="capitalize">
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative w-full sm:w-40">
                            <Filter className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value as UserStatus | 'all')}
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm capitalize focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option} value={option} className="capitalize">
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsAddUserModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Add user
                        </button>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-600">
                                <th className="py-3 font-semibold">Name</th>
                                <th className="py-3 font-semibold">Email</th>
                                <th className="py-3 font-semibold">Role</th>
                                <th className="py-3 font-semibold">Status</th>
                                <th className="py-3 font-semibold">Created</th>
                                <th className="py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="transition-colors hover:bg-slate-50">
                                    <td className="py-3 font-medium text-slate-900">{user.name}</td>
                                    <td className="py-3 text-slate-600">{user.email}</td>
                                    <td className="py-3 text-slate-700 capitalize">{user.role}</td>
                                    <td className="py-3">
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
                                    <td className="py-3 text-slate-600">{user.createdAt}</td>
                                    <td className="py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => openManageUserModal(user)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-300"
                                        >
                                            <Settings className="h-3 w-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 ? (
                        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            No users found for the current filters.
                        </p>
                    ) : null}
                </div>
            </motion.section>
            <AddUserModal open={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} />
            <ManageUserActionModal
                open={isManageUserModalOpen}
                user={selectedUser}
                onClose={() => {
                    setIsManageUserModalOpen(false);
                    setSelectedUser(null);
                }}
                onSave={saveManagedUser}
            />
        </AdminLayout>
    );
};

export default AdminUsersIndex;
