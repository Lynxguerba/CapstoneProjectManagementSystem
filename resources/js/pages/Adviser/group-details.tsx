import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Calendar,
    ChevronRight,
    Download,
    ExternalLink,
    FileText,
    FolderOpen,
    LayoutDashboard,
    Search,
    Users,
} from 'lucide-react';
import React from 'react';
import AdviserLayout from './_layout';

type Member = {
    id: number;
    name: string;
    email: string;
    role: string;
};

type Submission = {
    id: number;
    file_name: string;
    file_path: string;
    file_url: string | null;
    status: string;
    adviser_status: string;
    stage: string;
    requirement_type: string;
    created_at: string;
};

type Schedule = {
    id: number;
    stage: string;
    status: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
};

type Panel = {
    name: string;
    role: string;
};

type GroupDetailsProps = {
    group: {
        id: number;
        name: string;
        program: string;
        academic_year: string;
        instructor: string;
        members: Member[];
        panels: Panel[];
    };
    submissions: Submission[];
    schedules: Schedule[];
};

const AdviserGroupDetails = () => {
    const { group, submissions, schedules } = usePage<GroupDetailsProps>().props;
    const [activeTab, setActiveTab] = React.useState<'overview' | 'submissions' | 'schedules'>('overview');
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredSubmissions = submissions.filter(
        (s) =>
            s.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.stage.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.requirement_type.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <AdviserLayout title="Group Details" subtitle={`Managing ${group.name}`}>
            <div className="space-y-6">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/adviser/dashboard" className="font-medium text-slate-600 transition-colors hover:text-emerald-600">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/adviser/documents" className="font-medium text-slate-600 transition-colors hover:text-emerald-600">
                        Approved Projects
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        {group.name}
                    </span>
                </nav>

                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                            activeTab === 'overview'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200'
                        }`}
                    >
                        <LayoutDashboard size={16} />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('submissions')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                            activeTab === 'submissions'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200'
                        }`}
                    >
                        <FolderOpen size={16} />
                        Document Submissions
                    </button>
                    <button
                        onClick={() => setActiveTab('schedules')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                            activeTab === 'schedules'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200'
                        }`}
                    >
                        <Calendar size={16} />
                        Defense Schedules
                    </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                    <FileText size={18} className="text-emerald-600" />
                                    Recent Submissions
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {submissions.slice(0, 5).map((s) => (
                                        <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-800 text-sm">{s.file_name}</p>
                                                <p className="text-slate-500 text-[10px]">
                                                    {s.stage} • {s.created_at}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${
                                                    s.status === 'Approved'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : s.status === 'Revision Required'
                                                          ? 'bg-amber-100 text-amber-700'
                                                          : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {s.status}
                                            </span>
                                        </div>
                                    ))}
                                    {submissions.length === 0 && <p className="py-4 text-center text-slate-400 text-xs">No submissions found.</p>}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                    <Calendar size={18} className="text-emerald-600" />
                                    Schedule Detials
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {schedules.length > 0 ? (
                                        schedules.slice(0, 3).map((sch) => (
                                            <div key={sch.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{sch.stage} Defense</p>
                                                    <p className="text-slate-500 text-[10px]">
                                                        {sch.scheduled_date} • {sch.start_time} - {sch.end_time}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${
                                                        sch.status === 'Scheduled'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : sch.status === 'Completed'
                                                                  ? 'bg-emerald-50 text-emerald-600'
                                                                  : 'bg-amber-100 text-amber-700'

                                                    }`}
                                                >
                                                    {sch.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="py-4 text-center text-slate-400 text-xs">No defense schedules found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search submissions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-none transition-all focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5"
                                />
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50/50 font-bold text-slate-600 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-4">File Name</th>
                                            <th className="px-6 py-4">Stage</th>
                                            <th className="px-6 py-4">Requirement</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-right">Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredSubmissions.map((s) => (
                                            <tr key={s.id} className="transition-colors hover:bg-slate-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded bg-emerald-100 p-1.5 text-emerald-700">
                                                            <FileText size={16} />
                                                        </div>
                                                        <span className="font-semibold text-slate-800">{s.file_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{s.stage}</td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">{s.requirement_type}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${
                                                            s.status === 'Approved'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : s.status === 'Revision Required'
                                                                  ? 'bg-amber-100 text-amber-700'
                                                                  : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500 text-xs">{s.created_at}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {s.file_url && (
                                                            <>
                                                                <a
                                                                    href={s.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                                                    title="Open File"
                                                                >
                                                                    <ExternalLink size={16} />
                                                                </a>
                                                                <a
                                                                    href={s.file_url}
                                                                    download
                                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                                                    title="Download"
                                                                >
                                                                    <Download size={16} />
                                                                </a>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredSubmissions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                                                    No submissions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedules' && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50/50 font-bold text-slate-600 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Defense Stage</th>
                                        <th className="px-6 py-4">Scheduled Date</th>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {schedules.map((sch) => (
                                        <tr key={sch.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded bg-emerald-100 p-1.5 text-emerald-700">
                                                        <Calendar size={16} />
                                                    </div>
                                                    <span className="font-semibold text-slate-800">{sch.stage} Defense</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{sch.scheduled_date}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {sch.start_time} - {sch.end_time}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${
                                                        sch.status === 'Scheduled'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : sch.status === 'Completed'
                                                                  ? 'bg-emerald-50 text-emerald-600'
                                                                  : 'bg-amber-100 text-amber-700'

                                                    }`}
                                                >
                                                    {sch.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {schedules.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                                No schedules found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdviserLayout>
    );
};

export default AdviserGroupDetails;
