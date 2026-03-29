import { Link, usePage } from '@inertiajs/react';
import { Box } from '@mui/material';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, ClipboardCheck, FileSearch, FolderOpen, LayoutDashboard, TimerReset, TrendingUp, Users } from 'lucide-react';
import React from 'react';
import panelistRoutes from '../../routes/panelist';
import PanelLayout from './_layout';

type DashboardStats = {
    assignedGroups: number;
    scheduledDefenses: number;
    pendingEvaluations: number;
    completedDefenses: number;
    overdueDefenses: number;
    submittedDocuments: number;
    reviewedDocuments: number;
    revisionDocuments: number;
    uniquePrograms: number;
};

type DistributionItem = {
    label: string;
    value: number;
    color: string;
};

type UpcomingScheduleLoad = {
    labels: string[];
    values: number[];
};

type UpcomingSchedule = {
    id: number;
    groupName: string;
    stage: string;
    scheduledDate: string | null;
    startTime: string | null;
    roomName: string | null;
    status: string;
};

type RecentDocumentActivity = {
    id: number;
    groupName: string;
    requirementType: string;
    stage: string | null;
    fileName: string;
    status: string;
    updatedAt: string;
};

type PanelistDashboardProps = {
    welcomeName?: string;
    stats?: DashboardStats;
    stageDistribution?: DistributionItem[];
    scheduleStatusDistribution?: DistributionItem[];
    documentStatusDistribution?: DistributionItem[];
    programDistribution?: DistributionItem[];
    upcomingScheduleLoad?: UpcomingScheduleLoad;
    upcomingSchedules?: UpcomingSchedule[];
    recentDocumentActivity?: RecentDocumentActivity[];
};

const fallbackStats: DashboardStats = {
    assignedGroups: 0,
    scheduledDefenses: 0,
    pendingEvaluations: 0,
    completedDefenses: 0,
    overdueDefenses: 0,
    submittedDocuments: 0,
    reviewedDocuments: 0,
    revisionDocuments: 0,
    uniquePrograms: 0,
};

const fallbackLoad: UpcomingScheduleLoad = {
    labels: [],
    values: [],
};

const progressFor = (value: number, total: number): number => {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
};

