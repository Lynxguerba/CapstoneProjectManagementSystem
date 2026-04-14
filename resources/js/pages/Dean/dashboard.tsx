import { Link, usePage } from '@inertiajs/react';
import { Box } from '@mui/material';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { FolderKanban, GraduationCap, Layers3, Tags, UserCheck } from 'lucide-react';
import React from 'react';
import deanRoutes from '../../routes/dean';
import DeanLayout from './_layout';

type DashboardStats = {
    approvedProjects: number;
    categories: number;
    programSets: number;
    groupsWithAdviser: number;
    groupsWithoutAdviser: number;
};

type DistributionItem = {
    label: string;
    value: number;
    color: string;
};

type ProgramSetGroupCount = {
    label: string;
    value: number;
    program?: string | null;
};

type ApprovalTrendEvent = {
    occurredAt: string;
};

type ApprovalTrend = {
    events: ApprovalTrendEvent[];
};

type ApprovalTrendSeries = {
    labels: string[];
    values: number[];
};

type RecentApproval = {
    id: number;
    groupName: string;
    title: string;
    program: string | null;
    approvedAt: string | null;
};

type DeanDashboardProps = {
    stats?: DashboardStats;
    programDistribution?: DistributionItem[];
    programSetGroups?: ProgramSetGroupCount[];
    approvalTrend?: ApprovalTrend;
    recentApprovals?: RecentApproval[];
};

const fallbackStats: DashboardStats = {
    approvedProjects: 0,
    categories: 0,
    programSets: 0,
    groupsWithAdviser: 0,
    groupsWithoutAdviser: 0,
};

const fallbackProgramDistribution: DistributionItem[] = [
    { label: 'BSIT', value: 0, color: '#047857' },
    { label: 'BSIS', value: 0, color: '#65a30d' },
];

const fallbackApprovalTrend: ApprovalTrend = {
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

const buildLocalApprovalTrendSeries = (events: ApprovalTrendEvent[]): ApprovalTrendSeries => {
    const dayStarts = Array.from({ length: 7 }, (_, index) => {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - (6 - index));

        return dayStart;
    });

    const labels = dayStarts.map((dayStart) => dayStart.toLocaleDateString(undefined, { weekday: 'short' }));
    const values = Array.from({ length: 7 }, () => 0);
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

        values[dayIndex] += 1;
    });

    return { labels, values };
};

