import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Lock, UserCheck } from 'lucide-react';
import React from 'react';
import studentRoutes from '../../routes/student';
import StudentLayout from './_layout';

type PanelistSummary = {
    id?: number | null;
    name?: string | null;
    slot?: number;
    email?: string | null;
};

type RoomRow = {
    id: number;
    name: string;
    capacity?: number;
    is_active?: boolean;
};

type ScheduleRow = {
    id: number;
    group_id?: number | null;
    group_name?: string | null;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    stage?: string | null;
    status?: 'Scheduled' | 'Completed' | 'Pending' | 'Cancelled' | string;
    scheduled_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    notes?: string | null;
    room?: RoomRow | null;
    panelists?: PanelistSummary[];
};

type GroupSummary = {
    id: number;
    name: string;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    concept_verdict?: string | null;
};

type AdviserSummary = {
    id: number;
    name?: string | null;
    email?: string | null;
};

type ConceptRequirementRow = {
    id: number;
    requirement_type: string;
    is_recommendation?: boolean;
    status: 'Approved' | 'For Review' | 'Revise' | 'Missing' | string;
    submission?: {
        id: number;
        file_name?: string | null;
        status?: string | null;
        adviser_status?: string | null;
        submitted_at?: string | null;
    } | null;
};

type ConceptReadiness = {
    status: 'Approved' | 'For Review' | 'Revise' | 'Missing' | string;
    approved: boolean;
    latest_submitted_at?: string | null;
    requirements?: ConceptRequirementRow[];
};

type StudentSchedulePageProps = {
    group?: GroupSummary | null;
    adviser?: AdviserSummary | null;
    panelists?: PanelistSummary[];
    schedules?: ScheduleRow[];
    conceptReadiness?: ConceptReadiness | null;
};

type PhaseRow = {
    phase: string;
    status: PhaseStatus | 'Locked';
    rawStatus: PhaseStatus;
    schedule: ScheduleRow | null;
    isLocked: boolean;
    lockReason?: string;
};

type PhaseStatus = 'Pending' | 'Defended' | 'Conditional' | 'Failed' | 'Not Scheduled';

const phaseOrder = ['Concept', 'Outline', 'Pre-Deployment', 'Deployment', 'Final'] as const;

const scheduleStatusStyles: Record<string, { badge: string; dot: string; event: string }> = {
    Scheduled: {
        badge: 'bg-emerald-100 text-emerald-700',
        dot: 'bg-emerald-500',
        event: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    },
    Completed: {
        badge: 'bg-green-100 text-green-700',
        dot: 'bg-green-500',
        event: 'border-green-500 bg-green-50 text-green-700',
    },
    Pending: {
        badge: 'bg-amber-100 text-amber-700',
        dot: 'bg-amber-500',
        event: 'border-amber-500 bg-amber-50 text-amber-700',
    },
    Cancelled: {
        badge: 'bg-rose-100 text-rose-700',
        dot: 'bg-rose-500',
        event: 'border-rose-500 bg-rose-50 text-rose-700',
    },
    'Re-Defense': {
        badge: 'bg-orange-100 text-orange-700',
        dot: 'bg-orange-500',
        event: 'border-orange-500 bg-orange-50 text-orange-700',
    },
};

const phaseStatusStyles: Record<string, string> = {
    Defended: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Conditional: 'border-blue-200 bg-blue-50 text-blue-700',
    Failed: 'border-rose-200 bg-rose-50 text-rose-700',
    Pending: 'border-amber-200 bg-amber-50 text-amber-700',
    Locked: 'border-slate-200 bg-slate-100 text-slate-600',
    'Not Scheduled': 'border-slate-200 bg-slate-100 text-slate-600',
};

