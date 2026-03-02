import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import InstructorLayout from './_layout';

type EvalRow = {
    id: string;
    group: string;
    panelMember: string;
    score: number;
    remarks: string;
    submittedAt: string;
};

const EvaluationPage = () => {
    const [groupFilter, setGroupFilter] = useState<'all' | 'Group 1' | 'Group 2' | 'Group 3'>('all');
    const [search, setSearch] = useState('');

    const rows: EvalRow[] = [
        {
            id: 'e1',
            group: 'Group 2',
            panelMember: 'Prof. A',
            score: 92,
            remarks: 'Well-structured; minor UI polish recommended.',
            submittedAt: '2026-03-20',
        },
        {
            id: 'e2',
            group: 'Group 2',
            panelMember: 'Prof. B',
            score: 89,
            remarks: 'Good implementation; tighten documentation.',
            submittedAt: '2026-03-20',
        },
        {
            id: 'e3',
            group: 'Group 1',
            panelMember: 'Prof. C',
            score: 78,
            remarks: 'Scope too broad for timeline; clarify features.',
            submittedAt: '2026-03-18',
        },
    ];

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return rows.filter((r) => {
            const matchesGroup = groupFilter === 'all' || r.group === groupFilter;
            const matchesSearch = !s || r.panelMember.toLowerCase().includes(s) || r.remarks.toLowerCase().includes(s);
            return matchesGroup && matchesSearch;
        });
    }, [rows, groupFilter, search]);

    const summary = useMemo(() => {
        const perGroup = new Map<string, number[]>();
        for (const r of filtered) {
            const list = perGroup.get(r.group) ?? [];
            list.push(r.score);
            perGroup.set(r.group, list);
        }

        return Array.from(perGroup.entries()).map(([group, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const submitted = scores.length;
            return { group, avg: Math.round(avg * 10) / 10, submitted };
        });
    }, [filtered]);

    return (
        <InstructorLayout title="Panel Evaluation Monitoring" subtitle="Track submissions, averages, and remarks (UI only)">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {summary.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm lg:col-span-3">
                            No evaluation rows for selected filters.
                        </div>
                    ) : (
                        summary.map((s) => (
                            <div key={s.group} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="text-sm font-semibold text-slate-600">{s.group}</div>
                                <div className="mt-2 text-3xl font-bold text-slate-900">{s.avg}</div>
                                <div className="mt-1 text-sm text-slate-500">Average score</div>
                                <div className="mt-4 text-xs font-medium text-slate-600">{s.submitted} panel submission(s)</div>
                            </div>
                        ))
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Evaluation Records</h3>
                            <p className="text-sm text-slate-500">Instructor view-only monitoring</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <select
                                value={groupFilter}
                                onChange={(e) => setGroupFilter(e.target.value as any)}
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Groups</option>
                                <option value="Group 1">Group 1</option>
                                <option value="Group 2">Group 2</option>
                                <option value="Group 3">Group 3</option>
                            </select>

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search panel member or remarks..."
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />

                            <button
                                onClick={() => alert('UI only: export summary')}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-50"
                            >
                                Export
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-4 text-left font-semibold">Group</th>
                                    <th className="py-4 text-left font-semibold">Panel Member</th>
                                    <th className="py-4 text-left font-semibold">Score</th>
                                    <th className="py-4 text-left font-semibold">Remarks</th>
                                    <th className="py-4 text-left font-semibold">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((r) => (
                                    <tr key={r.id} className="transition-colors hover:bg-slate-50">
                                        <td className="py-4 font-medium text-slate-800">{r.group}</td>
                                        <td className="py-4 text-slate-700">{r.panelMember}</td>
                                        <td className="py-4">
                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                {r.score}
                                            </span>
                                        </td>
                                        <td className="max-w-xl py-4 text-slate-600">{r.remarks}</td>
                                        <td className="py-4 text-slate-600">{r.submittedAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </InstructorLayout>
    );
};

export default EvaluationPage;
