import { Link, usePage } from '@inertiajs/react';
import { Box } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { CalendarCheck, FolderKanban, GraduationCap, Layers3, ShieldCheck, UserCheck, Users } from 'lucide-react';
import React from 'react';
import adminRoutes from '../../routes/admin';
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

type ActivitySeverity = 'info' | 'warning' | 'critical';

type ActivityTrendEvent = {
    occurredAt: string;
    severity: ActivitySeverity;
};

type ActivityTrendSeries = {
    labels: string[];
    info: number[];
    warning: number[];
    critical: number[];
};

type AdminDashboardProps = {
    stats?: DashboardStats;
    roleDistribution?: RoleDistribution[];
    programDistribution?: ProgramDistribution[];
    activityTrend?: ActivityTrend;
};

type ActivityTrend = {
    events: ActivityTrendEvent[];
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
    events: [],
};

const progressFor = (value: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
};

const toLocalDateKey = (value: Date): string => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const buildLocalActivityTrendSeries = (events: ActivityTrendEvent[]): ActivityTrendSeries => {
    const dayStarts = Array.from({ length: 7 }, (_, index) => {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - (6 - index));

        return dayStart;
    });

    const labels = dayStarts.map((dayStart) => dayStart.toLocaleDateString(undefined, { weekday: 'short' }));
    const info = Array.from({ length: 7 }, () => 0);
    const warning = Array.from({ length: 7 }, () => 0);
    const critical = Array.from({ length: 7 }, () => 0);
    const dayIndexByKey = new Map(dayStarts.map((dayStart, index): [string, number] => [toLocalDateKey(dayStart), index]));

    events.forEach((event) => {
        const parsedDate = new Date(event.occurredAt);

        if (Number.isNaN(parsedDate.getTime())) {
            return;
        }

        const dayIndex = dayIndexByKey.get(toLocalDateKey(parsedDate));
        if (dayIndex === undefined) {
            return;
        }

        if (event.severity === 'info') {
            info[dayIndex] += 1;
            return;
        }

        if (event.severity === 'warning') {
            warning[dayIndex] += 1;
            return;
        }

        critical[dayIndex] += 1;
    });

    return {
        labels,
        info,
        warning,
        critical,
    };
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
    const activityTrendSeries = React.useMemo(
        () => buildLocalActivityTrendSeries(activityTrend.events),
        [activityTrend.events],
    );
    const hasActivityData =
        activityTrendSeries.info.some((value) => value > 0) ||
        activityTrendSeries.warning.some((value) => value > 0) ||
        activityTrendSeries.critical.some((value) => value > 0);

    const activeUserProgress = progressFor(stats.activeUsers, stats.totalUsers);
    const adviserCoverageProgress = progressFor(stats.groupsWithAdviser, stats.activeGroups);
    const facultyProgress = progressFor(stats.totalFaculty, stats.totalUsers);

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

    const dashboardHighlights = [
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
        },
        {
            label: 'Active Groups',
            value: stats.activeGroups,
            icon: FolderKanban,
        },
        {
            label: 'Pending Requests',
            value: stats.pendingAdviserRequests,
            icon: UserCheck,
        },
        {
            label: 'Active Rooms',
            value: stats.defenseRoomsActive,
            icon: ShieldCheck,
        },
    ] as const;


    const workloadIntensity = progressFor(
        stats.inactiveUsers + stats.groupsWithoutAdviser + stats.pendingAdviserRequests,
        Math.max(1, stats.totalUsers + stats.activeGroups),
    );

    const metricCardClassName =
        'group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg';
    const panelClassName = 'rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm';

    return (
        <AdminLayout title="Dashboard" subtitle="Admin Dashboard">
            <div className="space-y-8">
                <motion.section
                    initial={{ opacity: 0, y: 14, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className="relative overflow-hidden rounded-3xl border border-emerald-300/70 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 p-6 shadow-xl shadow-emerald-950/20 md:p-8"
                >
                    <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-lime-200/15 blur-3xl" />

                    <div className="relative grid gap-8 xl:grid-cols-[1.25fr_1fr]">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-200 uppercase">Admin Workspace</p>
                            <h3 className="mt-3 text-2xl font-semibold text-white md:text-[2rem] md:leading-[1.1]">System Operations Snapshot</h3>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100 md:text-base">
                                Monitor user health, assignment coverage, and audit activity from one administrative view.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={adminRoutes.users.students.url()}
                                    className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    Open User Management
                                </Link>
                                <Link
                                    href={adminRoutes.auditLogs.url()}
                                    className="inline-flex items-center rounded-xl border border-emerald-200/60 bg-white/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-white/20"
                                >
                                    Open Audit Logs
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {dashboardHighlights.map((highlight, index) => (
                                <motion.div
                                    key={highlight.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08 + index * 0.06 }}
                                    className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-semibold tracking-wide text-emerald-100 uppercase">{highlight.label}</span>
                                        <highlight.icon className="h-4 w-4 text-emerald-100" />
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-white">{highlight.value.toLocaleString()}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-2"
                >
                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers3 className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Admin Operations Snapshot</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Live totals from users, groups, and scheduling tables.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Core Controls
                            </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {operationTiles.map((tile) => (
                                <div key={tile.label} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
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

                    <div className={panelClassName}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Role Distribution</h3>
                                <p className="mt-1 text-sm text-slate-600">Breakdown of user accounts by role assignment.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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
                                            <div key={role.label} className="min-w-[105px] rounded-lg border border-emerald-100 px-2.5 py-2 text-center text-xs text-slate-700">
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
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
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
                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Program Distribution</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Student totals under BSIT and BSIS programs.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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
                                                <div key={program.label} className="min-w-[105px] rounded-lg border border-emerald-100 px-2.5 py-2 text-center text-xs text-slate-700">
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
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
                                No BSIT/BSIS program records found yet.
                            </div>
                        )}
                    </div>

                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Account Status</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Active and inactive user account distribution.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {stats.totalUsers.toLocaleString()} users
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {accountStatus.map((status) => (
                                <div key={status.label} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
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
                    className={panelClassName}
                >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Audit Logs Trend</h3>
                            <p className="mt-1 text-sm text-slate-600">Daily audit-log activity by severity for the last 7 days (local time).</p>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Audit Timeline
                        </span>
                    </div>

                    {hasActivityData ? (
                        <Box>
                            <LineChart
                                height={260}
                                xAxis={[{ data: activityTrendSeries.labels, scaleType: 'point' }]}
                                series={[
                                    {
                                        data: activityTrendSeries.info,
                                        label: 'Info Logs',
                                        color: '#059669',
                                        area: true,
                                        showMark: false,
                                    },
                                    {
                                        data: activityTrendSeries.warning,
                                        label: 'Warning Logs',
                                        color: '#0f766e',
                                        showMark: false,
                                    },
                                    {
                                        data: activityTrendSeries.critical,
                                        label: 'Critical Logs',
                                        color: '#dc2626',
                                        showMark: false,
                                    },
                                ]}
                                margin={{ top: 16, right: 20, bottom: 28, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                                skipAnimation={false}
                            />
                        </Box>
                    ) : (
                        <div className="mt-2 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-8 text-center text-xs text-slate-500">
                            No audit log trends available yet.
                        </div>
                    )}
                </motion.section>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
