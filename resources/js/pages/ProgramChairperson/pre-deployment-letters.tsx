import { motion } from 'framer-motion';
import { Download, Eye, FileText, Paperclip, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import ProgramChairpersonLayout from './_layout';

type LetterStatus = 'Pending' | 'Approved' | 'Rejected' | 'For Revision';

type LetterRequest = {
    id: string;
    group: string;
    title: string;
    submittedAt: string;
    status: LetterStatus;
    content: string;
    attachments: string[];
};

const statusStyle: Record<LetterStatus, string> = {
    Pending: 'border-slate-200 bg-slate-50 text-slate-700',
    Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Rejected: 'border-rose-200 bg-rose-50 text-rose-700',
    'For Revision': 'border-amber-200 bg-amber-50 text-amber-700',
};

const preDeploymentLetters: LetterRequest[] = [
    {
        id: 'pl-001',
        group: 'Group Alpha',
        title: 'Request for Pre-Deployment Endorsement',
        submittedAt: '2026-03-03',
        status: 'Pending',
        content:
            'We request approval to proceed with pilot deployment at Barangay Learning Center with supervised user onboarding and system orientation.',
        attachments: ['endorsement-letter-alpha.pdf', 'implementation-plan-alpha.pdf'],
    },
    {
        id: 'pl-002',
        group: 'Group Delta',
        title: 'Pre-Deployment Letter with Security Checklist',
        submittedAt: '2026-03-02',
        status: 'For Revision',
        content: 'The group requests pre-deployment approval and commits to completing data retention and backup validation before go-live.',
        attachments: ['request-delta.pdf', 'security-checklist-delta.pdf'],
    },
    {
        id: 'pl-003',
        group: 'Group Sigma',
        title: 'Pre-Deployment Request for LGU Rollout',
        submittedAt: '2026-02-28',
        status: 'Approved',
        content: 'The project team is requesting final letter approval for managed deployment to the partner LGU with signed implementation scope.',
        attachments: ['letter-sigma.pdf'],
    },
];

const decisionHistory = [
    { id: 'h-1', group: 'Group Sigma', decision: 'Approved', date: '2026-02-29', note: 'Complete attachments and clear scope.' },
    { id: 'h-2', group: 'Group Vega', decision: 'Rejected', date: '2026-02-22', note: 'Missing signed consent form.' },
    { id: 'h-3', group: 'Group Delta', decision: 'For Revision', date: '2026-03-01', note: 'Need clarified hosting details.' },
] as const;

const PreDeploymentLettersPage = () => {
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(preDeploymentLetters[0]?.id ?? null);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return preDeploymentLetters;
        }

        return preDeploymentLetters.filter(
            (item) =>
                item.group.toLowerCase().includes(normalized) ||
                item.title.toLowerCase().includes(normalized) ||
                item.status.toLowerCase().includes(normalized),
        );
    }, [query]);

    const selectedLetter = useMemo(() => filtered.find((item) => item.id === selectedId) ?? null, [filtered, selectedId]);

    return (
        <ProgramChairpersonLayout
            title="Pre-Deployment Letter Approval"
            subtitle="Review request letters, attachments, and record decision history (UI only)"
        >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-slate-700" />
                        <h3 className="text-lg font-semibold text-slate-900">Submitted Letters</h3>
                    </div>

                    <div className="relative mt-4">
                        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search group, title, status"
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="mt-4 space-y-3">
                        {filtered.map((item) => {
                            const isActive = selectedId === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedId(item.id)}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${isActive ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{item.group}</p>
                                            <p className="mt-1 text-xs text-slate-600">{item.title}</p>
                                        </div>
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">Submitted: {item.submittedAt}</p>
                                </button>
                            );
                        })}
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"
                >
                    {!selectedLetter ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                            <p className="text-base font-semibold text-slate-800">Select a letter request to review details.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Letter Request</p>
                                    <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedLetter.group}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{selectedLetter.title}</p>
                                </div>

                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[selectedLetter.status]}`}>
                                    {selectedLetter.status}
                                </span>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Letter Content</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedLetter.content}</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex items-center gap-2">
                                    <Paperclip size={16} className="text-slate-600" />
                                    <p className="text-sm font-semibold text-slate-900">Attachments</p>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {selectedLetter.attachments.map((attachment) => (
                                        <div
                                            key={attachment}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                                        >
                                            <span className="text-sm text-slate-700">{attachment}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => alert('UI only: preview attachment')}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                                                >
                                                    <Eye size={14} />
                                                    Preview
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => alert('UI only: download attachment')}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white"
                                                >
                                                    <Download size={14} />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => alert('UI only: approve letter')}
                                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => alert('UI only: request revision')}
                                    className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                                >
                                    Request Revision
                                </button>
                                <button
                                    type="button"
                                    onClick={() => alert('UI only: reject letter')}
                                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                                >
                                    Reject
                                </button>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <p className="text-sm font-semibold text-slate-900">Decision History</p>
                                <div className="mt-3 space-y-2">
                                    {decisionHistory.map((entry) => (
                                        <div key={entry.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="font-semibold text-slate-800">{entry.group}</span>
                                                <span className="text-xs font-semibold text-slate-500">{entry.date}</span>
                                            </div>
                                            <p className="mt-1 text-slate-700">
                                                <span className="font-semibold">{entry.decision}</span> - {entry.note}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.section>
            </div>
        </ProgramChairpersonLayout>
    );
};

export default PreDeploymentLettersPage;
