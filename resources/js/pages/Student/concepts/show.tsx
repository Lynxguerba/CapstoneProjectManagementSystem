import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronsLeft, FilePenLine, FileText, PanelRightOpen, Trash2 } from 'lucide-react';
import React from 'react';
import ConfirmConceptSubmissionActionModal from '@/components/Student/ConfirmConceptSubmissionActionModal';
import EditConceptSubmissionModal from '@/components/Student/EditConceptSubmissionModal';
import StudentLayout from '../_layout';

type GroupSummary = {
    id: number;
    name: string;
    programSetName?: string | null;
    academicYear?: string | null;
};

type SubmissionDetail = {
    id: number;
    title: string;
    status: string;
    submittedAt?: string | null;
    requirementType: string;
    deadlineLabel?: string | null;
    mimeType?: string | null;
    fileSizeLabel?: string | null;
    fileUrl?: string | null;
};

type StudentConceptShowProps = {
    group: GroupSummary;
    studentProgram: 'BSIT' | 'BSIS' | string;
    submission: SubmissionDetail;
    flash?: {
        success?: string;
    };
};

const statusPillClass = (status: SubmissionDetail['status']): string => {
    if (status === 'Approved') {
        return 'border-emerald-300 bg-emerald-100 text-emerald-800';
    }

    if (status === 'Revision Required') {
        return 'border-slate-200 bg-slate-100 text-slate-700';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const StudentConceptSubmissionShow = () => {
    const { props } = usePage<StudentConceptShowProps>();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = React.useState(false);

    const group = props.group;
    const studentProgram = props.studentProgram ?? 'BSIT';
    const submission = props.submission;
    const successMessage = props.flash?.success ?? '';
    const deleteForm = useForm({});

    const groupLabel = `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}${group.academicYear ? ` · ${group.academicYear}` : ''}`;

    const handleConfirmDelete = () => {
        deleteForm.delete(`/student/concepts/submissions/${submission.id}`, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    return (
        <StudentLayout title="Concept File Viewer" subtitle="Review your uploaded concept paper in split view">
            <div className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/student/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/student/concepts" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Concept Submission
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        View File
                    </span>
                </nav>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
                                    <FileText className="h-3.5 w-3.5" />
                                    Concept File Viewer
                                </div>
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPillClass(submission.status)}`}>
                                    {submission.status}
                                </span>
                            </div>

                            <div className="min-w-0">
                                <h3 className="max-w-3xl text-lg leading-snug font-semibold break-words text-slate-900">{submission.title}</h3>
                                <p className="mt-1 text-xs text-slate-500">{groupLabel}</p>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-row items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                                <FilePenLine className="h-4 w-4" />
                                Edit Details
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsDeleteConfirmationOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </div>

                    {successMessage !== '' ? (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                            {successMessage}
                        </div>
                    ) : null}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="flex min-h-[72vh] flex-col lg:flex-row">
                        <aside
                            className={`border-b border-slate-200 bg-slate-50/90 transition-all duration-300 lg:border-r lg:border-b-0 ${
                                isSidebarCollapsed ? 'lg:w-20' : 'lg:w-80'
                            }`}
                        >
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                    <div className={`min-w-0 ${isSidebarCollapsed ? 'hidden lg:block' : ''}`}>
                                        <p
                                            className={`text-xs font-semibold tracking-wide text-slate-500 uppercase ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
                                        >
                                            Submission Details
                                        </p>
                                        <p className={`mt-1 text-sm font-semibold text-slate-900 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                                            {submission.requirementType}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarCollapsed((current) => !current)}
                                        className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-700 lg:inline-flex"
                                        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                    >
                                        {isSidebarCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                                    </button>
                                </div>

                                <div className="space-y-4 p-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p
                                            className={`text-[11px] font-semibold tracking-wide text-slate-500 uppercase ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
                                        >
                                            Title
                                        </p>
                                        <p
                                            className={`mt-1 text-sm font-medium text-slate-900 ${isSidebarCollapsed ? 'hidden lg:block lg:text-center' : ''}`}
                                        >
                                            {isSidebarCollapsed ? 'PDF' : submission.title}
                                        </p>
                                        {!isSidebarCollapsed ? null : <FileText className="mx-auto hidden h-6 w-6 text-emerald-600 lg:block" />}
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="space-y-3 text-sm text-slate-600">
                                            <div>
                                                <p
                                                    className={`text-[11px] font-semibold tracking-wide text-slate-500 uppercase ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
                                                >
                                                    Program
                                                </p>
                                                <p className={`${isSidebarCollapsed ? 'hidden lg:block lg:text-center' : 'mt-1 text-slate-900'}`}>
                                                    {studentProgram}
                                                </p>
                                            </div>
                                            <div>
                                                <p
                                                    className={`text-[11px] font-semibold tracking-wide text-slate-500 uppercase ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
                                                >
                                                    Submitted
                                                </p>
                                                <p className={`${isSidebarCollapsed ? 'hidden lg:block lg:text-center' : 'mt-1 text-slate-900'}`}>
                                                    {isSidebarCollapsed ? (submission.submittedAt ?? '—') : (submission.submittedAt ?? '—')}
                                                </p>
                                            </div>
                                            <div>
                                                <p
                                                    className={`text-[11px] font-semibold tracking-wide text-slate-500 uppercase ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
                                                >
                                                    Deadline
                                                </p>
                                                <p className={`${isSidebarCollapsed ? 'hidden lg:block lg:text-center' : 'mt-1 text-slate-900'}`}>
                                                    {submission.deadlineLabel ?? 'No deadline declared yet.'}
                                                </p>
                                            </div>
                                            <div>
                                                <p
                                                    className={`text-[11px] font-semibold tracking-wide text-slate-500 uppercase ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
                                                >
                                                    File Size
                                                </p>
                                                <p className={`${isSidebarCollapsed ? 'hidden lg:block lg:text-center' : 'mt-1 text-slate-900'}`}>
                                                    {submission.fileSizeLabel ?? 'Unavailable'}
                                                </p>
                                            </div>
                                            <div>
                                                <p
                                                    className={`text-[11px] font-semibold tracking-wide text-slate-500 uppercase ${isSidebarCollapsed ? 'lg:hidden' : ''}`}
                                                >
                                                    Mime Type
                                                </p>
                                                <p
                                                    className={`${isSidebarCollapsed ? 'hidden lg:block lg:text-center' : 'mt-1 break-all text-slate-900'}`}
                                                >
                                                    {submission.mimeType ?? 'application/pdf'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1 bg-slate-100 p-4 lg:p-5">
                            {submission.fileUrl ? (
                                <iframe
                                    key={submission.fileUrl}
                                    src={`${submission.fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                    title={submission.title}
                                    className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-white lg:h-full lg:min-h-[72vh]"
                                />
                            ) : (
                                <div className="flex h-[70vh] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 lg:h-full lg:min-h-[72vh]">
                                    PDF preview is not available for this submission.
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>
            </div>

            <EditConceptSubmissionModal
                open={isEditModalOpen}
                submission={submission}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => setIsEditModalOpen(false)}
            />

            <ConfirmConceptSubmissionActionModal
                open={isDeleteConfirmationOpen}
                title="Delete Concept Submission"
                message="This will permanently remove the selected submission record and delete the uploaded PDF file from storage."
                confirmLabel="Delete Submission"
                tone="danger"
                processing={deleteForm.processing}
                onClose={() => setIsDeleteConfirmationOpen(false)}
                onConfirm={handleConfirmDelete}
            />
        </StudentLayout>
    );
};

export default StudentConceptSubmissionShow;
