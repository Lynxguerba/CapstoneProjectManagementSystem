import { motion } from 'framer-motion';
import { Archive, CheckCircle2, FolderOpen, PenLine, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import ProgramChairpersonLayout from './_layout';

type DocumentStatus = 'Pending Signature Check' | 'Approved' | 'Archived';

type OfficialDocument = {
    id: string;
    group: string;
    title: string;
    category: 'Letter' | 'Report' | 'Agreement';
    status: DocumentStatus;
    submittedAt: string;
};

const documents: OfficialDocument[] = [
    {
        id: 'dc-01',
        group: 'Group Alpha',
        title: 'Signed Deployment Agreement',
        category: 'Agreement',
        status: 'Pending Signature Check',
        submittedAt: '2026-03-04',
    },
    {
        id: 'dc-02',
        group: 'Group Sigma',
        title: 'Final Post-Deployment Report',
        category: 'Report',
        status: 'Approved',
        submittedAt: '2026-03-01',
    },
    {
        id: 'dc-03',
        group: 'Group Vega',
        title: 'Pre-Deployment Endorsement Letter',
        category: 'Letter',
        status: 'Archived',
        submittedAt: '2026-02-18',
    },
];

const statusStyle: Record<DocumentStatus, string> = {
    'Pending Signature Check': 'border-amber-200 bg-amber-50 text-amber-700',
    Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Archived: 'border-slate-200 bg-slate-100 text-slate-700',
};

const DocumentApprovalPage = () => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return documents;
        }

        return documents.filter(
            (row) =>
                row.group.toLowerCase().includes(normalized) ||
                row.title.toLowerCase().includes(normalized) ||
                row.category.toLowerCase().includes(normalized),
        );
    }, [query]);

    return (
        <ProgramChairpersonLayout title="Document Approval" subtitle="Approve and archive signed deployment-related documents (UI only)">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Pending Checks</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">4</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Approved Docs</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">22</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Archived Docs</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">40</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <FolderOpen size={18} className="text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Official Document Registry</h3>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search group, title, category"
                                className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-3 text-left font-semibold">Group</th>
                                    <th className="py-3 text-left font-semibold">Document</th>
                                    <th className="py-3 text-left font-semibold">Category</th>
                                    <th className="py-3 text-left font-semibold">Submitted</th>
                                    <th className="py-3 text-left font-semibold">Status</th>
                                    <th className="py-3 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50">
                                        <td className="py-3 font-semibold text-slate-900">{row.group}</td>
                                        <td className="py-3 text-slate-700">{row.title}</td>
                                        <td className="py-3 text-slate-700">{row.category}</td>
                                        <td className="py-3 text-slate-700">{row.submittedAt}</td>
                                        <td className="py-3">
                                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[row.status]}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => alert('UI only: approve document')}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => alert('UI only: verify signatures')}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                                                >
                                                    <PenLine size={14} />
                                                    Verify Signatures
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => alert('UI only: archive document')}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                                                >
                                                    <Archive size={14} />
                                                    Archive
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.section>
        </ProgramChairpersonLayout>
    );
};

export default DocumentApprovalPage;
