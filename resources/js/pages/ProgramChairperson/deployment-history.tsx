import { Box } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { History, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import ProgramChairpersonLayout from './_layout';

type HistoryRow = {
    id: string;
    group: string;
    project: string;
    semester: '1st Semester' | '2nd Semester' | 'Summer';
    academicYear: string;
    partner: string;
    result: 'Completed' | 'Sustained' | 'Retired';
};

const historyRows: HistoryRow[] = [
    {
        id: 'dh-01',
        group: 'Group Sigma',
        project: 'Clinic Queue Management System',
        semester: '1st Semester',
        academicYear: '2025-2026',
        partner: 'City Health Office',
        result: 'Completed',
    },
    {
        id: 'dh-02',
        group: 'Group Vega',
        project: 'Campus Asset Tracker',
        semester: '2nd Semester',
        academicYear: '2024-2025',
        partner: 'College Property Office',
        result: 'Sustained',
    },
    {
        id: 'dh-03',
        group: 'Group Delta',
        project: 'School Inventory and Forecasting System',
        semester: '1st Semester',
        academicYear: '2024-2025',
        partner: 'Registrar Office',
        result: 'Completed',
    },
    {
        id: 'dh-04',
        group: 'Group Orion',
        project: 'Community Records Platform',
        semester: 'Summer',
        academicYear: '2023-2024',
        partner: 'Barangay Hall',
        result: 'Retired',
    },
];

const resultBadge: Record<HistoryRow['result'], string> = {
    Completed: 'bg-emerald-100 text-emerald-700',
    Sustained: 'bg-sky-100 text-sky-700',
    Retired: 'bg-slate-200 text-slate-700',
};

const DeploymentHistoryPage = () => {
    const [query, setQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<'All' | '2025-2026' | '2024-2025' | '2023-2024'>('All');
    const [selectedSemester, setSelectedSemester] = useState<'All' | '1st Semester' | '2nd Semester' | 'Summer'>('All');

    const filteredRows = useMemo(() => {
        const normalized = query.trim().toLowerCase();

        return historyRows.filter((row) => {
            const queryMatch =
                normalized.length === 0 ||
                row.group.toLowerCase().includes(normalized) ||
                row.project.toLowerCase().includes(normalized) ||
                row.partner.toLowerCase().includes(normalized);
            const yearMatch = selectedYear === 'All' || row.academicYear === selectedYear;
            const semesterMatch = selectedSemester === 'All' || row.semester === selectedSemester;

            return queryMatch && yearMatch && semesterMatch;
        });
    }, [query, selectedYear, selectedSemester]);

    return (
        <ProgramChairpersonLayout title="Deployment History" subtitle="Browse previous deployments by semester and academic year (UI only)">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-slate-700" />
                        <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="relative">
                            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search group, project, partner"
                                className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-9 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <select
                            value={selectedYear}
                            onChange={(event) => setSelectedYear(event.target.value as typeof selectedYear)}
                            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="All">All Academic Years</option>
                            <option value="2025-2026">2025-2026</option>
                            <option value="2024-2025">2024-2025</option>
                            <option value="2023-2024">2023-2024</option>
                        </select>

                        <select
                            value={selectedSemester}
                            onChange={(event) => setSelectedSemester(event.target.value as typeof selectedSemester)}
                            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="All">All Semesters</option>
                            <option value="1st Semester">1st Semester</option>
                            <option value="2nd Semester">2nd Semester</option>
                            <option value="Summer">Summer</option>
                        </select>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-2"
                >
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900">Deployments per Academic Year</h3>
                        <p className="mt-1 text-sm text-slate-500">MUI chart summary for archived deployments.</p>
                        <Box sx={{ mt: 2 }}>
                            <BarChart
                                height={260}
                                xAxis={[{ scaleType: 'band', data: ['2023-2024', '2024-2025', '2025-2026'] }]}
                                series={[{ data: [4, 7, 6], label: 'Deployments', color: '#0ea5e9' }]}
                                margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                                grid={{ horizontal: true }}
                            />
                        </Box>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900">Result Snapshot</h3>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                                <span className="font-semibold text-slate-700">Completed</span>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">12</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                                <span className="font-semibold text-slate-700">Sustained</span>
                                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">4</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                                <span className="font-semibold text-slate-700">Retired</span>
                                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">2</span>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <h3 className="text-lg font-semibold text-slate-900">Deployment Archive Table</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-3 text-left font-semibold">Group</th>
                                    <th className="py-3 text-left font-semibold">Project</th>
                                    <th className="py-3 text-left font-semibold">Semester</th>
                                    <th className="py-3 text-left font-semibold">Academic Year</th>
                                    <th className="py-3 text-left font-semibold">Partner</th>
                                    <th className="py-3 text-left font-semibold">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRows.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50">
                                        <td className="py-3 font-semibold text-slate-900">{row.group}</td>
                                        <td className="py-3 text-slate-700">{row.project}</td>
                                        <td className="py-3 text-slate-700">{row.semester}</td>
                                        <td className="py-3 text-slate-700">{row.academicYear}</td>
                                        <td className="py-3 text-slate-700">{row.partner}</td>
                                        <td className="py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resultBadge[row.result]}`}>{row.result}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.section>
            </div>
        </ProgramChairpersonLayout>
    );
};

export default DeploymentHistoryPage;
