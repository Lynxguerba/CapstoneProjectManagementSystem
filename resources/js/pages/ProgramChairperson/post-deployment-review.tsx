import { motion } from 'framer-motion';
import { ClipboardCheck, FileBarChart2, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import ProgramChairpersonLayout from './_layout';

type ReviewStatus = 'Pending Review' | 'For Revision' | 'Completed';

type ReportRow = {
    id: string;
    group: string;
    reportTitle: string;
    submittedAt: string;
    status: ReviewStatus;
    summary: string;
};

const reports: ReportRow[] = [
    {
        id: 'pr-01',
        group: 'Group Alpha',
        reportTitle: 'Post-Deployment Evaluation Report',
        submittedAt: '2026-03-04',
        status: 'Pending Review',
        summary: 'Initial rollout succeeded with 92% task completion and partner requested additional role-based filtering.',
    },
    {
        id: 'pr-02',
        group: 'Group Vega',
        reportTitle: 'Deployment Completion and User Acceptance',
        submittedAt: '2026-03-01',
        status: 'For Revision',
        summary: 'User acceptance evidence attached but missing signed completion checklist from deployment partner.',
    },
    {
        id: 'pr-03',
        group: 'Group Delta',
        reportTitle: 'Final Deployment Narrative',
        submittedAt: '2026-02-26',
        status: 'Completed',
        summary: 'Completed production handover with full documentation and support turnover package.',
    },
];

const statusClass: Record<ReviewStatus, string> = {
    'Pending Review': 'border-amber-200 bg-amber-50 text-amber-700',
    'For Revision': 'border-sky-200 bg-sky-50 text-sky-700',
    Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const PostDeploymentReviewPage = () => {
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(reports[0]?.id ?? null);

    const filteredReports = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return reports;
        }

        return reports.filter(
            (row) =>
                row.group.toLowerCase().includes(normalized) ||
                row.reportTitle.toLowerCase().includes(normalized) ||
                row.status.toLowerCase().includes(normalized),
        );
    }, [query]);

    const selectedReport = useMemo(() => filteredReports.find((row) => row.id === selectedId) ?? null, [filteredReports, selectedId]);

    return (
        <ProgramChairpersonLayout
            title="Post-Deployment Review"
            subtitle="Evaluate deployment reports and approve final completion (UI only)"
        >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <FileBarChart2 size={18} className="text-slate-700" />
                        <h3 className="text-lg font-semibold text-slate-900">Submitted Reports</h3>
                    </div>

                    <div className="relative mt-4">
                        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search group, report, status"
                            className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="mt-4 space-y-3">
                        {filteredReports.map((row) => (
                            <button
                                key={row.id}
                                type="button"
                                onClick={() => setSelectedId(row.id)}
                                className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedId === row.id ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                            >
                                <p className="text-sm font-semibold text-slate-900">{row.group}</p>
                                <p className="mt-1 text-xs text-slate-600">{row.reportTitle}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">{row.submittedAt}</span>
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[row.status]}`}>{row.status}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"
                >
                    {!selectedReport ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                            <p className="text-base font-semibold text-slate-800">Select a report to proceed with review.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Post-Deployment Report</p>
                                    <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedReport.group}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{selectedReport.reportTitle}</p>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[selectedReport.status]}`}>
                                    {selectedReport.status}
                                </span>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Report Summary</p>
                                <p className="mt-2 text-sm text-slate-700">{selectedReport.summary}</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <p className="text-sm font-semibold text-slate-900">Review Actions</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => alert('UI only: approve final deployment completion')}
                                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                                    >
                                        Approve Final Completion
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => alert('UI only: request revision')}
                                        className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white"
                                    >
                                        Request Revision
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex items-center gap-2">
                                    <ClipboardCheck size={16} className="text-slate-700" />
                                    <p className="text-sm font-semibold text-slate-900">Completion Checklist</p>
                                </div>
                                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                    <li className="rounded-xl border border-slate-200 px-3 py-2">Signed turnover form uploaded</li>
                                    <li className="rounded-xl border border-slate-200 px-3 py-2">Partner acceptance and issue log attached</li>
                                    <li className="rounded-xl border border-slate-200 px-3 py-2">Final deployment documentation complete</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </motion.section>
            </div>
        </ProgramChairpersonLayout>
    );
};

export default PostDeploymentReviewPage;
