import RecommendationLetterModal from '@/components/Student/RecommendationLetterModal';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FileText, MessageSquareText, Mic, ShieldCheck, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import studentRoutes from '../../routes/student';
import StudentLayout from './_layout';

type ConceptSubmission = {
    id: number;
    title: string;
    requirementType: string;
    submittedAt?: string | null;
    instructorStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    adviserStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    panelApprovalCount?: number | null;
    panelApprovalTotal?: number | null;
    fileUrl?: string | null;
};

type AssignedPanelist = {
    id: number;
    name: string;
    email?: string | null;
    slot?: number | null;
    role?: string | null;
};

type RecommendationLetter = {
    id: number;
    fileName: string;
    fileUrl: string | null;
    signedAt?: string | null;
    adviserName?: string | null;
};

type StudentLiveDefenseProps = {
    group: {
        id: number;
        name: string;
        programSetName?: string | null;
        academicYear?: string | null;
    } | null;
    conceptSubmissions: ConceptSubmission[];
    panelists: AssignedPanelist[];
    recommendationLetter?: RecommendationLetter | null;
};

const statusPillClass = (status: string): string => {
    if (status === 'Approved') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'Revision Required') {
        return 'border-amber-200 bg-amber-100 text-amber-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-600';
};

const panelApprovalPillClass = (approvedCount: number, totalCount: number): string => {
    if (totalCount === 0) {
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }

    if (approvedCount >= totalCount) {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (approvedCount > 0) {
        return 'border-amber-200 bg-amber-100 text-amber-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-600';
};

const StudentLiveDefense = () => {
    const { props } = usePage<StudentLiveDefenseProps>();
    const group = props.group;
    const conceptSubmissions = useMemo(() => props.conceptSubmissions ?? [], [props.conceptSubmissions]);
    const assignedPanelists = useMemo(() => props.panelists ?? [], [props.panelists]);
    const recommendationLetter = props.recommendationLetter ?? null;
    const [selectedConceptId, setSelectedConceptId] = useState<number | null>(null);
    const [isRecommendationLetterModalOpen, setIsRecommendationLetterModalOpen] = useState(false);

    useEffect(() => {
        if (conceptSubmissions.length === 0) {
            setSelectedConceptId(null);
            return;
        }

        const stillAvailable = conceptSubmissions.some((submission) => submission.id === selectedConceptId);
        if (stillAvailable) {
            return;
        }

        const firstWithPdf = conceptSubmissions.find((submission) => submission.fileUrl);
        setSelectedConceptId(firstWithPdf?.id ?? conceptSubmissions[0]?.id ?? null);
    }, [conceptSubmissions, selectedConceptId]);

    const selectedConcept = useMemo(
        () => conceptSubmissions.find((submission) => submission.id === selectedConceptId) ?? null,
        [conceptSubmissions, selectedConceptId],
    );

    const groupLabel = group
        ? `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}${group.academicYear ? ` · ${group.academicYear}` : ''}`
        : 'No active group assignment yet.';

    const activeGroupName = group?.name ?? 'Your Group';

    return (
        <StudentLayout title="Live Defense Board" subtitle="Track concept titles, panel feedback, and file review">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={studentRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <span>/</span>
                    <Link href={studentRoutes.schedule.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Defense Schedule
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Live Defense Board
                    </span>
                </nav>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Concept Title List</h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">{groupLabel}</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                {conceptSubmissions.length} title{conceptSubmissions.length === 1 ? '' : 's'}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-xs">
                            <thead className="border-b border-slate-200 bg-white text-slate-600">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Title</th>
                                    <th className="px-4 py-3 font-semibold">Submitted</th>
                                    <th className="px-4 py-3 font-semibold">Approval of Panelist</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {conceptSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                                            No concept titles are available yet.
                                        </td>
                                    </tr>
                                ) : (
                                    conceptSubmissions.map((submission) => {
                                        const active = submission.id === selectedConceptId;
                                        const panelApprovalCount = Math.max(0, Number(submission.panelApprovalCount ?? 0));
                                        const panelApprovalTotal = Math.max(0, Number(submission.panelApprovalTotal ?? assignedPanelists.length));

                                        return (
                                            <tr
                                                key={submission.id}
                                                onClick={() => setSelectedConceptId(submission.id)}
                                                className={`cursor-pointer transition-colors ${active ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-900">{submission.title}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">{submission.requirementType}</p>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{submission.submittedAt ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${panelApprovalPillClass(panelApprovalCount, panelApprovalTotal)}`}
                                                    >
                                                        {panelApprovalCount}/{panelApprovalTotal} panelists
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-800">Panelist Comments</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Real panelists assigned to your group are listed here.</p>

                        <div className="mt-4 space-y-3">
                            {assignedPanelists.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                    No panelists are assigned to this group yet.
                                </div>
                            ) : (
                                assignedPanelists.map((panelist) => (
                                    <div key={panelist.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-800">{panelist.name}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    Panelist {panelist.slot ?? '—'}
                                                    {panelist.role ? ` · ${panelist.role}` : ''}
                                                </p>
                                            </div>
                                            {panelist.email ? <span className="text-[10px] text-slate-500">{panelist.email}</span> : null}
                                        </div>
                                        <p className="mt-2 text-xs text-slate-600">No comment submitted yet for this panelist.</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 shadow-sm lg:p-5">
                        <div className="mb-3">
                            <p className="text-sm font-semibold text-slate-900">PDF Viewer</p>
                            <p className="mt-1 text-xs text-slate-500">
                                {selectedConcept ? selectedConcept.title : 'Select a concept title row to preview the uploaded PDF.'}
                            </p>
                        </div>

                        {!selectedConcept ? (
                            <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                                Select a concept row from the title table to load the PDF preview.
                            </div>
                        ) : selectedConcept.fileUrl ? (
                            <iframe
                                key={selectedConcept.fileUrl}
                                src={`${selectedConcept.fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                title={selectedConcept.title}
                                className="h-[65vh] w-full rounded-2xl border border-slate-200 bg-white lg:h-[72vh]"
                            />
                        ) : (
                            <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                                PDF preview is not available for this selected concept submission.
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-800">Active Session</h3>
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Outline Defense · {activeGroupName}</p>
                            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Panelists assigned: {assignedPanelists.length}</p>
                            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Selected title: {selectedConcept?.title ?? 'None selected'}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <MessageSquareText className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-800">Session Notes</h3>
                        </div>
                        <ul className="mt-3 space-y-2 text-xs text-slate-600">
                            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                Use the title table to check submission date and current panelist approval count.
                            </li>
                            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                Panelist comment entries will appear here once the panel feedback module stores them.
                            </li>
                            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                Final verdict and scoring remain available in the Verdict and Evaluation pages.
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-800">Defense Status</h3>
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Presentation: In Progress</p>
                            {recommendationLetter?.fileUrl ? (
                                <button
                                    type="button"
                                    onClick={() => setIsRecommendationLetterModalOpen(true)}
                                    className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left transition-colors hover:bg-emerald-100"
                                >
                                    <p className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">Recommendation Letter</p>
                                    <p className="mt-1 text-xs font-semibold text-emerald-900">{recommendationLetter.fileName}</p>
                                    <p className="mt-0.5 text-[11px] text-emerald-700">
                                        Signed at: {recommendationLetter.signedAt ?? 'Not available'} · Click to view
                                    </p>
                                </button>
                            ) : (
                                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    Recommendation Letter: Not available yet.
                                </p>
                            )}
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[11px] text-slate-500">Instructor Status</p>
                                <span
                                    className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${statusPillClass(
                                        selectedConcept?.instructorStatus ?? 'Submitted',
                                    )}`}
                                >
                                    {selectedConcept?.instructorStatus ?? 'Submitted'}
                                </span>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <p className="text-[11px] text-slate-500">Adviser Status</p>
                                <span
                                    className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${statusPillClass(
                                        selectedConcept?.adviserStatus ?? 'Submitted',
                                    )}`}
                                >
                                    {selectedConcept?.adviserStatus ?? 'Submitted'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {recommendationLetter ? (
                    <RecommendationLetterModal
                        open={isRecommendationLetterModalOpen}
                        onClose={() => setIsRecommendationLetterModalOpen(false)}
                        recommendationLetter={recommendationLetter}
                    />
                ) : null}
            </motion.section>
        </StudentLayout>
    );
};

export default StudentLiveDefense;
