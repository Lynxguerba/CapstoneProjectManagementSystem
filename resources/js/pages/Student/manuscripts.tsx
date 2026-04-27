import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, ExternalLink, FileText, FolderOpen, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import React from 'react';
import ConfirmConceptSubmissionActionModal from '@/components/Student/ConfirmConceptSubmissionActionModal';
import StudentLayout from './_layout';

type ManuscriptRequirement = {
    id: number;
    type: string;
    deadlineDate?: string | null;
    deadlineLabel?: string | null;
};

type ManuscriptSubmission = {
    id: number;
    title: string;
    requirementType: string;
    instructorStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    adviserStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    submittedAt?: string | null;
    fileSizeLabel?: string | null;
    viewUrl?: string | null;
    removeUrl?: string | null;
};

type StudentManuscriptProps = {
    group: {
        id: number;
        name: string;
        programSetName?: string | null;
        academicYear?: string | null;
    } | null;
    isGroupLeader?: boolean;
    readiness: {
        isReady: boolean;
        message: string;
    };
    activeRequirement: ManuscriptRequirement | null;
    submission: ManuscriptSubmission | null;
    notifications: {
        deadline?: string | null;
        documentsUrl: string;
    };
    flash?: {
        success?: string;
    };
};

type ManuscriptSubmissionForm = {
    manuscript_file: File | null;
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

const StudentManuscripts = () => {
    const { props } = usePage<StudentManuscriptProps>();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [isUploadConfirmationOpen, setIsUploadConfirmationOpen] = React.useState(false);
    const [isRemoveConfirmationOpen, setIsRemoveConfirmationOpen] = React.useState(false);
    const group = props.group;
    const isGroupLeader = props.isGroupLeader ?? false;
    const readiness = props.readiness;
    const activeRequirement = props.activeRequirement;
    const submission = props.submission;
    const notifications = props.notifications;
    const successMessage = props.flash?.success ?? '';

    const form = useForm<ManuscriptSubmissionForm>({
        manuscript_file: null,
    });
    const deleteForm = useForm({});

    const canSubmit = isGroupLeader && readiness.isReady && group !== null && !form.processing && form.data.manuscript_file !== null;
    const deadlineLabel = activeRequirement?.deadlineLabel ?? notifications.deadline ?? 'No manuscript deadline declared yet.';
    const requirementLabel = activeRequirement?.type ?? 'Manuscript';
    const groupLabel = group
        ? `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}${group.academicYear ? ` · ${group.academicYear}` : ''}`
        : 'No active group assignment yet.';
    const uploadProgress = form.progress?.percentage ? Math.round(form.progress.percentage) : null;

    const resetFileInput = () => {
        form.setData('manuscript_file', null);

        if (fileInputRef.current !== null) {
            fileInputRef.current.value = '';
        }
    };

    const handleChooseFile = () => {
        if (form.processing) {
            return;
        }

        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        form.setData('manuscript_file', file);

        if (file !== null) {
            form.clearErrors('manuscript_file');
        }
    };

    const handleClearSelectedFile = () => {
        resetFileInput();
        form.clearErrors('manuscript_file');
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        setIsUploadConfirmationOpen(true);
    };

    const handleConfirmUpload = () => {
        form.post('/student/manuscripts/submissions', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsUploadConfirmationOpen(false);
                form.reset();
                resetFileInput();
            },
            onError: () => {
                setIsUploadConfirmationOpen(false);
            },
        });
    };

    const handleConfirmRemove = () => {
        if (!submission?.removeUrl) {
            return;
        }

        deleteForm.delete(submission.removeUrl, {
            preserveScroll: true,
            preserveState: false,
            onFinish: () => {
                setIsRemoveConfirmationOpen(false);
            },
        });
    };

    return (
        <StudentLayout title="Manuscript Submission" subtitle="Upload and maintain the single active manuscript file for Phase 2 review">
            <div className="space-y-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/student/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href={notifications.documentsUrl} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Documents &amp; Uploads
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Manuscript Submission
                    </span>
                </nav>

                <motion.section
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="pointer-events-none absolute -top-24 right-0 h-60 w-60 rounded-full bg-slate-100/90 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 left-14 h-52 w-52 rounded-full bg-emerald-100/70 blur-3xl" />

                    <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
                                    <FileText className="h-3.5 w-3.5" />
                                    Phase 2 Manuscript Desk
                                </div>
                                <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                        readiness.isReady
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                    }`}
                                >
                                    {readiness.isReady ? 'Ready for Upload' : 'Waiting for Access'}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    Single active file
                                </span>
                            </div>

                            <h3 className="mt-3 text-base font-semibold text-slate-900">Manuscript Submission Workspace</h3>
                            <p className="mt-1 text-xs text-slate-500">{groupLabel}</p>

                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                {readiness.message}
                            </div>

                            {successMessage !== '' ? (
                                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                                    {successMessage}
                                </div>
                            ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Current Deadline</p>
                                <p className="mt-1 text-xs text-slate-900">{deadlineLabel}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Current File Status</p>
                                <p className="mt-1 text-xs text-slate-900">
                                    {submission ? `${submission.instructorStatus} · ${submission.title}` : 'No manuscript uploaded yet.'}
                                </p>
                            </div>

                            <Link
                                href={notifications.documentsUrl}
                                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md sm:col-span-2 lg:col-span-1"
                            >
                                Open Documents Repository
                            </Link>
                        </div>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                    >
                        {isGroupLeader ? (
                            <>
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        {submission ? 'Replace Current Manuscript' : 'Upload Manuscript'}
                                    </h3>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                        PDF only
                                    </span>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                        <p className="font-semibold tracking-wide text-slate-700 uppercase">Active Requirement</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">{requirementLabel}</p>
                                        <p className="mt-1 text-xs text-slate-500">{deadlineLabel}</p>
                                    </div>

                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="application/pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />

                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-800 uppercase">
                                                    <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
                                                    Upload Manuscript PDF
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">Max file size: 100MB</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleChooseFile}
                                                    disabled={!readiness.isReady || form.processing}
                                                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Choose PDF
                                                </button>
                                                {form.data.manuscript_file !== null ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearSelectedFile}
                                                        disabled={form.processing}
                                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        Clear
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                                            {form.data.manuscript_file !== null ? form.data.manuscript_file.name : 'No file selected'}
                                        </div>

                                        {form.progress ? (
                                            <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
                                                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">
                                                    <span>Uploading file</span>
                                                    <span>{uploadProgress ?? 0}%</span>
                                                </div>
                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-600 transition-all duration-200"
                                                        style={{ width: `${Math.max(uploadProgress ?? 8, 8)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : null}

                                        {form.errors.manuscript_file ? (
                                            <p className="mt-1 text-xs font-medium text-rose-600">{form.errors.manuscript_file}</p>
                                        ) : null}
                                    </div>

                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                                        {submission
                                            ? 'Uploading a new PDF replaces the current Phase 2 manuscript file.'
                                            : 'Only one active manuscript file is kept for Phase 2 at a time.'}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                        <p className="text-xs text-slate-500">Deadline: {deadlineLabel}</p>
                                        <button
                                            type="submit"
                                            disabled={!canSubmit}
                                            className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {form.processing ? 'Submitting...' : submission ? 'Replace Manuscript' : 'Submit Manuscript'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                                    <h3 className="text-sm font-semibold text-slate-900">Submission Access</h3>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Your group can keep only one active manuscript file for Phase 2. The Project Manager handles uploads and replacements.
                                </p>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                    Requirement: <span className="font-semibold text-slate-900">{requirementLabel}</span>
                                </div>
                            </div>
                        )}
                    </motion.section>

                    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                        <motion.section
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 }}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4 text-slate-700" />
                                    <h3 className="text-sm font-semibold text-slate-900">Current Manuscript</h3>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    {submission ? '1 file' : 'Empty'}
                                </span>
                            </div>

                            {submission ? (
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-sm font-semibold text-slate-900">{submission.title}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">{submission.requirementType}</p>
                                    </div>

                                    <div className="space-y-2 text-xs text-slate-600">
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPillClass(submission.instructorStatus)}`}>
                                                Instructor: {submission.instructorStatus}
                                            </span>
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPillClass(submission.adviserStatus)}`}>
                                                Adviser: {submission.adviserStatus}
                                            </span>
                                        </div>
                                        <p>
                                            <span className="font-semibold text-slate-800">Submitted:</span> {submission.submittedAt ?? '—'}
                                        </p>
                                        <p>
                                            <span className="font-semibold text-slate-800">File Size:</span> {submission.fileSizeLabel ?? 'Unavailable'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                        <Link
                                            href={submission.viewUrl ?? '#'}
                                            preserveScroll
                                            className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                                submission.viewUrl
                                                    ? 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                                                    : 'pointer-events-none cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Open File
                                        </Link>

                                        {isGroupLeader && submission.removeUrl ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsRemoveConfirmationOpen(true)}
                                                disabled={deleteForm.processing}
                                                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                {deleteForm.processing ? 'Removing...' : 'Remove File'}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                                    No manuscript file is currently stored for Phase 2.
                                </div>
                            )}
                        </motion.section>
                    </aside>
                </div>
            </div>

            <ConfirmConceptSubmissionActionModal
                open={isUploadConfirmationOpen}
                title={submission ? 'Replace Manuscript' : 'Submit Manuscript'}
                message={
                    form.data.manuscript_file
                        ? submission
                            ? `This replaces your current manuscript with "${form.data.manuscript_file.name}" and keeps only one active Phase 2 file.`
                            : `This uploads "${form.data.manuscript_file.name}" as your active Phase 2 manuscript file.`
                        : 'Confirm the selected manuscript file before submitting.'
                }
                confirmLabel={submission ? 'Replace Manuscript' : 'Submit Manuscript'}
                processing={form.processing}
                onClose={() => setIsUploadConfirmationOpen(false)}
                onConfirm={handleConfirmUpload}
            />

            <ConfirmConceptSubmissionActionModal
                open={isRemoveConfirmationOpen}
                title="Remove Manuscript"
                message="This permanently deletes the current manuscript file from your Phase 2 records and storage."
                confirmLabel="Remove File"
                tone="danger"
                processing={deleteForm.processing}
                onClose={() => setIsRemoveConfirmationOpen(false)}
                onConfirm={handleConfirmRemove}
            />
        </StudentLayout>
    );
};

export default StudentManuscripts;
