import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, ChevronsLeft, FileText, GraduationCap, PanelRightOpen, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import adviserRoutes from '../../routes/adviser';
import AdviserLayout from './_layout';

type Concept = {
    id: number;
    title: string;
    submitted_at?: string | null;
    file_url?: string | null;
};

type GroupConceptBundle = {
    group_id: number;
    group_name: string;
    leader_name?: string | null;
    program_set_id?: number | null;
    program_set_name?: string | null;
    school_year?: string | null;
    updated_at?: string | null;
    concepts: Concept[];
};

type AdviserConceptsPageProps = {
    groups?: GroupConceptBundle[];
};

const AdviserConcepts = () => {
    const { props } = usePage<AdviserConceptsPageProps>();
    const [query, setQuery] = useState('');
    const [selectedProgramSet, setSelectedProgramSet] = useState('All');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('All');
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [selectedConceptId, setSelectedConceptId] = useState<number | null>(null);
    const [isSubmissionsPaneCollapsed, setIsSubmissionsPaneCollapsed] = useState(false);
    const [bundles, setBundles] = useState<GroupConceptBundle[]>(() => props.groups ?? []);

    useEffect(() => {
        setBundles(props.groups ?? []);
    }, [props.groups]);

    const programSetOptions = useMemo(() => {
        const options = new Map<string, { value: string; label: string }>();

        bundles.forEach((bundle) => {
            if (!bundle.program_set_id) {
                return;
            }

            const label = bundle.program_set_name ?? 'Program set';
            options.set(String(bundle.program_set_id), { value: String(bundle.program_set_id), label });
        });

        return Array.from(options.values()).sort((first, second) => first.label.localeCompare(second.label));
    }, [bundles]);

    const academicYearOptions = useMemo(() => {
        const options = new Set<string>();

        bundles.forEach((bundle) => {
            if (bundle.school_year) {
                options.add(bundle.school_year);
            }
        });

        return Array.from(options.values()).sort((first, second) => first.localeCompare(second));
    }, [bundles]);

    useEffect(() => {
        if (selectedProgramSet === 'All') {
            return;
        }

        const stillAvailable = programSetOptions.some((option) => option.value === selectedProgramSet);
        if (!stillAvailable) {
            setSelectedProgramSet('All');
        }
    }, [programSetOptions, selectedProgramSet]);

    useEffect(() => {
        if (selectedAcademicYear === 'All') {
            return;
        }

        const stillAvailable = academicYearOptions.includes(selectedAcademicYear);
        if (!stillAvailable) {
            setSelectedAcademicYear('All');
        }
    }, [academicYearOptions, selectedAcademicYear]);

    const filteredBundles = useMemo(() => {
        const q = query.trim().toLowerCase();

        return bundles.filter((bundle) => {
            const matchesProgramSet = selectedProgramSet === 'All' || String(bundle.program_set_id) === selectedProgramSet;
            if (!matchesProgramSet) {
                return false;
            }

            const matchesAcademicYear = selectedAcademicYear === 'All' || bundle.school_year === selectedAcademicYear;
            if (!matchesAcademicYear) {
                return false;
            }

            if (!q) {
                return true;
            }

            const matchesGroup = bundle.group_name.toLowerCase().includes(q);
            const matchesConcept = bundle.concepts.some((concept) => concept.title.toLowerCase().includes(q));

            return matchesGroup || matchesConcept;
        });
    }, [bundles, query, selectedProgramSet, selectedAcademicYear]);

    const selectedGroup = useMemo(
        () => filteredBundles.find((bundle) => bundle.group_id === selectedGroupId) ?? null,
        [filteredBundles, selectedGroupId],
    );
    const selectedConcept = useMemo(
        () => selectedGroup?.concepts.find((concept) => concept.id === selectedConceptId) ?? null,
        [selectedConceptId, selectedGroup],
    );

    useEffect(() => {
        if (selectedGroupId === null) {
            return;
        }

        const stillAvailable = filteredBundles.some((bundle) => bundle.group_id === selectedGroupId);
        if (!stillAvailable) {
            setSelectedGroupId(null);
            setSelectedConceptId(null);
        }
    }, [filteredBundles, selectedGroupId]);

    useEffect(() => {
        if (selectedConceptId === null || !selectedGroup) {
            return;
        }

        const stillAvailable = selectedGroup.concepts.some((concept) => concept.id === selectedConceptId);
        if (!stillAvailable) {
            setSelectedConceptId(null);
        }
    }, [selectedConceptId, selectedGroup]);

    return (
        <AdviserLayout title="Concepts" subtitle="Review concept submissions from your groups">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={adviserRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Concepts
                    </span>
                </nav>

                <div className={`grid grid-cols-1 gap-5 ${isSubmissionsPaneCollapsed ? 'xl:grid-cols-[88px_minmax(0,1fr)]' : 'xl:grid-cols-3'}`}>
                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-emerald-700" />
                                <div className={isSubmissionsPaneCollapsed ? 'hidden' : ''}>
                                    <div className="text-sm font-semibold text-slate-900">Submissions</div>
                                    <div className="text-xs text-slate-500">Select a group to review.</div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsSubmissionsPaneCollapsed((current) => !current)}
                                className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={isSubmissionsPaneCollapsed ? 'Expand submissions pane' : 'Collapse submissions pane'}
                            >
                                {isSubmissionsPaneCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                            </button>
                        </div>

                        {isSubmissionsPaneCollapsed ? null : (
                            <div className="mt-4 space-y-2">
                                <div className="relative">
                                    <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search group or title..."
                                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-8 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div className="relative">
                                        <GraduationCap className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={selectedProgramSet}
                                            onChange={(event) => setSelectedProgramSet(event.target.value)}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="All">All Program Sets</option>
                                            {programSetOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={selectedAcademicYear}
                                            onChange={(event) => setSelectedAcademicYear(event.target.value)}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="All">All A.Y.</option>
                                            {academicYearOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 space-y-2">
                            {filteredBundles.map((bundle) => {
                                const active = bundle.group_id === selectedGroupId;
                                const firstLetter = bundle.group_name.trim().charAt(0).toUpperCase() || '?';

                                return (
                                    <button
                                        key={bundle.group_id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedGroupId(bundle.group_id);
                                            setSelectedConceptId(null);
                                        }}
                                        className={`w-full rounded-xl border text-left transition-colors ${
                                            active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        {isSubmissionsPaneCollapsed ? (
                                            <div className="flex items-center justify-center px-2 py-3">
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${
                                                        active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {firstLetter}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-3 px-4 py-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-slate-900">{bundle.group_name}</div>
                                                    <div className="mt-1 text-[11px] text-slate-500">
                                                        {bundle.program_set_name ?? 'Program set'}
                                                        {bundle.school_year ? ` • ${bundle.school_year}` : ''}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-slate-500">Updated: {bundle.updated_at ?? '—'}</div>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}

                            {filteredBundles.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                                    No submissions match the current filters.
                                </div>
                            ) : null}
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${isSubmissionsPaneCollapsed ? '' : 'xl:col-span-2'}`}
                    >
                        {!selectedGroup ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                                <div className="text-sm font-semibold text-slate-900">Select a group</div>
                                <div className="mt-1 text-xs text-slate-600">Choose a group from the left to review submissions.</div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                    <span className="font-semibold text-slate-900">Group</span>
                                    <span className="font-semibold text-slate-900">{selectedGroup.group_name}</span>
                                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                        Leader {selectedGroup.leader_name ?? 'N/A'}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                        {selectedGroup.program_set_name ?? 'Program set'}
                                    </span>
                                </div>

                                <div className="space-y-5">
                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[360px] text-left text-xs">
                                                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">Title</th>
                                                        <th className="px-4 py-3 font-semibold">Submitted Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedGroup.concepts.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                                                                No concept submissions yet.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        selectedGroup.concepts.map((concept) => {
                                                            const active = concept.id === selectedConceptId;

                                                            return (
                                                                <tr
                                                                    key={concept.id}
                                                                    onClick={() => {
                                                                        setSelectedConceptId(concept.id);
                                                                    }}
                                                                    className={`cursor-pointer transition-colors ${active ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                                                                >
                                                                    <td className="px-4 py-3">
                                                                        <div className="font-semibold text-slate-900">{concept.title}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                                        {concept.submitted_at ?? '—'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                        <div className="border-b border-slate-200 bg-white px-4 py-3">
                                            <div className="text-sm font-semibold text-slate-900">PDF Viewer</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {selectedConcept ? selectedConcept.title : 'Select a concept paper row to preview the PDF.'}
                                            </div>
                                        </div>

                                        {!selectedConcept ? (
                                            <div className="flex min-h-[18rem] items-center justify-center p-6 text-center text-sm text-slate-500">
                                                Select a concept paper from the table to load the PDF viewer.
                                            </div>
                                        ) : selectedConcept.file_url ? (
                                            <div className="bg-slate-100 p-4 lg:p-5">
                                                <iframe
                                                    key={selectedConcept.file_url}
                                                    src={`${selectedConcept.file_url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                                    title={selectedConcept.title}
                                                    className="h-[72vh] w-full rounded-2xl border border-slate-200 bg-white"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex min-h-[18rem] items-center justify-center p-6 text-center text-sm text-slate-500">
                                                PDF preview is not available for the selected submission.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.section>
                </div>
            </motion.section>
        </AdviserLayout>
    );
};

export default AdviserConcepts;
