import { usePage } from '@inertiajs/react';
import { Box, Typography } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { CalendarClock, ClipboardCheck, FileText, FolderOpen, LayoutDashboard, Scale, Users } from 'lucide-react';
import React from 'react';
import AdviserLayout from './_layout';

type AdviserDashboardStats = {
    assignedGroups: number;
    pendingConceptReviews: number;
    pendingDocumentReviews: number;
    upcomingDefenses: number;
};

type TrendSeries = {
    labels: string[];
    values: number[];
};

type ReviewBreakdownItem = {
    label: string;
    value: number;
    color: string;
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

type DashboardNotification = {
    id: string | number;
    title: string;
    message: string;
    date: string;
    tone: 'info' | 'success' | 'warning' | 'danger';
};

type AdviserDashboardProps = {
    stats?: AdviserDashboardStats;
    trend?: TrendSeries;
    reviewBreakdown?: ReviewBreakdownItem[];
    upcomingSchedules?: UpcomingSchedule[];
    notifications?: DashboardNotification[];
};

const fallbackStats: AdviserDashboardStats = {
    assignedGroups: 0,
    pendingConceptReviews: 0,
    pendingDocumentReviews: 0,
    upcomingDefenses: 0,
};

const fallbackTrend: TrendSeries = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    values: [0, 0, 0, 0, 0, 0],
};

const fallbackReviewBreakdown: ReviewBreakdownItem[] = [
    { label: 'Approved', value: 0, color: '#10b981' },
    { label: 'Pending', value: 0, color: '#22c55e' },
    { label: 'For Revision', value: 0, color: '#34d399' },
];

const progressFor = (value: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Math.min(100, Math.round((value / total) * 100));
};

const parseDate = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const [datePart] = value.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);

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
        return '';
    }

    const [hoursPart, minutesPart] = value.split(':');
    const hours = Number(hoursPart);
    const minutes = Number(minutesPart);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return value;
    }

    const normalizedHours = hours % 12 || 12;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const paddedMinutes = minutes.toString().padStart(2, '0');

    return `${normalizedHours}:${paddedMinutes} ${suffix}`;
};

const formatTimeRange = (start?: string | null, end?: string | null): string => {
    if (!start || !end) {
        return '';
    }

    return `${formatTime(start)} - ${formatTime(end)}`;
};

const formatDateTimeLabel = (value?: string | null): string => {
    if (!value) {
        return '';
    }

    const [datePart, timePart] = value.split(' ');
    const dateLabel = formatDateLabel(datePart) || datePart;

    if (!timePart) {
        return dateLabel;
    }

    const timeLabel = formatTime(timePart);

    return timeLabel !== '' ? `${dateLabel} ${timeLabel}` : dateLabel;
};

