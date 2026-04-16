import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ChevronRight, RotateCcw, X } from 'lucide-react';
import React from 'react';
import InstructorLayout from '../_layout';

type SubmissionStatus = 'Submitted' | 'Approved' | 'Revision Required';

type ConceptSubmissionRow = {
    id: number;
    title: string;
    requirementType: string;
    status: SubmissionStatus;
    adviserStatus: SubmissionStatus;
    submittedAt?: string | null;
    adviserReviewedAt?: string | null;
    fileUrl?: string | null;
};

type GroupDocumentRow = {
    id: number;
    name: string;
    leaderName?: string | null;
    programSetName?: string | null;
    program?: string | null;
    schoolYear?: string | null;
    adviser?: {
        id: number;
        name: string;
        email?: string | null;
        assignedAt?: string | null;
    } | null;
    submissions: ConceptSubmissionRow[];
};

type ReviewNotification = {
    tone: 'success' | 'warning' | 'error';
    title: string;
    message: string;
};

type PageProps = {
    groups?: GroupDocumentRow[];
    selectedGroupId?: number | null;
    selectedRequirementId?: number | null;
    selectedRequirementType?: string | null;
    activeStage?: string | null;
};

const statusBadge = (status: SubmissionStatus): string => {
    if (status === 'Approved') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'Revision Required') {
        return 'border-amber-200 bg-amber-100 text-amber-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-600';
};

const adviserStatusBadge = (status: SubmissionStatus): string => {
    if (status === 'Approved') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'Revision Required') {
        return 'border-amber-200 bg-amber-100 text-amber-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-600';
};

