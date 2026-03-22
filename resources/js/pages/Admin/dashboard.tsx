import { usePage } from '@inertiajs/react';
import { Box } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { CalendarCheck, FolderKanban, GraduationCap, Layers3, ShieldCheck, UserCheck, Users } from 'lucide-react';
import React from 'react';
import AdminLayout from './_layout';

type DashboardStats = {
    totalUsers: number;
    activeGroups: number;
    totalStudents: number;
    totalFaculty: number;
    activeUsers: number;
    inactiveUsers: number;
    groupsWithAdviser: number;
    groupsWithoutAdviser: number;
    programSets: number;
    upcomingDefenses: number;
    pendingAdviserRequests: number;
    defenseRoomsTotal: number;
    defenseRoomsActive: number;
};

type RoleDistribution = {
    label: string;
    value: number;
    color: string;
};

type ProgramDistribution = {
    label: string;
    value: number;
    color: string;
};

type AdminDashboardProps = {
    stats?: DashboardStats;
    roleDistribution?: RoleDistribution[];
    programDistribution?: ProgramDistribution[];
    activityTrend?: ActivityTrend;
};

type ActivityTrend = {
    labels: string[];
    users: number[];
    groups: number[];
};

const fallbackStats: DashboardStats = {
    totalUsers: 0,
    activeGroups: 0,
    totalStudents: 0,
    totalFaculty: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    groupsWithAdviser: 0,
    groupsWithoutAdviser: 0,
    programSets: 0,
    upcomingDefenses: 0,
    pendingAdviserRequests: 0,
    defenseRoomsTotal: 0,
    defenseRoomsActive: 0,
};

const fallbackProgramDistribution: ProgramDistribution[] = [
    { label: 'BSIT', value: 0, color: '#10b981' },
    { label: 'BSIS', value: 0, color: '#22c55e' },
];
const fallbackActivityTrend: ActivityTrend = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    users: [0, 0, 0, 0, 0, 0],
    groups: [0, 0, 0, 0, 0, 0],
};

const progressFor = (value: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
};

