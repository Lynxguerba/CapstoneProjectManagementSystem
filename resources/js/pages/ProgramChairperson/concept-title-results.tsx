import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import React from 'react';

import ProgramChairpersonLayout from './_layout';

type ConceptSubmission = {
    id: number;
    title: string;
    requirementType: string;
    submittedAt?: string | null;
    instructorStatus: string;
    adviserStatus: string;
    panelistApprovalStatus: 'Approved' | 'Rejected' | string;
    fileUrl?: string | null;
};

type ConceptTitleResultsProps = {
    assignedProgram?: string | null;
    group?: {
        id: number;
        name: string;
        programSetName?: string | null;
        academicYear?: string | null;
        adviserName?: string | null;
        instructorName?: string | null;
    } | null;
    conceptSubmissions?: ConceptSubmission[];
};

const conceptStatusClass = (status: string): string => {
    if (status === 'Approved') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'Rejected') {
        return 'border-rose-200 bg-rose-100 text-rose-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-700';
};

const ProgramChairpersonConceptTitleResultsPage = () => {
    const { props } = usePage<ConceptTitleResultsProps>();
    const group = props.group ?? null;
    const assignedProgram = props.assignedProgram ?? null;
    const conceptSubmissions = React.useMemo(
        () =>
            (props.conceptSubmissions ?? []).filter(
                (submission) => submission.panelistApprovalStatus === 'Approved' || submission.panelistApprovalStatus === 'Rejected',
            ),
        [props.conceptSubmissions],
    );
    const [selectedConceptId, setSelectedConceptId] = React.useState<number | null>(conceptSubmissions[0]?.id ?? null);

    React.useEffect(() => {
        setSelectedConceptId((currentSelectedConceptId) => {
            if (conceptSubmissions.length === 0) {
                return null;
            }

            if (currentSelectedConceptId !== null && conceptSubmissions.some((submission) => submission.id === currentSelectedConceptId)) {
                return currentSelectedConceptId;
            }

            return conceptSubmissions[0]?.id ?? null;
        });
    }, [conceptSubmissions]);

    const selectedConcept = React.useMemo(() => {
        if (selectedConceptId === null) {
            return null;
        }

        return conceptSubmissions.find((submission) => submission.id === selectedConceptId) ?? null;
    }, [conceptSubmissions, selectedConceptId]);

    return (
        <ProgramChairpersonLayout title="Concept Title Results" subtitle="Approved and rejected concept titles with PDF preview">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/program_chairperson/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/program_chairperson/concept-titles" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Concept Titles
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        View
                    </span>
                </nav>

                {assignedProgram === null ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-amber-900">Program assignment is required.</h3>
                        <p className="mt-2 text-sm text-amber-800">
                            No `program` is assigned to this Program Chairperson account yet. Ask an administrator to assign `BSIT` or `BSIS`.
                        </p>
                    </div>
                ) : group === null ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-amber-900">Group not found.</h3>
                        <p className="mt-2 text-sm text-amber-800">This group is unavailable or does not belong to your assigned program.</p>
                    </div>
                ) : (
                    <div className="grid h-[82vh] grid-cols-[350px_minmax(0,1fr)] gap-5">
                        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-sm font-semibold text-slate-900">{group.name}</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    {group.programSetName || 'Unassigned Set'}
                                    {group.academicYear ? ` • ${group.academicYear}` : ''}
                                </p>
                                <p className="mt-2 text-[11px] text-slate-500">
                                    Adviser: <span className="font-medium text-slate-700">{group.adviserName || 'Unassigned'}</span>
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Instructor: <span className="font-medium text-slate-700">{group.instructorName || 'Unassigned'}</span>
                                </p>
                            </div>

                            <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
                                {conceptSubmissions.map((submission) => {
                                    const isActive = submission.id === selectedConceptId;

                                    return (
                                        <button
                                            key={submission.id}
                                            type="button"
                                            onClick={() => setSelectedConceptId(submission.id)}
                                            className={`w-full rounded-xl border p-3 text-left transition-colors ${
                                                isActive ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <p className="line-clamp-2 text-xs font-semibold text-slate-800">{submission.title}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">{submission.requirementType}</p>
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <span
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${conceptStatusClass(submission.panelistApprovalStatus)}`}
                                                >
                                                    {submission.panelistApprovalStatus}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{submission.submittedAt || 'No date'}</span>
                                            </div>
                                        </button>
                                    );
                                })}

                                {conceptSubmissions.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                                        No approved or rejected concept titles found for this group yet.
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {selectedConcept ? (
                                <div className="flex h-full flex-col space-y-3 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Concept Title</p>
                                            <h3 className="mt-1 text-base font-semibold text-slate-900">{selectedConcept.title}</h3>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                        {selectedConcept.fileUrl ? (
                                            <iframe
                                                key={selectedConcept.fileUrl}
                                                src={`${selectedConcept.fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                                title={`${selectedConcept.title} PDF Preview`}
                                                className="h-full w-full"
                                            />
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
                                                <FileText className="h-6 w-6 text-slate-300" />
                                                PDF preview is unavailable for this submission.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
                                    <FileText className="h-8 w-8 text-slate-300" />
                                    Select a concept title to view its PDF.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.section>
        </ProgramChairpersonLayout>
    );
};

export default ProgramChairpersonConceptTitleResultsPage;