const conceptReadinessStyles: Record<string, string> = {
    Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'For Review': 'border-blue-200 bg-blue-50 text-blue-700',
    Revise: 'border-orange-200 bg-orange-50 text-orange-700',
    Missing: 'border-slate-200 bg-slate-100 text-slate-600',
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
        return '--';
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const timeToMinutes = (value?: string | null): number | null => {
    if (!value) {
        return null;
    }

    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return null;
    }

    return hours * 60 + minutes;
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
        return '--';
    }

    return `${formatTime(start)} - ${formatTime(end)}`;
};

const scheduleDateTime = (schedule: ScheduleRow): Date | null => {
    const date = parseDate(schedule.scheduled_date ?? undefined);
    if (!date) {
        return null;
    }

    const minutes = timeToMinutes(schedule.start_time ?? undefined) ?? 0;

    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minutes / 60), minutes % 60);
};

const normalizeConceptVerdictStatus = (conceptVerdict?: string | null): Exclude<PhaseStatus, 'Not Scheduled'> => {
    const verdict = (conceptVerdict ?? '').trim();

    if (verdict === 'Passed (No revisions needed)' || verdict === 'Passed (With revisions needed)' || verdict === 'Pass with revision') {
        return 'Defended';
    }

    if (verdict === 'Conditional Passed' || verdict === 'Conditional Pass') {
        return 'Conditional';
    }

    if (verdict === 'Failed' || verdict === 'Deffered') {
        return 'Failed';
    }

    return 'Pending';
};

const normalizePhaseStatus = (schedule: ScheduleRow | null, phase: string, conceptVerdict?: string | null): PhaseStatus => {
    if (phase === 'Concept') {
        const verdictStatus = normalizeConceptVerdictStatus(conceptVerdict);

        if (verdictStatus !== 'Pending') {
            return verdictStatus;
        }
    }

    if (!schedule) {
        return 'Not Scheduled';
    }

    const status = (schedule.status ?? '').toLowerCase().trim();
    if (status !== 'completed') {
        return 'Pending';
    }

    if (phase !== 'Concept') {
        return 'Defended';
    }

    return normalizeConceptVerdictStatus(conceptVerdict);
};

const normalizeScheduleDetailStatus = (schedule: ScheduleRow | null): string => {
    if (!schedule) {
        return 'Not Scheduled';
    }

    const status = (schedule.status ?? '').toLowerCase().trim();
    const notes = (schedule.notes ?? '').toLowerCase().trim();
    const combined = `${status} ${notes}`;

    if (combined.includes('re-defense') || combined.includes('re defense') || combined.includes('redefense')) {
        return 'Re-Defense';
    }

    if (status === 'completed') {
        return 'Defended';
    }

    if (status === 'pending') {
        return 'Pending';
    }

    if (status === 'cancelled') {
        return 'Cancelled';
    }

    if (status === 'scheduled') {
        return 'Scheduled';
    }

    return schedule.status ?? 'Scheduled';
};

const isUnlockStatus = (status: PhaseStatus): boolean => status === 'Defended';

