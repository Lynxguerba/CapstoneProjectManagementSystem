import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Clock, Search, Users } from 'lucide-react';
import React from 'react';
import studentRoutes from '../../routes/student';
import StudentLayout from './_layout';

type PanelistSummary = {
    id?: number | null;
    name?: string | null;
    slot?: number;
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

type BrowseSchedulesPageProps = {
    schedules?: ScheduleRow[];
};

type CalendarDay = {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
};

const stageOptions = ['Concept', 'Outline', 'Pre-Deployment', 'Deployment', 'Final'] as const;

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

const pad = (value: number): string => value.toString().padStart(2, '0');

const toDateKey = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

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

const normalizeSchedulePhaseStatus = (schedule: ScheduleRow): string => {
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

const BrowseSchedules = () => {
    const { props } = usePage<BrowseSchedulesPageProps>();
    const schedules = React.useMemo(() => props.schedules ?? [], [props.schedules]);

    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedStage, setSelectedStage] = React.useState('All');

    const [currentMonth, setCurrentMonth] = React.useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = React.useState(() => new Date());

    const filteredSchedules = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return schedules.filter((schedule) => {
            if (selectedStage !== 'All' && schedule.stage !== selectedStage) {
                return false;
            }

            if (!query) {
                return true;
            }

            const panelNames = (schedule.panelists ?? [])
                .map((panelist) => panelist.name ?? '')
                .join(' ')
                .toLowerCase();
            const haystack =
                `${schedule.group_name ?? ''} ${schedule.program_set_name ?? ''} ${schedule.program ?? ''} ${schedule.stage ?? ''} ${schedule.room?.name ?? ''} ${schedule.status ?? ''} ${schedule.notes ?? ''} ${panelNames}`.toLowerCase();

            return haystack.includes(query);
        });
    }, [schedules, searchTerm, selectedStage]);

    const scheduledGroupsCount = React.useMemo(() => {
        const keys = new Set<string>();

        filteredSchedules.forEach((schedule) => {
            if (schedule.group_id !== null && schedule.group_id !== undefined) {
                keys.add(`id:${schedule.group_id}`);
                return;
            }

            if ((schedule.group_name ?? '').trim() !== '') {
                keys.add(`name:${schedule.group_name?.trim()}`);
            }
        });

        return keys.size;
    }, [filteredSchedules]);

    const defendedCount = React.useMemo(() => {
        return filteredSchedules.filter((schedule) => {
            const status = normalizeSchedulePhaseStatus(schedule);
            return status === 'Defended' || status === 'Re-Defense';
        }).length;
    }, [filteredSchedules]);

    const upcomingCount = React.useMemo(() => {
        const now = new Date();
        const limit = new Date(now);
        limit.setDate(limit.getDate() + 7);

        return filteredSchedules.filter((schedule) => {
            const dateTime = scheduleDateTime(schedule);
            if (!dateTime) {
                return false;
            }

            return dateTime >= now && dateTime <= limit;
        }).length;
    }, [filteredSchedules]);

    const calendarDays = React.useMemo<CalendarDay[]>(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startDay = firstDayOfMonth.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const todayKey = toDateKey(new Date());

        const days: CalendarDay[] = [];

        for (let index = startDay - 1; index >= 0; index -= 1) {
            const day = daysInPrevMonth - index;
            const date = new Date(year, month - 1, day);
            days.push({ date, isCurrentMonth: false, isToday: toDateKey(date) === todayKey });
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, month, day);
            days.push({ date, isCurrentMonth: true, isToday: toDateKey(date) === todayKey });
        }

        const remaining = 42 - days.length;
        for (let day = 1; day <= remaining; day += 1) {
            const date = new Date(year, month + 1, day);
            days.push({ date, isCurrentMonth: false, isToday: toDateKey(date) === todayKey });
        }

        return days;
    }, [currentMonth]);

    const schedulesByDate = React.useMemo(() => {
        const map = new Map<string, ScheduleRow[]>();

        filteredSchedules.forEach((schedule) => {
            if (!schedule.scheduled_date) {
                return;
            }

            const list = map.get(schedule.scheduled_date) ?? [];
            list.push(schedule);
            map.set(schedule.scheduled_date, list);
        });

        map.forEach((list) => {
            list.sort((first, second) => (timeToMinutes(first.start_time) ?? 0) - (timeToMinutes(second.start_time) ?? 0));
        });

        return map;
    }, [filteredSchedules]);

    const selectedDateKey = toDateKey(selectedDate);
    const daySchedules = schedulesByDate.get(selectedDateKey) ?? [];

    const monthLabel = currentMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    const upcomingSchedules = React.useMemo(() => {
        const now = new Date();

        return filteredSchedules
            .map((schedule) => ({
                schedule,
                dateTime: scheduleDateTime(schedule),
            }))
            .filter((item) => item.dateTime !== null && item.dateTime >= now)
            .sort((first, second) => (first.dateTime?.getTime() ?? 0) - (second.dateTime?.getTime() ?? 0))
            .slice(0, 5)
            .map((item) => item.schedule);
    }, [filteredSchedules]);

    return (
        <StudentLayout title="Browse Schedules" subtitle="Browse defense schedules from all student groups">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={studentRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Browse Schedules
                    </span>
                </nav>

                {schedules.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-800">No defense schedules available yet.</p>
                        <p className="mt-1 text-xs text-slate-500">Your instructor can publish schedules once groups are ready for defense.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Search group, stage, room, status, or panelist..."
                                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:w-80"
                                    />
                                </div>
                                <select
                                    value={selectedStage}
                                    onChange={(event) => setSelectedStage(event.target.value)}
                                    className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    <option value="All">All Stages</option>
                                    {stageOptions.map((stage) => (
                                        <option key={stage} value={stage}>
                                            {stage}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedStage('All');
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Total Defenses</p>
                                        <p className="text-2xl font-semibold text-slate-800">{filteredSchedules.length}</p>
                                    </div>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <CalendarDays className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500">Based on your current filters</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Defended / Re-Defense</p>
                                        <p className="text-2xl font-semibold text-emerald-600">{defendedCount}</p>
                                    </div>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <CalendarCheck className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="mt-2 text-[11px] text-emerald-600">Completed or retake checkpoints</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Scheduled Groups</p>
                                        <p className="text-2xl font-semibold text-slate-800">{scheduledGroupsCount}</p>
                                    </div>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                        <Users className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500">Groups with at least one scheduled defense</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Upcoming in 7 days</p>
                                        <p className="text-2xl font-semibold text-green-600">{upcomingCount}</p>
                                    </div>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                        <Clock className="h-5 w-5" />
                                    </span>
                                </div>
                                <p className="mt-2 text-[11px] text-green-600">Scheduled defenses due soon</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800">{monthLabel}</h3>
                                    <p className="text-xs text-slate-500">Student view calendar for all group schedules</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                    {['Scheduled', 'Completed', 'Pending', 'Cancelled', 'Re-Defense'].map((status) => (
                                        <span key={status} className="inline-flex items-center gap-1">
                                            <span className={`h-2.5 w-2.5 rounded-full ${scheduleStatusStyles[status]?.dot ?? 'bg-slate-400'}`} />
                                            {status}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1));
                                            setSelectedDate(
                                                (previous) =>
                                                    new Date(previous.getFullYear(), previous.getMonth() - 1, Math.min(previous.getDate(), 28)),
                                            );
                                        }}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 transition hover:bg-slate-100"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date();
                                            setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                                            setSelectedDate(now);
                                        }}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1));
                                            setSelectedDate(
                                                (previous) =>
                                                    new Date(previous.getFullYear(), previous.getMonth() + 1, Math.min(previous.getDate(), 28)),
                                            );
                                        }}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 transition hover:bg-slate-100"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold text-slate-600">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                                    <div key={day} className="px-2 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7">
                                {calendarDays.map((day) => {
                                    const dateKey = toDateKey(day.date);
                                    const events = schedulesByDate.get(dateKey) ?? [];
                                    const isSelected = dateKey === selectedDateKey;

                                    return (
                                        <button
                                            key={dateKey}
                                            type="button"
                                            onClick={() => setSelectedDate(day.date)}
                                            className={`min-h-[110px] border-r border-b border-slate-200 p-2 text-left text-xs transition hover:bg-slate-50 ${
                                                !day.isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'
                                            } ${day.isToday ? 'ring-1 ring-emerald-300' : ''} ${isSelected ? 'bg-emerald-50/50' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`font-semibold ${day.isToday ? 'text-emerald-600' : ''}`}>{day.date.getDate()}</span>
                                                {events.length > 0 ? (
                                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                        {events.length}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                {events.slice(0, 2).map((schedule) => {
                                                    const normalizedStatus = normalizeSchedulePhaseStatus(schedule);
                                                    const style =
                                                        normalizedStatus === 'Re-Defense'
                                                            ? scheduleStatusStyles['Re-Defense']
                                                            : (scheduleStatusStyles[schedule.status ?? 'Scheduled'] ?? scheduleStatusStyles.Scheduled);

                                                    return (
                                                        <div key={schedule.id} className={`rounded-md border-l-4 px-2 py-1 text-[10px] ${style.event}`}>
                                                            <p className="font-semibold">{formatTime(schedule.start_time)}</p>
                                                            <p className="truncate">{schedule.group_name ?? 'Unnamed group'}</p>
                                                        </div>
                                                    );
                                                })}
                                                {events.length > 2 ? (
                                                    <span className="text-[10px] text-slate-500">+{events.length - 2} more</span>
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="space-y-6 lg:col-span-2">
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-800">Schedules on {formatDateLabel(selectedDateKey)}</h3>
                                            <p className="text-xs text-slate-500">Read-only schedule details for all groups.</p>
                                        </div>
                                    </div>

                                    {daySchedules.length === 0 ? (
                                        <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                                            No defenses scheduled for this day.
                                        </div>
                                    ) : (
                                        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                                            <table className="w-full text-left text-xs">
                                                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-3">Group</th>
                                                        <th className="px-4 py-3">Stage</th>
                                                        <th className="px-4 py-3">Room &amp; Time</th>
                                                        <th className="px-4 py-3">Status</th>
                                                        <th className="px-4 py-3">Panelists</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {daySchedules.map((schedule, index) => {
                                                        const normalizedStatus = normalizeSchedulePhaseStatus(schedule);
                                                        const badgeStyle =
                                                            normalizedStatus === 'Re-Defense'
                                                                ? scheduleStatusStyles['Re-Defense'].badge
                                                                : (scheduleStatusStyles[schedule.status ?? 'Scheduled'] ?? scheduleStatusStyles.Scheduled)
                                                                      .badge;

                                                        return (
                                                            <tr
                                                                key={schedule.id}
                                                                className={`transition-colors hover:bg-emerald-50/30 ${
                                                                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                                                }`}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <div className="font-semibold text-slate-800">{schedule.group_name ?? 'Unnamed group'}</div>
                                                                    <div className="text-[10px] text-slate-500">{schedule.program_set_name ?? 'Program set'}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600">{schedule.stage ?? 'Stage'}</td>
                                                                <td className="px-4 py-3 text-slate-600">
                                                                    <div className="font-semibold text-slate-800">{schedule.room?.name ?? 'Room TBA'}</div>
                                                                    <div className="text-[10px] text-slate-500">
                                                                        {formatTimeRange(schedule.start_time, schedule.end_time)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${badgeStyle}`}
                                                                    >
                                                                        {normalizedStatus === 'Defended' ? 'Completed' : normalizedStatus}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600">
                                                                    {(schedule.panelists ?? []).length === 0
                                                                        ? 'No panelists'
                                                                        : (schedule.panelists ?? [])
                                                                              .map((panelist) => panelist.name ?? `Panelist ${panelist.slot ?? ''}`)
                                                                              .join(', ')}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-slate-800">Upcoming Defenses</h3>
                                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                            {upcomingSchedules.length}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {upcomingSchedules.length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                                                No upcoming defenses in this filter.
                                            </div>
                                        ) : (
                                            upcomingSchedules.map((schedule) => {
                                                const normalizedStatus = normalizeSchedulePhaseStatus(schedule);
                                                const style =
                                                    normalizedStatus === 'Re-Defense'
                                                        ? scheduleStatusStyles['Re-Defense']
                                                        : (scheduleStatusStyles[schedule.status ?? 'Scheduled'] ?? scheduleStatusStyles.Scheduled);

                                                return (
                                                    <div key={schedule.id} className="rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800">
                                                                    {schedule.group_name ?? 'Unnamed group'}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500">
                                                                    {schedule.stage ?? 'Stage'} · {schedule.room?.name ?? 'Room not set'}
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}
                                                            >
                                                                {normalizedStatus === 'Defended' ? 'Completed' : normalizedStatus}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-[11px] text-slate-600">{formatDateLabel(schedule.scheduled_date)}</p>
                                                        <p className="text-[11px] text-slate-500">
                                                            {formatTimeRange(schedule.start_time, schedule.end_time)}
                                                        </p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-emerald-600" />
                                        <h3 className="text-base font-semibold text-slate-800">Browse Notes</h3>
                                    </div>
                                    <ul className="mt-3 space-y-2 text-xs text-slate-600">
                                        <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            This page is read-only and shows the published defense schedules for all groups.
                                        </li>
                                        <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            Use the stage filter and search box to narrow schedules by group, room, status, or panelist.
                                        </li>
                                        <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                            Status labels follow instructor scheduling updates, including re-defense tagging from notes.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </motion.section>
        </StudentLayout>
    );
};

export default BrowseSchedules;