const Dashboard = () => {
    const { props } = usePage<AdminDashboardProps>();
    const stats = props.stats ?? fallbackStats;
    const roleDistribution = props.roleDistribution ?? [];
    const programDistribution = props.programDistribution ?? fallbackProgramDistribution;
    const activityTrend = props.activityTrend ?? fallbackActivityTrend;

    const rolePieData = roleDistribution.map((item, index) => ({
        id: index,
        value: item.value,
        label: item.label,
        color: item.color,
    }));
    const programPieData = programDistribution.map((item, index) => ({
        id: index,
        value: item.value,
        label: item.label,
        color: item.color,
    }));

    const roleTotal = roleDistribution.reduce((sum, item) => sum + item.value, 0);
    const hasRoleData = roleTotal > 0;

    const programTotal = programDistribution.reduce((sum, item) => sum + item.value, 0);
    const hasProgramData = programTotal > 0;
    const studentProgramCoverage = progressFor(programTotal, stats.totalStudents);
    const hasActivityData = activityTrend.users.some((value) => value > 0) || activityTrend.groups.some((value) => value > 0);

    const activeUserProgress = progressFor(stats.activeUsers, stats.totalUsers);
    const adviserCoverageProgress = progressFor(stats.groupsWithAdviser, stats.activeGroups);
    const facultyProgress = progressFor(stats.totalFaculty, stats.totalUsers);

    const quickStats = [
        {
            label: 'Total Users',
            value: stats.totalUsers,
            change: `${stats.activeUsers} active · ${stats.inactiveUsers} inactive`,
            progress: activeUserProgress,
            icon: Users,
            tone: 'from-emerald-700 to-emerald-500',
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        },
        {
            label: 'Active Groups',
            value: stats.activeGroups,
            change: stats.groupsWithoutAdviser > 0 ? `${stats.groupsWithoutAdviser} missing adviser` : 'All groups have advisers',
            progress: adviserCoverageProgress,
            icon: FolderKanban,
            tone: 'from-emerald-600 to-teal-500',
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        },
        {
            label: 'Student Accounts',
            value: stats.totalStudents,
            change: `${programTotal} with BSIT/BSIS profile`,
            progress: studentProgramCoverage,
            icon: GraduationCap,
            tone: 'from-green-600 to-emerald-500',
            pill: 'border-green-200 bg-green-50 text-green-700',
        },
        {
            label: 'Faculty Accounts',
            value: stats.totalFaculty,
            change: `${stats.pendingAdviserRequests} pending adviser requests`,
            progress: facultyProgress,
            icon: UserCheck,
            tone: 'from-teal-600 to-emerald-500',
            pill: 'border-teal-200 bg-teal-50 text-teal-700',
        },
    ] as const;

    const operationTiles = [
        {
            label: 'Program Sets',
            value: stats.programSets.toLocaleString(),
            helper: 'Configured sets in the system',
            icon: Layers3,
            tone: 'from-emerald-600 to-emerald-500',
        },
        {
            label: 'Upcoming Defenses',
            value: stats.upcomingDefenses.toLocaleString(),
            helper: 'Scheduled or pending defenses',
            icon: CalendarCheck,
            tone: 'from-green-600 to-emerald-500',
        },
        {
            label: 'Defense Rooms',
            value: `${stats.defenseRoomsActive}/${stats.defenseRoomsTotal}`,
            helper: 'Active over total rooms',
            icon: ShieldCheck,
            tone: 'from-teal-600 to-emerald-500',
        },
        {
            label: 'Pending Requests',
            value: stats.pendingAdviserRequests.toLocaleString(),
            helper: 'Adviser assignment approvals',
            icon: UserCheck,
            tone: 'from-emerald-700 to-green-600',
        },
    ] as const;

    const programToneStyles: Record<string, string> = {
        BSIT: 'from-emerald-600 to-emerald-500',
        BSIS: 'from-teal-600 to-emerald-500',
    };

    const accountStatus = [
        {
            label: 'Active Accounts',
            value: stats.activeUsers,
            progress: progressFor(stats.activeUsers, stats.totalUsers),
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            bar: 'bg-emerald-500',
        },
        {
            label: 'Inactive Accounts',
            value: stats.inactiveUsers,
            progress: progressFor(stats.inactiveUsers, stats.totalUsers),
            pill: 'border-slate-200 bg-slate-50 text-slate-700',
            bar: 'bg-slate-400',
        },
    ] as const;

    return (
        <AdminLayout title="Dashboard" subtitle="Admin Dashboard">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {quickStats.map((stat, idx) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.06 * idx }}
                            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{stat.label}</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
                                    <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${stat.pill}`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tone} shadow-sm`}>
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full rounded-full bg-emerald-100/60">
                                <div className={`h-1.5 rounded-full bg-gradient-to-r ${stat.tone}`} style={{ width: `${stat.progress}%` }} />
                            </div>
                        </motion.div>
                    ))}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-2"
                >
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers3 className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Admin Operations Snapshot</h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Live totals from users, groups, and scheduling tables.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                Core Controls
                            </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {operationTiles.map((tile) => (
                                <div key={tile.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{tile.label}</p>
                                            <p className="mt-1 text-xl font-bold text-slate-900">{tile.value}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">{tile.helper}</p>
                                        </div>
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${tile.tone}`}>
                                            <tile.icon className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Role Distribution</h3>
                                <p className="mt-1 text-xs text-slate-500">Breakdown of user accounts by role assignment.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                {roleTotal.toLocaleString()} assignments
                            </span>
                        </div>

                        {hasRoleData ? (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <PieChart
                                        height={190}
                                        margin={{ left: 90 }}
                                        series={[
                                            {
                                                data: rolePieData,
                                                innerRadius: 44,
                                                outerRadius: 74,
                                                paddingAngle: 2,
                                                cornerRadius: 5,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 40, additionalRadius: -5, color: '#d1d5db' },
                                            },
                                        ]}
                                        slotProps={{ legend: { hidden: true } }}
                                        skipAnimation={false}
                                    />
                                </Box>

                                <div className="overflow-x-auto pb-1">
                                    <div className="mx-auto flex w-max items-center justify-center gap-2">
                                    {roleDistribution.map((role) => (
                                        <div key={role.label} className="min-w-[105px] rounded-lg border border-slate-100 px-2.5 py-2 text-center text-xs text-slate-700">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                                                <span className="font-medium">{role.label}</span>
                                            </div>
                                            <p className="mt-1 font-semibold text-slate-900 tabular-nums">{role.value.toLocaleString()}</p>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                                No role assignment records available yet.
                            </div>
                        )}
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-2"
                >
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Program Distribution</h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Student totals under BSIT and BSIS programs.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                {programTotal.toLocaleString()} students
                            </span>
                        </div>

                        {hasProgramData ? (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <PieChart
                                        height={190}
                                        margin={{ left: 90 }}
                                        series={[
                                            {
                                                data: programPieData,
                                                innerRadius: 44,
                                                outerRadius: 74,
                                                paddingAngle: 2,
                                                cornerRadius: 5,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 40, additionalRadius: -5, color: '#d1d5db' },
                                            },
                                        ]}
                                        slotProps={{ legend: { hidden: true } }}
                                        skipAnimation={false}
                                    />
                                </Box>

                                <div className="overflow-x-auto pb-1">
                                    <div className="mx-auto flex w-max items-center justify-center gap-2">
                                        {programDistribution.map((program) => {
                                            const share = progressFor(program.value, programTotal);
                                            const barTone = programToneStyles[program.label] ?? 'from-emerald-600 to-emerald-500';

                                            return (
                                                <div key={program.label} className="min-w-[105px] rounded-lg border border-slate-100 px-2.5 py-2 text-center text-xs text-slate-700">
                                                    <div className="mb-1 flex items-center justify-center gap-1.5">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: program.color }} />
                                                        <span className="font-medium">{program.label}</span>
                                                    </div>
                                                    <p className="font-semibold text-slate-900 tabular-nums">{program.value.toLocaleString()}</p>
                                                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-emerald-100/70">
                                                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${barTone}`} style={{ width: `${share}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                                No BSIT/BSIS program records found yet.
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Account Status</h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Active and inactive user account distribution.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                {stats.totalUsers.toLocaleString()} users
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {accountStatus.map((status) => (
                                <div key={status.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.pill}`}>
                                            {status.label}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900">{status.value.toLocaleString()}</span>
                                    </div>
                                    <div className="mt-2 h-2 w-full rounded-full bg-slate-200/80">
                                        <div className={`h-2 rounded-full ${status.bar}`} style={{ width: `${status.progress}%` }} />
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">{status.progress}% of total users</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 }}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">System Activity Trend</h3>
                            <p className="mt-1 text-xs text-slate-500">New user accounts and new groups created over the last 6 months.</p>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            Last 6 Months
                        </span>
                    </div>

                    {hasActivityData ? (
                        <Box>
                            <LineChart
                                height={260}
                                xAxis={[{ data: activityTrend.labels, scaleType: 'point' }]}
                                series={[
                                    {
                                        data: activityTrend.users,
                                        label: 'New User Accounts',
                                        color: '#059669',
                                        area: true,
                                        showMark: false,
                                    },
                                    {
                                        data: activityTrend.groups,
                                        label: 'New Groups',
                                        color: '#0f766e',
                                        showMark: false,
                                    },
                                ]}
                                margin={{ top: 16, right: 20, bottom: 28, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                                skipAnimation={false}
                            />
                        </Box>
                    ) : (
                        <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
                            No activity trends available yet.
                        </div>
                    )}
                </motion.section>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
