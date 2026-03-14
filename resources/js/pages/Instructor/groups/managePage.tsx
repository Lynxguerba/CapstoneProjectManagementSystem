import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, LayoutGrid, List, PencilLine, Plus, Search, User, Users } from 'lucide-react';
import React from 'react';
import CreateGroupModal from '../../../components/Instructor/groups/CreateGroupModal';
import EditGroupMembersModal from '../../../components/Instructor/groups/EditGroupMembersModal';
import GroupDetailsModal from '../../../components/Instructor/groups/GroupDetailsModal';
import InstructorLayout from '../_layout';

type ProgramSetSummary = {
    id: number;
    name: string;
    program?: string | null;
    school_year?: string | null;
};

type GroupSummary = {
    id: number;
    name: string;
    program_set_id: number;
    leader_name?: string | null;
    members_count?: number;
};

type InstructorGroupsManageProps = {
    programSet?: ProgramSetSummary;
    groups?: GroupSummary[];
};

const InstructorGroupsManage = ({ programSet, groups = [] }: InstructorGroupsManageProps) => {
    const sectionName = typeof programSet?.name === 'string' && programSet.name.trim() !== '' ? programSet.name : 'Selected Set';
    const sectionProgram = typeof programSet?.program === 'string' ? programSet.program : '';
    const sectionYear = typeof programSet?.school_year === 'string' ? programSet.school_year : '';
    const sectionMeta = [sectionProgram, sectionYear].filter(Boolean).join(' • ');

    const [searchTerm, setSearchTerm] = React.useState('');
    const [viewMode, setViewMode] = React.useState<'card' | 'list'>('card');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
    const [selectedGroupId, setSelectedGroupId] = React.useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [selectedEditGroupId, setSelectedEditGroupId] = React.useState<number | null>(null);
    const itemsPerPage = 6;

    const filteredGroups = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return groups.filter((group) => {
            const matchesSearch =
                !query ||
                group.name.toLowerCase().includes(query) ||
                (group.leader_name ?? '').toLowerCase().includes(query);

            return matchesSearch;
        });
    }, [groups, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / itemsPerPage));

    React.useEffect(() => {
        setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    }, [totalPages]);

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

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const subtitle = sectionMeta ? `Manage groups for ${sectionName} (${sectionMeta})` : `Manage groups for ${sectionName}`;
    const availableProgramSets = programSet ? [programSet] : [];
    const formatGroupName = (name: string): string => {
        const trimmed = name.trim();
        if (trimmed === '') {
            return 'Group';
        }

        return trimmed.toLowerCase().endsWith(' group') ? trimmed : `${trimmed} Group`;
    };

    return (
        <InstructorLayout title="Groups Management" subtitle={subtitle}>
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/instructor/groups" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Groups
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        {sectionName}
                    </span>
                </nav>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search group or leader..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 md:w-64"
                            />
                        </div>
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

                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-800 active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Create Group
                        </button>
                    </div>
                </div>

                {viewMode === 'card' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {paginatedGroups.map((group, idx) => (
                            <motion.div
                                key={group.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="p-5">
                                    <div className="mb-3">
                                        <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-green-600">
                                            {formatGroupName(group.name)}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-600">Leader: {group.leader_name ?? '—'}</p>
                                    </div>

                                    <div className="mb-3 space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <User className="h-3.5 w-3.5" />
                                            <span className="font-medium">Project Manager</span>
                                        </div>
                                    </div>

                                    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-2">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">{group.members_count ?? 0}</div>
                                            <div className="text-[10px] text-slate-600">Members</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">{sectionProgram || '—'}</div>
                                            <div className="text-[10px] text-slate-600">Program</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedGroupId(group.id);
                                                setIsDetailsModalOpen(true);
                                            }}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                        >
                                            <Users className="h-3 w-3" />
                                            View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedEditGroupId(group.id);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                                        >
                                            <PencilLine className="h-3 w-3" />
                                            Edit
                                        </button>
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
                                    <th className="px-6 py-4">Group</th>
                                    <th className="px-6 py-4">Leader</th>
                                    <th className="px-6 py-4">Members</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedGroups.map((group, index) => (
                                    <tr
                                        key={group.id}
                                        className={`transition-colors hover:bg-green-50/30 ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                        }`}
                                    >
                                        <td className="px-6 py-3.5">
                                            <div>
                                                <div className="font-semibold text-slate-800">{formatGroupName(group.name)}</div>
                                                <div className="text-[10px] text-slate-500">{sectionProgram || '—'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">{group.leader_name ?? '—'}</td>
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{group.members_count ?? 0}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedGroupId(group.id);
                                                    setIsDetailsModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                            >
                                                <Users className="h-3 w-3" />
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedEditGroupId(group.id);
                                                    setIsEditModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
                                            >
                                                <PencilLine className="h-3 w-3" />
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredGroups.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-sm font-medium text-slate-400">No groups found for this program set.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'card' && paginatedGroups.length === 0 && filteredGroups.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm"
                    >
                        <Users className="mb-3 h-8 w-8 text-slate-400" />
                        <h3 className="mb-2 text-sm font-semibold text-slate-800">No groups yet</h3>
                        <p className="mb-4 text-xs text-slate-600">Create a group to get started.</p>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-800 active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Create Group
                        </button>
                    </motion.div>
                )}

                {filteredGroups.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs font-medium text-slate-500">
                        Showing {paginatedGroups.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredGroups.length)} of {filteredGroups.length} groups
                    </motion.div>
                )}

                {filteredGroups.length > 0 && (
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

            <CreateGroupModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} programSets={availableProgramSets} />
            <GroupDetailsModal
                open={isDetailsModalOpen}
                groupId={selectedGroupId}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedGroupId(null);
                }}
            />
            <EditGroupMembersModal
                open={isEditModalOpen}
                groupId={selectedEditGroupId}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedEditGroupId(null);
                }}
            />
        </InstructorLayout>
    );
};

const InstructorGroupsManagePage = () => {
    const { props } = usePage<InstructorGroupsManageProps>();

    return <InstructorGroupsManage programSet={props.programSet} groups={props.groups ?? []} />;
};

export default InstructorGroupsManagePage;
