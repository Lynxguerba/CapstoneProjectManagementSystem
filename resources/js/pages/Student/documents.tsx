import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ChevronRight,
    ExternalLink,
    FileCheck2,
    Flag,
    FolderOpen,
    Lightbulb,
    ListTree,
    PackageCheck,
    Rocket,
    ShieldCheck,
    Trash2,
    Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import ConfirmConceptSubmissionActionModal from '@/components/Student/ConfirmConceptSubmissionActionModal';
import StudentLayout from './_layout';

type GroupSummary = {
    id: number;
    name: string;
    programSetName?: string | null;
    academicYear?: string | null;
};

type UploadedFileRow = {
    id: number;
    title: string;
    requirementType: string;
    stage: string;
    submittedAt?: string | null;
    instructorStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    adviserStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    fileSizeLabel?: string | null;
    viewUrl?: string | null;
    removeUrl?: string | null;
};

type GeneratedFileRow = {
    id: number;
    title: string;
    requirementType: string;
    stage: string;
    signedAt?: string | null;
    instructorStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    adviserStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    fileSizeLabel?: string | null;
    adviserName?: string | null;
    viewUrl?: string | null;
};

type Phase2RequirementRow = {
    id: number;
    requirementType: string;
    stage: string;
    dueDate?: string | null;
    status: 'Missing' | 'Submitted' | 'Approved' | 'Revision Required' | string;
    fileName?: string | null;
    submittedAt?: string | null;
};

type StudentDocumentsProps = {
    group: GroupSummary | null;
    isGroupLeader?: boolean;
    isPhase2Available?: boolean;
    approvedConceptSubmissionId?: number | null;
    phase2Requirements?: Phase2RequirementRow[];
    uploadedFiles?: UploadedFileRow[];
    generatedFiles?: GeneratedFileRow[];
    flash?: {
        success?: string;
    };
};

type PhaseKey = 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';

const phaseTabs: { key: PhaseKey; label: string; icon: LucideIcon }[] = [
    { key: 'phase1', label: 'Phase 1: Concept Papers', icon: Lightbulb },
    { key: 'phase2', label: 'Phase 2: Outline', icon: ListTree },
    { key: 'phase3', label: 'Phase 3: Pre-Deployment', icon: PackageCheck },
    { key: 'phase4', label: 'Phase 4: Deployment', icon: Rocket },
    { key: 'phase5', label: 'Phase 5: Finals', icon: Flag },
];

