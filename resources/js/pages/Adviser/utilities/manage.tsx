import { Link, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, Power, Save, Settings } from 'lucide-react';
import React from 'react';
import AdviserLayout from '../_layout';

type UtilityProgram = {
    program: string;
    max_groups: number;
    assigned_count?: number;
    pending_count?: number;
};

type AdviserUtilitiesSummary = {
    is_available?: boolean;
    programs?: UtilityProgram[];
};

type AdviserUtilitiesPageProps = {
    programOptions?: string[];
    utilities?: AdviserUtilitiesSummary;
};

type UtilityFormRow = {
    program: string;
    max_groups: string;
};

const AdviserUtilitiesPage = () => {
    const { props } = usePage<AdviserUtilitiesPageProps>();
    const programOptions = props.programOptions ?? [];
    const utilities = props.utilities;
    const utilityPrograms = utilities?.programs ?? [];

    const [isAvailable, setIsAvailable] = React.useState(utilities?.is_available ?? true);
    const [availabilityProcessing, setAvailabilityProcessing] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');

    const initialRows = React.useMemo(() => {
        const utilityMap = new Map(utilityPrograms.map((utility) => [utility.program, utility]));
        const programs = new Set<string>([...programOptions, ...utilityPrograms.map((utility) => utility.program)]);

        return Array.from(programs)
            .filter((program) => program.trim() !== '')
            .sort((first, second) => first.localeCompare(second))
            .map((program) => {
                const existing = utilityMap.get(program);
                return {
                    program,
                    max_groups: existing?.max_groups ?? 0,
                };
            });
    }, [programOptions, utilityPrograms]);

    const form = useForm<{ programs: UtilityFormRow[] }>({
        programs: initialRows.map((row) => ({
            program: row.program,
            max_groups: String(row.max_groups),
        })),
    });

    React.useEffect(() => {
        form.setData(
            'programs',
            initialRows.map((row) => ({
                program: row.program,
                max_groups: String(row.max_groups),
            })),
        );
        form.clearErrors();
        setErrorMessage('');
    }, [initialRows]);

    const metaByProgram = React.useMemo(() => {
        return new Map(utilityPrograms.map((utility) => [utility.program, utility]));
    }, [utilityPrograms]);

    const rows = React.useMemo(() => {
        return form.data.programs.map((row) => {
            const maxGroups = Number(row.max_groups) || 0;
            const meta = metaByProgram.get(row.program);
            const assigned = meta?.assigned_count ?? 0;
            const pending = meta?.pending_count ?? 0;
            const remaining = Math.max(0, maxGroups - assigned);

            return {
                ...row,
                maxGroups,
                assigned,
                pending,
                remaining,
            };
        });
    }, [form.data.programs, metaByProgram]);

    const toggleAvailability = () => {
        if (availabilityProcessing) {
            return;
        }

        setAvailabilityProcessing(true);
        setErrorMessage('');

        router.post(
            '/adviser/utilities/availability',
            { is_available: !isAvailable },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAvailable((current) => !current);
                },
                onError: () => {
                    setErrorMessage('Unable to update availability right now.');
                },
                onFinish: () => {
                    setAvailabilityProcessing(false);
                },
            },
        );
    };

    const handleSubmit = () => {
        setErrorMessage('');

        form.post('/adviser/utilities/programs', {
            preserveScroll: true,
            onError: () => {
                const firstError = form.errors.programs || form.errors['programs.0.program'] || form.errors['programs.0.max_groups'];
                if (firstError) {
                    setErrorMessage(firstError);
                } else {
                    setErrorMessage('Unable to update program utilities right now.');
                }
            },
        });
    };

    return (
        <AdviserLayout title="Capacity Settings" subtitle="Set how many groups you can handle per program">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/adviser/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/adviser/groups" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Groups
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Capacity Settings
                    </span>
                </nav>

                {errorMessage ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                        {errorMessage}
                    </div>
                ) : null}

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <Settings className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Availability</p>
                                <p className="text-xs text-slate-500">Open or close group request intake for your adviser role.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={toggleAvailability}
                            disabled={availabilityProcessing}
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-semibold shadow-sm transition ${
                                isAvailable
                                    ? 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            } ${availabilityProcessing ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                            <Power className="h-3.5 w-3.5" />
                            {isAvailable ? 'Close Availability' : 'Open Availability'}
                        </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                        >
                            {isAvailable ? 'Open for requests' : 'Closed for requests'}
                        </span>
                        <span className="text-[11px] text-slate-500">You can reopen availability anytime.</span>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Program Utilities</p>
                            <p className="text-xs text-slate-500">Set the maximum groups you can handle per program.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save className="h-3.5 w-3.5" />
                            Save Utilities
                        </button>
                    </div>

                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                            <tr>
                                <th className="px-5 py-3">Program</th>
                                <th className="px-5 py-3">Max Groups</th>
                                <th className="px-5 py-3">Assigned</th>
                                <th className="px-5 py-3">Pending</th>
                                <th className="px-5 py-3">Remaining</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, index) => (
                                <tr key={row.program} className="transition-colors hover:bg-emerald-50/30">
                                    <td className="px-5 py-3 font-semibold text-slate-800">{row.program}</td>
                                    <td className="px-5 py-3">
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={form.data.programs[index]?.max_groups ?? ''}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                form.setData(
                                                    'programs',
                                                    form.data.programs.map((item, itemIndex) =>
                                                        itemIndex === index ? { ...item, max_groups: value } : item,
                                                    ),
                                                );
                                            }}
                                            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">{row.assigned}</td>
                                    <td className="px-5 py-3 text-slate-600">{row.pending}</td>
                                    <td className="px-5 py-3 font-semibold text-slate-800">{row.remaining}</td>
                                </tr>
                            ))}

                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-center text-xs text-slate-500">
                                        No program options found. Ask an instructor to create program sets first.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </motion.section>
        </AdviserLayout>
    );
};

export default AdviserUtilitiesPage;
