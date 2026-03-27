import { Link, usePage } from '@inertiajs/react';
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
    { label: 'Approved', value: 0, color: '#065f46' },
    { label: 'Pending', value: 0, color: '#059669' },
    { label: 'For Revision', value: 0, color: '#34d399' },
];

const reviewPalette = ['#065f46', '#047857', '#059669', '#10b981', '#34d399'];

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
            color: reviewPalette[index % reviewPalette.length],
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
    const totalPendingReviews = stats.pendingConceptReviews + stats.pendingDocumentReviews;
    const actionableNotifications = notifications.filter((notice) => notice.tone === 'warning' || notice.tone === 'danger').length;

    const dashboardHighlights = [
        {
            label: 'Assigned Groups',
            value: stats.assignedGroups,
            icon: Users,
        },
        {
            label: 'Pending Reviews',
            value: totalPendingReviews,
            icon: ClipboardCheck,
        },
        {
            label: 'Upcoming Defenses',
            value: stats.upcomingDefenses,
            icon: CalendarClock,
        },
        {
            label: 'Attention Needed',
            value: actionableNotifications,
            icon: Scale,
        },
    ] as const;

    const toneStyles: Record<DashboardNotification['tone'], string> = {
        info: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        success: 'border-green-200 bg-green-50 text-green-800',
        warning: 'border-lime-200 bg-lime-50 text-lime-800',
        danger: 'border-rose-200 bg-rose-50 text-rose-800',
    };

    return (
        <AdviserLayout title="Dashboard" subtitle="Overview of assigned groups, submissions, and schedules">
            <div className="space-y-8">
                <motion.section
                    initial={{ opacity: 0, y: 14, scale: 0.99 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.45 }}
                    className="relative overflow-hidden rounded-3xl border border-emerald-300/70 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 p-6 shadow-xl shadow-emerald-950/20 md:p-8"
                >
                    <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-lime-200/15 blur-3xl" />

                    <div className="relative grid gap-8 xl:grid-cols-[1.25fr_1fr]">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-200 uppercase">Adviser Workspace</p>
                            <h3 className="mt-3 text-2xl font-semibold text-white md:text-[2rem] md:leading-[1.1]">Daily Monitoring Snapshot</h3>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100 md:text-base">
                                Follow review queues, defense schedules, and priority alerts without leaving your dashboard.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/adviser/groups"
                                    className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    Open Group Monitoring
                                </Link>
                                <Link
                                    href="/adviser/schedule"
                                    className="inline-flex items-center rounded-xl border border-emerald-200/60 bg-white/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-white/20"
                                >
                                    View Defense Schedule
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {dashboardHighlights.map((highlight, index) => (
                                <motion.div
                                    key={highlight.label}
                                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: false, amount: 0.3 }}
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
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-2"
                >
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Submission Activity</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Document submissions from your assigned groups over the last 6 weeks.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Last 6 Weeks
                            </span>
                        </div>

                        <Box sx={{ mt: 3 }}>
                            <LineChart
                                height={280}
                                xAxis={[{ data: trendLabels, scaleType: 'point' }]}
                                series={[{ data: trendValues, label: 'Submissions / Week', color: '#059669', area: true }]}
                                margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                            />
                            <Typography sx={{ mt: 1, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                                {trendTotal > 0 ? 'Based on submissions logged for assigned groups.' : 'No submissions logged yet.'}
                            </Typography>
                        </Box>
                    </div>

                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ClipboardCheck className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Review Breakdown</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Current distribution of review outcomes from assigned submissions.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Current
                            </span>
                        </div>

                        <Box sx={{ mt: 2 }}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-1 justify-center">
                                    {reviewTotal > 0 ? (
                                        <PieChart
                                            height={270}
                                            series={[
                                                {
                                                    data: [...reviewBreakdownItems],
                                                    innerRadius: 64,
                                                    outerRadius: 104,
                                                    paddingAngle: 3,
                                                    cornerRadius: 6,
                                                    highlightScope: { faded: 'global', highlighted: 'item' },
                                                    faded: { innerRadius: 64, additionalRadius: -4, color: 'gray' },
                                                },
                                            ]}
                                            slotProps={{ legend: { hidden: true } }}
                                        />
                                    ) : (
                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-slate-500">
                                            No submissions yet.
                                        </div>
                                    )}
                                </div>

                                <div className="lg:w-48">
                                    <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Legend</div>
                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
                                        {reviewBreakdownItems.map((item) => (
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

                <motion.section
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm xl:col-span-2">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Upcoming Schedule</h3>
                                <p className="mt-1 text-sm text-slate-600">Defense schedules for your assigned groups.</p>
                            </div>
                            <Link
                                href="/adviser/schedule"
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                                Open schedule
                            </Link>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-emerald-100 text-slate-600">
                                        <th className="py-3 text-left text-xs font-semibold tracking-wide uppercase">Event</th>
                                        <th className="py-3 text-left text-xs font-semibold tracking-wide uppercase">Date</th>
                                        <th className="py-3 text-left text-xs font-semibold tracking-wide uppercase">Time</th>
                                        <th className="py-3 text-left text-xs font-semibold tracking-wide uppercase">Room</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                    {scheduleRows.length > 0 ? (
                                        scheduleRows.map((row) => (
                                            <tr key={row.id} className="transition hover:bg-emerald-50/60">
                                                <td className="py-3.5 text-sm font-medium text-slate-900">{row.title}</td>
                                                <td className="py-3.5 text-sm text-slate-600">{row.date}</td>
                                                <td className="py-3.5 text-sm text-slate-600">{row.time}</td>
                                                <td className="py-3.5 text-sm text-slate-600">{row.room}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                                                No upcoming schedules yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                            <Link href="/adviser/notifications" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                                View all
                            </Link>
                        </div>

                        <div className="mt-5 space-y-3">
                            {notifications.length > 0 ? (
                                notifications.map((notice) => (
                                    <div key={notice.id} className={`rounded-2xl border p-4 ${toneStyles[notice.tone]}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-sm font-semibold">{notice.title}</div>
                                            <div className="text-xs whitespace-nowrap opacity-80">{formatDateTimeLabel(notice.date)}</div>
                                        </div>
                                        <div className="mt-1.5 text-sm text-slate-700">{notice.message}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-center text-sm text-slate-500">
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
