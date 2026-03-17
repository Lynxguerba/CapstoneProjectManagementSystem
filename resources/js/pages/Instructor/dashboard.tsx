import { Link, usePage } from '@inertiajs/react';
import { Box } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import {
    CalendarCheck,
    CheckCircle2,
    ClipboardList,
    DoorOpen,
    GraduationCap,
    Layers3,
    Scale,
    TriangleAlert,
    Users,
} from 'lucide-react';
import InstructorLayout from './_layout';

type DashboardStats = {
    totalGroups: number;
    programSets: number;
    students: number;
    groupedStudents: number;
    adviserAssigned: number;
    adviserUnassigned: number;
    panelSlotsFilled: number;
    panelSlotsTotal: number;
    panelSlotsOpen: number;
    panelGroupsNeeding: number;
    scheduledGroups: number;
    upcomingDefenses: number;
    roomsTotal: number;
    roomsActive: number;
};

type StatusRecord = {
    label: string;
    value: number;
    color: string;
};

type StageRecord = {
    label: string;
    completed: number;
    total: number;
};

type GroupMember = {
    name: string;
    initials: string;
};

type GroupRow = {
    id: number;
    name: string;
    members: GroupMember[];
    members_count: number;
    adviser_name?: string | null;
    status: string;
    stage?: string | null;
    progress: number;
    panel_slots_open: number;
};

type UpcomingSchedule = {
    id: number;
    group_name?: string | null;
    stage?: string | null;
    status?: string | null;
    scheduled_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    room_name?: string | null;
};

type AttentionItem = {
    id: number;
    group_name: string;
    issue: string;
    tone: 'info' | 'warning' | 'danger';
};

type InstructorDashboardProps = {
    stats?: DashboardStats;
    statusRecords?: StatusRecord[];
    stageScale?: StageRecord[];
    groups?: GroupRow[];
    upcomingSchedules?: UpcomingSchedule[];
    attentionItems?: AttentionItem[];
};

const fallbackStats: DashboardStats = {
    totalGroups: 0,
    programSets: 0,
    students: 0,
    groupedStudents: 0,
    adviserAssigned: 0,
    adviserUnassigned: 0,
    panelSlotsFilled: 0,
    panelSlotsTotal: 0,
    panelSlotsOpen: 0,
    panelGroupsNeeding: 0,
    scheduledGroups: 0,
    upcomingDefenses: 0,
    roomsTotal: 0,
    roomsActive: 0,
};

const progressFor = (value: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
};

const pad = (value: number): string => value.toString().padStart(2, '0');

const parseDate = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
};