const GroupConceptReviewPage = () => {
    const { props } = usePage<PageProps>();
    const [groups, setGroups] = React.useState<GroupDocumentRow[]>(() => props.groups ?? []);
    const [selectedSubmissionId, setSelectedSubmissionId] = React.useState<number | null>(null);
    const [processingSubmissionId, setProcessingSubmissionId] = React.useState<number | null>(null);
    const [notification, setNotification] = React.useState<ReviewNotification | null>(null);
    const dismissNotification = React.useCallback(() => {
        setNotification(null);
    }, []);

    React.useEffect(() => {
        setGroups(props.groups ?? []);
    }, [props.groups]);

    const activeGroup = React.useMemo(() => {
        const selectedGroup = groups.find((group) => group.id === props.selectedGroupId);
        if (selectedGroup) {
            return selectedGroup;
        }

        return groups[0] ?? null;
    }, [groups, props.selectedGroupId]);

    React.useEffect(() => {
        const firstSubmissionId = activeGroup?.submissions[0]?.id ?? null;
        setSelectedSubmissionId((current) => {
            if (current !== null && (activeGroup?.submissions ?? []).some((submission) => submission.id === current)) {
                return current;
            }

            return firstSubmissionId;
        });
    }, [activeGroup]);

    React.useEffect(() => {
        if (!notification) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            dismissNotification();
        }, 4500);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [dismissNotification, notification]);

    const selectedSubmission = React.useMemo(() => {
        if (!activeGroup) {
            return null;
        }

        return activeGroup.submissions.find((submission) => submission.id === selectedSubmissionId) ?? null;
    }, [activeGroup, selectedSubmissionId]);
    const normalizedStage = (props.activeStage ?? 'Concept').trim().toLowerCase();
    const stageLabel = (props.activeStage ?? 'Concept').trim() || 'Concept';
    const phaseLabel = normalizedStage === 'outline' ? 'Phase 2' : 'Phase 1';
    const phaseHref = normalizedStage === 'outline' ? '/instructor/phase2?tab=documents' : '/instructor/phase1?tab=documents';
    const requirementLabel = props.selectedRequirementType ?? `${stageLabel} Requirement`;
    const stageQuerySuffix = `&stage=${encodeURIComponent(stageLabel)}`;
    const requirementsIndexHref = activeGroup
        ? `/instructor/requirements/documents?group=${activeGroup.id}${stageQuerySuffix}`
        : `/instructor/requirements/documents?stage=${encodeURIComponent(stageLabel)}`;

    const updateSubmissionStatus = React.useCallback((submissionId: number, status: 'Approved' | 'Revision Required'): Promise<boolean> => {
        return new Promise((resolve) => {
            router.patch(
                `/instructor/document-submissions/${submissionId}/status`,
                { status },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setGroups((currentGroups) =>
                            currentGroups.map((group) => ({
                                ...group,
                                submissions: group.submissions.map((submission) =>
                                    submission.id === submissionId ? { ...submission, status } : submission,
                                ),
                            })),
                        );

                        resolve(true);
                    },
                    onError: () => resolve(false),
                    onCancel: () => resolve(false),
                },
            );
        });
    }, []);

    const handleApprove = async (submissionId: number) => {
        setProcessingSubmissionId(submissionId);
        setNotification(null);
        const isSuccessful = await updateSubmissionStatus(submissionId, 'Approved');
        setProcessingSubmissionId(null);

        if (!isSuccessful) {
            setNotification({
                tone: 'error',
                title: 'Unable to Approve Submission',
                message: 'Please try again in a moment.',
            });
            return;
        }

        setNotification({
            tone: 'success',
            title: 'Submission Approved',
            message: 'The selected submission is now marked as approved.',
        });
    };

    const handleResubmit = async (submissionId: number) => {
        setProcessingSubmissionId(submissionId);
        setNotification(null);
        const isSuccessful = await updateSubmissionStatus(submissionId, 'Revision Required');
        setProcessingSubmissionId(null);

        if (!isSuccessful) {
            setNotification({
                tone: 'error',
                title: 'Unable to Request Resubmission',
                message: 'Please try again in a moment.',
            });
            return;
        }

        setNotification({
            tone: 'warning',
            title: 'Resubmission Requested',
            message: 'The selected submission is now marked for resubmission.',
        });
    };

    return (
        <InstructorLayout title={`${stageLabel} Requirement Review`} subtitle={`Review ${stageLabel.toLowerCase()} submissions for the selected requirement`}>
            <div className="space-y-6">
                <div className="space-y-3">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Dashboard
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <Link href={phaseHref} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            {phaseLabel}
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <Link href={requirementsIndexHref} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Requirement Documents
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-800" aria-current="page">
                            {stageLabel} Review
                        </span>
                    </nav>
                </div>

                <div className="text-1xl font-bold text-slate-900">
                    {requirementLabel} Review : <span className="font-semibold text-slate-900">Group</span> {activeGroup?.name ?? 'No group selected'}
                </div>
                {activeGroup?.adviser ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Adviser:</span> {activeGroup.adviser.name}
                        <span className="ml-3 text-xs text-slate-500">{activeGroup.adviser.email ?? 'No email'}</span>
                    </div>
                ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        No adviser assignment found for this group.
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {notification ? (
                        <motion.div
                            initial={{ opacity: 0, y: -16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4 sm:justify-end sm:px-6"
                        >
                            <div
                                role="alert"
                                className={`pointer-events-auto w-full max-w-[30rem] overflow-hidden rounded-2xl border px-4 py-3 shadow-xl ring-1 ring-black/5 sm:w-fit sm:min-w-[22rem] ${
                                    notification.tone === 'error'
                                        ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50'
                                        : notification.tone === 'warning'
                                          ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
                                          : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                                            notification.tone === 'error'
                                                ? 'bg-rose-100 text-rose-600'
                                                : notification.tone === 'warning'
                                                  ? 'bg-amber-100 text-amber-600'
                                                  : 'bg-emerald-100 text-emerald-600'
                                        }`}
                                    >
                                        {notification.tone === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-xs font-bold ${
                                                notification.tone === 'error'
                                                    ? 'text-rose-700'
                                                    : notification.tone === 'warning'
                                                      ? 'text-amber-700'
                                                      : 'text-emerald-700'
                                            }`}
                                        >
                                            {notification.title}
                                        </p>
                                        <p
                                            className={`mt-1 text-xs font-medium ${
                                                notification.tone === 'error'
                                                    ? 'text-rose-700/90'
                                                    : notification.tone === 'warning'
                                                      ? 'text-amber-700/90'
                                                      : 'text-emerald-700/90'
                                            }`}
                                        >
                                            {notification.message}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={dismissNotification}
                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                            notification.tone === 'error'
                                                ? 'border-rose-200 text-rose-500 hover:bg-rose-100'
                                                : notification.tone === 'warning'
                                                  ? 'border-amber-200 text-amber-500 hover:bg-amber-100'
                                                  : 'border-emerald-200 text-emerald-500 hover:bg-emerald-100'
                                        }`}
                                        aria-label="Dismiss notification"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div
                                    className={`mt-3 h-1 w-full overflow-hidden rounded-full ${
                                        notification.tone === 'error'
                                            ? 'bg-rose-100'
                                            : notification.tone === 'warning'
                                              ? 'bg-amber-100'
                                              : 'bg-emerald-100'
                                    }`}
                                >
                                    <motion.div
                                        key={`${notification.tone}-${notification.message}`}
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: 4.5, ease: 'linear' }}
                                        className={`h-full ${
                                            notification.tone === 'error'
                                                ? 'bg-rose-400'
                                                : notification.tone === 'warning'
                                                  ? 'bg-amber-500'
                                                  : 'bg-emerald-500'
                                        }`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {!activeGroup ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        No group was selected for review.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
                        <div className="border-r border-slate-200">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                                Submitted Requirement Files
                            </div>
                            <div className="max-h-[70vh] overflow-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Title</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activeGroup.submissions.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-10 text-center text-xs text-slate-500">
                                                    No submissions found for this group.
                                                </td>
                                            </tr>
                                        ) : (
                                            activeGroup.submissions.map((submission) => {
                                                const isSelected = submission.id === selectedSubmissionId;
                                                const isProcessing = processingSubmissionId === submission.id;

                                                return (
                                                    <tr
                                                        key={submission.id}
                                                        onClick={() => setSelectedSubmissionId(submission.id)}
                                                        className={`cursor-pointer align-top transition-colors ${
                                                            isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-slate-900">{submission.title}</div>
                                                            <div className="mt-1 text-[11px] text-slate-500">{submission.submittedAt ?? '—'}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(
                                                                    submission.status,
                                                                )}`}
                                                            >
                                                                {submission.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        void handleApprove(submission.id);
                                                                    }}
                                                                    disabled={processingSubmissionId !== null}
                                                                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {isProcessing ? 'Saving...' : 'Approve'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        void handleResubmit(submission.id);
                                                                    }}
                                                                    disabled={processingSubmissionId !== null}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    <RotateCcw className="h-3 w-3" />
                                                                    {isProcessing ? 'Saving...' : 'Resubmit'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                                    Assigned Adviser
                                </div>
                                <div className="overflow-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200 bg-white text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Assigned At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr>
                                                <td className="px-4 py-3 font-semibold text-slate-900">
                                                    {activeGroup.adviser?.name ?? 'Unassigned'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{activeGroup.adviser?.email ?? '—'}</td>
                                                <td className="px-4 py-3 text-slate-600">{activeGroup.adviser?.assignedAt ?? '—'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="border-t border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                                    Adviser Approval Status
                                </div>
                                <div className="max-h-[26vh] overflow-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Title</th>
                                                <th className="px-4 py-3">Adviser Status</th>
                                                <th className="px-4 py-3">Reviewed At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {activeGroup.submissions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500">
                                                        No adviser approval records available.
                                                    </td>
                                                </tr>
                                            ) : (
                                                activeGroup.submissions.map((submission) => (
                                                    <tr key={`adviser-${submission.id}`}>
                                                        <td className="px-4 py-3 font-semibold text-slate-900">{submission.title}</td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${adviserStatusBadge(
                                                                    submission.adviserStatus,
                                                                )}`}
                                                            >
                                                                {submission.adviserStatus}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{submission.adviserReviewedAt ?? '—'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex min-h-[24rem] flex-col">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-semibold text-slate-600 uppercase">PDF Preview</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">
                                    {selectedSubmission ? selectedSubmission.title : 'Select a submission'}
                                </div>
                            </div>

                            {!selectedSubmission ? (
                                <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
                                    Select a row from the table to preview the PDF.
                                </div>
                            ) : selectedSubmission.fileUrl ? (
                                <div className="flex-1 bg-slate-100 p-4">
                                    <iframe
                                        key={selectedSubmission.fileUrl}
                                        src={`${selectedSubmission.fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                        title={selectedSubmission.title}
                                        className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-white"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
                                    PDF preview is unavailable for the selected submission.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </InstructorLayout>
    );
};

export default GroupConceptReviewPage;
