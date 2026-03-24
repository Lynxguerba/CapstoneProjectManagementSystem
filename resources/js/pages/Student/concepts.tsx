import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, BellRing, CheckCircle2, ChevronRight, Clock3, FileText, FolderOpen, UploadCloud } from 'lucide-react';
import React from 'react';
import ConceptSubmitConfirmationModal from '@/components/Student/ConceptSubmitConfirmationModal';
import StudentLayout from './_layout';

type ConceptRequirement = {
    id: number;
    type: string;
    deadlineDate?: string | null;
    deadlineLabel?: string | null;
};

type ConceptSubmission = {
    id: number;
    title: string;
    titleCategoryId?: number | null;
    category?: string | null;
    status: 'Submitted' | 'Approved' | 'Revision Required' | string;
    submittedAt?: string | null;
    requirementType: string;
    mimeType?: string | null;
    fileSizeLabel?: string | null;
    fileUrl?: string | null;
    viewUrl?: string | null;
};

type CategoryOption = {
    id: number;
    name: string;
    description?: string | null;
};

type StudentConceptProps = {
    group: {
        id: number;
        name: string;
        programSetName?: string | null;
        academicYear?: string | null;
    } | null;
    studentProgram: 'BSIT' | 'BSIS' | string;
    categoryOptions: CategoryOption[];
    readiness: {
        isReady: boolean;
        message: string;
    };
    activeRequirement: ConceptRequirement | null;
    submissions: ConceptSubmission[];
    notifications: {
        deadline?: string | null;
        approvedTitlesUrl: string;
    };
    flash?: {
        success?: string;
    };
};

type ConceptSubmissionForm = {
    title: string;
    title_category_id: string;
    concept_file: File | null;
};

