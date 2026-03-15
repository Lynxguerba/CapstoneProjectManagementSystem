import { useForm } from '@inertiajs/react';
import { Calendar, CalendarCheck, Clock, DoorOpen, FileText, Search } from 'lucide-react';
import React from 'react';
import defenseSchedules from '../../../routes/instructor/defense-schedules';

type PanelistSummary = {
    id?: number | null;
    name?: string | null;
    slot?: number;
};

type GroupOption = {
    id: number;
    name: string;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    panelists?: PanelistSummary[];
};

type RoomOption = {
    id: number;
    name: string;
    capacity: number;
    is_active: boolean;
};

type DefenseScheduleSummary = {
    id: number;
    group_id?: number | null;
    group_name?: string | null;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    room?: RoomOption | null;
    scheduled_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    stage?: string | null;
    notes?: string | null;
};

type ScheduleDefenseFormProps = {
    groups: GroupOption[];
    rooms: RoomOption[];
    initialSchedule?: DefenseScheduleSummary | null;
    defaultDate?: string;
    defaultRoomId?: number | null;
    defaultStage?: string;
    readOnly?: boolean;
    onSubmitted?: () => void;
    onReset?: () => void;
};

type ScheduleForm = {
    schedule_id: number | null;
    group_id: string;
    room_id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    stage: string;
    notes: string;
};

const stageOptions = ['Concept', 'Outline', 'Pre-Deployment', 'Deployment'];