const formatDateLabel = (value?: string | null): string => {
    const date = parseDate(value);

    if (!date) {
        return '';
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatTime = (value?: string | null): string => {
    if (!value) {
        return '--';
    }

    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return value;
    }

    const normalizedHours = hours % 12 || 12;
    const suffix = hours >= 12 ? 'PM' : 'AM';

    return `${normalizedHours}:${pad(minutes)} ${suffix}`;
};

const formatTimeRange = (start?: string | null, end?: string | null): string => {
    if (!start || !end) {
        return '';
    }

    return `${formatTime(start)} - ${formatTime(end)}`;
};

const Dashboard = () => {
    const { props } = usePage<InstructorDashboardProps>();
    const stats = props.stats ?? fallbackStats;
    const statusRecords = props.statusRecords ?? [];
    const stageScale = props.stageScale ?? [];
    const groups = props.groups ?? [];
    const upcomingSchedules = props.upcomingSchedules ?? [];
    const attentionItems = props.attentionItems ?? [];

    const adviserProgress = progressFor(stats.adviserAssigned, stats.totalGroups);
    const panelProgress = progressFor(stats.panelSlotsFilled, stats.panelSlotsTotal);
    const groupedProgress = progressFor(stats.groupedStudents, stats.students);
    const schedulingProgress = progressFor(stats.scheduledGroups, stats.totalGroups);
    const roomsProgress = progressFor(stats.roomsActive, stats.roomsTotal);
    const upcomingProgress = progressFor(stats.upcomingDefenses, Math.max(stats.totalGroups, stats.scheduledGroups));

    const quickStats = [
        {
            label: 'Total Groups',
            value: stats.totalGroups,
            change: stats.programSets > 0 ? `${stats.programSets} program set${stats.programSets > 1 ? 's' : ''}` : 'No program sets yet',
            progress: schedulingProgress,
            icon: Users,
            tone: 'from-emerald-700 to-emerald-500',
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        },
        {
            label: 'Assigned Advisers',
            value: stats.adviserAssigned,
            change: stats.adviserUnassigned > 0 ? `${stats.adviserUnassigned} unassigned` : 'All groups covered',
            progress: adviserProgress,
            icon: GraduationCap,
            tone: 'from-emerald-600 to-teal-500',
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        },
        {
            label: 'Panel Slots Open',
            value: stats.panelSlotsOpen,
            change: stats.panelSlotsTotal > 0 ? `${stats.panelSlotsFilled}/${stats.panelSlotsTotal} filled` : 'No panel slots yet',
            progress: panelProgress,
            icon: Layers3,
            tone: 'from-green-600 to-emerald-500',
            pill: 'border-green-200 bg-green-50 text-green-700',
        },
        {
            label: 'Upcoming Defenses',
            value: stats.upcomingDefenses,
            change: stats.scheduledGroups > 0 ? `${stats.scheduledGroups} scheduled` : 'No schedules yet',
            progress: upcomingProgress,
            icon: CalendarCheck,
            tone: 'from-teal-600 to-emerald-500',
            pill: 'border-teal-200 bg-teal-50 text-teal-700',
        },
    ] as const;

    const pageSnapshots = [
        {
            id: 'groups',
            label: 'Groups Management',
            shortLabel: 'Groups',
            value: stats.totalGroups,
            helper: `${stats.programSets} program set${stats.programSets === 1 ? '' : 's'}`,
            progress: schedulingProgress,
            href: '/instructor/groups',
            icon: Users,
            tone: 'from-emerald-600 to-emerald-400',
        },
        {
            id: 'students',
            label: 'Students Management',
            shortLabel: 'Students',
            value: stats.students,
            helper: `${stats.groupedStudents} grouped`,
            progress: groupedProgress,
            href: '/instructor/students',
            icon: ClipboardList,
            tone: 'from-emerald-700 to-emerald-500',
        },
        {
            id: 'adviser',
            label: 'Adviser Assignment',
            shortLabel: 'Advisers',
            value: stats.adviserAssigned,
            helper: `${stats.adviserUnassigned} unassigned`,
            progress: adviserProgress,
            href: '/instructor/adviser-assignment',
            icon: GraduationCap,
            tone: 'from-green-600 to-emerald-500',
        },
        {
            id: 'panelist',
            label: 'Panelist Assignment',
            shortLabel: 'Panelists',
            value: stats.panelSlotsFilled,
            helper: `${stats.panelSlotsOpen} open slots`,
            progress: panelProgress,
            href: '/instructor/panelist-assignment',
            icon: Layers3,
            tone: 'from-teal-600 to-emerald-500',
        },
        {
            id: 'scheduling',
            label: 'Defense Scheduling',
            shortLabel: 'Schedules',
            value: stats.scheduledGroups,
            helper: `${stats.upcomingDefenses} upcoming`,
            progress: schedulingProgress,
            href: '/instructor/scheduling',
            icon: CalendarCheck,
            tone: 'from-emerald-600 to-green-500',
        },
        {
            id: 'rooms',
            label: 'Defense Rooms',
            shortLabel: 'Rooms',
            value: stats.roomsActive,
            helper: `${stats.roomsTotal} total rooms`,
            progress: roomsProgress,
            href: '/instructor/scheduling/rooms',
            icon: DoorOpen,
            tone: 'from-emerald-500 to-teal-500',
        },
    ] as const;

    const statusTotal = statusRecords.reduce((sum, item) => sum + item.value, 0);

    const statusPillStyles: Record<string, string> = {
        Scheduled: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        Pending: 'border-green-200 bg-green-50 text-green-700',
        Completed: 'border-teal-200 bg-teal-50 text-teal-700',
        Cancelled: 'border-lime-200 bg-lime-50 text-lime-700',
        Unscheduled: 'border-emerald-100 bg-emerald-50/60 text-emerald-600',
    };

    const statusProgressStyles: Record<string, string> = {
        Scheduled: 'bg-emerald-500',
        Pending: 'bg-green-500',
        Completed: 'bg-teal-500',
        Cancelled: 'bg-lime-500',
        Unscheduled: 'bg-emerald-200',
    };

    const statusBadgeStyles: Record<string, string> = {
        Scheduled: 'bg-emerald-100 text-emerald-700',
        Pending: 'bg-green-100 text-green-700',
        Completed: 'bg-teal-100 text-teal-700',
        Cancelled: 'bg-lime-100 text-lime-700',
    };

    const stageToneStyles: Record<string, string> = {
        Concept: 'bg-emerald-600',
        Outline: 'bg-emerald-500',
        'Pre-Deployment': 'bg-emerald-400',
        Deployment: 'bg-emerald-300',
    };

    const attentionToneStyles: Record<AttentionItem['tone'], string> = {
        info: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-green-200 bg-green-50 text-green-700',
        danger: 'border-teal-200 bg-teal-50 text-teal-700',
    };

    return (
        <InstructorLayout title="Dashboard" subtitle="Instructor Dashboard">
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
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tone} shadow-sm`}
                                >
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full rounded-full bg-emerald-100/60">
                                <div
                                    className={`h-1.5 rounded-full bg-gradient-to-r ${stat.tone}`}
                                    style={{ width: `${stat.progress}%` }}
                                />
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
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers3 className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Page Records Scale</h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Record volume per instructor module.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                MUI X Charts
                            </span>
                        </div>

                        <Box sx={{ mt: 3 }}>
                            <BarChart
                                height={260}
                                xAxis={[{ data: pageSnapshots.map((page) => page.shortLabel), scaleType: 'band' }]}
                                series={[{ data: pageSnapshots.map((page) => page.value), color: '#10b981' }]}
                                margin={{ top: 20, right: 20, bottom: 50, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                            />
                        </Box>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Status Distribution</h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Scheduled vs pending outcomes.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                MUI X Charts
                            </span>
                        </div>

                        <Box sx={{ mt: 2 }}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-1 justify-center">
                                    <PieChart
                                        height={260}
                                        series={[
                                            {
                                                data: statusRecords.map((item, index) => ({
                                                    id: index,
                                                    value: item.value,
                                                    label: item.label,
                                                    color: item.color,
                                                })),
                                                innerRadius: 60,
                                                outerRadius: 100,
                                                paddingAngle: 3,
                                                cornerRadius: 6,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 60, additionalRadius: -4, color: 'gray' },
                                            },
                                        ]}
                                        slotProps={{ legend: { hidden: true } }}
                                    />
                                </div>

                                <div className="lg:w-44">
                                    <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Legend</div>
                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
                                        {statusRecords.map((item) => (
                                            <div key={item.label} className="flex items-center gap-2 text-xs text-slate-700">
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

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md xl:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Workspace Pages</h3>
                                <p className="mt-1 text-xs text-slate-500">Module records aligned with the instructor workflow.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                Current AY
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {pageSnapshots.map((page) => (
                                <Link
                                    key={page.id}
                                    href={page.href}
                                    className="group rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{page.label}</div>
                                            <div className="mt-1 text-xs text-slate-500">{page.helper}</div>
                                        </div>
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${page.tone} shadow-sm`}
                                        >
                                            <page.icon className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                                        <span className="font-semibold">{page.value.toLocaleString()} records</span>
                                        <span>{page.progress}% scale</span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-100/60">
                                        <div
                                            className={`h-1.5 rounded-full bg-gradient-to-r ${page.tone}`}
                                            style={{ width: `${page.progress}%` }}
                                        />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-center gap-2">
                            <TriangleAlert className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-900">Status Records</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Latest schedule status per group.</p>

                        <div className="mt-5 space-y-3">
                            {statusRecords.map((record) => {
                                const percent = statusTotal > 0 ? Math.round((record.value / statusTotal) * 100) : 0;

                                return (
                                    <div
                                        key={record.label}
                                        className="rounded-xl border border-slate-200 bg-emerald-50/40 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/70"
                                    >
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: record.color }} />
                                                {record.label}
                                            </div>
                                            <span className="text-slate-500 tabular-nums">{record.value}</span>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/80">
                                            <div
                                                className="h-1.5 rounded-full"
                                                style={{ width: `${percent}%`, backgroundColor: record.color }}
                                            />
                                        </div>
                                        <div className="mt-2 text-[11px] text-slate-500">{percent}% of records</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.section>

                

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md xl:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Active Groups</h3>
                                <p className="mt-1 text-xs text-slate-500">Latest schedule status per group.</p>
                            </div>
                            <Link
                                href="/instructor/groups"
                                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md active:scale-95"
                            >
                                View groups
                            </Link>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-emerald-700">
                                        <th className="py-3 text-left font-semibold">Group</th>
                                        <th className="py-3 text-left font-semibold">Members</th>
                                        <th className="py-3 text-left font-semibold">Adviser</th>
                                        <th className="py-3 text-left font-semibold">Status</th>
                                        <th className="py-3 text-left font-semibold">Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {groups.map((group) => {
                                        const extraMembers = Math.max(0, group.members_count - group.members.length);
                                        const statusTone = statusPillStyles[group.status] ?? statusPillStyles.Unscheduled;
                                        const progressTone = statusProgressStyles[group.status] ?? statusProgressStyles.Unscheduled;

                                        return (
                                            <tr key={group.id} className="transition-colors hover:bg-emerald-50/40">
                                                <td className="py-3 font-semibold text-slate-900">Group {group.name}</td>
                                                <td className="py-3">
                                                    <div className="flex -space-x-2">
                                                        {group.members.map((member) => (
                                                            <div
                                                                key={`${group.id}-${member.initials}-${member.name}`}
                                                                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-xs font-semibold text-white"
                                                            >
                                                                {member.initials || '?'}
                                                            </div>
                                                        ))}
                                                        {extraMembers > 0 ? (
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-600">
                                                                +{extraMembers}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-slate-600">{group.adviser_name ?? 'Unassigned'}</td>
                                                <td className="py-3">
                                                    <div className="space-y-1">
                                                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
                                                            {group.status}
                                                        </span>
                                                        <div className="text-xs text-slate-500">{group.stage ?? 'No stage yet'}</div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-24 rounded-full bg-emerald-100/60">
                                                            <div
                                                                className={`h-2 rounded-full ${progressTone}`}
                                                                style={{ width: `${group.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-500">{group.progress}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {groups.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-xs text-slate-500">
                                                No groups available for your program sets yet.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-900">Capstone Scale</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Latest stage completion across groups.</p>

                        <div className="mt-5 space-y-4">
                            {stageScale.map((phase) => {
                                const percent = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
                                const tone = stageToneStyles[phase.label] ?? 'bg-emerald-500';

                                return (
                                    <div key={phase.label}>
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                            <span>{phase.label}</span>
                                            <span className="text-[11px] text-slate-500">
                                                {phase.completed}/{phase.total}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 w-full rounded-full bg-emerald-100/60">
                                            <div className={`h-2 rounded-full ${tone}`} style={{ width: `${percent}%` }} />
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">{percent}% complete</div>
                                    </div>
                                );
                            })}
                            {stageScale.length === 0 ? (
                                <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-4 text-xs text-slate-500">
                                    No stage records yet.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                >
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <CalendarCheck className="h-4 w-4 text-emerald-600" /> Upcoming Defense Schedules
                            </h2>
                            <Link href="/instructor/scheduling" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                                View calendar
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {upcomingSchedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className="rounded-xl border border-slate-200 bg-emerald-50/40 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/70"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{schedule.group_name ?? 'TBD Group'}</p>
                                            <p className="text-xs text-slate-500">
                                                {schedule.stage ?? 'Stage pending'} · {schedule.room_name ?? 'Room TBA'}
                                            </p>
                                        </div>
                                        {schedule.status ? (
                                            <span
                                                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                    statusBadgeStyles[schedule.status] ?? 'bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                {schedule.status}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-3 text-xs font-semibold text-slate-700">
                                        {formatDateLabel(schedule.scheduled_date)}{' '}
                                        <span className="text-[11px] font-medium text-slate-500">
                                            {formatTimeRange(schedule.start_time, schedule.end_time)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {upcomingSchedules.length === 0 ? (
                                <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-4 text-xs text-slate-500">
                                    No upcoming defense schedules yet.
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <TriangleAlert className="h-4 w-4 text-emerald-600" /> Attention Required
                            </h2>
                            <Link
                                href="/instructor/adviser-assignment"
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                            >
                                Review assignments
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {attentionItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`rounded-xl border p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50 ${attentionToneStyles[item.tone]}`}
                                >
                                    <p className="font-semibold text-slate-900">{item.group_name}</p>
                                    <p className="mt-1 text-xs text-slate-600">{item.issue}</p>
                                </div>
                            ))}
                            {attentionItems.length === 0 ? (
                                <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-4 text-xs text-slate-500">
                                    No outstanding assignment issues for your groups.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </motion.section>
            </div>
        </InstructorLayout>
    );
};

export default Dashboard;