const StudentSchedule = () => {
    const { props } = usePage<StudentSchedulePageProps>();

    const group = props.group ?? null;
    const adviser = props.adviser ?? null;
    const panelists = props.panelists ?? [];
    const schedules = React.useMemo(() => props.schedules ?? [], [props.schedules]);
    const conceptReadiness = props.conceptReadiness ?? null;

    const schedulesByStage = React.useMemo(() => {
        const map = new Map<string, ScheduleRow>();

        const sortedSchedules = [...schedules].sort((first, second) => {
            const firstTime = scheduleDateTime(first)?.getTime() ?? 0;
            const secondTime = scheduleDateTime(second)?.getTime() ?? 0;

            return firstTime - secondTime;
        });

        sortedSchedules.forEach((schedule) => {
            const stage = schedule.stage ?? '';
            if (stage !== '' && !map.has(stage)) {
                map.set(stage, schedule);
            }
        });

        return map;
    }, [schedules]);

    const phaseRows = React.useMemo<PhaseRow[]>(() => {
        let previousPhaseCleared = true;

        return phaseOrder.map((phase, index) => {
            const schedule = schedulesByStage.get(phase) ?? null;
            const rawStatus = normalizePhaseStatus(schedule, phase, group?.concept_verdict);
            const isLocked = index > 0 && !previousPhaseCleared && schedule === null;
            const status = isLocked ? 'Locked' : rawStatus;

            const lockReason = isLocked ? `Waiting for ${phaseOrder[index - 1]} to be marked Defended.` : undefined;

            previousPhaseCleared = isUnlockStatus(rawStatus);

            return {
                phase,
                status,
                rawStatus,
                schedule,
                isLocked,
                lockReason,
            };
        });
    }, [group?.concept_verdict, schedulesByStage]);

    const recommendationCount = React.useMemo(() => {
        const requirementRows = conceptReadiness?.requirements ?? [];
        return requirementRows.filter((row) => row.is_recommendation).length;
    }, [conceptReadiness?.requirements]);

    return (
        <StudentLayout title="Defense Schedule" subtitle="View the full phase flow, schedule details, and concept clearance gates">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={studentRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Defense Schedule
                    </span>
                </nav>

                {!group ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-800">No active capstone group found.</p>
                        <p className="mt-1 text-xs text-slate-500">
                            Schedule tracking is available after your account is linked to a group by your instructor.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Assigned Group</p>
                                        <h3 className="mt-1 text-sm font-semibold text-slate-800">{group.name}</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {group.program_set_name ?? 'Program set'} · {group.school_year ?? 'Academic year not set'}
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                        {group.program ?? 'Program'}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Adviser</p>
                                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
                                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                            {adviser?.name ?? 'Not assigned yet'}
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-500">{adviser?.email ?? 'No adviser email available'}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Panelists</p>
                                        {panelists.length === 0 ? (
                                            <p className="mt-1 text-xs text-slate-600">No panelists assigned yet.</p>
                                        ) : (
                                            <div className="mt-1 space-y-1">
                                                {panelists.map((panelist) => (
                                                    <p key={`${panelist.id ?? panelist.slot ?? panelist.name}`} className="text-xs text-slate-700">
                                                        <span className="font-semibold">P{panelist.slot ?? '-'}:</span>{' '}
                                                        {panelist.name ?? 'Unassigned'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                            Concept & Recommendation Gate
                                        </p>
                                        <h3 className="mt-1 text-sm font-semibold text-slate-800">Phase 1 Clearance</h3>
                                    </div>
                                    <span
                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${conceptReadinessStyles[conceptReadiness?.status ?? 'Missing'] ?? conceptReadinessStyles.Missing}`}
                                    >
                                        {conceptReadiness?.status ?? 'Missing'}
                                    </span>
                                </div>

                                <p className="mt-2 text-xs text-slate-600">
                                    {conceptReadiness?.approved
                                        ? 'Concept requirements are approved. Next stages can proceed based on defense results.'
                                        : 'Concept requirements are still in progress. Next stages remain locked until this phase is cleared.'}
                                </p>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {(conceptReadiness?.requirements ?? []).map((requirement) => (
                                        <div key={requirement.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                                            <p className="text-xs font-semibold text-slate-700">{requirement.requirement_type}</p>
                                            <div className="mt-1 flex items-center justify-between gap-2">
                                                <span
                                                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${conceptReadinessStyles[requirement.status] ?? conceptReadinessStyles.Missing}`}
                                                >
                                                    {requirement.status}
                                                </span>
                                                {requirement.is_recommendation ? (
                                                    <span className="text-[10px] font-semibold text-emerald-700">Recommendation</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {(conceptReadiness?.requirements ?? []).length === 0 ? (
                                    <p className="mt-3 text-xs text-slate-500">No concept requirements configured for your group year.</p>
                                ) : null}

                                {conceptReadiness?.latest_submitted_at ? (
                                    <p className="mt-3 text-[11px] text-slate-500">
                                        Latest concept-related submission: {conceptReadiness.latest_submitted_at}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
                                <h3 className="text-sm font-semibold text-slate-800">Capstone Defense Phase Flow</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Every phase is listed. Next phase rows are locked until the previous row result is Defended.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Phase</th>
                                            <th className="px-4 py-3">Phase Status</th>
                                            <th className="px-4 py-3">Adviser &amp; Panelists</th>
                                            <th className="px-4 py-3">Schedule Detail</th>
                                            <th className="px-4 py-3">Remarks</th>
                                            <th className="px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {phaseRows.map((row, index) => {
                                            const scheduleStatus = normalizeScheduleDetailStatus(row.schedule);
                                            const scheduleBadgeClass =
                                                scheduleStatus === 'Re-Defense'
                                                    ? scheduleStatusStyles['Re-Defense'].badge
                                                    : (scheduleStatusStyles[row.schedule?.status ?? 'Scheduled'] ?? scheduleStatusStyles.Scheduled)
                                                          .badge;

                                            return (
                                                <tr
                                                    key={row.phase}
                                                    className={`transition-colors hover:bg-emerald-50/30 ${
                                                        row.isLocked ? 'bg-slate-50/80' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                                    }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-slate-800">{row.phase}</div>
                                                        <div className="text-[10px] text-slate-500">Phase {index + 1}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${phaseStatusStyles[row.status] ?? phaseStatusStyles['Not Scheduled']}`}
                                                        >
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-xs font-semibold text-slate-700">
                                                            {adviser?.name ?? 'Adviser not assigned'}
                                                        </p>
                                                        {panelists.length === 0 ? (
                                                            <p className="mt-1 text-[11px] text-slate-500">Panelists not assigned yet.</p>
                                                        ) : (
                                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                                {panelists.map((panelist) => (
                                                                    <span
                                                                        key={`${row.phase}-panel-${panelist.id ?? panelist.slot ?? panelist.name}`}
                                                                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                                                    >
                                                                        P{panelist.slot ?? '-'}: {panelist.name ?? 'Unassigned'}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {row.schedule ? (
                                                            <div>
                                                                <p className="font-semibold text-slate-800">
                                                                    {formatDateLabel(row.schedule.scheduled_date)}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500">
                                                                    {formatTimeRange(row.schedule.start_time, row.schedule.end_time)} ·{' '}
                                                                    {row.schedule.room?.name ?? 'Room not assigned'}
                                                                </p>
                                                                <span
                                                                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${scheduleBadgeClass}`}
                                                                >
                                                                    {scheduleStatus === 'Defended' ? 'Completed' : scheduleStatus}
                                                                </span>
                                                            </div>
                                                        ) : row.isLocked ? (
                                                            <div className="inline-flex items-start gap-1.5 text-[11px] text-slate-500">
                                                                <Lock className="mt-0.5 h-3 w-3" />
                                                                <span>Locked for now</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-500">Not yet scheduled.</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-[11px] text-slate-600">
                                                        {row.phase === 'Concept' ? (
                                                            <div className="space-y-1">
                                                                <p>
                                                                    Concept status:{' '}
                                                                    <span className="font-semibold">{conceptReadiness?.status ?? 'Missing'}</span>
                                                                </p>
                                                                <p>
                                                                    Recommendation requirements:{' '}
                                                                    <span className="font-semibold">{recommendationCount}</span>
                                                                </p>
                                                            </div>
                                                        ) : row.isLocked ? (
                                                            row.lockReason
                                                        ) : (
                                                            (row.schedule?.notes ?? 'No additional notes.')
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {row.schedule ? (
                                                            <Link
                                                                href="/student/live-defense"
                                                                className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                            >
                                                                Open Defense Board
                                                            </Link>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400">Not available</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </motion.section>
        </StudentLayout>
    );
};

export default StudentSchedule;