const statusPillClass = (status: ConceptSubmission['status']): string => {
    if (status === 'Approved') {
        return 'border-emerald-300 bg-emerald-100 text-emerald-800';
    }

    if (status === 'Revision Required') {
        return 'border-slate-200 bg-slate-100 text-slate-700';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const deriveTitleFromFileName = (fileName: string): string => {
    return fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const StudentConcepts = () => {
    const { props } = usePage<StudentConceptProps>();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [isSubmitConfirmationOpen, setIsSubmitConfirmationOpen] = React.useState(false);
    const group = props.group;
    const readiness = props.readiness;
    const activeRequirement = props.activeRequirement;
    const submissions = props.submissions ?? [];
    const studentProgram = props.studentProgram ?? 'BSIT';
    const categoryOptions = props.categoryOptions ?? [];
    const notifications = props.notifications;
    const successMessage = props.flash?.success ?? '';

    const form = useForm<ConceptSubmissionForm>({
        title: '',
        title_category_id: '',
        concept_file: null,
    });

    const requirementLabel = activeRequirement?.type ?? 'Concept Paper';
    const deadlineLabel = activeRequirement?.deadlineLabel ?? notifications.deadline ?? 'No deadline declared yet.';
    const selectedCategory = categoryOptions.find((category) => String(category.id) === form.data.title_category_id) ?? null;
    const canSubmit =
        readiness.isReady &&
        group !== null &&
        !form.processing &&
        form.data.concept_file !== null &&
        form.data.title.trim() !== '' &&
        form.data.title_category_id !== '';

    const resetFileInput = () => {
        form.setData('concept_file', null);
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
        form.setData('concept_file', file);

        if (file !== null) {
            form.setData('title', deriveTitleFromFileName(file.name));
            form.clearErrors('concept_file', 'title');
        }
    };

    const handleClearSelectedFile = () => {
        resetFileInput();
        form.setData('title', '');
        form.clearErrors('concept_file', 'title');
    };

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        setIsSubmitConfirmationOpen(true);
    };

    const handleConfirmedSubmit = () => {
        form.post('/student/concepts/submissions', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsSubmitConfirmationOpen(false);
                form.reset();
                resetFileInput();
            },
            onError: () => {
                setIsSubmitConfirmationOpen(false);
            },
        });
    };

    const groupLabel = group
        ? `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}${group.academicYear ? ` · ${group.academicYear}` : ''}`
        : 'No active group assignment yet.';
    const latestSubmission = submissions[0] ?? null;
    const uploadProgress = form.progress?.percentage ? Math.round(form.progress.percentage) : null;

    return (
        <StudentLayout title="Concept Submission" subtitle="Submit and track your concept paper requirements">
            <div className="space-y-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/student/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Concept Submission
                    </span>
                </nav>

                <motion.section
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-slate-100/90 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 left-14 h-52 w-52 rounded-full bg-emerald-100/70 blur-3xl" />

                    <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
                                    <FileText className="h-3.5 w-3.5" />
                                    Concept Submission Desk
                                </div>
                                <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                        readiness.isReady
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                    }`}
                                >
                                    {readiness.isReady ? 'Ready for Submission' : 'Waiting for Requirement'}
                                </span>
                            </div>

                            <h3 className="mt-3 text-base font-semibold text-slate-900">Concept Paper Workspace</h3>
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
                                <p className="mt-1 text-xs text-slate-900">{notifications.deadline ?? 'No concept deadline set yet.'}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Latest Activity</p>
                                <p className="mt-1 text-xs text-slate-900">
                                    {latestSubmission ? `${latestSubmission.status} · ${latestSubmission.title}` : 'No submissions yet.'}
                                </p>
                            </div>

                            <Link
                                href={notifications.approvedTitlesUrl}
                                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md sm:col-span-2 lg:col-span-1"
                            >
                                Open Approved Titles Repository
                            </Link>
                        </div>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-slate-900">Submit New Concept / Revision</h3>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                PDF only
                            </span>
                        </div>

                        <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5">
                            <div>
                                <label className="text-xs font-semibold tracking-wide text-slate-700 uppercase">Concept Title</label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    placeholder="Auto-filled from the uploaded PDF file name"
                                    disabled={!readiness.isReady || form.processing}
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                                />
                                {form.errors.title ? <p className="mt-1 text-xs font-medium text-rose-600">{form.errors.title}</p> : null}
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <label className="text-xs font-semibold tracking-wide text-slate-700 uppercase">Category</label>
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                        {studentProgram}
                                    </span>
                                </div>
                                <select
                                    value={form.data.title_category_id}
                                    onChange={(event) => form.setData('title_category_id', event.target.value)}
                                    disabled={!readiness.isReady || form.processing || categoryOptions.length === 0}
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                                >
                                    <option value="">Select {studentProgram} category</option>
                                    {categoryOptions.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {selectedCategory?.description ? <p className="mt-1 text-xs text-slate-500">{selectedCategory.description}</p> : null}
                                {categoryOptions.length === 0 ? (
                                    <p className="mt-1 text-xs text-amber-700">No category options are configured yet for {studentProgram}.</p>
                                ) : null}
                                {form.errors.title_category_id ? <p className="mt-1 text-xs font-medium text-rose-600">{form.errors.title_category_id}</p> : null}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                <p className="font-semibold tracking-wide text-slate-700 uppercase">Active Requirement</p>
                                <p className="mt-1 text-sm font-medium text-slate-900">{requirementLabel}</p>
                                <p className="mt-1 text-xs text-slate-500">{deadlineLabel}</p>
                            </div>

                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />

                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-800 uppercase">
                                            <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
                                            Upload Concept PDF
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">Max file size: 50MB</p>
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
                                        {form.data.concept_file !== null ? (
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
                                    {form.data.concept_file !== null ? form.data.concept_file.name : 'No file selected'}
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

                                {form.errors.concept_file ? <p className="mt-1 text-xs font-medium text-rose-600">{form.errors.concept_file}</p> : null}
                            </div>

                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                                Anti-duplication reminder: verify your title against the Final Approved Titles Repository before submission.
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                <p className="text-xs text-slate-500">Deadline: {deadlineLabel}</p>
                                <button
                                    type="submit"
                                    disabled={
                                        !canSubmit
                                    }
                                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? 'Submitting...' : 'Submit Concept'}
                                </button>
                            </div>
                        </form>
                    </motion.section>

                    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 }}
                            className={`rounded-2xl border p-4 shadow-sm ${
                                readiness.isReady ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {readiness.isReady ? (
                                    <BellRing className="mt-0.5 h-4 w-4 text-emerald-600" />
                                ) : (
                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-slate-600" />
                                )}
                                <div>
                                    <p
                                        className={`text-xs font-semibold tracking-wide uppercase ${
                                            readiness.isReady ? 'text-emerald-800' : 'text-slate-800'
                                        }`}
                                    >
                                        Concept Notification
                                    </p>
                                    <p className={`mt-1 text-xs ${readiness.isReady ? 'text-emerald-700' : 'text-slate-600'}`}>{readiness.message}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.11 }}
                            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <Clock3 className="mt-0.5 h-4 w-4 text-emerald-600" />
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">Requirement Window</p>
                                    <p className="mt-1 text-xs text-emerald-700">{requirementLabel}</p>
                                    <p className="mt-1 text-xs text-emerald-700">Due: {deadlineLabel}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.14 }}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-800 uppercase">Submission Checklist</p>
                                    <p className="mt-1 text-xs text-slate-600">Use this quick check before submitting your document.</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                                        <li className="flex items-start gap-2">
                                            <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Title aligns with approved repository entries.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Uploaded PDF file name matches the concept title.
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            PDF file is complete and within size limit.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    </aside>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.17 }}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-3.5 w-3.5 text-slate-700" />
                            <h3 className="text-sm font-semibold text-slate-900">Your Submitted Concepts</h3>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {submissions.length} record{submissions.length === 1 ? '' : 's'}
                        </span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-3 py-3">Title</th>
                                        <th className="px-3 py-3">Category</th>
                                        <th className="px-3 py-3">Requirement</th>
                                        <th className="px-3 py-3">Submitted</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-3 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {submissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-8 text-center text-xs text-slate-500">
                                                No concept submissions yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        submissions.map((submission) => (
                                            <tr key={submission.id} className="hover:bg-slate-50/80">
                                                <td className="px-3 py-3 font-semibold text-slate-900">{submission.title}</td>
                                                <td className="px-3 py-3 text-slate-600">{submission.category ?? 'Uncategorized'}</td>
                                                <td className="px-3 py-3 text-slate-600">{submission.requirementType}</td>
                                                <td className="px-3 py-3 text-slate-600">{submission.submittedAt ?? '—'}</td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPillClass(submission.status)}`}
                                                    >
                                                        {submission.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-xs text-slate-600">
                                                    <Link
                                                        href={submission.viewUrl ?? '#'}
                                                        preserveScroll
                                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                                            submission.viewUrl
                                                                ? 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                                                                : 'pointer-events-none cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                                        }`}
                                                    >
                                                        Open File
                                                    </Link>
                                                    {submission.fileSizeLabel ? <div className="mt-1 text-slate-500">{submission.fileSizeLabel}</div> : null}
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

            <ConceptSubmitConfirmationModal
                open={isSubmitConfirmationOpen}
                title={form.data.title.trim()}
                categoryName={selectedCategory?.name ?? 'No category selected'}
                fileName={form.data.concept_file?.name ?? 'No file selected'}
                requirementLabel={requirementLabel}
                deadlineLabel={deadlineLabel}
                processing={form.processing}
                progressPercentage={form.progress?.percentage ?? null}
                onClose={() => setIsSubmitConfirmationOpen(false)}
                onConfirm={handleConfirmedSubmit}
            />
        </StudentLayout>
    );
};

export default StudentConcepts;