const formatDate = (value: string | null): string => {
    if (!value) {
        return 'TBA';
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value: string): string => {
    if (value.trim() === '') {
        return 'No updates yet';
    }

    const parsed = new Date(value.replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const scheduleStatusTone = (status: string): string => {
    if (status === 'Completed') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'Pending') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    if (status === 'Cancelled') {
        return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    return 'border-teal-200 bg-teal-50 text-teal-700';
};

const documentStatusTone = (status: string): string => {
    if (status === 'Approved') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'Revision Required') {
        return 'border-orange-200 bg-orange-50 text-orange-700';
    }

    return 'border-teal-200 bg-teal-50 text-teal-700';
};

const PanelistDashboard = () => {
    const { props } = usePage<PanelistDashboardProps>();
    const welcomeName = props.welcomeName ?? 'Panelist';
    const stats = props.stats ?? fallbackStats;
    const stageDistribution = props.stageDistribution ?? [];
    const scheduleStatusDistribution = props.scheduleStatusDistribution ?? [];
    const documentStatusDistribution = props.documentStatusDistribution ?? [];
    const programDistribution = props.programDistribution ?? [];
    const upcomingScheduleLoad = props.upcomingScheduleLoad ?? fallbackLoad;
    const upcomingSchedules = props.upcomingSchedules ?? [];
    const recentDocumentActivity = props.recentDocumentActivity ?? [];

    const stageTotal = stageDistribution.reduce((sum, item) => sum + item.value, 0);
    const scheduleStatusTotal = scheduleStatusDistribution.reduce((sum, item) => sum + item.value, 0);
    const documentStatusTotal = documentStatusDistribution.reduce((sum, item) => sum + item.value, 0);
    const programTotal = programDistribution.reduce((sum, item) => sum + item.value, 0);

    const hasStageData = stageTotal > 0;
    const hasScheduleStatusData = scheduleStatusTotal > 0;
    const hasDocumentData = documentStatusTotal > 0;
    const hasProgramData = programTotal > 0;
    const hasLoadData = upcomingScheduleLoad.values.some((value) => value > 0);

    const stagePieData = stageDistribution.map((item, index) => ({
        id: index,
        value: item.value,
        label: item.label,
        color: item.color,
    }));
    const scheduleStatusPieData = scheduleStatusDistribution.map((item, index) => ({
        id: index,
        value: item.value,
        label: item.label,
        color: item.color,
    }));
    const documentStatusPieData = documentStatusDistribution.map((item, index) => ({
        id: index,
        value: item.value,
        label: item.label,
        color: item.color,
    }));

    const scheduleCompletionRate = progressFor(stats.completedDefenses, scheduleStatusTotal);
    const documentReviewRate = progressFor(stats.reviewedDocuments, documentStatusTotal);
    const revisionRate = progressFor(stats.revisionDocuments, documentStatusTotal);

    const heroHighlights = [
        {
            label: 'Assigned Groups',
            value: stats.assignedGroups.toLocaleString(),
            icon: Users,
        },
        {
            label: 'Upcoming Defenses',
            value: stats.scheduledDefenses.toLocaleString(),
            icon: CalendarClock,
        },
        {
            label: 'Pending Evaluations',
            value: stats.pendingEvaluations.toLocaleString(),
            icon: ClipboardCheck,
        },
        {
            label: 'Reviewed Documents',
            value: stats.reviewedDocuments.toLocaleString(),
            icon: CheckCircle2,
        },
    ] as const;

    const operationTiles = [
        {
            label: 'Completed Defenses',
            value: stats.completedDefenses.toLocaleString(),
            helper: `${scheduleCompletionRate}% completion coverage`,
            icon: TrendingUp,
            tone: 'from-emerald-600 to-emerald-500',
        },
        {
            label: 'Overdue Defenses',
            value: stats.overdueDefenses.toLocaleString(),
            helper: 'Scheduled or pending past due dates',
            icon: TimerReset,
            tone: 'from-orange-500 to-amber-500',
        },
        {
            label: 'Submitted Documents',
            value: stats.submittedDocuments.toLocaleString(),
            helper: `${documentReviewRate}% already reviewed`,
            icon: FolderOpen,
            tone: 'from-teal-600 to-emerald-500',
        },
        {
            label: 'Needs Revision',
            value: stats.revisionDocuments.toLocaleString(),
            helper: `${revisionRate}% of total documents`,
            icon: FileSearch,
            tone: 'from-lime-600 to-emerald-500',
        },
    ] as const;

    const panelClassName = 'rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm';
    const programChartWidth = Math.max(360, programDistribution.length * 92);

    return (
        <PanelLayout title="Dashboard" subtitle="Panel Evaluation workspace overview">
            <div className="space-y-8">
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                            .cpms-scroll::-webkit-scrollbar {
                                height: 6px;
                            }
                            .cpms-scroll::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .cpms-scroll::-webkit-scrollbar-thumb {
                                background: #09be8293;
                                border-radius: 3px;
                            }
                            .cpms-scroll::-webkit-scrollbar-thumb:hover {
                                background: #00af78ff;
                            }
                            .cpms-scroll::-webkit-scrollbar-button {
                                display: none;
                            }
                        `,
                    }}
                />
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
                            <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-200 uppercase">Panelist Workspace</p>
                            <h3 className="mt-3 text-2xl font-semibold text-white md:text-[2rem] md:leading-[1.1]">
                                Evaluation Command Center
                            </h3>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100 md:text-base">
                                Hello {welcomeName}. Track your assigned defenses, monitor review outcomes, and move directly to your evaluation actions.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={panelistRoutes.assignedGroups.url()}
                                    className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    Open Assigned Groups
                                </Link>
                                <Link
                                    href={panelistRoutes.schedule.url()}
                                    className="inline-flex items-center rounded-xl border border-emerald-200/60 bg-white/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-white/20"
                                >
                                    View Schedule
                                </Link>
                                <Link
                                    href={panelistRoutes.evaluation.url()}
                                    className="inline-flex items-center rounded-xl border border-emerald-200/60 bg-white/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-white/20"
                                >
                                    Open Evaluation Form
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {heroHighlights.map((highlight, index) => (
                                <motion.div
                                    key={highlight.label}
                                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.08 + index * 0.06 }}
                                    className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-semibold tracking-wide text-emerald-100 uppercase">{highlight.label}</span>
                                        <highlight.icon className="h-4 w-4 text-emerald-100" />
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-white">{highlight.value}</div>
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
                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Panel Operations Snapshot</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Live metrics from your assigned schedules and submissions.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Current Load
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
                                <h3 className="text-lg font-semibold text-slate-900">Stage Distribution</h3>
                                <p className="mt-1 text-sm text-slate-600">Defense stage spread across your assignment history.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {stageTotal.toLocaleString()} entries
                            </span>
                        </div>

                        {hasStageData ? (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <PieChart
                                        height={190}
                                        margin={{ left: 88 }}
                                        series={[
                                            {
                                                data: stagePieData,
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

                                <div className="cpms-scroll overflow-x-auto pb-1">
                                    <div className="mx-auto flex w-max items-center justify-center gap-2">
                                        {stageDistribution.map((item) => (
                                            <div
                                                key={item.label}
                                                className="min-w-[105px] rounded-lg border border-emerald-100 px-2.5 py-2 text-center text-xs text-slate-700"
                                            >
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="font-medium">{item.label}</span>
                                                </div>
                                                <p className="mt-1 font-semibold text-slate-900 tabular-nums">{item.value.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
                                No stage records available for this panelist yet.
                            </div>
                        )}
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Schedule Status</h3>
                                <p className="mt-1 text-sm text-slate-600">Status split for all assigned defense schedules.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {scheduleStatusTotal.toLocaleString()} schedules
                            </span>
                        </div>

                        {hasScheduleStatusData ? (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <PieChart
                                        height={190}
                                        margin={{ left: 88 }}
                                        series={[
                                            {
                                                data: scheduleStatusPieData,
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

                                <div className="space-y-2">
                                    {scheduleStatusDistribution.map((item) => (
                                        <div key={item.label} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-2.5">
                                            <div className="flex items-center justify-between gap-2 text-xs text-slate-700">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="font-medium">{item.label}</span>
                                                </div>
                                                <span className="font-semibold text-slate-900">{item.value.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
                                No schedule status records yet.
                            </div>
                        )}
                    </div>

                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Program Coverage</h3>
                                <p className="mt-1 text-sm text-slate-600">Assigned groups by program track.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {stats.uniquePrograms} programs
                            </span>
                        </div>

                        {hasProgramData ? (
                            <div className="cpms-scroll mt-4 overflow-x-auto pb-1">
                                <Box sx={{ minWidth: programChartWidth }}>
                                    <BarChart
                                        width={programChartWidth}
                                        height={246}
                                        xAxis={[
                                            {
                                                scaleType: 'band',
                                                data: programDistribution.map((item) => item.label),
                                                tickLabelStyle: { fontSize: 10 },
                                            },
                                        ]}
                                        yAxis={[{ min: 0 }]}
                                        series={[
                                            {
                                                label: 'Groups',
                                                data: programDistribution.map((item) => item.value),
                                                color: '#10b981',
                                            },
                                        ]}
                                        margin={{ top: 16, right: 16, bottom: 52, left: 38 }}
                                        grid={{ horizontal: true }}
                                        slotProps={{ legend: { hidden: true } }}
                                        skipAnimation={false}
                                    />
                                </Box>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
                                No program distribution data yet.
                            </div>
                        )}
                    </div>

                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Upcoming 7-Day Load</h3>
                                <p className="mt-1 text-sm text-slate-600">Scheduled and pending defenses for the next week.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Weekly Forecast
                            </span>
                        </div>

                        {hasLoadData ? (
                            <Box sx={{ mt: 2 }}>
                                <LineChart
                                    height={246}
                                    xAxis={[{ data: upcomingScheduleLoad.labels, scaleType: 'point' }]}
                                    series={[
                                        {
                                            id: 'weekly-load',
                                            data: upcomingScheduleLoad.values,
                                            label: 'Defenses',
                                            color: '#059669',
                                            area: true,
                                            showMark: false,
                                            disableHighlight: true,
                                        },
                                    ]}
                                    margin={{ top: 16, right: 20, bottom: 28, left: 40 }}
                                    grid={{ vertical: true, horizontal: true }}
                                    disableLineItemHighlight
                                    skipAnimation={false}
                                />
                            </Box>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
                                No upcoming defense load in the next 7 days.
                            </div>
                        )}
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-2"
                >
                    <div className={panelClassName}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Upcoming Defense Queue</h3>
                                <p className="mt-1 text-sm text-slate-600">Your next assigned schedules from today onward.</p>
                            </div>
                            <Link
                                href={panelistRoutes.schedule.url()}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                                Open Full Schedule
                            </Link>
                        </div>

                        {upcomingSchedules.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingSchedules.map((schedule) => (
                                    <div key={schedule.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{schedule.groupName}</p>
                                                <p className="text-xs text-slate-600">
                                                    {formatDate(schedule.scheduledDate)}
                                                    {schedule.startTime ? ` • ${schedule.startTime}` : ''}
                                                    {schedule.roomName ? ` • ${schedule.roomName}` : ''}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">{schedule.stage}</p>
                                            </div>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${scheduleStatusTone(schedule.status)}`}
                                            >
                                                {schedule.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-8 text-center text-xs text-slate-500">
                                No upcoming schedules assigned yet.
                            </div>
                        )}
                    </div>

                    <div className={panelClassName}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Recent Document Activity</h3>
                                <p className="mt-1 text-sm text-slate-600">Latest submissions from your assigned groups.</p>
                            </div>
                            <Link
                                href={panelistRoutes.documents.url()}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                                Open Document Center
                            </Link>
                        </div>

                        {recentDocumentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {recentDocumentActivity.map((document) => (
                                    <div key={document.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900">{document.fileName}</p>
                                                <p className="text-xs text-slate-600">{document.groupName}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {document.requirementType}
                                                    {document.stage ? ` • ${document.stage}` : ''}
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(document.updatedAt)}</p>
                                            </div>
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${documentStatusTone(document.status)}`}
                                            >
                                                {document.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-8 text-center text-xs text-slate-500">
                                No document submissions found for your assigned groups.
                            </div>
                        )}
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.35 }}
                    className={panelClassName}
                >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Document Review Status</h3>
                            <p className="mt-1 text-sm text-slate-600">Submission outcomes from all assigned groups.</p>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {documentStatusTotal.toLocaleString()} submissions
                        </span>
                    </div>

                    {hasDocumentData ? (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <PieChart
                                    height={190}
                                    margin={{ left: 88 }}
                                    series={[
                                        {
                                            data: documentStatusPieData,
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

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {documentStatusDistribution.map((item) => (
                                    <div key={item.label} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{item.label}</span>
                                        </div>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-8 text-center text-xs text-slate-500">
                            No document review status records available yet.
                        </div>
                    )}
                </motion.section>
            </div>
        </PanelLayout>
    );
};

export default PanelistDashboard;
