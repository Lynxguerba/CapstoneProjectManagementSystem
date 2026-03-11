import { motion } from 'framer-motion';
import { CircleCheckBig, MonitorCog, Users } from 'lucide-react';
import React from 'react';

import ProgramChairpersonLayout from './_layout';

type MonitoringStatus = 'Onboarding' | 'Live' | 'Stabilization' | 'Completed';

type DeploymentRow = {
    id: string;
    group: string;
    systemName: string;
    partner: string;
    startDate: string;
    status: MonitoringStatus;
    progress: number;
};

const deployments: DeploymentRow[] = [
    {
        id: 'dm-01',
        group: 'Group Sigma',
        systemName: 'Clinic Queue Management System',
        partner: 'City Health Office',
        startDate: '2026-02-20',
        status: 'Live',
        progress: 76,
    },
    {
        id: 'dm-02',
        group: 'Group Alpha',
        systemName: 'Barangay Incident Reporting System',
        partner: 'Barangay Learning Center',
        startDate: '2026-02-28',
        status: 'Onboarding',
        progress: 45,
    },
    {
        id: 'dm-03',
        group: 'Group Vega',
        systemName: 'Campus Asset Tracker',
        partner: 'College Property Office',
        startDate: '2026-01-30',
        status: 'Stabilization',
        progress: 88,
    },
    {
        id: 'dm-04',
        group: 'Group Delta',
        systemName: 'School Inventory and Forecasting System',
        partner: 'Registrar Office',
        startDate: '2026-01-15',
        status: 'Completed',
        progress: 100,
    },
];

const statusPill: Record<MonitoringStatus, string> = {
    Onboarding: 'bg-sky-100 text-sky-700',
    Live: 'bg-emerald-100 text-emerald-700',
    Stabilization: 'bg-amber-100 text-amber-700',
    Completed: 'bg-slate-200 text-slate-700',
};

const DeploymentMonitoringPage = () => {
    return (
        <ProgramChairpersonLayout
            title="Deployment Monitoring"
            subtitle="Track approved deployments, status transitions, and partner coordination (UI only)"
        >
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Active Deployments</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">3</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Deployment Partners</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">4</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Completed Rollouts</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">1</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                        <MonitorCog size={18} className="text-slate-700" />
                        <h3 className="text-lg font-semibold text-slate-900">Approved Deployment List</h3>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-3 text-left font-semibold">Group</th>
                                    <th className="py-3 text-left font-semibold">System</th>
                                    <th className="py-3 text-left font-semibold">Partner</th>
                                    <th className="py-3 text-left font-semibold">Status</th>
                                    <th className="py-3 text-left font-semibold">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {deployments.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50">
                                        <td className="py-3 font-semibold text-slate-900">{row.group}</td>
                                        <td className="py-3 text-slate-700">{row.systemName}</td>
                                        <td className="py-3 text-slate-700">{row.partner}</td>
                                        <td className="py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill[row.status]}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="w-44">
                                                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                                                    <span>{row.startDate}</span>
                                                    <span>{row.progress}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-200">
                                                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${row.progress}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Partner Coordination Notes</h3>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                            <p className="rounded-xl border border-slate-200 px-3 py-2">
                                City Health Office: User retraining scheduled on 2026-03-08.
                            </p>
                            <p className="rounded-xl border border-slate-200 px-3 py-2">Registrar Office: Final sign-off document in review.</p>
                            <p className="rounded-xl border border-slate-200 px-3 py-2">
                                Barangay Learning Center: Pilot users increased from 20 to 35.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2">
                            <CircleCheckBig size={18} className="text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Monitoring Actions</h3>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => alert('UI only: update status')}
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                Update Status
                            </button>
                            <button
                                type="button"
                                onClick={() => alert('UI only: log partner note')}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
                            >
                                Add Partner Note
                            </button>
                        </div>
                    </div>
                </div>
            </motion.section>
        </ProgramChairpersonLayout>
    );
};

export default DeploymentMonitoringPage;
