import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, ChevronRight, FileText, GraduationCap, MessageSquareText, Search, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import ConceptApproveModal from '../../components/Adviser/ConceptApproveModal';
import ConceptRejectModal from '../../components/Adviser/ConceptRejectModal';
import ConceptRevisionModal from '../../components/Adviser/ConceptRevisionModal';
import adviserRoutes from '../../routes/adviser';
import AdviserLayout from './_layout';

type ConceptDecision = 'Pending' | 'Approved' | 'Rejected' | 'For Revision';

type Concept = {
    id: number;
    title: string;
    decision: ConceptDecision;
    submitted_at?: string | null;
};

type GroupConceptBundle = {
    group_id: number;
    group_name: string;
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
    const [feedback, setFeedback] = useState('');
    const [activeModal, setActiveModal] = useState<'approve' | 'revision' | 'reject' | null>(null);
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

    const decisionPill = (d: ConceptDecision): string => {
        if (d === 'Approved') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }

        if (d === 'Rejected') {
            return 'bg-rose-50 text-rose-700 border-rose-200';
        }

        if (d === 'For Revision') {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }

        return 'bg-slate-50 text-slate-700 border-slate-200';
    };

    const setDecision = (decision: ConceptDecision) => {
        if (!selectedGroup || !selectedConcept) {
            return;
        }

        setBundles((previous) =>
            previous.map((bundle) => {
                if (bundle.group_id !== selectedGroup.group_id) {
                    return bundle;
                }

                return {
                    ...bundle,
                    concepts: bundle.concepts.map((concept) =>
                        concept.id === selectedConcept.id
                            ? {
                                  ...concept,
                                  decision,
                              }
                            : concept,
                    ),
                };
            }),
        );
    };

    const closeModal = () => setActiveModal(null);

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

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1"
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={16} className="text-emerald-700" />
                            <div>
                                <div className="text-sm font-semibold text-slate-900">Submissions</div>
                                <div className="text-xs text-slate-500">Select a group to review.</div>
                            </div>
                        </div>

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

                        <div className="mt-4 space-y-2">
                            {filteredBundles.map((bundle) => {
                                const active = bundle.group_id === selectedGroupId;
                                const pendingCount = bundle.concepts.filter((concept) => concept.decision === 'Pending').length;

                                return (
                                    <button
                                        key={bundle.group_id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedGroupId(bundle.group_id);
                                            setSelectedConceptId(null);
                                            setFeedback('');
                                        }}
                                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                                            active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-slate-900">{bundle.group_name}</div>
                                                <div className="mt-1 text-[11px] text-slate-500">
                                                    {bundle.program_set_name ?? 'Program set'}
                                                    {bundle.school_year ? ` • ${bundle.school_year}` : ''}
                                                </div>
                                                <div className="mt-1 text-[11px] text-slate-500">Updated: {bundle.updated_at ?? '—'}</div>
                                            </div>
                                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                {pendingCount} pending
                                            </span>
                                        </div>
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
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2"
                    >
                        {!selectedGroup ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                                <div className="text-sm font-semibold text-slate-900">Select a group</div>
                                <div className="mt-1 text-xs text-slate-600">Choose a group from the left to review submissions.</div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-2">
                                    <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Group</div>
                                    <div className="text-xl font-bold text-slate-900">{selectedGroup.group_name}</div>
                                    <div className="text-xs text-slate-600">
                                        {selectedGroup.program_set_name ?? 'Program set'}
                                        {selectedGroup.school_year ? ` • ${selectedGroup.school_year}` : ''}
                                    </div>
                                </div>

                                {selectedGroup.concepts.length === 0 ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                                        <div className="text-sm font-semibold text-slate-900">No concept submissions yet</div>
                                        <div className="mt-1 text-xs text-slate-600">Waiting for the group to submit their concept files.</div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {selectedGroup.concepts.map((concept) => {
                                            const active = concept.id === selectedConceptId;
                                            return (
                                                <button
                                                    key={concept.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedConceptId(concept.id);
                                                        setFeedback('');
                                                    }}
                                                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                                                        active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="line-clamp-2 text-sm font-semibold text-slate-900">{concept.title}</div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                                        <span
                                                            className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${decisionPill(
                                                                concept.decision,
                                                            )}`}
                                                        >
                                                            {concept.decision}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-600">
                                                            Submitted: {concept.submitted_at ?? '—'}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {!selectedConcept ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                                        <div className="text-sm font-semibold text-slate-900">Select a submission</div>
                                        <div className="mt-1 text-xs text-slate-600">Pick a submission to review and decide.</div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <div className="text-sm font-semibold text-slate-900">Submission Detail</div>
                                            <div className="mt-2 text-sm font-semibold text-slate-700">{selectedConcept.title}</div>
                                            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${decisionPill(
                                                        selectedConcept.decision,
                                                    )}`}
                                                >
                                                    {selectedConcept.decision}
                                                </span>
                                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700">
                                                    Submitted: {selectedConcept.submitted_at ?? '—'}
                                                </span>
                                            </div>

                                            <div className="mt-4">
                                                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Preview</div>
                                                <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                                                    <div className="text-sm font-semibold text-slate-800">Concept preview area</div>
                                                    <div className="mt-1 text-xs text-slate-600">UI placeholder only.</div>
                                                    <button
                                                        type="button"
                                                        className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                                    >
                                                        Open preview
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <div className="flex items-center gap-2">
                                                <MessageSquareText size={16} className="text-emerald-700" />
                                                <div className="text-sm font-semibold text-slate-900">Feedback</div>
                                            </div>

                                            <textarea
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                placeholder="Add adviser feedback comment..."
                                                className="mt-3 h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                            />

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('approve')}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('revision')}
                                                    className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                                                >
                                                    Request revision
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveModal('reject')}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                                                >
                                                    <XCircle size={14} />
                                                    Reject
                                                </button>
                                            </div>

                                            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                                <div className="text-xs font-semibold text-emerald-900">Reminder</div>
                                                <div className="mt-1 text-xs text-emerald-700">
                                                    Only one submission can be approved per group (enforced later in backend).
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.section>
                </div>
            </motion.section>

            <ConceptApproveModal
                open={activeModal === 'approve' && Boolean(selectedConcept)}
                groupName={selectedGroup?.group_name}
                conceptTitle={selectedConcept?.title}
                onClose={closeModal}
                onConfirm={() => {
                    setDecision('Approved');
                    closeModal();
                }}
            />
            <ConceptRevisionModal
                open={activeModal === 'revision' && Boolean(selectedConcept)}
                groupName={selectedGroup?.group_name}
                conceptTitle={selectedConcept?.title}
                onClose={closeModal}
                onConfirm={() => {
                    setDecision('For Revision');
                    closeModal();
                }}
            />
            <ConceptRejectModal
                open={activeModal === 'reject' && Boolean(selectedConcept)}
                groupName={selectedGroup?.group_name}
                conceptTitle={selectedConcept?.title}
                onClose={closeModal}
                onConfirm={() => {
                    setDecision('Rejected');
                    closeModal();
                }}
            />
        </AdviserLayout>
    );
};

export default AdviserConcepts;
