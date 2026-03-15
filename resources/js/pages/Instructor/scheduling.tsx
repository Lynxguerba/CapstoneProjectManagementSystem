import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Calendar,
    CalendarCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    Clock,
    DoorOpen,
    Plus,
    Search,
    XCircle,
} from 'lucide-react';
import React from 'react';
import defenseSchedules from '../../routes/instructor/defense-schedules';
import instructorRoutes from '../../routes/instructor';
import InstructorLayout from './_layout';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

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

type SchedulingPageProps = {
    groups?: GroupRow[];
    rooms?: RoomRow[];
    schedules?: ScheduleRow[];
    academicYears?: AcademicYearOption[];
};

type CalendarDay = {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
};

const stageOptions = ['Concept', 'Outline', 'Pre-Deployment', 'Deployment'];

const statusStyles: Record<string, { badge: string; dot: string; event: string }> = {
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

const scheduleDateTime = (schedule: ScheduleRow): Date | null => {
    const date = parseDate(schedule.scheduled_date ?? undefined);
    if (!date) {
        return null;
    }

    const minutes = timeToMinutes(schedule.start_time ?? undefined) ?? 0;

    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minutes / 60), minutes % 60);
};

const SchedulingPage = () => {
    const { props } = usePage<SchedulingPageProps>();
    const groups = props.groups ?? [];
    const rooms = props.rooms ?? [];
    const schedules = props.schedules ?? [];
    const academicYears = props.academicYears ?? [];

    const currentAcademicYear = academicYears.find((year) => year.is_current)?.label ?? academicYears[0]?.label ?? 'All';

    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(currentAcademicYear || 'All');
    const [selectedProgram, setSelectedProgram] = React.useState('All');
    const [selectedStage, setSelectedStage] = React.useState('All');
    const [selectedRoomId, setSelectedRoomId] = React.useState<number | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    const [currentMonth, setCurrentMonth] = React.useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = React.useState(() => new Date());

    const programOptions = React.useMemo(() => {
        const set = new Set<string>();
        groups.forEach((group) => {
            if (group.program) {
                set.add(group.program);
            }
        });
        schedules.forEach((schedule) => {
            if (schedule.program) {
                set.add(schedule.program);
            }
        });

        return ['All', ...Array.from(set).sort()];
    }, [groups, schedules]);

    const academicYearOptions = React.useMemo(() => {
        const years = academicYears.map((year) => year.label);
        return ['All', ...years];
    }, [academicYears]);

    const baseFilteredSchedules = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return schedules.filter((schedule) => {
            if (selectedAcademicYear !== 'All' && schedule.school_year !== selectedAcademicYear) {
                return false;
            }

            if (selectedProgram !== 'All' && schedule.program !== selectedProgram) {
                return false;
            }

            if (selectedStage !== 'All' && schedule.stage !== selectedStage) {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = `${schedule.group_name ?? ''} ${schedule.program_set_name ?? ''} ${schedule.room?.name ?? ''}`.toLowerCase();
            return haystack.includes(query);
        });
    }, [schedules, selectedAcademicYear, selectedProgram, selectedStage, searchTerm]);

    const filteredSchedules = React.useMemo(() => {
        if (!selectedRoomId) {
            return baseFilteredSchedules;
        }

        return baseFilteredSchedules.filter((schedule) => schedule.room?.id === selectedRoomId);
    }, [baseFilteredSchedules, selectedRoomId]);

    const eligibleGroups = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return groups.filter((group) => {
            if (selectedAcademicYear !== 'All' && group.school_year !== selectedAcademicYear) {
                return false;
            }

            if (selectedProgram !== 'All' && group.program !== selectedProgram) {
                return false;
            }

            if (query) {
                const haystack = `${group.name} ${group.program_set_name ?? ''} ${group.leader_name ?? ''}`.toLowerCase();
                if (!haystack.includes(query)) {
                    return false;
                }
            }

            return (group.panelists?.length ?? 0) >= 3;
        });
    }, [groups, selectedAcademicYear, selectedProgram, searchTerm]);

    const pendingGroups = React.useMemo(() => {
        return eligibleGroups.filter((group) => {
            if (selectedStage === 'All') {
                return !schedules.some((schedule) => schedule.group_id === group.id);
            }

            return !schedules.some((schedule) => schedule.group_id === group.id && schedule.stage === selectedStage);
        });
    }, [eligibleGroups, schedules, selectedStage]);

    const statusCounts = React.useMemo(() => {
        return filteredSchedules.reduce(
            (acc, schedule) => {
                const status = schedule.status ?? 'Scheduled';
                if (acc[status] === undefined) {
                    acc[status] = 0;
                }
                acc[status] += 1;
                return acc;
            },
            {
                Scheduled: 0,
                Completed: 0,
                Pending: 0,
                Cancelled: 0,
            } as Record<string, number>,
        );
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
            list.sort((a, b) => (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0));
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
            .sort((a, b) => (a.dateTime?.getTime() ?? 0) - (b.dateTime?.getTime() ?? 0))
            .slice(0, 5)
            .map((item) => item.schedule);
    }, [filteredSchedules]);

    const roomConflicts = React.useMemo(() => {
        const conflicts = new Map<number, boolean>();

        rooms.forEach((room) => {
            const roomSchedules = baseFilteredSchedules
                .filter((schedule) => schedule.room?.id === room.id && schedule.scheduled_date === selectedDateKey)
                .sort((a, b) => (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0));

            let hasConflict = false;
            let lastEndMinutes: number | null = null;

            roomSchedules.forEach((schedule) => {
                const startMinutes = timeToMinutes(schedule.start_time);
                const endMinutes = timeToMinutes(schedule.end_time);

                if (startMinutes === null || endMinutes === null) {
                    return;
                }

                if (lastEndMinutes !== null && startMinutes < lastEndMinutes) {
                    hasConflict = true;
                }

                lastEndMinutes = Math.max(lastEndMinutes ?? 0, endMinutes);
            });

            conflicts.set(room.id, hasConflict);
        });

        return conflicts;
    }, [rooms, baseFilteredSchedules, selectedDateKey]);

    const hasConflicts = Array.from(roomConflicts.values()).some(Boolean);

    const scheduleManagerBaseUrl = '/instructor/scheduling/manage';
    const roomsManagerUrl = '/instructor/scheduling/rooms';

    const buildScheduleManagerUrl = (options?: { scheduleId?: number; date?: string; roomId?: number | null; stage?: string }) => {
        const params = new URLSearchParams();

        if (options?.scheduleId) {
            params.set('schedule', String(options.scheduleId));
        }

        if (options?.date) {
            params.set('date', options.date);
        }

        if (options?.roomId) {
            params.set('room', String(options.roomId));
        }

        if (options?.stage) {
            params.set('stage', options.stage);
        }

        const query = params.toString();

        return query ? `${scheduleManagerBaseUrl}?${query}` : scheduleManagerBaseUrl;
    };

    const visitScheduleManager = (options?: { scheduleId?: number; date?: string; roomId?: number | null; stage?: string }) => {
        router.visit(buildScheduleManagerUrl(options));
    };

    const updateScheduleStatus = (schedule: ScheduleRow, status: string) => {
        router.patch(defenseSchedules.status.url({ schedule: schedule.id }), { status }, { preserveScroll: true });
    };

    const activeRoom = selectedRoomId ? rooms.find((room) => room.id === selectedRoomId) : null;

    return (
        <InstructorLayout title="Defense Scheduling" subtitle="Plan, assign, and monitor defense schedules">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link
                        href={instructorRoutes.dashboard.url()}
                        className="font-medium text-slate-600 transition-colors hover:text-slate-900"
                    >
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Defense Scheduling
                    </span>
                </nav>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search group, room, or set..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:w-56"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedAcademicYear}
                                onChange={(event) => setSelectedAcademicYear(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                {academicYearOptions.map((year) => {
                                    const isCurrent = academicYears.find((item) => item.label === year)?.is_current;

                                    return (
                                        <option key={year} value={year}>
                                            {year === 'All' ? 'All Academic Years' : `${year}${isCurrent ? ' (current)' : ''}`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedProgram}
                                onChange={(event) => setSelectedProgram(event.target.value)}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                {programOptions.map((program) => (
                                    <option key={program} value={program}>
                                        {program === 'All' ? 'All Programs' : program}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
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
                        </div>
                        <div className="relative">
                            <select
                                value={selectedRoomId ? String(selectedRoomId) : ''}
                                onChange={(event) =>
                                    setSelectedRoomId(event.target.value ? Number(event.target.value) : null)
                                }
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                                <option value="">All Rooms</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {activeRoom ? (
                            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                Room filter: {activeRoom.name}
                                <button
                                    type="button"
                                    onClick={() => setSelectedRoomId(null)}
                                    className="rounded-full px-1 text-emerald-700 transition hover:bg-emerald-100"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                visitScheduleManager({
                                    roomId: selectedRoomId,
                                    stage: selectedStage !== 'All' ? selectedStage : undefined,
                                })
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Schedule Defense
                        </button>
                        <Link
                            href={roomsManagerUrl}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                            <DoorOpen className="h-3.5 w-3.5" />
                            Manage Rooms
                        </Link>
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
                        <p className="mt-2 text-[11px] text-slate-500">Based on current filters</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500">Scheduled</p>
                                <p className="text-2xl font-semibold text-emerald-600">{statusCounts.Scheduled}</p>
                            </div>
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                <CalendarCheck className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-[11px] text-emerald-600">{upcomingCount} due in 7 days</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500">Pending</p>
                                <p className="text-2xl font-semibold text-amber-600">{pendingGroups.length}</p>
                            </div>
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-[11px] text-amber-600">Eligible groups without schedule</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500">Completed</p>
                                <p className="text-2xl font-semibold text-green-600">{statusCounts.Completed}</p>
                            </div>
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                <CircleCheck className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-[11px] text-green-600">Finished defenses</p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">{monthLabel}</h3>
                            <p className="text-xs text-slate-500">Tap a date to view schedules</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            {['Scheduled', 'Completed', 'Pending', 'Cancelled'].map((status) => (
                                <span key={status} className="inline-flex items-center gap-1">
                                    <span className={`h-2.5 w-2.5 rounded-full ${statusStyles[status]?.dot ?? 'bg-slate-400'}`} />
                                    {status}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1));
                                    setSelectedDate((previous) =>
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
                                    setSelectedDate((previous) =>
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
                                    className={`min-h-[110px] border-b border-r border-slate-200 p-2 text-left text-xs transition hover:bg-slate-50 ${
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
                                            const status = schedule.status ?? 'Scheduled';
                                            const style = statusStyles[status] ?? statusStyles.Scheduled;

                                            return (
                                                <div
                                                    key={schedule.id}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        visitScheduleManager({ scheduleId: schedule.id });
                                                    }}
                                                    className={`cursor-pointer rounded-md border-l-4 px-2 py-1 text-[10px] ${style.event}`}
                                                >
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
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800">Schedules on {formatDateLabel(selectedDateKey)}</h3>
                                    <p className="text-xs text-slate-500">View schedules and update those you manage.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        visitScheduleManager({
                                            date: selectedDateKey,
                                            roomId: selectedRoomId,
                                            stage: selectedStage !== 'All' ? selectedStage : undefined,
                                        })
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Schedule
                                </button>
                            </div>

                            {daySchedules.length === 0 ? (
                                <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                                    No defenses scheduled for this day.
                                </div>
                            ) : (
                                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">Group</th>
                                                <th className="px-4 py-3">Stage</th>
                                                <th className="px-4 py-3">Room &amp; Time</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Managed By</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {daySchedules.map((schedule, index) => {
                                                const status = schedule.status ?? 'Scheduled';
                                                const style = statusStyles[status] ?? statusStyles.Scheduled;
                                                const canManage = schedule.can_manage ?? false;
                                                const managerName = schedule.manager?.name ?? 'Unassigned';

                                                return (
                                                    <tr
                                                        key={schedule.id}
                                                        className={`transition-colors hover:bg-emerald-50/30 ${
                                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-slate-800">
                                                                {schedule.group_name ?? 'Unnamed group'}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500">
                                                                {schedule.program_set_name ?? 'Program set'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{schedule.stage ?? 'Stage'}</td>
                                                        <td className="px-4 py-3 text-slate-600">
                                                            <div className="font-semibold text-slate-800">{schedule.room?.name ?? 'No room'}</div>
                                                            <div className="text-[10px] text-slate-500">
                                                                {formatTimeRange(schedule.start_time, schedule.end_time)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${style.badge}`}
                                                            >
                                                                {status}
                                                            </span>
                                                            <select
                                                                value={status}
                                                                onChange={(event) => updateScheduleStatus(schedule, event.target.value)}
                                                                disabled={!canManage}
                                                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                                                                onClick={() => visitScheduleManager({ scheduleId: schedule.id })}
                                                                className="rounded-lg border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
                                                            >
                                                                {canManage ? 'Edit' : 'View'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800">Upcoming Defenses</h3>
                                    <p className="text-xs text-slate-500">Sorted by the next available schedule.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        visitScheduleManager({
                                            roomId: selectedRoomId,
                                            stage: selectedStage !== 'All' ? selectedStage : undefined,
                                        })
                                    }
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                >
                                    Schedule another →
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {upcomingSchedules.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                                        No upcoming defenses in this filter.
                                    </div>
                                ) : (
                                    upcomingSchedules.map((schedule) => {
                                        const status = schedule.status ?? 'Scheduled';
                                        const style = statusStyles[status] ?? statusStyles.Scheduled;
                                        const canManage = schedule.can_manage ?? false;
                                        const managerName = schedule.manager?.name ?? 'Unassigned';

                                        return (
                                            <div
                                                key={schedule.id}
                                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{schedule.group_name ?? 'Unnamed group'}</p>
                                                        <p className="text-[11px] text-slate-500">
                                                            {schedule.program_set_name ?? 'Program set'} • {schedule.room?.name ?? 'No room'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500">Managed by {managerName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {formatDateLabel(schedule.scheduled_date)}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {formatTimeRange(schedule.start_time, schedule.end_time)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => visitScheduleManager({ scheduleId: schedule.id })}
                                                        className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-800"
                                                    >
                                                        {canManage ? 'Edit' : 'View'}
                                                    </button>
                                                    {canManage ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateScheduleStatus(schedule, 'Cancelled')}
                                                            className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex h-full flex-col lg:self-stretch">
                        <div className="flex h-full min-h-[360px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-slate-800">Schedule Conflict Checker</h3>
                                <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                        hasConflicts
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-green-100 text-green-700'
                                    }`}
                                >
                                    {hasConflicts ? 'Conflicts detected' : 'No conflicts detected'}
                                </span>
                            </div>

                            <div className="mt-4 grid flex-1 content-start gap-3">
                                {rooms.map((room) => {
                                    const isConflict = roomConflicts.get(room.id);

                                    return (
                                        <div
                                            key={room.id}
                                            className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${
                                                isConflict
                                                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                    : 'border-green-200 bg-green-50 text-green-700'
                                            }`}
                                        >
                                            {room.name} • {isConflict ? 'Conflict found' : 'Available'}
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="mt-4 text-[11px] text-slate-500">
                                <XCircle className="mr-1 inline h-3 w-3" />
                                Conflicts are checked for {formatDateLabel(selectedDateKey)}. Room availability is validated automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.section>
        </InstructorLayout>
    );
};

export default SchedulingPage;
