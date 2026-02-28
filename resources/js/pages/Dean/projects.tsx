import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import DeanLayout from './_layout';

type ProjectStatus = 'Proposed' | 'Active' | 'Completed' | 'On Hold' | 'Archived';

type ProjectRow = {
    id: string;
    title: string;
    group: string;
    adviser: string;
    department: string;
    status: ProjectStatus;
    submittedAt: string;
};

const DeanProjects = () => {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'all' | ProjectStatus>('all');

    const projects: ProjectRow[] = [
        {
            id: 'p1',
            title: 'Smart Attendance with QR + Face Match',
            group: 'Group 2',
            adviser: 'Prof. Reyes',
            department: 'Computer Science',
            status: 'Active',
            submittedAt: '2026-03-10',
        },
        {
            id: 'p2',
            title: 'E-Library Book Locator with RFID',
            group: 'Group 6',
            adviser: 'Prof. Cruz',
            department: 'Information Systems',
            status: 'Completed',
            submittedAt: '2026-02-28',
        },
    ];

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return projects.filter((p) => {
            const matchesSearch = !s || p.title.toLowerCase().includes(s) || p.group.toLowerCase().includes(s) || p.adviser.toLowerCase().includes(s);
            const matchesStatus = status === 'all' || p.status === status;
            return matchesSearch && matchesStatus;
        });
    }, [projects, search, status]);

    return (
        <DeanLayout title="Capstone Projects" subtitle="Overview of all capstone projects across departments">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Projects</h3>
                            <p className="text-sm text-slate-500">Manage and review submitted capstone projects</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title, group or adviser..."
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="Proposed">Proposed</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Archived">Archived</option>
                            </select>

                            <button
                                onClick={() => alert('UI only: export projects CSV')}
                                className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-2.5 font-medium text-white transition-all hover:shadow-lg"
                            >
                                Export
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
                                    <th className="py-4 text-left font-semibold">Department</th>
                                    <th className="py-4 text-left font-semibold">Status</th>
                                    <th className="py-4 text-left font-semibold">Submitted</th>
                                    <th className="py-4 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((p) => (
                                    <tr key={p.id} className="transition-colors hover:bg-slate-50">
                                        <td className="py-4 font-medium text-slate-800">{p.title}</td>
                                        <td className="py-4 text-slate-600">{p.group}</td>
                                        <td className="py-4 text-slate-600">{p.adviser}</td>
                                        <td className="py-4 text-slate-600">{p.department}</td>
                                        <td className="py-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-slate-600">{p.submittedAt}</td>
                                        <td className="py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => alert(`UI only: view project ${p.id}`)}
                                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => alert('UI only: request updates')}
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                                >
                                                    Request Update
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filtered.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">No projects found.</div> : null}
                    </div>
                </div>
            </motion.div>
        </DeanLayout>
    );
};

export default DeanProjects;
