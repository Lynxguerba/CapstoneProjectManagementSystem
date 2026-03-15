import { useForm } from '@inertiajs/react';
import { Calendar, CalendarCheck, Clock, DoorOpen, FileText, Search, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
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
    room?: RoomOption | null;
    scheduled_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    stage?: string | null;
    notes?: string | null;
};

type ScheduleDefenseModalProps = {
    open: boolean;
    groups: GroupOption[];
    rooms: RoomOption[];
    initialSchedule?: DefenseScheduleSummary | null;
    defaultDate?: string;
    defaultRoomId?: number | null;
    defaultStage?: string;
    onClose: () => void;
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

const ScheduleDefenseModal = ({
    open,
    groups,
    rooms,
    initialSchedule,
    defaultDate,
    defaultRoomId,
    defaultStage,
    onClose,
}: ScheduleDefenseModalProps) => {
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

    const [isAppearing, setIsAppearing] = React.useState(false);
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

    React.useEffect(() => {
        if (!open) {
            form.reset();
            form.clearErrors();
            setErrorMessage('');
            setGroupSearch('');
            setProgramSetFilter('');
            return;
        }

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
            setProgramSetFilter('');
        }

        setGroupSearch('');
    }, [open, initialSchedule, defaultDate, defaultRoomId, resolvedDefaultStage]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        if (initialSchedule?.group_id && !programSetFilter) {
            const group = groups.find((item) => item.id === initialSchedule.group_id);
            if (group?.program_set_name) {
                setProgramSetFilter(group.program_set_name);
            }
        }
    }, [open, initialSchedule, groups, programSetFilter]);

    React.useEffect(() => {
        if (!open || initialSchedule || programSetFilter) {
            return;
        }

        if (programSetOptions.length === 1) {
            setProgramSetFilter(programSetOptions[0]);
        }
    }, [open, initialSchedule, programSetFilter, programSetOptions]);

    React.useEffect(() => {
        if (!open || !form.data.group_id) {
            return;
        }

        const selected = groups.find((item) => String(item.id) === form.data.group_id);
        if (!selected) {
            return;
        }

        if (programSetFilter && selected.program_set_name !== programSetFilter) {
            form.setData('group_id', '');
        }
    }, [open, programSetFilter, groups, form]);

    React.useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [open]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !form.processing) {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose, form.processing]);

    const submitForm = () => {
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
                onClose();
            },
        });
    };

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const submitLabel = initialSchedule ? 'Update Schedule' : 'Save Schedule';

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !form.processing) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-800">
                            {initialSchedule ? 'Update Schedule' : 'Create Schedule'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={form.processing}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    {errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Program Set</label>
                                <select
                                    value={programSetFilter}
                                    onChange={(event) => setProgramSetFilter(event.target.value)}
                                    disabled={programSetOptions.length === 0}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                >
                                    <option value="">All Program Sets</option>
                                    {programSetOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                {programSetOptions.length === 0 ? (
                                    <p className="mt-1 text-xs text-slate-500">No program sets available.</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Group</label>
                                <div className="relative mt-1.5">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={groupSearch}
                                        onChange={(event) => setGroupSearch(event.target.value)}
                                        placeholder="Search by group name or program set..."
                                        disabled={groups.length === 0}
                                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </div>

                                {groups.length === 0 ? (
                                    <p className="mt-1 text-xs text-slate-500">No groups available.</p>
                                ) : null}
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
                                                const isDisabled = !isEligible && !isSelected;
                                                const meta = [group.program_set_name, group.program, group.school_year]
                                                    .filter(Boolean)
                                                    .join(' • ');

                                                return (
                                                    <button
                                                        key={group.id}
                                                        type="button"
                                                        onClick={() => {
                                                            form.setData('group_id', String(group.id));
                                                            setGroupSearch('');
                                                        }}
                                                        disabled={isDisabled}
                                                        className={`flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-b-0 ${
                                                            isDisabled
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
                                                                    isEligible
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}
                                                            >
                                                                {panelCount}/3 panelists
                                                            </span>
                                                        </div>
                                                        {meta ? <span className="text-xs text-slate-500">{meta}</span> : null}
                                                        {isSelected ? (
                                                            <span className="text-[10px] font-semibold text-emerald-700">Selected</span>
                                                        ) : null}
                                                        {!isEligible ? (
                                                            <span className="text-[10px] font-semibold text-amber-700">
                                                                Needs 3 panelists
                                                            </span>
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
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                                                    Selected Group
                                                </p>
                                                <p className="text-sm font-semibold text-slate-800">{selectedGroup.name}</p>
                                                {selectedGroupMeta ? (
                                                    <p className="text-xs text-slate-600">{selectedGroupMeta}</p>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => form.setData('group_id', '')}
                                                className="rounded-full border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {form.errors.group_id ? (
                                    <p className="mt-1 text-xs text-rose-600">{form.errors.group_id}</p>
                                ) : null}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Stage</label>
                            <div className="relative mt-1.5">
                                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={form.data.stage}
                                    onChange={(event) => form.setData('stage', event.target.value)}
                                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                >
                                    {stageOptions.map((stage) => (
                                        <option key={stage} value={stage}>
                                            {stage}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Room</label>
                            <div className="relative mt-1.5">
                                <DoorOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={form.data.room_id}
                                    onChange={(event) => form.setData('room_id', event.target.value)}
                                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
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
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Start Time</label>
                            <div className="relative mt-1.5">
                                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="time"
                                    value={form.data.start_time}
                                    onChange={(event) => form.setData('start_time', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
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
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
                        <textarea
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                            rows={3}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            placeholder="Add optional notes for the defense schedule."
                        />
                    </div>
                </div>

                <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={form.processing}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submitForm}
                            disabled={form.processing}
                            className="group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
            </div>
        </div>,
        document.body,
    );
};

export default ScheduleDefenseModal;
