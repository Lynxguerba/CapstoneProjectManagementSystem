import { Link } from '@inertiajs/react';
import { Box } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, ClipboardCheck, FileCheck2, FileText, FolderOpen, History, MonitorCog, Send } from 'lucide-react';
import React from 'react';

import ProgramChairpersonLayout from './_layout';

const ProgramChairpersonDashboard = () => {
    const cards = [
        { label: 'Pending Letter Approvals', value: 7, tone: 'from-amber-500 to-orange-500', icon: FileText },
        { label: 'Pending Deployment Requests', value: 5, tone: 'from-sky-500 to-cyan-500', icon: Send },
        { label: 'Approved Deployments', value: 14, tone: 'from-emerald-500 to-teal-500', icon: CheckCircle2 },
        { label: 'Post-Deployment Reports', value: 6, tone: 'from-violet-500 to-indigo-500', icon: ClipboardCheck },
    ] as const;

    const workflowLinks = [
        { label: 'Pre-Deployment Letter Approval', href: '/program_chairperson/pre-deployment-letters', icon: FileText },
        { label: 'Deployment Approval', href: '/program_chairperson/deployment-approval', icon: Send },
        { label: 'Deployment Monitoring', href: '/program_chairperson/deployment-monitoring', icon: MonitorCog },
        { label: 'Post-Deployment Review', href: '/program_chairperson/post-deployment-review', icon: ClipboardCheck },
        { label: 'Document Approval', href: '/program_chairperson/document-approval', icon: FolderOpen },
        { label: 'Deployment History', href: '/program_chairperson/deployment-history', icon: History },
        { label: 'Notifications', href: '/program_chairperson/notifications', icon: Bell },
    ] as const;

    const recentAlerts = [
        { id: 'a1', title: '3 new pre-deployment letters submitted', date: '2026-03-04', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
        {
            id: 'a2',
            title: 'Group Delta deployment request now complete for validation',
            date: '2026-03-03',
            tone: 'border-sky-200 bg-sky-50 text-sky-800',
        },
        {
            id: 'a3',
            title: '2 post-deployment reports awaiting completion approval',
            date: '2026-03-02',
            tone: 'border-violet-200 bg-violet-50 text-violet-800',
        },
    ] as const;

    const approvalsByCategory = [
        { id: 0, value: 9, label: 'Letters', color: '#f59e0b' },
        { id: 1, value: 6, label: 'Deployments', color: '#0ea5e9' },
        { id: 2, value: 4, label: 'Documents', color: '#10b981' },
        { id: 3, value: 3, label: 'Post Reports', color: '#8b5cf6' },
    ] as const;

    return (
        <ProgramChairpersonLayout title="Program Chairperson Dashboard" subtitle="Deployment approvals and monitoring workspace (UI only)">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {cards.map((card, index) => (
                        <motion.article
                            key={card.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{card.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone}`}>
                                    <card.icon size={20} className="text-white" />
                                </div>
                            </div>
                            <div className={`absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r ${card.tone}`} />
                        </motion.article>
                    ))}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <div className="flex items-center gap-2">
                            <FileCheck2 size={18} className="text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Workflow Pages</h3>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {workflowLinks.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-200 hover:bg-emerald-50"
                                >
                                    <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                                        <item.icon size={16} className="text-slate-500 group-hover:text-emerald-600" />
                                        {item.label}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">Open</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Bell size={18} className="text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Recent Alerts</h3>
                        </div>
                        <div className="mt-5 space-y-3">
                            {recentAlerts.map((alert) => (
                                <div key={alert.id} className={`rounded-xl border p-3 ${alert.tone}`}>
                                    <p className="text-sm font-semibold">{alert.title}</p>
                                    <p className="mt-1 text-xs">{alert.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-2"
                >
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900">Monthly Deployment Decisions</h3>
                        <p className="mt-1 text-sm text-slate-500">MUI chart for decisions trend (dummy data).</p>
                        <Box sx={{ mt: 2 }}>
                            <BarChart
                                height={260}
                                xAxis={[{ scaleType: 'band', data: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'] }]}
                                series={[
                                    { data: [5, 7, 6, 8, 9], label: 'Approved', color: '#10b981' },
                                    { data: [1, 2, 2, 1, 1], label: 'Denied', color: '#ef4444' },
                                ]}
                                margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                                grid={{ horizontal: true }}
                            />
                        </Box>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900">Pending Approvals by Category</h3>
                        <p className="mt-1 text-sm text-slate-500">MUI chart distribution (dummy data).</p>
                        <Box sx={{ mt: 2 }}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-1 justify-center">
                                    <PieChart
                                        height={260}
                                        series={[
                                            {
                                                data: [...approvalsByCategory],
                                                innerRadius: 55,
                                                outerRadius: 100,
                                                paddingAngle: 3,
                                                cornerRadius: 5,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 55, additionalRadius: -4, color: 'gray' },
                                            },
                                        ]}
                                        slotProps={{ legend: { hidden: true } }}
                                    />
                                </div>

                                <div className="lg:w-40">
                                    <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Legend</div>
                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
                                        {approvalsByCategory.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="truncate font-medium">{item.label}</span>
                                                <span className="ml-auto text-slate-500 tabular-nums">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Box>
                    </div>
                </motion.section>
            </div>
        </ProgramChairpersonLayout>
    );
};

export default ProgramChairpersonDashboard;
