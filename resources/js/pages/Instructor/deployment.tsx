import { motion } from 'framer-motion';
import React, { useState } from 'react';
import InstructorLayout from './_layout';

type ArchiveRow = {
    id: string;
    group: string;
    status: 'Active' | 'Archived';
    link?: string;
    manuscript?: string;
};

const DeploymentPage = () => {
    const [rows, setRows] = useState<ArchiveRow[]>([
        { id: 'a1', group: 'Group 2', status: 'Active', link: 'https://example.com/group2', manuscript: 'final-manuscript-group2.pdf' },
        { id: 'a2', group: 'Group 6', status: 'Archived', link: 'https://example.com/group6', manuscript: 'final-manuscript-group6.pdf' },
    ]);

    const [group, setGroup] = useState('');
    const [link, setLink] = useState('');
    const [manuscript, setManuscript] = useState('');

    const add = () => {
        if (!group) {
            alert('Group is required. (UI only)');
            return;
        }

        setRows([{ id: `${Date.now()}`, group, status: 'Active', link: link || undefined, manuscript: manuscript || undefined }, ...rows]);
        setGroup('');
        setLink('');
        setManuscript('');
    };

    const toggleArchive = (id: string) => {
        setRows(
            rows.map((r) =>
                r.id === id
                    ? {
                          ...r,
                          status: r.status === 'Archived' ? 'Active' : 'Archived',
                      }
                    : r,
            ),
        );
    };

    const badge = (value: ArchiveRow['status']) => (value === 'Archived' ? 'bg-slate-100 text-slate-700' : 'bg-teal-100 text-teal-700');

    return (
        <InstructorLayout title="Deployment & Archiving" subtitle="Verify deployment links, upload manuscript, and lock records (UI only)">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Projects</h3>
                            <p className="text-sm text-slate-500">Archived projects are read-only (conceptual)</p>
                        </div>
                        <button
                            onClick={() => alert('UI only: verify all deployments')}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-50"
                        >
                            Verify All
                        </button>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-4 text-left font-semibold">Group</th>
                                    <th className="py-4 text-left font-semibold">Deployment Link</th>
                                    <th className="py-4 text-left font-semibold">Manuscript</th>
                                    <th className="py-4 text-left font-semibold">Status</th>
                                    <th className="py-4 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((r) => (
                                    <tr key={r.id} className="transition-colors hover:bg-slate-50">
                                        <td className="py-4 font-medium text-slate-800">{r.group}</td>
                                        <td className="py-4 text-slate-600">{r.link ?? '—'}</td>
                                        <td className="py-4 text-slate-600">{r.manuscript ?? '—'}</td>
                                        <td className="py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(r.status)}`}>{r.status}</span>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => alert('UI only: check deployment status')}
                                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                >
                                                    Check
                                                </button>
                                                <button
                                                    onClick={() => toggleArchive(r.id)}
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                                >
                                                    {r.status === 'Archived' ? 'Unarchive' : 'Archive'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800">Upload / Register</h3>
                    <p className="mt-1 text-sm text-slate-500">UI-only form</p>

                    <div className="mt-6 space-y-3">
                        <label className="text-sm font-semibold text-slate-700">Group</label>
                        <input
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            placeholder="Group 1"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />

                        <label className="text-sm font-semibold text-slate-700">Deployed System Link</label>
                        <input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />

                        <label className="text-sm font-semibold text-slate-700">Final Manuscript Filename</label>
                        <input
                            value={manuscript}
                            onChange={(e) => setManuscript(e.target.value)}
                            placeholder="final-manuscript.pdf"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={add}
                            className="w-full rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </motion.div>
        </InstructorLayout>
    );
};

export default DeploymentPage;
