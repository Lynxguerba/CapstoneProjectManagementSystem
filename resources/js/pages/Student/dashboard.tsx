import { usePage } from '@inertiajs/react';
import { Box } from '@mui/material';
import { PieChart } from '@mui/x-charts';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, Flag, Users } from 'lucide-react';
import React from 'react';
import StudentLayout from './_layout';

type QuickStat = {
    label: string;
    value: string;
    helper: string;
    progress: number;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    progressTone: string;
};

type TeamMember = {
    id: number;
    name: string;
    role: string;
    access: string;
    initials: string;
};

type ApprovedSubmission = {
    id: number;
    title: string;
    group: string;
    approvedOn: string;
};

type DashboardStage = {
    label: string;
    phaseLabel: string;
    progress: number;
};

type DashboardStats = {
    approvedSubmissions: number;
    inReviewSubmissions: number;
    teamMembers: number;
    daysLeft: number | null;
};

type DeadlineSummary = {
    requirementType: string;
    dueDate: string;
    daysLeft: number;
};

type StudentDashboardProps = {
    welcomeName?: string;
    groupName?: string | null;
    stage?: DashboardStage;
    stats?: DashboardStats;
    nextDeadline?: DeadlineSummary | null;
    teamMembers?: TeamMember[];
    recentApprovedSubmissions?: ApprovedSubmission[];
};

const fallbackStage: DashboardStage = {
    label: 'Concept',
    phaseLabel: 'Phase 1 of 5',
    progress: 20,
};

const fallbackStats: DashboardStats = {
    approvedSubmissions: 0,
    inReviewSubmissions: 0,
    teamMembers: 0,
    daysLeft: null,
};

