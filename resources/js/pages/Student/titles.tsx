import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Filter, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import StudentLayout from './_layout';

type TitleItem = {
    id: number;
    title: string;
    academicYear: string;
    adviser: string;
    status: 'Approved' | 'Archived';
    category: string;
};

type StudentTitlesPageProps = {
    titles?: TitleItem[];
    categories?: string[];
    studentProgram?: 'BSIT' | 'BSIS';
};

const StudentTitles = () => {
    const { props } = usePage<StudentTitlesPageProps>();

    const titles = props.titles ?? [];
    const studentProgram = props.studentProgram ?? 'BSIT';

    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'all' | TitleItem['status']>('all');
    const [category, setCategory] = useState<'all' | string>('all');

    const categories = useMemo(() => {
        const options = props.categories ?? [];

        if (options.length > 0) {
            return ['all', ...options];
        }

        const fallback = Array.from(new Set(titles.map((title) => title.category))).sort();

        return ['all', ...fallback];
    }, [props.categories, titles]);

    const filteredTitles = titles.filter((title) => {
        const normalizedQuery = query.toLowerCase();
        const matchesQuery =
            title.title.toLowerCase().includes(normalizedQuery) ||
            title.adviser.toLowerCase().includes(normalizedQuery) ||
            title.academicYear.toLowerCase().includes(normalizedQuery);
        const matchesStatus = status === 'all' ? true : title.status === status;
        const matchesCategory = category === 'all' ? true : title.category === category;

        return matchesQuery && matchesStatus && matchesCategory;
    });

    const statusPill = (value: TitleItem['status']): string => {
        return value === 'Approved'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-slate-200 bg-slate-50 text-slate-700';
    };

    return (
        <StudentLayout title="Title Repository" subtitle="Reference titles based on your program category">
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/student/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Title Repository
                    </span>
                </nav>

                <div className="">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-sm">
                                <BookOpen size={16} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Program-Specific Title Repository</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Showing category references for <span className="font-semibold text-slate-700">{studentProgram}</span> only.
                                </p>
                            </div>
                        </div>

                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            {filteredTitles.length} item(s)
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
                        <div className="lg:col-span-2">
                            <label className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">Search</label>
                            <div className="relative mt-1.5">
                                <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search title, adviser, or A.Y"
                                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-xs outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">Status</label>
                            <div className="relative mt-1.5">
                                <Filter size={13} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as typeof status)}
                                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pr-3 pl-8 text-xs outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            >
                                {categories.map((categoryOption) => (
                                    <option key={categoryOption} value={categoryOption}>
                                        {categoryOption === 'all' ? 'All categories' : categoryOption}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-2.5 text-left font-semibold">Title</th>
                                    <th className="py-2.5 text-left font-semibold">A.Y</th>
                                    <th className="py-2.5 text-left font-semibold">Adviser</th>
                                    <th className="py-2.5 text-left font-semibold">Category</th>
                                    <th className="py-2.5 text-left font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTitles.map((title) => (
                                    <tr key={title.id} className="transition-colors hover:bg-emerald-50/40">
                                        <td className="min-w-[280px] py-2.5 font-medium text-slate-900">{title.title}</td>
                                        <td className="py-2.5 whitespace-nowrap text-slate-600">{title.academicYear}</td>
                                        <td className="py-2.5 whitespace-nowrap text-slate-600">{title.adviser}</td>
                                        <td className="py-2.5 whitespace-nowrap text-slate-600">{title.category}</td>
                                        <td className="py-2.5">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusPill(title.status)}`}>
                                                {title.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredTitles.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-emerald-50/40 p-3 text-xs text-slate-600">
                            No title repository records match your current filters for {studentProgram}.
                        </div>
                    ) : null}
                </div>
            </motion.section>
        </StudentLayout>
    );
};

export default StudentTitles;