const ScheduleDefenseForm = ({
    groups,
    rooms,
    initialSchedule,
    defaultDate,
    defaultRoomId,
    defaultStage,
    readOnly = false,
    onSubmitted,
    onReset,
}: ScheduleDefenseFormProps) => {
    const form = useForm<ScheduleForm>({
        schedule_id: null,
        group_id: '',
        room_id: '',
        scheduled_date: '',
        start_time: '',
        end_time: '',
        stage: 'Concept',
        notes: '',
    });

    const [errorMessage, setErrorMessage] = React.useState('');
    const [groupSearch, setGroupSearch] = React.useState('');
    const [programSetFilter, setProgramSetFilter] = React.useState('');
    const resolvedDefaultStage = React.useMemo(() => {
        if (defaultStage && stageOptions.includes(defaultStage)) {
            return defaultStage;
        }

        return 'Concept';
    }, [defaultStage]);

    const programSetOptions = React.useMemo(() => {
        const options: string[] = [];
        const seen = new Set<string>();

        groups.forEach((group) => {
            const name = (group.program_set_name ?? '').trim();
            if (!name || seen.has(name)) {
                return;
            }

            seen.add(name);
            options.push(name);
        });

        return options;
    }, [groups]);

    const filteredGroups = React.useMemo(() => {
        if (!programSetFilter) {
            return groups;
        }

        return groups.filter((group) => (group.program_set_name ?? '') === programSetFilter);
    }, [groups, programSetFilter]);

    const groupSearchResults = React.useMemo(() => {
        const query = groupSearch.trim().toLowerCase();
        if (!query) {
            return [];
        }

        return filteredGroups.filter((group) => {
            const name = group.name.toLowerCase();
            const programSetName = (group.program_set_name ?? '').toLowerCase();
            const program = (group.program ?? '').toLowerCase();
            const schoolYear = (group.school_year ?? '').toLowerCase();

            return (
                name.includes(query) ||
                programSetName.includes(query) ||
                program.includes(query) ||
                schoolYear.includes(query)
            );
        });
    }, [filteredGroups, groupSearch]);

    const selectedGroup = React.useMemo(() => {
        if (!form.data.group_id) {
            return null;
        }

        return groups.find((group) => String(group.id) === form.data.group_id) ?? null;
    }, [groups, form.data.group_id]);

    const selectedGroupMeta = React.useMemo(() => {
        if (!selectedGroup) {
            return '';
        }

        return [selectedGroup.program_set_name, selectedGroup.program, selectedGroup.school_year].filter(Boolean).join(' • ');
    }, [selectedGroup]);

    const fallbackGroupMeta = React.useMemo(() => {
        if (!initialSchedule) {
            return '';
        }

        return [initialSchedule.program_set_name, initialSchedule.program, initialSchedule.school_year].filter(Boolean).join(' • ');
    }, [initialSchedule]);

    const showFallbackGroup = Boolean(!selectedGroup && initialSchedule?.group_id && initialSchedule?.group_name);

    React.useEffect(() => {
        if (initialSchedule) {
            form.setData({
                schedule_id: initialSchedule.id,
                group_id: initialSchedule.group_id ? String(initialSchedule.group_id) : '',
                room_id: initialSchedule.room?.id ? String(initialSchedule.room.id) : '',
                scheduled_date: initialSchedule.scheduled_date ?? '',
                start_time: initialSchedule.start_time?.slice(0, 5) ?? '',
                end_time: initialSchedule.end_time?.slice(0, 5) ?? '',
                stage: initialSchedule.stage ?? 'Concept',
                notes: initialSchedule.notes ?? '',
            });
        } else {
            form.setData({
                schedule_id: null,
                group_id: '',
                room_id: defaultRoomId ? String(defaultRoomId) : '',
                scheduled_date: defaultDate ?? '',
                start_time: '',
                end_time: '',
                stage: resolvedDefaultStage,
                notes: '',
            });
        }

        form.clearErrors();
        setErrorMessage('');
        setGroupSearch('');
        setProgramSetFilter('');
    }, [initialSchedule, defaultDate, defaultRoomId, resolvedDefaultStage]);

    React.useEffect(() => {
        if (!initialSchedule || programSetFilter) {
            return;
        }

        const group = groups.find((item) => item.id === initialSchedule.group_id);
        if (group?.program_set_name) {
            setProgramSetFilter(group.program_set_name);
        }
    }, [initialSchedule, groups, programSetFilter]);

    React.useEffect(() => {
        if (initialSchedule || programSetFilter) {
            return;
        }

        if (programSetOptions.length === 1) {
            setProgramSetFilter(programSetOptions[0]);
        }
    }, [initialSchedule, programSetFilter, programSetOptions]);

    React.useEffect(() => {
        if (!form.data.group_id) {
            return;
        }

        const selected = groups.find((item) => String(item.id) === form.data.group_id);
        if (!selected) {
            return;
        }

        if (programSetFilter && selected.program_set_name !== programSetFilter) {
            form.setData('group_id', '');
        }
    }, [programSetFilter, groups, form]);

    const submitForm = () => {
        if (readOnly) {
            return;
        }

        setErrorMessage('');

        form.post(defenseSchedules.upsert.url(), {
            preserveScroll: true,
            onError: (errors) => {
                const firstError =
                    errors.group_id ||
                    errors.room_id ||
                    errors.scheduled_date ||
                    errors.start_time ||
                    errors.end_time ||
                    errors.stage ||
                    errors.notes;

                if (firstError) {
                    setErrorMessage(firstError);
                }
            },
            onSuccess: () => {
                if (onSubmitted) {
                    onSubmitted();
                }
            },
        });
    };

    const submitLabel = initialSchedule ? 'Update Schedule' : 'Save Schedule';
    const isDisabled = readOnly || form.processing;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-slate-700" />
                    <h2 className="text-base font-semibold text-slate-800">
                        {initialSchedule ? 'Schedule Details' : 'Create Defense Schedule'}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {readOnly ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">Read-only</span>
                    ) : null}
                    {onReset ? (
                        <button
                            type="button"
                            onClick={onReset}
                            disabled={isDisabled}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            New Schedule
                        </button>
                    ) : null}
                </div>
            </div>
            {readOnly && initialSchedule ? (
                <p className="mt-2 text-xs text-slate-500">
                    This schedule is managed by another instructor. You can view the details, but editing is disabled.
                </p>
            ) : null}

            {errorMessage ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm font-semibold text-slate-700">Program Set</label>
                    <select
                        value={programSetFilter}
                        onChange={(event) => setProgramSetFilter(event.target.value)}
                        disabled={programSetOptions.length === 0 || isDisabled}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                        <option value="">All Program Sets</option>
                        {programSetOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    {programSetOptions.length === 0 ? <p className="mt-1 text-xs text-slate-500">No program sets available.</p> : null}
                </div>

                <div>
                    <label className="text-sm font-semibold text-slate-700">Stage</label>
                    <div className="relative mt-1.5">
                        <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                            value={form.data.stage}
                            onChange={(event) => form.setData('stage', event.target.value)}
                            disabled={isDisabled}
                            className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                            {stageOptions.map((stage) => (
                                <option key={stage} value={stage}>
                                    {stage}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Group</label>
                    <div className="relative mt-1.5">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={groupSearch}
                            onChange={(event) => setGroupSearch(event.target.value)}
                            placeholder="Search by group name or program set..."
                            disabled={groups.length === 0 || isDisabled}
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>

                    {groups.length === 0 ? <p className="mt-1 text-xs text-slate-500">No groups available.</p> : null}
                    {groups.length > 0 && filteredGroups.length === 0 && groupSearch.trim() === '' ? (
                        <p className="mt-1 text-xs text-slate-500">No groups found for this program set.</p>
                    ) : null}
                    {groups.length > 0 && filteredGroups.length > 0 && groupSearch.trim() === '' ? (
                        <p className="mt-1 text-xs text-slate-500">Start typing to search groups.</p>
                    ) : null}

                    {groupSearch.trim() !== '' ? (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                            {groupSearchResults.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-slate-500">No groups found.</p>
                            ) : (
                                groupSearchResults.map((group) => {
                                    const panelCount = group.panelists?.length ?? 0;
                                    const isEligible = panelCount >= 3;
                                    const isSelected = form.data.group_id === String(group.id);
                                    const isDisabledResult = !isEligible && !isSelected;
                                    const meta = [group.program_set_name, group.program, group.school_year].filter(Boolean).join(' • ');

                                    return (
                                        <button
                                            key={group.id}
                                            type="button"
                                            onClick={() => {
                                                if (readOnly) {
                                                    return;
                                                }

                                                form.setData('group_id', String(group.id));
                                                setGroupSearch('');
                                            }}
                                            disabled={isDisabled || isDisabledResult}
                                            className={`flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-b-0 ${
                                                isDisabledResult || isDisabled
                                                    ? 'cursor-not-allowed bg-amber-50/60'
                                                    : isSelected
                                                    ? 'bg-emerald-50/80'
                                                    : 'hover:bg-emerald-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium text-slate-800">{group.name}</span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        isEligible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {panelCount}/3 panelists
                                                </span>
                                            </div>
                                            {meta ? <span className="text-xs text-slate-500">{meta}</span> : null}
                                            {isSelected ? <span className="text-[10px] font-semibold text-emerald-700">Selected</span> : null}
                                            {!isEligible ? (
                                                <span className="text-[10px] font-semibold text-amber-700">Needs 3 panelists</span>
                                            ) : null}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    ) : null}

                    {selectedGroup ? (
                        <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Selected Group</p>
                                    <p className="text-sm font-semibold text-slate-800">{selectedGroup.name}</p>
                                    {selectedGroupMeta ? <p className="text-xs text-slate-600">{selectedGroupMeta}</p> : null}
                                </div>
                                {!readOnly ? (
                                    <button
                                        type="button"
                                        onClick={() => form.setData('group_id', '')}
                                        className="rounded-full border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                        Clear
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ) : showFallbackGroup ? (
                        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">Selected Group</p>
                                    <p className="text-sm font-semibold text-slate-800">{initialSchedule?.group_name}</p>
                                    {fallbackGroupMeta ? <p className="text-xs text-slate-600">{fallbackGroupMeta}</p> : null}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {form.errors.group_id ? <p className="mt-1 text-xs text-rose-600">{form.errors.group_id}</p> : null}
                </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm font-semibold text-slate-700">Room</label>
                    <div className="relative mt-1.5">
                        <DoorOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                            value={form.data.room_id}
                            onChange={(event) => form.setData('room_id', event.target.value)}
                            disabled={isDisabled}
                            className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                            <option value="">Select room</option>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id} disabled={!room.is_active}>
                                    {room.name} (Cap {room.capacity})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-semibold text-slate-700">Defense Date</label>
                    <div className="relative mt-1.5">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={form.data.scheduled_date}
                            onChange={(event) => form.setData('scheduled_date', event.target.value)}
                            disabled={isDisabled}
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm font-semibold text-slate-700">Start Time</label>
                    <div className="relative mt-1.5">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="time"
                            value={form.data.start_time}
                            onChange={(event) => form.setData('start_time', event.target.value)}
                            disabled={isDisabled}
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-700">End Time</label>
                    <div className="relative mt-1.5">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="time"
                            value={form.data.end_time}
                            onChange={(event) => form.setData('end_time', event.target.value)}
                            disabled={isDisabled}
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
                <textarea
                    value={form.data.notes}
                    onChange={(event) => form.setData('notes', event.target.value)}
                    rows={3}
                    disabled={isDisabled}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="Add optional notes for the defense schedule."
                />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={submitForm}
                    disabled={isDisabled}
                    className="group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                    {form.processing ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <CalendarCheck className="h-4 w-4" />
                            {submitLabel}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ScheduleDefenseForm;
