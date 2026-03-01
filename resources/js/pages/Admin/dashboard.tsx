import React from 'react';
import { motion } from 'framer-motion';
import { FileArchive, Clock3, FolderKanban, ShieldCheck, Users } from 'lucide-react';
import { Box } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import AdminLayout from './_layout';

type DashboardStats = {
    totalUsers: number;
    activeGroups: number;
    pendingTitleApprovals: number;
    upcomingDefenses: number;
};

type DashboardItem = {
    id: string;
    title: string;
    details: string;
    updatedAt: string;
    tone?: 'info' | 'warning' | 'success';
};

type RoleDistribution = {
    label: string;
    value: number;
    color: string;
};

type AdminDashboardProps = {
    stats?: DashboardStats;
    recentActivities?: DashboardItem[];
    approvalTrend?: number[];
    roleDistribution?: RoleDistribution[];
};

const fallbackStats: DashboardStats = {
    totalUsers: 0,
    activeGroups: 0,
    pendingTitleApprovals: 0,
    upcomingDefenses: 0,
};

const fallbackTrend = [24, 30, 28, 35, 39, 42, 47];

const fallbackRoles: RoleDistribution[] = [];

const toneStyles: Record<NonNullable<DashboardItem['tone']>, string> = {
    info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const AdminDashboard = ({
    stats = fallbackStats,
    recentActivities = [],
    approvalTrend = fallbackTrend,
    roleDistribution = fallbackRoles,
}: AdminDashboardProps) => {
    const cards = [
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            tone: 'from-slate-700 to-slate-900',
        },
        {
            label: 'Active Groups',
            value: stats.activeGroups,
            icon: FolderKanban,
            tone: 'from-emerald-500 to-emerald-700',
        },
        {
            label: 'Pending Title Approvals',
            value: stats.pendingTitleApprovals,
            icon: Clock3,
            tone: 'from-amber-500 to-orange-600',
        },
        {
            label: 'Documents',
            value: stats.upcomingDefenses,
            icon: FileArchive,
            tone: 'from-violet-500 to-violet-700',
        },
    ] as const;

    const pieData = roleDistribution.map((item, index) => ({
        id: index,
        value: item.value,
        label: item.label,
        color: item.color,
    }));

    return (
        <AdminLayout title="Dashboard" subtitle="High-level administration overview">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                >
                    {cards.map((card, index) => (
                        <motion.article
                            key={card.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{card.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
                                </div>
                                <span className={`rounded-xl bg-gradient-to-r p-2.5 text-white shadow-sm ${card.tone}`}>
                                    <card.icon className="h-5 w-5" />
                                </span>
                            </div>
                            <div className={`absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r ${card.tone}`} />
                        </motion.article>
                    ))}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Title Approval Throughput</h3>
                            <p className="mt-1 text-sm text-slate-500">Weekly overview of capstone titles reviewed and approved.</p>
                        </div>

                        <Box>
                            <LineChart
                                height={280}
                                xAxis={[{ data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'], scaleType: 'point' }]}
                                series={[{ data: approvalTrend, label: 'Approved Titles', color: '#2563eb', area: true, showMark: false }]}
                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                                skipAnimation={false}
                            />
                        </Box>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Role Distribution</h3>
                            <p className="mt-1 text-sm text-slate-500">Breakdown of registered users by their system role.</p>
                        </div>

                        <Box>
                            <PieChart
                                height={260}
                                series={[
                                    {
                                        data: pieData,
                                        innerRadius: 55,
                                        outerRadius: 95,
                                        paddingAngle: 2,
                                        cornerRadius: 6,
                                        highlightScope: { faded: 'global', highlighted: 'item' },
                                        faded: { innerRadius: 50, additionalRadius: -6, color: 'gray' },
                                    },
                                ]}
                                slotProps={{ legend: { hidden: true } }}
                                skipAnimation={false}
                            />
                        </Box>

                        <div className="mt-1 space-y-2">
                            {roleDistribution.map((role) => (
                                <div key={role.label} className="flex items-center gap-2 text-sm text-slate-700">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                                    <span className="font-medium">{role.label}</span>
                                    <span className="ml-auto text-slate-500 tabular-nums">{role.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
