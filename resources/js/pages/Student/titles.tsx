import { motion } from 'framer-motion';
import { BookOpen, Search, ShieldAlert } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import StudentLayout from './_layout';

type TitleItem = {
    id: string;
    title: string;
    year: string;
    adviser: string;
    status: 'Approved' | 'Archived';
    category: string;
};

const StudentTitles = () => {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'all' | TitleItem['status']>('all');
    const [category, setCategory] = useState<'all' | string>('all');

    const titles: TitleItem[] = [
        {
            id: 't1',
            title: 'Smart Attendance using QR + Face Verification',
            year: '2025',
            adviser: 'Prof. Cruz',
            status: 'Approved',
            category: 'AI / Vision',
        },
        { id: 't2', title: 'Library Book Finder with Indoor Navigation', year: '2024', adviser: 'Prof. Tan', status: 'Archived', category: 'Mobile' },
        { id: 't3', title: 'Barangay Incident Reporting Web System', year: '2025', adviser: 'Prof. Garcia', status: 'Approved', category: 'Web' },
        { id: 't4', title: 'Clinic Queue Management with SMS Alerts', year: '2023', adviser: 'Prof. Aquino', status: 'Archived', category: 'IoT' },
        { id: 't5', title: 'Campus Lost-and-Found Portal', year: '2026', adviser: 'Prof. Reyes', status: 'Approved', category: 'Web' },
    ];

    const categories = useMemo(() => {
        const unique = Array.from(new Set(titles.map((t) => t.category))).sort();
        return ['all', ...unique];
    }, [titles]);

    const filtered = titles.filter((t) => {
        const matchesQuery = t.title.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === 'all' ? true : t.status === status;
        const matchesCategory = category === 'all' ? true : t.category === category;

        return matchesQuery && matchesStatus && matchesCategory;
    });

    const statusPill = (s: TitleItem['status']): string => {
        return s === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200';
    };

    return (
        <StudentLayout title="Title Repository" subtitle="View-only references for originality checking">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                                <BookOpen size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Browse Titles</h3>
                                <p className="mt-1 text-sm text-slate-500">Search and filter approved/archived titles.</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <ShieldAlert size={16} />
                                Duplication checker runs during title submission (UI only)
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-semibold tracking-wide text-slate-600 uppercase">Search</label>
                            <div className="relative mt-2">
                                <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by title..."
                                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-4 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold tracking-wide text-slate-600 uppercase">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All</option>
                                <option value="Approved">Approved</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold tracking-wide text-slate-600 uppercase">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c === 'all' ? 'All categories' : c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-slate-900">Results</h3>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                            {filtered.length} item(s)
                        </span>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-3 text-left font-semibold">Title</th>
                                    <th className="py-3 text-left font-semibold">Year</th>
                                    <th className="py-3 text-left font-semibold">Adviser</th>
                                    <th className="py-3 text-left font-semibold">Category</th>
                                    <th className="py-3 text-left font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="min-w-[320px] py-3 font-medium text-slate-900">{t.title}</td>
                                        <td className="py-3 whitespace-nowrap text-slate-600">{t.year}</td>
                                        <td className="py-3 whitespace-nowrap text-slate-600">{t.adviser}</td>
                                        <td className="py-3 whitespace-nowrap text-slate-600">{t.category}</td>
                                        <td className="py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(t.status)}`}
                                            >
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>
            </div>
        </StudentLayout>
    );
};

export default StudentTitles;
