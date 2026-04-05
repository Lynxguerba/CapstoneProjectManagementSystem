import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Flag, Lightbulb, ListTree, PackageCheck, Rocket, Search, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import ScheduleGroupDetailsModal, { type ScheduleGroupDetails } from '@/components/Panelist/ScheduleGroupDetailsModal';
import PanelLayout from './_layout';

type PhaseKey = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';

type ScheduleRow = {
    id: string;
    phase: PhaseKey;
    date: string;
    time: string;
    room: string;
    defenseType: string;
    projectTitle: string;
    defenseStatus: 'Pending' | 'In Progress' | 'Completed' | string;
    evaluationStatus: 'Pending' | 'Submitted' | 'Locked' | string;
    group: ScheduleGroupDetails;
};

type PanelistScheduleProps = {
    rows?: ScheduleRow[];
};

const phaseTabs: { key: PhaseKey; label: string; icon: LucideIcon }[] = [
    { key: 'phase1', label: 'Phase 1: Concept Papers', icon: Lightbulb },
    { key: 'phase2', label: 'Phase 2: Outline', icon: ListTree },
    { key: 'phase3', label: 'Phase 3: Pre-Deployment', icon: PackageCheck },
    { key: 'phase4', label: 'Phase 4: Deployment', icon: Rocket },
    { key: 'phase5', label: 'Phase 5: Finals', icon: Flag },
];

const evaluationBadgeClass = (status: string): string => {
    if (status === 'Submitted' || status === 'Locked') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    return 'border-amber-200 bg-amber-100 text-amber-700';
};

const defenseBadgeClass = (status: string): string => {
    if (status === 'Completed') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'In Progress') {
        return 'border-indigo-200 bg-indigo-100 text-indigo-700';
    }

    return 'border-amber-200 bg-amber-100 text-amber-700';
};

const PanelistSchedule = () => {
    const { props } = usePage<PanelistScheduleProps>();
    const scheduleRows = React.useMemo(() => props.rows ?? [], [props.rows]);
    const [query, setQuery] = React.useState('');
    const [activePhase, setActivePhase] = React.useState<PhaseKey>('phase1');
    const [selectedGroupDetails, setSelectedGroupDetails] = React.useState<ScheduleGroupDetails | null>(null);

    const activePhaseRows = React.useMemo(() => {
        return scheduleRows.filter((row) => row.phase === activePhase);
    }, [activePhase, scheduleRows]);

    const filteredRows = React.useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return activePhaseRows;
        }

        return activePhaseRows.filter((row) => {
            const searchable = [
                row.group.groupName,
                row.projectTitle,
                row.room,
                row.group.programSetName ?? '',
                row.group.adviser?.name ?? '',
                ...row.group.coPanelists.map((panelist) => panelist.name ?? ''),
            ]
                .join(' ')
                .toLowerCase();

            return searchable.includes(normalizedQuery);
        });
    }, [activePhaseRows, query]);

    const activePhaseLabel = React.useMemo(() => {
        return phaseTabs.find((tab) => tab.key === activePhase)?.label ?? 'Phase';
    }, [activePhase]);

    const defenseStatus = React.useMemo(() => {
        if (filteredRows.some((row) => row.defenseStatus === 'In Progress')) {
            return 'In Progress';
        }

        if (filteredRows.length > 0 && filteredRows.every((row) => row.defenseStatus === 'Completed')) {
            return 'Completed';
        }

        return 'Pending';
    }, [filteredRows]);

    return (
        <PanelLayout title="Defense Schedule" subtitle="Track assigned groups by phase">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/panelist/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Defense Schedule
                    </span>
                </nav>

                <div className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    {phaseTabs.map((tab) => {
                        const isActive = activePhase === tab.key;
                        const PhaseIcon = tab.icon;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActivePhase(tab.key)}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                            >
                                <PhaseIcon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={`Search ${activePhaseLabel.toLowerCase()} groups...`}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 md:w-72"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        Clear Search
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{activePhaseLabel} Group List</p>
                                <p className="text-xs text-slate-500">List of groups assigned to you for this phase.</p>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[11px] font-semibold text-slate-500 uppercase">Defense Status</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${defenseBadgeClass(defenseStatus)}`}>
                                {defenseStatus}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[880px] text-left text-xs">
                            <thead className="border-b border-slate-200 bg-white text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">Date & Time</th>
                                    <th className="px-5 py-3">Group</th>
                                    <th className="px-5 py-3">Project</th>
                                    <th className="px-5 py-3">Room</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Evaluation</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-xs text-slate-500">
                                            No schedule items found for this phase.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row) => (
                                        <tr key={row.id} className="transition-colors hover:bg-emerald-50/30">
                                            <td className="px-5 py-3.5 text-slate-700">
                                                {row.date} · {row.time}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-slate-800">{row.group.groupName}</p>
                                                <p className="text-[10px] text-slate-500">{row.group.programSetName ?? 'Program set'}</p>
                                            </td>
                                            <td className="min-w-[220px] px-5 py-3.5 text-slate-700">{row.projectTitle}</td>
                                            <td className="px-5 py-3.5 text-slate-700">{row.room}</td>
                                            <td className="px-5 py-3.5 text-slate-700">{row.defenseType}</td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${evaluationBadgeClass(row.evaluationStatus)}`}
                                                >
                                                    {row.evaluationStatus}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="inline-flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedGroupDetails(row.group)}
                                                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                    >
                                                        Details
                                                    </button>
                                                    <Link
                                                        href={`/panelist/live-defense?group=${row.group.id}`}
                                                        className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                                    >
                                                        Evaluate
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-800">{filteredRows.length}</span> group
                    {filteredRows.length === 1 ? '' : 's'} in {activePhaseLabel}.
                </p>

                <ScheduleGroupDetailsModal
                    open={selectedGroupDetails !== null}
                    onClose={() => setSelectedGroupDetails(null)}
                    group={selectedGroupDetails}
                />
            </motion.section>
        </PanelLayout>
    );
};

export default PanelistSchedule;