const formatDateTime = (value: string | null): string => {
    if (!value || value.trim() === '') {
        return '—';
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

const Dashboard = () => {
    const { props } = usePage<DeanDashboardProps>();
    const stats = props.stats ?? fallbackStats;
    const programDistribution = props.programDistribution ?? fallbackProgramDistribution;
    const programSetGroups = props.programSetGroups ?? [];
    const approvalTrend = props.approvalTrend ?? fallbackApprovalTrend;
    const recentApprovals = props.recentApprovals ?? [];

    const programTotal = programDistribution.reduce((sum, item) => sum + item.value, 0);
    const hasProgramData = programTotal > 0;
    const approvedProjectsTotal = stats.approvedProjects;
    const adviserCoverageTotal = stats.groupsWithAdviser + stats.groupsWithoutAdviser;
    const adviserCoverageRate = progressFor(stats.groupsWithAdviser, adviserCoverageTotal);

    const programPieData = programDistribution.map((item, index) => ({
        id: index,
        value: item.value,
        label: item.label,
        color: item.color,
    }));

    const [selectedProgramSetChartFilter, setSelectedProgramSetChartFilter] = React.useState<'All' | 'BSIT' | 'BSIS'>('All');
    const filteredProgramSetGroups = React.useMemo(() => {
        if (selectedProgramSetChartFilter === 'All') {
            return programSetGroups;
        }

        return programSetGroups.filter((item) => (item.program ?? '').toUpperCase() === selectedProgramSetChartFilter);
    }, [programSetGroups, selectedProgramSetChartFilter]);
    const hasProgramSetGroupData = filteredProgramSetGroups.some((item) => item.value > 0);
    const programSetBarChartWidth = Math.max(520, filteredProgramSetGroups.length * 92);

    const approvalTrendSeries = React.useMemo(() => buildLocalApprovalTrendSeries(approvalTrend.events), [approvalTrend.events]);
    const hasApprovalData = approvalTrendSeries.values.some((value) => value > 0);

    const heroHighlights = [
        {
            label: 'Approved Projects',
            value: approvedProjectsTotal.toLocaleString(),
            icon: FolderKanban,
        },
        {
            label: 'Categories',
            value: stats.categories.toLocaleString(),
            icon: Tags,
        },
        {
            label: 'Program Sets',
            value: stats.programSets.toLocaleString(),
            icon: Layers3,
        },
        {
            label: 'Adviser Coverage',
            value: `${adviserCoverageRate}%`,
            icon: UserCheck,
        },
    ] as const;

    const adviserCoverage = [
        {
            label: 'With Adviser',
            value: stats.groupsWithAdviser,
            progress: progressFor(stats.groupsWithAdviser, adviserCoverageTotal),
            pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            bar: 'bg-emerald-500',
        },
        {
            label: 'Without Adviser',
            value: stats.groupsWithoutAdviser,
            progress: progressFor(stats.groupsWithoutAdviser, adviserCoverageTotal),
            pill: 'border-slate-200 bg-slate-50 text-slate-700',
            bar: 'bg-slate-400',
        },
    ] as const;

    const panelClassName = 'rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm';

    return (
        <DeanLayout title="Dashboard" subtitle="Dean workspace overview">
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
                    className="relative overflow-hidden rounded-3xl border border-emerald-300/70 bg-gradient-to-br from-emerald-950 via-emerald-900 to-sky-900 p-6 shadow-xl shadow-emerald-950/20 md:p-8"
                >
                    <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-sky-200/15 blur-3xl" />

                    <div className="relative grid gap-8 xl:grid-cols-[1.25fr_1fr]">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-200 uppercase">Dean Workspace</p>
                            <h3 className="mt-3 text-2xl font-semibold text-white md:text-[2rem] md:leading-[1.1]">Academic Oversight Snapshot</h3>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100 md:text-base">
                                Review approved capstone concepts, monitor adviser coverage, and maintain categories for BSIT and BSIS.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={deanRoutes.projects.url()}
                                    className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    Review Projects
                                </Link>
                                <Link
                                    href={deanRoutes.categories.url()}
                                    className="inline-flex items-center rounded-xl border border-emerald-200/60 bg-white/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-white/20"
                                >
                                    Manage Categories
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
                                    <div className="mt-2 text-2xl font-semibold text-white tabular-nums">{highlight.value}</div>
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
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    

                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Recent Approvals</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Latest approved concepts in scope.</p>
                            </div>
                        </div>

                        {recentApprovals.length ? (
                            <div className="mt-4 space-y-2">
                                {recentApprovals.map((approval) => (
                                    <Link
                                        key={approval.id}
                                        href={deanRoutes.projects.url()}
                                        className="block rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 transition hover:bg-emerald-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-slate-900">{approval.title}</p>
                                                <p className="mt-1 truncate text-[11px] text-slate-600">{approval.groupName}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {approval.program ? (
                                                    <span className="inline-flex rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                        {approval.program}
                                                    </span>
                                                ) : null}
                                                <p className="mt-1 text-[10px] text-slate-500">{formatDateTime(approval.approvedAt)}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
                                No approved concept titles available yet.
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
                    <motion.div whileHover={{ y: -3, scale: 1.005 }} transition={{ duration: 0.18 }} className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Program Distribution</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Approved concepts split between BSIT and BSIS.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {programTotal.toLocaleString()} total
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

                                <div className="cpms-scroll overflow-x-auto pb-1">
                                    <div className="mx-auto flex w-max items-center justify-center gap-2">
                                        {programDistribution.map((program) => (
                                            <div
                                                key={program.label}
                                                className="min-w-[105px] rounded-lg border border-emerald-100 px-2.5 py-2 text-center text-xs text-slate-700"
                                            >
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: program.color }} />
                                                    <span className="font-medium">{program.label}</span>
                                                </div>
                                                <p className="mt-1 font-semibold text-slate-900 tabular-nums">{program.value.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
                                No approved concepts recorded for BSIT/BSIS yet.
                            </div>
                        )}
                    </motion.div>

                    <motion.div whileHover={{ y: -3, scale: 1.005 }} transition={{ duration: 0.18 }} className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers3 className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Program Set Approvals</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Approved concepts count per program set.</p>
                            </div>

                            <select
                                value={selectedProgramSetChartFilter}
                                onChange={(event) => setSelectedProgramSetChartFilter(event.target.value as 'All' | 'BSIT' | 'BSIS')}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                            >
                                <option value="All">All Programs</option>
                                <option value="BSIT">BSIT</option>
                                <option value="BSIS">BSIS</option>
                            </select>
                        </div>

                        {hasProgramSetGroupData ? (
                            <div className="cpms-scroll mt-4 overflow-x-auto pb-1">
                                <Box sx={{ minWidth: programSetBarChartWidth }}>
                                    <BarChart
                                        width={programSetBarChartWidth}
                                        height={248}
                                        xAxis={[
                                            {
                                                scaleType: 'band',
                                                data: filteredProgramSetGroups.map((item) => item.label),
                                                tickLabelStyle: { fontSize: 10 },
                                            },
                                        ]}
                                        yAxis={[{ min: 0 }]}
                                        series={[
                                            {
                                                label: 'Approved',
                                                data: filteredProgramSetGroups.map((item) => item.value),
                                                color: '#10b981',
                                            },
                                        ]}
                                        margin={{ top: 16, right: 16, bottom: 54, left: 40 }}
                                        grid={{ horizontal: true }}
                                        slotProps={{ legend: { hidden: true } }}
                                        skipAnimation={false}
                                        sx={{
                                            '& .MuiBarElement-root': {
                                                transformOrigin: 'center bottom',
                                                transition: 'transform 160ms ease, filter 160ms ease',
                                            },
                                            '& .MuiBarElement-root:hover': {
                                                transform: 'scaleY(1.05)',
                                                filter: 'brightness(1.02)',
                                            },
                                        }}
                                    />
                                </Box>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-slate-500">
                                No approved program-set records available yet.
                            </div>
                        )}
                    </motion.div>

                    <motion.div whileHover={{ y: -3, scale: 1.005 }} transition={{ duration: 0.18 }} className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Adviser Coverage</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Adviser assignment split for approved projects.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {adviserCoverageTotal.toLocaleString()} projects
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {adviserCoverage.map((status) => (
                                <div key={status.label} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.pill}`}>
                                            {status.label}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-900 tabular-nums">{status.value.toLocaleString()}</span>
                                    </div>
                                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200/80">
                                        <div className={`h-2 rounded-full ${status.bar}`} style={{ width: `${status.progress}%` }} />
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">{status.progress}% of approved projects</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
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
                            <h3 className="text-lg font-semibold text-slate-900">Approvals Trend</h3>
                            <p className="mt-1 text-sm text-slate-600">Daily approved concept activity for the last 7 days (local time).</p>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Weekly Timeline
                        </span>
                    </div>

                    {hasApprovalData ? (
                        <Box>
                            <LineChart
                                height={260}
                                xAxis={[{ data: approvalTrendSeries.labels, scaleType: 'point' }]}
                                series={[
                                    {
                                        id: 'approvals',
                                        data: approvalTrendSeries.values,
                                        label: 'Approvals',
                                        color: '#10b981',
                                        area: true,
                                        disableHighlight: true,
                                        showMark: false,
                                    },
                                ]}
                                margin={{ top: 16, right: 20, bottom: 28, left: 40 }}
                                grid={{ vertical: true, horizontal: true }}
                                disableLineItemHighlight
                                sx={{
                                    '& .MuiAreaElement-series-approvals': {
                                        fill: 'url(#deanApprovalsAreaGradient) !important',
                                    },
                                    '& .MuiLineElement-series-approvals': {
                                        strokeWidth: 3,
                                    },
                                }}
                                skipAnimation={false}
                            >
                                <defs>
                                    <linearGradient id="deanApprovalsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
                                    </linearGradient>
                                </defs>
                            </LineChart>
                        </Box>
                    ) : (
                        <div className="mt-2 rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-8 text-center text-xs text-slate-500">
                            No approval activity recorded in the last 7 days yet.
                        </div>
                    )}
                </motion.section>
            </div>
        </DeanLayout>
    );
};

export default Dashboard;
