import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import React from 'react';
import ScheduleDefenseForm from '../../../components/Instructor/scheduling/ScheduleDefenseModal';
import defenseSchedules from '../../../routes/instructor/defense-schedules';
import InstructorLayout from '../_layout';

type PanelistSummary = {
    id?: number | null;
    name?: string | null;
    slot?: number;
};

type GroupRow = {
    id: number;
    name: string;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
    panelists?: PanelistSummary[];
};

type RoomRow = {
    id: number;
    name: string;
    capacity: number;
    is_active: boolean;
    notes?: string | null;
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
    manager?: {
        id?: number | null;
        name?: string | null;
    } | null;
    can_manage?: boolean;
    panelists?: PanelistSummary[];
};

type ScheduleManagerPageProps = {
    groups?: GroupRow[];
    rooms?: RoomRow[];
    schedules?: ScheduleRow[];
    selectedScheduleId?: number | null;
    defaultDate?: string | null;
    defaultRoomId?: number | null;
    defaultStage?: string | null;
};

const stageOptions = ['Concept', 'Outline', 'Pre-Deployment', 'Deployment'];

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
        return '';
    }

    return `${formatTime(start)} - ${formatTime(end)}`;
};

const ScheduleManagerPage = () => {
    const { props } = usePage<ScheduleManagerPageProps>();
    const groups = props.groups ?? [];
    const rooms = props.rooms ?? [];
    const schedules = props.schedules ?? [];
    const selectedScheduleId = props.selectedScheduleId ?? null;

    const selectedSchedule = React.useMemo(
        () => schedules.find((schedule) => schedule.id === selectedScheduleId) ?? null,
        [schedules, selectedScheduleId],
    );

    const isReadOnly = Boolean(selectedSchedule && !selectedSchedule.can_manage);

    const [searchTerm, setSearchTerm] = React.useState('');
    const [stageFilter, setStageFilter] = React.useState('All');

    const filteredSchedules = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return schedules
            .filter((schedule) => {
                if (stageFilter !== 'All' && schedule.stage !== stageFilter) {
                    return false;
                }

                if (!query) {
                    return true;
                }

                const haystack = `${schedule.group_name ?? ''} ${schedule.program_set_name ?? ''} ${schedule.room?.name ?? ''} ${schedule.manager?.name ?? ''}`
                    .toLowerCase()
                    .trim();

                return haystack.includes(query);
            })
            .sort((a, b) => {
                const dateA = parseDate(a.scheduled_date)?.getTime() ?? 0;
                const dateB = parseDate(b.scheduled_date)?.getTime() ?? 0;
                if (dateA !== dateB) {
                    return dateA - dateB;
                }

                return (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0);
            });
    }, [schedules, searchTerm, stageFilter]);

    const visitSchedule = (scheduleId: number) => {
        router.visit(`/instructor/scheduling/manage?schedule=${scheduleId}`);
    };

    const resetSchedule = () => {
        const params = new URLSearchParams();

        if (props.defaultDate) {
            params.set('date', props.defaultDate);
        }

        if (props.defaultRoomId) {
            params.set('room', String(props.defaultRoomId));
        }

        if (props.defaultStage) {
            params.set('stage', props.defaultStage);
        }

        const query = params.toString();

        router.visit(query ? `/instructor/scheduling/manage?${query}` : '/instructor/scheduling/manage');
    };

    const updateScheduleStatus = (schedule: ScheduleRow, status: string) => {
        router.patch(defenseSchedules.status.url({ schedule: schedule.id }), { status }, { preserveScroll: true });
    };

    return (
        <InstructorLayout title="Defense Schedule Manager" subtitle="Create schedules and review all defense appointments">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/instructor/scheduling" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Defense Scheduling
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Schedule Manager
                    </span>
                </nav>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search group, room, or manager..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:w-64"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={stageFilter}
                                onChange={(event) => setStageFilter(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="All">All Stages</option>
                                {stageOptions.map((stage) => (
                                    <option key={stage} value={stage}>
                                        {stage}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Link
                        href="/instructor/scheduling"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                        Back to Calendar
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <ScheduleDefenseForm
                            groups={groups}
                            rooms={rooms}
                            initialSchedule={selectedSchedule}
                            defaultDate={props.defaultDate ?? undefined}
                            defaultRoomId={props.defaultRoomId ?? undefined}
                            defaultStage={props.defaultStage ?? undefined}
                            readOnly={isReadOnly}
                            onReset={resetSchedule}
                        />
                    </div>

                    <div className="lg:col-span-3">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Group</th>
                                        <th className="px-4 py-3">Stage</th>
                                        <th className="px-4 py-3">Room</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Managed By</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSchedules.map((schedule, index) => {
                                        const status = schedule.status ?? 'Scheduled';
                                        const canManage = schedule.can_manage ?? false;
                                        const managerName = schedule.manager?.name ?? 'Unassigned';
                                        const isSelected = schedule.id === selectedScheduleId;

                                        return (
                                            <tr
                                                key={schedule.id}
                                                className={`transition-colors hover:bg-emerald-50/30 ${
                                                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                                } ${isSelected ? 'bg-emerald-100/70' : ''}`}
                                            >
                                                <td className="px-4 py-3 text-slate-600">
                                                    <div className="font-semibold text-slate-800">
                                                        {formatDateLabel(schedule.scheduled_date) || '—'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                        {formatTimeRange(schedule.start_time, schedule.end_time) || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-slate-800">{schedule.group_name ?? 'Unnamed group'}</div>
                                                    <div className="text-[10px] text-slate-500">
                                                        {schedule.program_set_name ?? 'Program set'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{schedule.stage ?? 'Stage'}</td>
                                                <td className="px-4 py-3 text-slate-600">{schedule.room?.name ?? 'No room'}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={status}
                                                        onChange={(event) => updateScheduleStatus(schedule, event.target.value)}
                                                        disabled={!canManage}
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                    >
                                                        {['Scheduled', 'Pending', 'Completed', 'Cancelled'].map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{managerName}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => visitSchedule(schedule.id)}
                                                        className="rounded-md border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
                                                    >
                                                        {canManage ? 'Edit' : 'View'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {filteredSchedules.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-500">No schedules found for this filter.</div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </motion.section>
        </InstructorLayout>
    );
};

export default ScheduleManagerPage;
