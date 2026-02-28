import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import InstructorLayout from './_layout';

type TitleStatus = 'Pending' | 'Approved' | 'Rejected' | 'Archived';

type TitleRow = {
    id: string;
    title: string;
    group: string;
    adviser: string;
    status: TitleStatus;
    submittedAt: string;
    similarity?: number;
};

const TitlesPage = () => {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'all' | TitleStatus>('all');

    const titles: TitleRow[] = [
        {
            id: 't1',
            title: 'Smart Attendance with QR + Face Match',
            group: 'Group 2',
            adviser: 'Prof. Reyes',
            status: 'Pending',
            submittedAt: '2026-03-10',
            similarity: 14,
        },
        {
            id: 't2',
            title: 'Capstone Projects Management System',
            group: 'Group 1',
            adviser: 'Prof. Cruz',
            status: 'Approved',
            submittedAt: '2026-03-08',
            similarity: 4,
        },
        {
            id: 't3',
            title: 'Inventory Forecasting for Campus Supplies',
            group: 'Group 3',
            adviser: 'Prof. Santos',
            status: 'Rejected',
            submittedAt: '2026-03-05',
            similarity: 31,
        },
        {
            id: 't4',
            title: 'E-Library Book Locator with RFID',
            group: 'Group 6',
            adviser: 'Prof. Cruz',
            status: 'Archived',
            submittedAt: '2026-02-28',
            similarity: 9,
        },
    ];

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return titles.filter((t) => {
            const matchesSearch = !s || t.title.toLowerCase().includes(s) || t.group.toLowerCase().includes(s);
            const matchesStatus = status === 'all' || t.status === status;
            return matchesSearch && matchesStatus;
        });
    }, [titles, search, status]);

    const badge = (value: TitleStatus) => {
        const map: Record<TitleStatus, string> = {
            Pending: 'bg-amber-100 text-amber-700',
            Approved: 'bg-teal-100 text-teal-700',
            Rejected: 'bg-rose-100 text-rose-700',
            Archived: 'bg-slate-100 text-slate-700',
        };

        return map[value];
    };

    return (
        <InstructorLayout title="Title Repository" subtitle="Oversee submitted titles and check duplicates">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Titles</h3>
                            <p className="text-sm text-slate-500">Includes a dummy “duplication checker” score</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title or group..."
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Archived">Archived</option>
                            </select>

                            <button
                                onClick={() => alert('UI only: run duplication checker')}
                                className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-2.5 font-medium text-white transition-all hover:shadow-lg"
                            >
                                Run Duplication Check
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-4 text-left font-semibold">Title</th>
                                    <th className="py-4 text-left font-semibold">Group</th>
                                    <th className="py-4 text-left font-semibold">Adviser</th>
                                    <th className="py-4 text-left font-semibold">Status</th>
                                    <th className="py-4 text-left font-semibold">Submitted</th>
                                    <th className="py-4 text-left font-semibold">Duplication</th>
                                    <th className="py-4 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((t) => (
                                    <tr key={t.id} className="transition-colors hover:bg-slate-50">
                                        <td className="py-4 font-medium text-slate-800">{t.title}</td>
                                        <td className="py-4 text-slate-600">{t.group}</td>
                                        <td className="py-4 text-slate-600">{t.adviser}</td>
                                        <td className="py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(t.status)}`}>{t.status}</span>
                                        </td>
                                        <td className="py-4 text-slate-600">{t.submittedAt}</td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                                                    <div
                                                        className="h-2 bg-gradient-to-r from-teal-500 to-indigo-500"
                                                        style={{ width: `${Math.min(100, t.similarity ?? 0)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700">{t.similarity ?? 0}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => alert('UI only: view title details')}
                                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => alert('UI only: approve title')}
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => alert('UI only: archive title')}
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                                >
                                                    Archive
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filtered.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">No titles match your filters.</div> : null}
                    </div>
                </div>
            </motion.div>
        </InstructorLayout>
    );
};

export default TitlesPage;
