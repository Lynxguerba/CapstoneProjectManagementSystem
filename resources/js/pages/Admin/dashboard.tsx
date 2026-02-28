import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock3, FolderKanban, ShieldCheck, Users } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import AdminLayout from './_layout';

type DashboardStats = {
    totalUsers: number;
    activeGroups: number;
    pendingTitleApprovals: number;
    securityAlerts: number;
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
    securityAlerts: 0,
};

const fallbackTrend = [24, 30, 28, 35, 39, 42, 47];

const fallbackRoles: RoleDistribution[] = [
    { label: 'Students', value: 120, color: '#16a34a' },
    { label: 'Advisers', value: 22, color: '#4f46e5' },
    { label: 'Instructors', value: 18, color: '#0891b2' },
    { label: 'Panelists', value: 15, color: '#f59e0b' },
    { label: 'Deans', value: 4, color: '#dc2626' },
    { label: 'Admins', value: 2, color: '#334155' },
];

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
            label: 'Security Alerts',
            value: stats.securityAlerts,
            icon: AlertTriangle,
            tone: 'from-rose-500 to-rose-700',
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
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Approval Throughput</h3>
                                <p className="mt-1 text-sm text-slate-500">Animated MUI line graph for weekly title approvals.</p>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">MUI X Charts</span>
                        </div>

                        <Box sx={{ mt: 2 }}>
                            <LineChart
                                height={280}
                                xAxis={[{ data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'], scaleType: 'point' }]}
                                series={[{ data: approvalTrend, label: 'Approved Titles', color: '#2563eb', area: true, showMark: false }]}
                                margin={{ top: 20, right: 20, bottom: 30, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                                skipAnimation={false}
                            />
                            <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
                                Graph is UI-ready for backend-driven analytics.
                            </Typography>
                        </Box>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Role Distribution</h3>
                                <p className="mt-1 text-sm text-slate-500">Animated MUI pie graph by role.</p>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">MUI X Charts</span>
                        </div>

                        <Box sx={{ mt: 1 }}>
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
                                    <span className="ml-auto tabular-nums text-slate-500">{role.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-900">Recent Activities</h3>
                        <p className="mt-1 text-sm text-slate-500">Latest high-level system events from the backend audit stream.</p>

                        <div className="mt-5 space-y-3">
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity) => {
                                    const tone = activity.tone ?? 'info';

                                    return (
                                        <div key={activity.id} className={`rounded-xl border px-4 py-3 ${toneStyles[tone]}`}>
                                            <p className="text-sm font-semibold">{activity.title}</p>
                                            <p className="text-sm opacity-90">{activity.details}</p>
                                            <p className="mt-1 text-xs opacity-80">Updated: {activity.updatedAt}</p>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                    No activity data yet. Pass `recentActivities` from your Inertia response.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Quick Admin Actions</h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">UI-only shortcuts for common operations.</p>

                        <div className="mt-5 space-y-3">
                            <button
                                type="button"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                Review pending title approvals
                            </button>
                            <button
                                type="button"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                Validate archived project records
                            </button>
                            <button
                                type="button"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                Publish system-wide notice
                            </button>
                        </div>
                    </div>
                </motion.section>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
