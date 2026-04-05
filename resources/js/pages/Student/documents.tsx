import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, ExternalLink, FileCheck2, FolderOpen, Trash2 } from 'lucide-react';
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

type StudentDocumentsProps = {
    group: GroupSummary | null;
    isGroupLeader?: boolean;
    uploadedFiles?: UploadedFileRow[];
    generatedFiles?: GeneratedFileRow[];
    flash?: {
        success?: string;
    };
};

const statusPillClass = (status: string): string => {
    if (status === 'Approved') {
        return 'border-emerald-300 bg-emerald-100 text-emerald-800';
    }

    if (status === 'Revision Required') {
        return 'border-amber-200 bg-amber-100 text-amber-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-700';
};

const StudentDocuments = () => {
    const { props } = usePage<StudentDocumentsProps>();
    const group = props.group;
    const isGroupLeader = props.isGroupLeader ?? false;
    const uploadedFiles = props.uploadedFiles ?? [];
    const generatedFiles = props.generatedFiles ?? [];
    const successMessage = props.flash?.success ?? '';

    const deleteForm = useForm({});
    const [submissionPendingRemoval, setSubmissionPendingRemoval] = React.useState<UploadedFileRow | null>(null);

    const groupLabel = group
        ? `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}${group.academicYear ? ` · ${group.academicYear}` : ''}`
        : 'No active group assignment yet.';

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
                                Uploaded: {uploadedFiles.length}
                            </span>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                Generated: {generatedFiles.length}
                            </span>
                        </div>
                    </div>

                    {successMessage !== '' ? (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                            {successMessage}
                        </div>
                    ) : null}
                </motion.section>

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
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {uploadedFiles.length} record{uploadedFiles.length === 1 ? '' : 's'}
                        </span>
                    </div>

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
                                    {uploadedFiles.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-7 text-center text-xs text-slate-500">
                                                No uploaded files found for your group yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        uploadedFiles.map((file) => (
                                            <tr key={file.id} className="hover:bg-slate-50/80">
                                                <td className="px-3 py-2.5 font-semibold text-slate-900">{file.title}</td>
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
                                                                {deleteForm.processing && submissionPendingRemoval?.id === file.id ? 'Removing...' : 'Remove File'}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.section>

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
                            {generatedFiles.length} record{generatedFiles.length === 1 ? '' : 's'}
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
                                        <th className="px-3 py-2.5">Instructor</th>
                                        <th className="px-3 py-2.5">Adviser</th>
                                        <th className="px-3 py-2.5">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {generatedFiles.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-7 text-center text-xs text-slate-500">
                                                No system-generated document is available for your group yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        generatedFiles.map((file) => (
                                            <tr key={file.id} className="hover:bg-slate-50/80">
                                                <td className="px-3 py-2.5 font-semibold text-slate-900">
                                                    <p>{file.title}</p>
                                                    <p className="text-[11px] font-medium text-slate-500">{file.fileSizeLabel ?? 'Size unavailable'}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-600">
                                                    <p>{file.requirementType}</p>
                                                    <p className="text-[11px] text-slate-500">{file.stage}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-600">
                                                    <p>{file.signedAt ?? '—'}</p>
                                                    <p className="text-[11px] text-slate-500">{file.adviserName ?? 'Adviser'}</p>
                                                </td>
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