const formatDateLabel = (value?: string | null): string => {
    if (!value) {
        return 'TBD';
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return value;
    }

    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatDaysLeft = (value: number | null): string => {
    if (value === null) {
        return 'No deadline yet';
    }

    if (value < 0) {
        return `${Math.abs(value)} day${Math.abs(value) === 1 ? '' : 's'} overdue`;
    }

    if (value === 0) {
        return 'Due today';
    }

    return `in ${value} day${value === 1 ? '' : 's'}`;
};

const toClampedProgress = (value: number): number => {
    return Math.max(0, Math.min(100, Math.round(value)));
};

const deadlineProgressFor = (daysLeft: number | null): number => {
    if (daysLeft === null) {
        return 0;
    }

    if (daysLeft <= 0) {
        return 100;
    }

    const referenceWindow = 30;

    return toClampedProgress(((referenceWindow - Math.min(daysLeft, referenceWindow)) / referenceWindow) * 100);
};

const getShortName = (fullName: string): string => {
    const trimmed = fullName.trim();

    if (trimmed === '') {
        return 'Student';
    }

    return trimmed.split(/\s+/)[0] ?? trimmed;
};

const StudentDashboard = () => {
    const { props } = usePage<StudentDashboardProps>();

    const stage = props.stage ?? fallbackStage;
    const stats = props.stats ?? fallbackStats;
    const nextDeadline = props.nextDeadline ?? null;
    const teamMembers = props.teamMembers ?? [];
    const approvedSubmissions = props.recentApprovedSubmissions ?? [];
    const welcomeName = props.welcomeName ?? 'Student';
    const shortName = getShortName(welcomeName);
    const groupName = props.groupName ?? 'No Group Assigned';

    const projectProgress = toClampedProgress(stage.progress);
    const projectProgressData = [
        { id: 0, value: projectProgress, label: 'Completed', color: '#10b981' },
        { id: 1, value: Math.max(0, 100 - projectProgress), label: 'Remaining', color: '#d1fae5' },
    ];

    const submissionTotal = stats.approvedSubmissions + stats.inReviewSubmissions;
    const hasSubmissionData = submissionTotal > 0;
    const submissionStatusData = hasSubmissionData
        ? [
              { id: 0, value: stats.approvedSubmissions, label: 'Approved', color: '#059669' },
              { id: 1, value: stats.inReviewSubmissions, label: 'In Review', color: '#34d399' },
          ]
        : [{ id: 0, value: 1, label: 'No submissions yet', color: '#d1fae5' }];

    const quickStats: QuickStat[] = [
        {
            label: 'Project Status',
            value: stage.label,
            helper: stage.phaseLabel,
            progress: projectProgress,
            icon: Flag,
            tone: 'from-emerald-600 to-teal-600',
            progressTone: 'from-emerald-600 to-teal-600',
        },
        {
            label: 'Approved Submissions',
            value: stats.approvedSubmissions.toLocaleString(),
            helper: 'Approved requirement records',
            progress: submissionTotal > 0 ? toClampedProgress((stats.approvedSubmissions / submissionTotal) * 100) : 0,
            icon: CheckCircle2,
            tone: 'from-emerald-500 to-green-600',
            progressTone: 'from-emerald-500 to-green-600',
        },
        {
            label: 'Team Members',
            value: stats.teamMembers.toLocaleString(),
            helper: groupName,
            progress: stats.teamMembers > 0 ? 100 : 0,
            icon: Users,
            tone: 'from-teal-600 to-emerald-500',
            progressTone: 'from-teal-600 to-emerald-500',
        },
        {
            label: 'Days Left',
            value: stats.daysLeft !== null ? stats.daysLeft.toString() : '--',
            helper: nextDeadline ? `${nextDeadline.requirementType} deadline` : 'No upcoming deadlines',
            progress: deadlineProgressFor(stats.daysLeft),
            icon: Clock3,
            tone: 'from-green-600 to-emerald-500',
            progressTone: 'from-green-600 to-emerald-500',
        },
    ];

    const avatarToneByIndex = ['bg-blue-500', 'bg-emerald-500', 'bg-teal-500', 'bg-green-500'];

    return (
        <StudentLayout title="Dashboard" subtitle="Student Dashboard">
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 }}
                    className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg"
                >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-xl font-bold">Welcome back, {shortName}!</h3>
                            <p className="mt-1 text-sm text-emerald-50">
                                {groupName !== 'No Group Assigned'
                                    ? `Your group (${groupName}) is currently in ${stage.label}.`
                                    : 'You are not yet assigned to a capstone group.'}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/30 bg-white/15 px-5 py-3 backdrop-blur-sm">
                            <p className="text-xs font-medium text-emerald-50">Next Deadline</p>
                            <p className="mt-1 text-base font-bold">{nextDeadline?.requirementType ?? 'No upcoming deadlines'}</p>
                            <p className="text-xs text-emerald-50">
                                {nextDeadline
                                    ? `${formatDateLabel(nextDeadline.dueDate)} · ${formatDaysLeft(nextDeadline.daysLeft)}`
                                    : 'No due dates available'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
                >
                    {quickStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.04 * index }}
                            whileHover={{ y: -4 }}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{stat.label}</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                                    <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
                                </div>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tone} shadow-sm`}>
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full rounded-full bg-emerald-100/70">
                                <div className={`h-1.5 rounded-full bg-gradient-to-r ${stat.progressTone}`} style={{ width: `${stat.progress}%` }} />
                            </div>
                        </motion.div>
                    ))}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14 }}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-3"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Project Progress</h3>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                {stage.label}
                            </span>
                        </div>
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <PieChart
                                    height={190}
                                    margin={{ left: 25, right: 25, top: 10, bottom: 10 }}
                                    series={[
                                        {
                                            data: projectProgressData,
                                            innerRadius: 48,
                                            outerRadius: 76,
                                            cornerRadius: 4,
                                            paddingAngle: 2,
                                            highlightScope: { faded: 'global', highlighted: 'item' },
                                            faded: { innerRadius: 48, additionalRadius: -4, color: 'gray' },
                                        },
                                    ]}
                                    slotProps={{ legend: { hidden: true } }}
                                    skipAnimation={false}
                                />
                            </Box>
                        </motion.div>
                        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                Completed {projectProgress}%
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-100" />
                                Remaining {Math.max(0, 100 - projectProgress)}%
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Submission Status</h3>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                {groupName}
                            </span>
                        </div>
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.24 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <PieChart
                                    height={190}
                                    margin={{ left: 25, right: 25, top: 10, bottom: 10 }}
                                    series={[
                                        {
                                            data: submissionStatusData,
                                            innerRadius: 48,
                                            outerRadius: 76,
                                            cornerRadius: 4,
                                            paddingAngle: 2,
                                            highlightScope: { faded: 'global', highlighted: 'item' },
                                            faded: { innerRadius: 48, additionalRadius: -4, color: 'gray' },
                                        },
                                    ]}
                                    slotProps={{ legend: { hidden: true } }}
                                    skipAnimation={false}
                                />
                            </Box>
                        </motion.div>
                        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-600">
                            {hasSubmissionData ? (
                                <>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-700" />
                                        Approved {stats.approvedSubmissions}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                        In Review {stats.inReviewSubmissions}
                                    </span>
                                </>
                            ) : (
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-100" />
                                    No submissions yet
                                </span>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24 }}
                        whileHover={{ y: -3 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Your Team Members</h3>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                {groupName}
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {teamMembers.length > 0 ? (
                                teamMembers.map((member, index) => {
                                    const avatarTone = avatarToneByIndex[index % avatarToneByIndex.length] ?? avatarToneByIndex[0];
                                    const badgeTone =
                                        member.access === 'Full Access' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700';

                                    return (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.28 + index * 0.04 }}
                                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                                        >
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${avatarTone}`}
                                            >
                                                {member.initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                                                <p className="truncate text-xs text-slate-500">{member.role}</p>
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeTone}`}>{member.access}</span>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                    No group members found.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Recent Approved Submissions</h3>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {approvedSubmissions.length} Approved
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {approvedSubmissions.length > 0 ? (
                            approvedSubmissions.map((record) => (
                                <motion.div
                                    key={record.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -2 }}
                                    className="rounded-r-xl border border-emerald-200 bg-emerald-50 p-4"
                                    style={{ borderLeftWidth: '4px' }}
                                >
                                    <p className="font-medium text-emerald-900">{record.title}</p>
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        <p className="text-xs text-emerald-700">
                                            {record.group} · Approved on {formatDateLabel(record.approvedOn)}
                                        </p>
                                        <span className="rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                            Approved
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2">
                                There are no approved submissions yet for your group.
                            </div>
                        )}
                    </div>

                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        Dashboard metrics are now pulled from your live group, requirement, and submission records.
                    </div>
                </motion.section>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
