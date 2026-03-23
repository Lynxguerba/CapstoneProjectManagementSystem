import { Link, usePage } from '@inertiajs/react';
import { Box } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { CalendarCheck, CheckCircle2, GraduationCap, Layers3, Scale, TriangleAlert, UserCheck, Users } from 'lucide-react';
import React from 'react';
import panelistAssignment from '../../routes/instructor/panelist-assignment';
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

type ProgramSetSummary = {
    id: number;
    name?: string | null;
    program: string;
    school_year?: string | null;
    students_count?: number;
    groups_count?: number;
};

type StatusRecordsByYear = {
    label: string;
    academic_year_id?: number | null;
    is_current: boolean;
    records: StatusRecord[];
};

type ProgramDistributionRecord = {
    label: string;
    value: number;
    color: string;
};

type PanelistSummary = {
    id: number;
    name?: string | null;
    email?: string | null;
    groups_count?: number;
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
    statusRecordsByYear?: StatusRecordsByYear[];
    stageScale?: StageRecord[];
    programSets?: ProgramSetSummary[];
    programDistribution?: ProgramDistributionRecord[];
    panelists?: PanelistSummary[];
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
    const statusRecordsByYear = React.useMemo(() => props.statusRecordsByYear ?? [], [props.statusRecordsByYear]);
    const stageScale = props.stageScale ?? [];
    const programSets = props.programSets ?? [];
    const programDistribution = props.programDistribution ?? [];
    const panelists = props.panelists ?? [];
    const groups = props.groups ?? [];
    const upcomingSchedules = props.upcomingSchedules ?? [];
    const attentionItems = props.attentionItems ?? [];

    const adviserProgress = progressFor(stats.adviserAssigned, stats.totalGroups);
    const panelProgress = progressFor(stats.panelSlotsFilled, stats.panelSlotsTotal);
    const schedulingProgress = progressFor(stats.scheduledGroups, stats.totalGroups);
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

    const statusYearMap = React.useMemo(() => {
        const map = new Map<string, StatusRecordsByYear>();
        statusRecordsByYear.forEach((record) => {
            map.set(record.label, record);
        });

        return map;
    }, [statusRecordsByYear]);

    const statusAcademicYearOptions = React.useMemo(() => {
        const labels = statusRecordsByYear.map((year) => year.label).filter((label) => label !== '');
        const uniqueLabels = Array.from(new Set(labels));

        return ['All', ...uniqueLabels];
    }, [statusRecordsByYear]);

    const defaultStatusYear = React.useMemo(() => {
        const currentYear = statusRecordsByYear.find((year) => year.is_current);

        return currentYear?.label ?? 'All';
    }, [statusRecordsByYear]);

    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(defaultStatusYear);

    React.useEffect(() => {
        if (statusAcademicYearOptions.includes(selectedAcademicYear)) {
            return;
        }

        setSelectedAcademicYear(defaultStatusYear);
    }, [defaultStatusYear, selectedAcademicYear, statusAcademicYearOptions]);

    const activeStatusRecords =
        selectedAcademicYear === 'All' ? statusRecords : (statusRecordsByYear.find((year) => year.label === selectedAcademicYear)?.records ?? []);

    const programToneStyles: Record<string, string> = {
        BSIT: 'from-emerald-600 to-emerald-400',
        BSIS: 'from-teal-600 to-emerald-500',
    };

    const panelistToneStyles = ['from-emerald-600 to-emerald-500', 'from-teal-600 to-emerald-500', 'from-green-600 to-emerald-500'];

    const programSetSnapshots = programSets.map((programSet, index) => {
        const name = typeof programSet.name === 'string' ? programSet.name.trim() : '';
        const labelParts = [programSet.program, programSet.school_year].filter((value): value is string => Boolean(value));
        const label = name !== '' ? name : labelParts.join(' ');
        const shortLabel = label.length > 12 ? `${label.slice(0, 12)}...` : label;
        const groupsCount = programSet.groups_count ?? 0;

        return {
            id: programSet.id,
            label: label !== '' ? label : `Program Set ${index + 1}`,
            shortLabel: shortLabel !== '' ? shortLabel : `Set ${index + 1}`,
            program: programSet.program,
            schoolYear: programSet.school_year ?? '',
            groupsCount,
            progress: progressFor(groupsCount, stats.totalGroups),
            tone: programToneStyles[programSet.program] ?? 'from-emerald-600 to-emerald-500',
        };
    });

    const panelistSnapshots = panelists.map((panelist, index) => {
        const name = typeof panelist.name === 'string' ? panelist.name.trim() : '';
        const email = typeof panelist.email === 'string' ? panelist.email.trim() : '';
        const groupsCount = panelist.groups_count ?? 0;

        return {
            id: panelist.id,
            name: name !== '' ? name : `Panelist ${index + 1}`,
            email: email !== '' ? email : null,
            groupsCount,
            progress: progressFor(groupsCount, stats.totalGroups),
            tone: panelistToneStyles[index % panelistToneStyles.length],
        };
    });

    const panelistHighlights = panelistSnapshots.slice(0, 4);

    const programDistributionTotal = programDistribution.reduce((sum, record) => sum + record.value, 0);
    const hasProgramDistribution = programDistribution.some((record) => record.value > 0);

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
        Final: 'bg-emerald-200',
    };

    const attentionToneStyles: Record<AttentionItem['tone'], string> = {
        info: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-green-200 bg-green-50 text-green-700',
        danger: 'border-teal-200 bg-teal-50 text-teal-700',
    };

    const dashboardHighlights = [
        {
            label: 'Total Groups',
            value: stats.totalGroups,
            icon: Users,
        },
        {
            label: 'Students',
            value: stats.students,
            icon: GraduationCap,
        },
        {
            label: 'Open Panel Slots',
            value: stats.panelSlotsOpen,
            icon: Layers3,
        },
        {
            label: 'Upcoming Defenses',
            value: stats.upcomingDefenses,
            icon: CalendarCheck,
        },
    ] as const;

    const quickActions = [
        {
            label: 'Adviser Assignment',
            description: 'Assign or rebalance advisers per group.',
            href: '/instructor/adviser-assignment',
            icon: GraduationCap,
            tone: 'from-emerald-700 to-emerald-500',
        },
        {
            label: 'Panelist Assignment',
            description: 'Fill panel slots and monitor panel load.',
            href: '/instructor/panelist-assignment',
            icon: UserCheck,
            tone: 'from-green-700 to-emerald-500',
        },
        {
            label: 'Scheduling',
            description: 'Manage defense calendar, rooms, and timing.',
            href: '/instructor/scheduling',
            icon: CalendarCheck,
            tone: 'from-emerald-800 to-green-600',
        },
        {
            label: 'Group Monitoring',
            description: 'Track group status and completion stages.',
            href: '/instructor/groups',
            icon: Scale,
            tone: 'from-emerald-600 to-lime-500',
        },
    ] as const;

    const workloadIntensity = progressFor(
        stats.adviserUnassigned + stats.panelSlotsOpen + stats.panelGroupsNeeding,
        Math.max(1, stats.totalGroups * 3),
    );

    const metricCardClassName =
        'group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg';
    const panelClassName =
        'rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm';

    return (
        <InstructorLayout title="Dashboard" subtitle="Instructor Dashboard">
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
                            <p className="text-[11px] font-semibold tracking-[0.24em] text-emerald-200 uppercase">Instructor Workspace</p>
                            <h3 className="mt-3 text-2xl font-semibold text-white md:text-[2rem] md:leading-[1.1]">
                                Program Set Monitoring Snapshot
                            </h3>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100 md:text-base">
                                Monitor assignments, scheduling, and capstone stage progress from one dashboard view.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/instructor/groups"
                                    className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    Open Group Monitoring
                                </Link>
                                <Link
                                    href="/instructor/scheduling"
                                    className="inline-flex items-center rounded-xl border border-emerald-200/60 bg-white/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-white/20"
                                >
                                    Open Scheduling
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
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers3 className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Program Set Group Scale</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Group counts for each program set you handle.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {programSetSnapshots.length} program set{programSetSnapshots.length === 1 ? '' : 's'}
                            </span>
                        </div>

                        <Box sx={{ mt: 3 }}>
                            {programSetSnapshots.length > 0 ? (
                                <BarChart
                                    height={260}
                                    xAxis={[{ data: programSetSnapshots.map((set) => set.shortLabel), scaleType: 'band' }]}
                                    series={[{ data: programSetSnapshots.map((set) => set.groupsCount), color: '#10b981' }]}
                                    margin={{ top: 20, right: 20, bottom: 50, left: 40 }}
                                    grid={{ vertical: true, horizontal: true }}
                                />
                            ) : (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-500">
                                    No program set records available yet.
                                </div>
                            )}
                        </Box>
                    </div>

                    <div className={panelClassName}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                                    <h3 className="text-lg font-semibold text-slate-900">Status Distribution</h3>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Scheduled vs pending outcomes by academic year.</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <span>A.Y</span>
                                <select
                                    value={selectedAcademicYear}
                                    onChange={(event) => setSelectedAcademicYear(event.target.value)}
                                    className="bg-transparent text-xs font-semibold text-emerald-700 focus:outline-none"
                                >
                                    {statusAcademicYearOptions.map((year) => {
                                        if (year === 'All') {
                                            return (
                                                <option key={year} value={year}>
                                                    All A.Y.
                                                </option>
                                            );
                                        }

                                        const yearMeta = statusYearMap.get(year);
                                        const suffix = yearMeta?.is_current ? ' (current)' : '';

                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                                {suffix}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <Box sx={{ mt: 2 }}>
                            <motion.div
                                key={selectedAcademicYear}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="flex flex-1 justify-center">
                                    {activeStatusRecords.length > 0 ? (
                                        <PieChart
                                            height={260}
                                            series={[
                                                {
                                                    data: activeStatusRecords.map((item, index) => ({
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
                                    ) : (
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-500">
                                            No status records for the selected academic year.
                                        </div>
                                    )}
                                </div>

                                <div className="lg:w-44">
                                    <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Legend</div>
                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
                                        {activeStatusRecords.map((item) => (
                                            <div key={item.label} className="flex items-center gap-2 text-xs text-slate-700">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="truncate font-medium">{item.label}</span>
                                                <span className="ml-auto text-slate-500 tabular-nums">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </Box>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className={panelClassName}>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Program Distribution</h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">Students handled per BSIS and BSIT program set.</p>

                        <Box sx={{ mt: 2 }}>
                            {hasProgramDistribution ? (
                                <motion.div
                                    key={programDistributionTotal}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <PieChart
                                        sx={{ ml: 10 }}
                                        height={220}
                                        series={[
                                            {
                                                data: programDistribution.map((record, index) => ({
                                                    id: index,
                                                    value: record.value,
                                                    label: record.label,
                                                    color: record.color,
                                                })),
                                                innerRadius: 70,
                                                outerRadius: 100,
                                                paddingAngle: 4,
                                                cornerRadius: 6,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 70, additionalRadius: -4, color: 'gray' },
                                            },
                                        ]}
                                        slotProps={{ legend: { hidden: true } }}
                                    />
                                    <div className="text-xs font-semibold text-slate-600">
                                        Total students: {programDistributionTotal.toLocaleString()}
                                    </div>
                                    <div className="grid w-full grid-cols-2 gap-2">
                                        {programDistribution.map((record) => (
                                            <div key={record.label} className="flex items-center gap-2 text-xs text-slate-700">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: record.color }} />
                                                <span className="font-medium">{record.label}</span>
                                                <span className="ml-auto text-slate-500 tabular-nums">{record.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-500">
                                    No students assigned to BSIS or BSIT yet.
                                </div>
                            )}
                        </Box>
                    </div>
                    <div className={`${panelClassName} xl:col-span-2`}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Panelist Assignments</h3>
                                <p className="mt-1 text-sm text-slate-600">Panelists assigned across your program set groups.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {panelistHighlights.length} panelist{panelistHighlights.length === 1 ? '' : 's'}
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {panelistHighlights.map((panelist) => (
                                <Link
                                    key={panelist.id}
                                    href={panelistAssignment.manage.url({ panelist: panelist.id })}
                                    className="group rounded-xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/50"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{panelist.name}</div>
                                            <div className="mt-1 text-xs text-slate-500">{panelist.email ?? 'Email pending'}</div>
                                        </div>
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${panelist.tone} shadow-sm`}
                                        >
                                            <UserCheck className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                                        <span className="font-semibold">{panelist.groupsCount.toLocaleString()} groups</span>
                                        <span>{panelist.progress}% coverage</span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-100/60">
                                        <div
                                            className={`h-1.5 rounded-full bg-gradient-to-r ${panelist.tone}`}
                                            style={{ width: `${panelist.progress}%` }}
                                        />
                                    </div>
                                </Link>
                            ))}
                            {panelistHighlights.length === 0 ? (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-500">
                                    No panelists assigned to your groups yet.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                    className="grid grid-cols-1 gap-6 xl:grid-cols-3"
                >
                    <div className={`${panelClassName} xl:col-span-2`}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Active Groups</h3>
                                <p className="mt-1 text-sm text-slate-600">Latest schedule status per group.</p>
                            </div>
                            <Link
                                href="/instructor/groups"
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                                View groups
                            </Link>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-emerald-100 text-emerald-700">
                                        <th className="py-3 text-left font-semibold">Group</th>
                                        <th className="py-3 text-left font-semibold">Members</th>
                                        <th className="py-3 text-left font-semibold">Adviser</th>
                                        <th className="py-3 text-left font-semibold">Status</th>
                                        <th className="py-3 text-left font-semibold">Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
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

                    <div className={panelClassName}>
                        <div className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-emerald-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Capstone Scale</h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">Latest stage completion across groups.</p>

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
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-500">
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
                    <div className={panelClassName}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                <CalendarCheck className="h-5 w-5 text-emerald-700" /> Upcoming Defense Schedules
                            </h2>
                            <Link href="/instructor/scheduling" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                                View calendar
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {upcomingSchedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/80"
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
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-500">
                                    No upcoming defense schedules yet.
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className={panelClassName}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                <TriangleAlert className="h-5 w-5 text-emerald-700" /> Attention Required
                            </h2>
                            <Link href="/instructor/adviser-assignment" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
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
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-500">
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
