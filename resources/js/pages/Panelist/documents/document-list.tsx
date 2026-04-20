import { Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, FileText, Filter, FolderOpen, GraduationCap, LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import PanelLayout from '../_layout';

type ReviewStatus = 'Not Reviewed' | 'In Progress' | 'Reviewed' | 'Needs Revision';

type DocumentRow = {
    id: number;
    group: string;
    defenseType: string;
    category: string;
    fileName: string;
    uploadedAt: string;
    status: ReviewStatus;
};

interface Props {
    documents: DocumentRow[];
    groups: string[];
    categories: string[];
    filters: {
        search: string;
        group: string;
        status: string;
        category: string;
    };
}

const pillClass = (s: ReviewStatus): string => {
    if (s === 'Reviewed') {
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }

    if (s === 'In Progress') {
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }

    if (s === 'Needs Revision') {
        return 'bg-rose-100 text-rose-700 border-rose-200';
    }

    return 'bg-amber-100 text-amber-700 border-amber-200';
};

const PanelistDocumentList = ({ documents, groups, categories, filters }: Props) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [groupFilter, setGroupFilter] = useState(filters.group || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('list');

    const handleFilterChange = (updates: Record<string, string>) => {
        const newFilters = {
            search: updates.search !== undefined ? updates.search : searchTerm,
            group: updates.group !== undefined ? updates.group : groupFilter,
            status: updates.status !== undefined ? updates.status : statusFilter,
            category: updates.category !== undefined ? updates.category : categoryFilter,
        };

        router.get(window.location.pathname, newFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.search) {
                handleFilterChange({ search: searchTerm });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <PanelLayout title="Document Review Center" subtitle="Centralized document queue for assigned groups">
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
            >
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/panelist/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Document Review Center
                    </span>
                </nav>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:w-64"
                            />
                        </div>

                        <div className="relative">
                            <GraduationCap className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={groupFilter}
                                onChange={(e) => {
                                    setGroupFilter(e.target.value);
                                    handleFilterChange({ group: e.target.value });
                                }}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">All Groups</option>
                                {groups.map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <FolderOpen className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    handleFilterChange({ category: e.target.value });
                                }}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <SlidersHorizontal className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setStatusFilter(val);
                                    handleFilterChange({ status: val });
                                }}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Not Reviewed">Not Reviewed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Needs Revision">Needs Revision</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setViewMode('card')}
                            className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                viewMode === 'card' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                                viewMode === 'list' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <List className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {viewMode === 'card' ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {documents.map((d, index) => (
                            <motion.div
                                key={d.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                                className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="flex-1 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-emerald-600">
                                                {d.group}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500">{d.category}</p>
                                        </div>
                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pillClass(d.status)}`}>
                                            {d.status}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-slate-400" />
                                            <span className="truncate">{d.fileName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span>Uploaded: {d.uploadedAt}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            < GraduationCap size={14} className="text-slate-400" />
                                            <span>Defense: {d.defenseType}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <Link
                                            href={`/panelist/documents/${d.id}`}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                        >
                                            View & Review
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Group</th>
                                    <th className="px-6 py-4">Defense</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">File</th>
                                    <th className="px-6 py-4">Uploaded</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documents.map((d) => (
                                    <tr key={d.id} className="transition-colors hover:bg-emerald-50/30">
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{d.group}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{d.defenseType}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{d.category}</td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-slate-400" />
                                                <span className="max-w-[150px] truncate">{d.fileName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">{d.uploadedAt}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pillClass(d.status)}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <Link
                                                href={`/panelist/documents/${d.id}`}
                                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                            >
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {documents.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            No documents found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.section>
        </PanelLayout>
    );
};

export default PanelistDocumentList;