const statusPillClass = (status: string): string => {
    if (status === 'Approved') {
        return 'border-emerald-300 bg-emerald-100 text-emerald-800';
    }

    if (status === 'Revision Required') {
        return 'border-amber-200 bg-amber-100 text-amber-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-700';
};

const resolvePhaseKey = (stage: string): PhaseKey => {
    const normalizedStage = stage.toLowerCase().trim();

    if (normalizedStage.includes('outline')) {
        return 'phase2';
    }

    if (normalizedStage.includes('pre') && normalizedStage.includes('deploy')) {
        return 'phase3';
    }

    if (normalizedStage.includes('deploy')) {
        return 'phase4';
    }

    if (normalizedStage.includes('final')) {
        return 'phase5';
    }

    return 'phase1';
};

const StudentDocuments = () => {
    const { props } = usePage<StudentDocumentsProps>();
    const group = props.group;
    const isGroupLeader = props.isGroupLeader ?? false;
    const isPhase2Available = props.isPhase2Available ?? false;
    const approvedConceptSubmissionId = props.approvedConceptSubmissionId ?? null;
    const phase2Requirements = React.useMemo(() => props.phase2Requirements ?? [], [props.phase2Requirements]);
    const uploadedFiles = React.useMemo(() => props.uploadedFiles ?? [], [props.uploadedFiles]);
    const generatedFiles = React.useMemo(() => props.generatedFiles ?? [], [props.generatedFiles]);
    const successMessage = props.flash?.success ?? '';

    const deleteForm = useForm({});
    const [activePhase, setActivePhase] = React.useState<PhaseKey>('phase1');
    const [submissionPendingRemoval, setSubmissionPendingRemoval] = React.useState<UploadedFileRow | null>(null);

    const activePhaseLabel = React.useMemo(() => {
        return phaseTabs.find((tab) => tab.key === activePhase)?.label ?? 'Phase';
    }, [activePhase]);

    const filteredUploadedFiles = React.useMemo(() => {
        return uploadedFiles.filter((file) => resolvePhaseKey(file.stage) === activePhase);
    }, [activePhase, uploadedFiles]);

    const filteredGeneratedFiles = React.useMemo(() => {
        return generatedFiles.filter((file) => resolvePhaseKey(file.stage) === activePhase);
    }, [activePhase, generatedFiles]);

    const approvedPhaseOneSubmission = React.useMemo(() => {
        if (activePhase !== 'phase1' || approvedConceptSubmissionId === null) {
            return null;
        }

        return filteredUploadedFiles.find((file) => file.id === approvedConceptSubmissionId) ?? null;
    }, [activePhase, approvedConceptSubmissionId, filteredUploadedFiles]);

    const phaseTwoRequirementSummary = React.useMemo(() => {
        if (!isPhase2Available) {
            return {
                total: 0,
                approved: 0,
                submitted: 0,
                revise: 0,
                missing: 0,
            };
        }

        return phase2Requirements.reduce(
            (summary, requirement) => {
                summary.total += 1;

                if (requirement.status === 'Approved') {
                    summary.approved += 1;
                } else if (requirement.status === 'Submitted') {
                    summary.submitted += 1;
                } else if (requirement.status === 'Revision Required') {
                    summary.revise += 1;
                } else {
                    summary.missing += 1;
                }

                return summary;
            },
            {
                total: 0,
                approved: 0,
                submitted: 0,
                revise: 0,
                missing: 0,
            },
        );
    }, [isPhase2Available, phase2Requirements]);

    const groupLabel = group
        ? `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}${group.academicYear ? ` · ${group.academicYear}` : ''}`
        : 'No active group assignment yet.';

    const uploadWorkspace = React.useMemo(() => {
        if (activePhase === 'phase2') {
            return {
                href: '/student/manuscripts',
                label: 'Manuscript Submission',
            };
        }

        return {
            href: '/student/concepts',
            label: activePhase === 'phase1' ? 'Concept Submission' : 'Upload',
        };
    }, [activePhase]);

    const handleAskRemoveSubmission = (submission: UploadedFileRow) => {
        if (!isGroupLeader || !submission.removeUrl || deleteForm.processing) {
            return;
        }

        setSubmissionPendingRemoval(submission);
    };

    const handleCloseRemoveModal = () => {
        if (deleteForm.processing) {
            return;
        }

        setSubmissionPendingRemoval(null);
    };

    const handleConfirmRemoveSubmission = () => {
        if (submissionPendingRemoval?.removeUrl === undefined || submissionPendingRemoval.removeUrl === null) {
            return;
        }

        deleteForm.delete(submissionPendingRemoval.removeUrl, {
            preserveScroll: true,
            preserveState: false,
            onFinish: () => {
                setSubmissionPendingRemoval(null);
            },
        });
    };

    return (
        <StudentLayout title="Group Documents" subtitle="Uploaded and system-generated files for your project group">
            <div className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/student/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Group Documents
                    </span>
                </nav>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-sm">
                                <FolderOpen className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Document Repository</h3>
                                <p className="text-xs text-slate-500">{groupLabel}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                Uploaded: {filteredUploadedFiles.length}
                            </span>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                Generated: {filteredGeneratedFiles.length}
                            </span>
                        </div>
                    </div>

                    {successMessage !== '' ? (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                            {successMessage}
                        </div>
                    ) : null}
                </motion.section>

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

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <FileCheck2 className="h-4 w-4 text-emerald-700" />
                            <h3 className="text-sm font-semibold text-slate-900">Uploaded Files</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                {filteredUploadedFiles.length} record{filteredUploadedFiles.length === 1 ? '' : 's'} in {activePhaseLabel}
                            </span>
                            <Link
                                href={uploadWorkspace.href}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                            >
                                <Upload className="h-3.5 w-3.5" />
                                {uploadWorkspace.label}
                            </Link>
                        </div>
                    </div>

                    {approvedPhaseOneSubmission ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Approved Title
                            </span>
                            <span className="font-semibold">{approvedPhaseOneSubmission.title}</span>
                            <span className="text-emerald-700/80">The highlighted row marks the approved concept paper for Phase 1.</span>
                        </div>
                    ) : null}

                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 font-semibold tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-3 py-2.5">Title</th>
                                        <th className="px-3 py-2.5">Requirement</th>
                                        <th className="px-3 py-2.5">Submitted</th>
                                        <th className="px-3 py-2.5">Instructor</th>
                                        <th className="px-3 py-2.5">Adviser</th>
                                        <th className="px-3 py-2.5">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUploadedFiles.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-7 text-center text-xs text-slate-500">
                                                No uploaded files found for {activePhaseLabel}.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUploadedFiles.map((file) => {
                                            const isApprovedConceptSubmission = activePhase === 'phase1' && file.id === approvedConceptSubmissionId;

                                            return (
                                                <tr
                                                    key={file.id}
                                                    className={`transition-colors ${
                                                        isApprovedConceptSubmission
                                                            ? 'bg-emerald-50/90 hover:bg-emerald-100/70'
                                                            : 'hover:bg-slate-50/80'
                                                    }`}
                                                >
                                                    <td
                                                        className={`px-3 py-2.5 ${isApprovedConceptSubmission ? 'border-l-4 border-emerald-500' : ''}`}
                                                    >
                                                        {isApprovedConceptSubmission ? (
                                                            <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                                                                <ShieldCheck className="h-3 w-3" />
                                                                Approved
                                                            </span>
                                                        ) : null}
                                                        <p className="font-semibold text-slate-900">{file.title}</p>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-600">
                                                        <p>{file.requirementType}</p>
                                                        <p className="text-[11px] text-slate-500">{file.stage}</p>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-600">{file.submittedAt ?? '—'}</td>
                                                    <td className="px-3 py-2.5">
                                                        <span
                                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPillClass(file.instructorStatus)}`}
                                                        >
                                                            {file.instructorStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span
                                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPillClass(file.adviserStatus)}`}
                                                        >
                                                            {file.adviserStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex flex-nowrap items-center gap-2">
                                                            <Link
                                                                href={file.viewUrl ?? '#'}
                                                                preserveScroll
                                                                className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                                                    file.viewUrl
                                                                        ? 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                                                                        : 'pointer-events-none cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                                                }`}
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                                Open File
                                                            </Link>

                                                            {isGroupLeader && file.removeUrl ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAskRemoveSubmission(file)}
                                                                    disabled={deleteForm.processing}
                                                                    className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                    {deleteForm.processing && submissionPendingRemoval?.id === file.id
                                                                        ? 'Removing...'
                                                                        : 'Remove File'}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.section>

                {activePhase === 'phase2' ? (
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.045 }}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <FileCheck2 className="h-4 w-4 text-emerald-700" />
                                <h3 className="text-sm font-semibold text-slate-900">Phase 2 Outline Requirements</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    Total: {phaseTwoRequirementSummary.total}
                                </span>
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                    Approved: {phaseTwoRequirementSummary.approved}
                                </span>
                                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                                    Submitted: {phaseTwoRequirementSummary.submitted}
                                </span>
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                    Revision: {phaseTwoRequirementSummary.revise}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    Missing: {phaseTwoRequirementSummary.missing}
                                </span>
                            </div>
                        </div>

                        {!isPhase2Available ? (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                                Phase 2 is locked until your group has an approved project title from Phase 1.
                            </div>
                        ) : (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[760px] text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-slate-50 font-semibold tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-3 py-2.5">Requirement</th>
                                                <th className="px-3 py-2.5">Due Date</th>
                                                <th className="px-3 py-2.5">Latest Submission</th>
                                                <th className="px-3 py-2.5">Status</th>
                                                <th className="px-3 py-2.5">Stage</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {phase2Requirements.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-3 py-7 text-center text-xs text-slate-500">
                                                        No instructor-configured outline requirements are available yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                phase2Requirements.map((requirement) => (
                                                    <tr key={requirement.id} className="hover:bg-slate-50/80">
                                                        <td className="px-3 py-2.5 font-semibold text-slate-900">{requirement.requirementType}</td>
                                                        <td className="px-3 py-2.5 text-slate-600">{requirement.dueDate ?? '—'}</td>
                                                        <td className="px-3 py-2.5 text-slate-600">
                                                            <p>{requirement.fileName ?? 'No submission yet'}</p>
                                                            <p className="text-[11px] text-slate-500">{requirement.submittedAt ?? '—'}</p>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span
                                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPillClass(requirement.status)}`}
                                                            >
                                                                {requirement.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-slate-600">{requirement.stage}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.section>
                ) : null}

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <FileCheck2 className="h-4 w-4 text-emerald-700" />
                            <h3 className="text-sm font-semibold text-slate-900">System Generated Files</h3>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {filteredGeneratedFiles.length} record{filteredGeneratedFiles.length === 1 ? '' : 's'} in {activePhaseLabel}
                        </span>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 font-semibold tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-3 py-2.5">File</th>
                                        <th className="px-3 py-2.5">Requirement</th>
                                        <th className="px-3 py-2.5">Signed</th>
                                        <th className="px-3 py-2.5">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredGeneratedFiles.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-7 text-center text-xs text-slate-500">
                                                No system-generated document is available for {activePhaseLabel}.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredGeneratedFiles.map((file) => (
                                            <tr key={file.id} className="hover:bg-slate-50/80">
                                                <td className="px-3 py-2.5 font-semibold text-slate-900">
                                                    <p>{file.title}</p>
                                                    <p className="text-[11px] font-medium text-slate-500">
                                                        {file.fileSizeLabel ?? 'Size unavailable'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-600">
                                                    <p>{file.requirementType}</p>
                                                    <p className="text-[11px] text-slate-500">{file.stage}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-600">
                                                    <p>{file.signedAt ?? '—'}</p>
                                                    <p className="text-[11px] text-slate-500">Adviser - {file.adviserName ?? 'Unassigned'}</p>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <Link
                                                        href={file.viewUrl ?? '#'}
                                                        preserveScroll
                                                        className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                                            file.viewUrl
                                                                ? 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                                                                : 'pointer-events-none cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                                        }`}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Open File
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.section>
            </div>

            <ConfirmConceptSubmissionActionModal
                open={submissionPendingRemoval !== null}
                title="Remove Uploaded File"
                message={
                    submissionPendingRemoval
                        ? `This permanently deletes "${submissionPendingRemoval.title}" from your uploaded files and storage.`
                        : 'This permanently deletes the selected uploaded file from your records and storage.'
                }
                confirmLabel="Remove File"
                tone="danger"
                processing={deleteForm.processing}
                onClose={handleCloseRemoveModal}
                onConfirm={handleConfirmRemoveSubmission}
            />
        </StudentLayout>
    );
};

export default StudentDocuments;
