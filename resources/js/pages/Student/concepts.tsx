import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, BellRing, CheckCircle2, Clock3, FileText, FolderOpen, UploadCloud } from 'lucide-react';
import React from 'react';
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
    status: 'Submitted' | 'Approved' | 'Revision Required' | string;
    submittedAt?: string | null;
    requirementType: string;
    mimeType?: string | null;
    fileSizeLabel?: string | null;
    fileUrl?: string | null;
};

type StudentConceptProps = {
    group: {
        id: number;
        name: string;
        programSetName?: string | null;
        academicYear?: string | null;
    } | null;
    readiness: {
        isReady: boolean;
        message: string;
    };
    activeRequirement: {
        id: number;
        type: string;
        deadlineDate?: string | null;
        deadlineLabel?: string | null;
    } | null;
    requirements: ConceptRequirement[];
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
    document_requirement_id: string;
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

const StudentConcepts = () => {
    const { props } = usePage<StudentConceptProps>();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const group = props.group;
    const readiness = props.readiness;
    const activeRequirement = props.activeRequirement;
    const requirements = props.requirements ?? [];
    const submissions = props.submissions ?? [];
    const notifications = props.notifications;
    const successMessage = props.flash?.success ?? '';

    const defaultRequirementId =
        activeRequirement !== null ? String(activeRequirement.id) : requirements.length > 0 ? String(requirements[0].id) : '';

    const form = useForm<ConceptSubmissionForm>({
        title: '',
        document_requirement_id: defaultRequirementId,
        concept_file: null,
    });

    React.useEffect(() => {
        if (form.data.document_requirement_id !== '' || defaultRequirementId === '') {
            return;
        }

        form.setData('document_requirement_id', defaultRequirementId);
    }, [defaultRequirementId, form]);

    const selectedRequirement = requirements.find((requirement) => String(requirement.id) === form.data.document_requirement_id) ?? activeRequirement;

    const handleChooseFile = () => {
        if (form.processing) {
            return;
        }

        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        form.setData('concept_file', file);
    };

    const resetFileInput = () => {
        form.setData('concept_file', null);
        if (fileInputRef.current !== null) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!readiness.isReady || group === null) {
            return;
        }

        form.post('/student/concepts/submissions', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset('title', 'concept_file');
                resetFileInput();
            },
        });
    };

    return (
        <StudentLayout title="Concept Submission" subtitle="Submit and track your concept paper requirements">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-5">
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Concept Paper Workspace</h3>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {group
                                            ? `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}`
                                            : 'No active group assignment yet.'}
                                    </p>
                                </div>
                            </div>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                    readiness.isReady
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-slate-50 text-slate-700'
                                }`}
                            >
                                {readiness.isReady ? 'Ready for Submission' : 'Waiting for Requirement'}
                            </span>
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
                            {readiness.message}
                        </div>

                        {successMessage !== '' && (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
                                {successMessage}
                            </div>
                        )}
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-slate-900">Submit New Concept / Revision</h3>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                PDF only
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                            <div>
                                <label className="text-xs font-semibold tracking-wide text-slate-700 uppercase">Concept Title</label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    placeholder="Enter your concept title"
                                    disabled={!readiness.isReady || form.processing}
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                                />
                                {form.errors.title && <p className="mt-1 text-xs font-medium text-rose-600">{form.errors.title}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-semibold tracking-wide text-slate-700 uppercase">Requirement Type</label>
                                <select
                                    value={form.data.document_requirement_id}
                                    onChange={(event) => form.setData('document_requirement_id', event.target.value)}
                                    disabled={!readiness.isReady || form.processing || requirements.length === 0}
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
                                >
                                    <option value="" disabled>
                                        Select requirement
                                    </option>
                                    {requirements.map((requirement) => (
                                        <option key={requirement.id} value={String(requirement.id)}>
                                            {requirement.type}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.document_requirement_id && (
                                    <p className="mt-1 text-xs font-medium text-rose-600">{form.errors.document_requirement_id}</p>
                                )}
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
                                        {form.data.concept_file !== null && (
                                            <button
                                                type="button"
                                                onClick={resetFileInput}
                                                disabled={form.processing}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                                    {form.data.concept_file !== null ? form.data.concept_file.name : 'No file selected'}
                                </div>
                                {form.errors.concept_file && <p className="mt-1 text-xs font-medium text-rose-600">{form.errors.concept_file}</p>}
                            </div>

                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                                Anti-duplication reminder: verify your title against the Final Approved Titles Repository before submission.
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                <p className="text-xs text-slate-500">
                                    {selectedRequirement?.deadlineLabel
                                        ? `Deadline: ${selectedRequirement.deadlineLabel}`
                                        : 'No deadline declared yet.'}
                                </p>
                                <button
                                    type="submit"
                                    disabled={!readiness.isReady || group === null || form.processing}
                                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? 'Submitting...' : 'Submit Concept'}
                                </button>
                            </div>
                        </form>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                    >
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-3.5 w-3.5 text-slate-700" />
                            <h3 className="text-sm font-semibold text-slate-900">Your Submitted Concepts</h3>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-xs">
                                <thead className="border-b border-slate-200 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-2 py-3">Title</th>
                                        <th className="px-2 py-3">Requirement</th>
                                        <th className="px-2 py-3">Submitted</th>
                                        <th className="px-2 py-3">Status</th>
                                        <th className="px-2 py-3">File</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {submissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-2 py-8 text-center text-xs text-slate-500">
                                                No concept submissions yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        submissions.map((submission) => (
                                            <tr key={submission.id} className="hover:bg-slate-50/80">
                                                <td className="px-2 py-3 font-semibold text-slate-900">{submission.title}</td>
                                                <td className="px-2 py-3 text-slate-600">{submission.requirementType}</td>
                                                <td className="px-2 py-3 text-slate-600">{submission.submittedAt ?? '—'}</td>
                                                <td className="px-2 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPillClass(submission.status)}`}
                                                    >
                                                        {submission.status}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-3 text-xs text-slate-600">
                                                    {submission.fileUrl ? (
                                                        <a
                                                            href={submission.fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-semibold text-emerald-700 hover:underline"
                                                        >
                                                            Open PDF
                                                        </a>
                                                    ) : (
                                                        '—'
                                                    )}
                                                    {submission.fileSizeLabel ? (
                                                        <div className="mt-0.5 text-slate-500">{submission.fileSizeLabel}</div>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>
                </div>

                <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <Clock3 className="mt-0.5 h-4 w-4 text-emerald-600" />
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">Deadline</p>
                                <p className="mt-1 text-xs text-emerald-700">{notifications.deadline ?? 'No concept deadline set yet.'}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 }}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">Final Approved Titles Repository</p>
                                <p className="mt-1 text-xs text-emerald-700">Review approved titles before finalizing your concept title.</p>
                                <Link
                                    href={notifications.approvedTitlesUrl}
                                    className="mt-2 inline-flex items-center rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                                >
                                    Open Repository
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 }}
                        className={`rounded-xl border p-4 shadow-sm ${
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
                </aside>
            </div>
        </StudentLayout>
    );
};

export default StudentConcepts;
