import { motion } from 'framer-motion';
import React from 'react';
import InstructorLayout from './_layout';

const ReportsPage = () => {
    const kpis = [
        { label: 'Approval Rate (Semester)', value: '68%', hint: 'Approved concepts vs submitted' },
        { label: 'Average Panel Score', value: '84.3', hint: 'Across all evaluated groups' },
        { label: 'Re-Defense Cases', value: '5', hint: 'For current batch' },
        { label: 'Top Category', value: 'Web Systems', hint: 'Most frequent title category' },
    ];

    const distribution = [
        { label: 'Approved', value: 14, color: 'from-teal-500 to-teal-600' },
        { label: 'Pending', value: 9, color: 'from-amber-500 to-amber-600' },
        { label: 'Rejected', value: 3, color: 'from-rose-500 to-rose-600' },
    ];

    const total = distribution.reduce((a, b) => a + b.value, 0);

    return (
        <InstructorLayout title="Reports & Analytics" subtitle="High-level insights for defense presentation (UI only)">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {kpis.map((k) => (
                        <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="text-sm font-semibold text-slate-600">{k.label}</div>
                            <div className="mt-2 text-3xl font-bold text-slate-900">{k.value}</div>
                            <div className="mt-1 text-sm text-slate-500">{k.hint}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Defense Status Distribution</h3>
                                <p className="text-sm text-slate-500">Simple bar chart using Tailwind</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => alert('UI only: export PDF')}
                                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-50"
                                >
                                    Export PDF
                                </button>
                                <button
                                    onClick={() => alert('UI only: export Excel')}
                                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-50"
                                >
                                    Export Excel
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            {distribution.map((d) => {
                                const pct = total === 0 ? 0 : Math.round((d.value / total) * 100);
                                return (
                                    <div key={d.label}>
                                        <div className="flex justify-between text-sm">
                                            <div className="font-semibold text-slate-700">{d.label}</div>
                                            <div className="text-slate-500">
                                                {d.value} ({pct}%)
                                            </div>
                                        </div>
                                        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                                            <div className={`h-3 rounded-full bg-gradient-to-r ${d.color}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800">Adviser Workload</h3>
                        <p className="mt-1 text-sm text-slate-500">Dummy workload snapshot</p>

                        <div className="mt-6 space-y-4">
                            {[
                                { name: 'Prof. Cruz', load: 3, max: 5 },
                                { name: 'Prof. Reyes', load: 4, max: 5 },
                                { name: 'Prof. Santos', load: 5, max: 5 },
                            ].map((a) => {
                                const pct = Math.round((a.load / a.max) * 100);
                                const color =
                                    pct >= 100
                                        ? 'from-rose-500 to-rose-600'
                                        : pct >= 80
                                          ? 'from-amber-500 to-amber-600'
                                          : 'from-teal-500 to-teal-600';

                                return (
                                    <div key={a.name} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold text-slate-800">{a.name}</div>
                                            <div className="text-xs font-semibold text-slate-500">
                                                {a.load}/{a.max}
                                            </div>
                                        </div>
                                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                            <div className={`h-2 rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </InstructorLayout>
    );
};

export default ReportsPage;