const AdviserDashboard = () => {
    const { props } = usePage<AdviserDashboardProps>();
    const stats = props.stats ?? fallbackStats;
    const trend = props.trend ?? fallbackTrend;
    const trendLabels = trend.labels.length > 0 ? trend.labels : fallbackTrend.labels;
    const trendValues = trend.values.length > 0 ? trend.values : Array.from({ length: trendLabels.length }, () => 0);
    const trendTotal = trendValues.reduce((total, value) => total + value, 0);

    const reviewBreakdownItems = (props.reviewBreakdown && props.reviewBreakdown.length > 0 ? props.reviewBreakdown : fallbackReviewBreakdown).map(
        (item, index) => ({
            ...item,
            id: index,
        }),
    );
    const reviewTotal = reviewBreakdownItems.reduce((total, item) => total + item.value, 0);

    const upcomingSchedules = props.upcomingSchedules ?? [];
    const scheduleRows = upcomingSchedules.map((schedule) => {
        const stageLabel = schedule.stage ? `${schedule.stage} Defense` : 'Defense';
        const titleParts = [schedule.group_name, stageLabel].filter(Boolean);
        const dateLabel = formatDateLabel(schedule.scheduled_date) || 'TBD';
        const timeLabel = formatTimeRange(schedule.start_time, schedule.end_time) || 'TBD';
        const roomLabel = schedule.room_name ?? 'TBD';

        return {
            id: schedule.id,
            title: titleParts.join(' • '),
            date: dateLabel,
            time: timeLabel,
            room: roomLabel,
        };
    });

    const notifications = props.notifications ?? [];

    const statsCards = [
        {
            label: 'Assigned Groups',
            value: stats.assignedGroups,
            icon: Users,
            tone: 'from-emerald-600 to-emerald-700',
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            caption: 'Active assignments',
            progress: stats.assignedGroups > 0 ? 100 : 0,
        },
        {
            label: 'Pending Concept Reviews',
            value: stats.pendingConceptReviews,
            icon: FileText,
            tone: 'from-green-500 to-emerald-600',
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            caption: 'Concept queue',
            progress: progressFor(stats.pendingConceptReviews, Math.max(1, stats.assignedGroups)),
        },
        {
            label: 'Pending Document Reviews',
            value: stats.pendingDocumentReviews,
            icon: FolderOpen,
            tone: 'from-emerald-500 to-green-600',
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            caption: 'Document queue',
            progress: progressFor(stats.pendingDocumentReviews, Math.max(1, stats.assignedGroups)),
        },
        {
            label: 'Upcoming Defenses',
            value: stats.upcomingDefenses,
            icon: CalendarClock,
            tone: 'from-emerald-400 to-green-500',
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            caption: 'Scheduled ahead',
            progress: progressFor(stats.upcomingDefenses, Math.max(1, stats.assignedGroups)),
        },
    ] as const;

    const toneStyles: Record<DashboardNotification['tone'], string> = {
        info: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        success: 'bg-emerald-100 border-emerald-200 text-emerald-800',
        warning: 'bg-green-50 border-green-200 text-green-700',
        danger: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    };

    return (
        <AdviserLayout title="Dashboard" subtitle="Overview of assigned groups, submissions, and schedules">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {statsCards.map((card, idx) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.06 * idx }}
                            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{card.label}</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
                                    <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${card.pill}`}>
                                        {card.caption}
                                    </span>
                                </div>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone} shadow-sm`}>
                                    <card.icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full rounded-full bg-emerald-100/60">
                                <div className={`h-1.5 rounded-full bg-gradient-to-r ${card.tone}`} style={{ width: `${card.progress}%` }} />
                            </div>
                        </motion.div>
                    ))}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
                            <p className="mt-1 text-xs text-slate-500">Jump to adviser tools for reviews and monitoring.</p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: 'Review Concepts', href: '/adviser/concepts', icon: FileText, tone: 'from-emerald-500 to-green-600' },
                            { label: 'Review Documents', href: '/adviser/documents', icon: FolderOpen, tone: 'from-green-500 to-emerald-600' },
                            { label: 'Group Monitoring', href: '/adviser/groups', icon: Users, tone: 'from-emerald-600 to-emerald-700' },
                            { label: 'Verdict & Remarks', href: '/adviser/verdict', icon: Scale, tone: 'from-emerald-400 to-green-500' },
                        ].map((action) => (
                            <a
                                key={action.label}
                                href={action.href}
                                className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">{action.label}</div>
                                        <div className="mt-1 text-xs text-slate-500">Open page</div>
                                    </div>
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${action.tone} shadow-sm`}>
                                        <action.icon size={16} className="text-white" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
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
                                    <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Submission Activity</h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Document submissions from your assigned groups (last 6 weeks).</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">Last 6 weeks</span>
                        </div>

                        <Box sx={{ mt: 3 }}>
                            <LineChart
                                height={260}
                                xAxis={[{ data: trendLabels, scaleType: 'point' }]}
                                series={[{ data: trendValues, label: 'Submissions / Week', color: '#10b981', area: true }]}
                                margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                            />
                            <Typography sx={{ mt: 1, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                                {trendTotal > 0 ? 'Based on submissions logged for assigned groups.' : 'No submissions logged yet.'}
                            </Typography>
                        </Box>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Review Breakdown</h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Latest submission statuses for assigned groups.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">Current</span>
                        </div>

                        <Box sx={{ mt: 2 }}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-1 justify-center">
                                    {reviewTotal > 0 ? (
                                        <PieChart
                                            height={260}
                                            series={[
                                                {
                                                    data: [...reviewBreakdownItems],
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
                                    ) : (
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-500">
                                            No submissions yet.
                                        </div>
                                    )}
                                </div>

                                <div className="lg:w-44">
                                    <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Legend</div>
                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
                                        {reviewBreakdownItems.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 text-xs text-slate-700">
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
                    transition={{ delay: 0.16 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md xl:col-span-2">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Upcoming Schedule</h3>
                                <p className="mt-1 text-xs text-slate-500">Defense schedules for your assigned groups.</p>
                            </div>
                            <a
                                href="/adviser/schedule"
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                                Open schedule
                            </a>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-600">
                                        <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide">Event</th>
                                        <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide">Date</th>
                                        <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide">Time</th>
                                        <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide">Room</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {scheduleRows.length > 0 ? (
                                        scheduleRows.map((row) => (
                                            <tr key={row.id} className="hover:bg-emerald-50/60">
                                                <td className="py-3 text-sm font-medium text-slate-900">{row.title}</td>
                                                <td className="py-3 text-xs text-slate-600">{row.date}</td>
                                                <td className="py-3 text-xs text-slate-600">{row.time}</td>
                                                <td className="py-3 text-xs text-slate-600">{row.room}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-xs text-slate-500">
                                                No upcoming schedules yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                            <a href="/adviser/notifications" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                                View all
                            </a>
                        </div>

                        <div className="mt-4 space-y-3">
                            {notifications.length > 0 ? (
                                notifications.map((notice) => (
                                    <div key={notice.id} className={`rounded-xl border p-4 ${toneStyles[notice.tone]} bg-white`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-xs font-semibold">{notice.title}</div>
                                            <div className="text-[11px] whitespace-nowrap opacity-80">{formatDateTimeLabel(notice.date)}</div>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-700">{notice.message}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-center text-xs text-slate-500">
                                    No notifications yet.
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>
            </div>
        </AdviserLayout>
    );
};

export default AdviserDashboard;
