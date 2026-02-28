import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, FolderKanban, Users } from 'lucide-react';
import AdminLayout from './_layout';

type DashboardStats = {
    totalUsers: number;
    activeGroups: number;
    pendingTitleApprovals: number;
};

type DashboardItem = {
    id: string;
    title: string;
    details: string;
    updatedAt: string;
};

type AdminDashboardProps = {
    stats?: DashboardStats;
    recentActivities?: DashboardItem[];
};

const fallbackStats: DashboardStats = {
    totalUsers: 0,
    activeGroups: 0,
    pendingTitleApprovals: 0,
};

const AdminDashboard = ({ stats = fallbackStats, recentActivities = [] }: AdminDashboardProps) => {
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
    ];

    return (
        <AdminLayout title="Dashboard" subtitle="High-level administration overview">
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {cards.map((card, index) => (
                        <motion.article
                            key={card.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-600">{card.label}</p>
                                <span className={`rounded-xl bg-gradient-to-r p-2 text-white ${card.tone}`}>
                                    <card.icon className="h-4 w-4" />
                                </span>
                            </div>
                            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
                        </motion.article>
                    ))}
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <h3 className="text-lg font-semibold text-slate-900">Recent Activities</h3>
                    <p className="mt-1 text-sm text-slate-500">Latest high-level system events from the backend audit stream.</p>

                    <div className="mt-5 space-y-3">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div key={activity.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                                    <p className="text-sm text-slate-600">{activity.details}</p>
                                    <p className="mt-1 text-xs text-slate-500">Updated: {activity.updatedAt}</p>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                No activity data yet. Pass `recentActivities` from your Inertia response.
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
