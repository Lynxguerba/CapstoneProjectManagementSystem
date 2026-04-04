import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FileText, MessageSquareText, Mic, ShieldCheck, Users } from 'lucide-react';
import React from 'react';
import type { IHighlight } from 'react-pdf-highlighter';
import { PdfHighlighterViewer } from '@/components/Panelist/PdfHighlighterViewer';
import RecommendationLetterModal from '@/components/Student/RecommendationLetterModal';
import studentRoutes from '../../routes/student';
import StudentLayout from './_layout';

type ConceptSubmission = {
    id: number;
    title: string;
    requirementType: string;
    submittedAt?: string | null;
    instructorStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    adviserStatus: 'Submitted' | 'Approved' | 'Revision Required' | string;
    panelistApprovalStatus: 'Approved' | 'Pending' | 'Rejected' | string;
    fileUrl?: string | null;
};

type AssignedPanelist = {
    id: number;
    name: string;
    email?: string | null;
    slot?: number | null;
    role?: string | null;
};

type Participant = {
    id: number;
    name: string;
    role: string;
    email?: string | null;
};

type RecommendationLetter = {
    id: number;
    fileName: string;
    fileUrl: string | null;
    signedAt?: string | null;
    adviserName?: string | null;
};

type LiveComment = {
    id: string;
    databaseId: number;
    author: string;
    authorRole: 'Student' | 'Adviser' | 'Panelist';
    attributedPanelistName?: string | null;
    message: string;
    createdAt: string;
    canDelete: boolean;
};

type StudentLiveDefenseProps = {
    group: {
        id: number;
        name: string;
        programSetName?: string | null;
        academicYear?: string | null;
        defenseStatus?: 'Pending' | 'In Progress' | 'Completed' | string;
    } | null;
    conceptSubmissions: ConceptSubmission[];
    panelists: AssignedPanelist[];
    participants?: {
        students?: Participant[];
        adviser?: Participant | null;
        panelists?: Participant[];
    };
    commentsBySubmission?: Record<number, LiveComment[]>;
    highlightsBySubmission?: Record<number, IHighlight[]>;
    commentHighlightTargets?: Record<string, { submissionId: number; highlightId: string }>;
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

const panelistApprovalStatusClass = (status: string): string => {
    if (status === 'Approved') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'Rejected') {
        return 'border-rose-200 bg-rose-100 text-rose-700';
    }

    return 'border-amber-200 bg-amber-100 text-amber-700';
};

const commentRoleBadgeClass = (role: LiveComment['authorRole']): string => {
    if (role === 'Panelist') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (role === 'Adviser') {
        return 'border-indigo-200 bg-indigo-100 text-indigo-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-600';
};

const formatCommentCreatedAt = (createdAt: string): string => {
    if (createdAt.trim() === '') {
        return '';
    }

    const commentDate = new Date(createdAt);
    if (Number.isNaN(commentDate.getTime())) {
        return createdAt;
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(commentDate);
};

const areLiveCommentsEqual = (currentComments: LiveComment[], incomingComments: LiveComment[]): boolean => {
    return JSON.stringify(currentComments) === JSON.stringify(incomingComments);
};

const areHighlightsEqual = (currentHighlights: IHighlight[], incomingHighlights: IHighlight[]): boolean => {
    return JSON.stringify(currentHighlights) === JSON.stringify(incomingHighlights);
};

const isScrolledNearBottom = (element: HTMLDivElement): boolean => {
    const distanceFromBottom = element.scrollHeight - (element.scrollTop + element.clientHeight);
    return distanceFromBottom <= 24;
};

const StudentLiveDefense = () => {
    const { props } = usePage<StudentLiveDefenseProps>();
    const group = props.group;
    const conceptSubmissions = React.useMemo(() => props.conceptSubmissions ?? [], [props.conceptSubmissions]);
    const assignedPanelists = React.useMemo(() => props.panelists ?? [], [props.panelists]);
    const students = React.useMemo(() => props.participants?.students ?? [], [props.participants?.students]);
    const adviser = props.participants?.adviser ?? null;
    const participantPanelists = React.useMemo(() => props.participants?.panelists ?? [], [props.participants?.panelists]);
    const recommendationLetter = props.recommendationLetter ?? null;
    const serverCommentsBySubmission = React.useMemo(() => props.commentsBySubmission ?? {}, [props.commentsBySubmission]);
    const serverHighlightsBySubmission = React.useMemo(() => props.highlightsBySubmission ?? {}, [props.highlightsBySubmission]);
    const serverCommentHighlightTargets = React.useMemo(() => props.commentHighlightTargets ?? {}, [props.commentHighlightTargets]);

    const [selectedConceptId, setSelectedConceptId] = React.useState<number | null>(null);
    const [isRecommendationLetterModalOpen, setIsRecommendationLetterModalOpen] = React.useState(false);
    const [liveCommentsMap, setLiveCommentsMap] = React.useState<Record<number, LiveComment[]>>({});
    const [highlightsMap, setHighlightsMap] = React.useState<Record<number, IHighlight[]>>({});
    const [commentHighlightTargets, setCommentHighlightTargets] = React.useState<Record<string, { submissionId: number; highlightId: string }>>({});
    const [pendingHighlightFocus, setPendingHighlightFocus] = React.useState<{ submissionId: number; highlightId: string } | null>(null);
    const [isReadingCommentHistory, setIsReadingCommentHistory] = React.useState(false);
    const commentsContainerRef = React.useRef<HTMLDivElement | null>(null);
    const shouldStickCommentsToBottomRef = React.useRef(true);
    const latestCommentDatabaseIdRef = React.useRef<number | null>(null);

    const liveDefenseCommentPollingProps = React.useMemo(() => ['commentsBySubmission', 'commentHighlightTargets'], []);
    const liveDefenseHighlightPartialProps = React.useMemo(() => ['highlightsBySubmission'], []);

    React.useEffect(() => {
        if (conceptSubmissions.length === 0) {
            setSelectedConceptId(null);
            return;
        }

        setSelectedConceptId((currentSelectedConceptId) => {
            if (
                currentSelectedConceptId !== null
                && conceptSubmissions.some((submission) => submission.id === currentSelectedConceptId)
            ) {
                return currentSelectedConceptId;
            }

            const firstWithPdf = conceptSubmissions.find((submission) => submission.fileUrl);

            return firstWithPdf?.id ?? conceptSubmissions[0]?.id ?? null;
        });
    }, [conceptSubmissions]);

    React.useEffect(() => {
        setLiveCommentsMap((currentLiveCommentsMap) => {
            const nextLiveCommentsMap: Record<number, LiveComment[]> = {};
            let hasChanges = Object.keys(currentLiveCommentsMap).length !== conceptSubmissions.length;

            conceptSubmissions.forEach((submission) => {
                const submissionId = submission.id;
                const incomingComments = serverCommentsBySubmission[submissionId] ?? [];
                const currentComments = currentLiveCommentsMap[submissionId] ?? [];

                if (areLiveCommentsEqual(currentComments, incomingComments)) {
                    nextLiveCommentsMap[submissionId] = currentComments;
                    return;
                }

                hasChanges = true;
                nextLiveCommentsMap[submissionId] = incomingComments;
            });

            if (!hasChanges) {
                return currentLiveCommentsMap;
            }

            return nextLiveCommentsMap;
        });
    }, [conceptSubmissions, serverCommentsBySubmission]);

    React.useEffect(() => {
        setHighlightsMap((currentHighlightsMap) => {
            const nextHighlightsMap: Record<number, IHighlight[]> = {};
            let hasChanges = Object.keys(currentHighlightsMap).length !== conceptSubmissions.length;

            conceptSubmissions.forEach((submission) => {
                const submissionId = submission.id;
                const incomingHighlights = serverHighlightsBySubmission[submissionId] ?? [];
                const currentHighlights = currentHighlightsMap[submissionId] ?? [];

                if (areHighlightsEqual(currentHighlights, incomingHighlights)) {
                    nextHighlightsMap[submissionId] = currentHighlights;
                    return;
                }

                hasChanges = true;
                nextHighlightsMap[submissionId] = incomingHighlights;
            });

            if (!hasChanges) {
                return currentHighlightsMap;
            }

            return nextHighlightsMap;
        });
    }, [conceptSubmissions, serverHighlightsBySubmission]);

    React.useEffect(() => {
        setCommentHighlightTargets(serverCommentHighlightTargets);
    }, [serverCommentHighlightTargets]);

    React.useEffect(() => {
        if (!group) {
            return;
        }

        const interval = setInterval(() => {
            if (isReadingCommentHistory || document.hidden) {
                return;
            }

            router.reload({
                only: liveDefenseCommentPollingProps,
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [group, isReadingCommentHistory, liveDefenseCommentPollingProps]);

    const selectedConcept = React.useMemo(
        () => conceptSubmissions.find((submission) => submission.id === selectedConceptId) ?? null,
        [conceptSubmissions, selectedConceptId],
    );
    const getHighlights = (submissionId: number): IHighlight[] => highlightsMap[submissionId] ?? [];
    const activeLiveComments = React.useMemo(() => {
        if (!selectedConcept) {
            return [];
        }

        return liveCommentsMap[selectedConcept.id] ?? [];
    }, [liveCommentsMap, selectedConcept]);
    const orderedActiveLiveComments = React.useMemo(
        () => [...activeLiveComments].sort((leftComment, rightComment) => leftComment.databaseId - rightComment.databaseId),
        [activeLiveComments],
    );

    React.useEffect(() => {
        shouldStickCommentsToBottomRef.current = true;
        setIsReadingCommentHistory(false);
        latestCommentDatabaseIdRef.current = null;
    }, [selectedConceptId]);

    React.useEffect(() => {
        const commentsContainer = commentsContainerRef.current;
        if (!commentsContainer) {
            return;
        }

        const latestCommentDatabaseId = orderedActiveLiveComments.at(-1)?.databaseId ?? null;
        const hasNewLatestComment = latestCommentDatabaseIdRef.current !== latestCommentDatabaseId;
        latestCommentDatabaseIdRef.current = latestCommentDatabaseId;

        if (!shouldStickCommentsToBottomRef.current || (!hasNewLatestComment && latestCommentDatabaseId !== null)) {
            return;
        }

        commentsContainer.scrollTop = commentsContainer.scrollHeight;
    }, [orderedActiveLiveComments]);

    const handleCommentsScroll = (event: React.UIEvent<HTMLDivElement>): void => {
        const isNearBottom = isScrolledNearBottom(event.currentTarget);
        shouldStickCommentsToBottomRef.current = isNearBottom;
        setIsReadingCommentHistory(!isNearBottom);
    };

    const focusHighlightedComment = (highlightTarget: { submissionId: number; highlightId: string }): void => {
        setSelectedConceptId(highlightTarget.submissionId);

        const hasHighlight = (highlightsMap[highlightTarget.submissionId] ?? []).some(
            (highlight) => highlight.id === highlightTarget.highlightId,
        );

        setPendingHighlightFocus(highlightTarget);

        if (hasHighlight) {
            return;
        }

        router.reload({
            only: liveDefenseHighlightPartialProps,
            onSuccess: () => {
                setPendingHighlightFocus(highlightTarget);
            },
        });
    };

    const groupLabel = group
        ? `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}${group.academicYear ? ` · ${group.academicYear}` : ''}`
        : 'No active group assignment yet.';

    const activeGroupName = group?.name ?? 'Your Group';
    const defenseStatus = group?.defenseStatus ?? 'Pending';

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
                                    <th className="px-4 py-3 font-semibold">Panelist Status</th>
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
                                        const panelistApprovalStatus = submission.panelistApprovalStatus ?? 'Pending';

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
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${panelistApprovalStatusClass(panelistApprovalStatus)}`}
                                                    >
                                                        {panelistApprovalStatus}
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
                    <div className="flex h-[65vh] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:h-[72vh]">
                        <div className="flex items-center gap-2">
                            <MessageSquareText className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-800">Panelist Comments</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Comments are view-only for students and update in real time.</p>

                        <div
                            ref={commentsContainerRef}
                            onScroll={handleCommentsScroll}
                            className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
                        >
                            {orderedActiveLiveComments.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                                    No live comments yet.
                                </div>
                            ) : (
                                orderedActiveLiveComments.map((comment) => {
                                    const highlightTarget = commentHighlightTargets[comment.id];
                                    const cardContent = (
                                        <>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-xs font-semibold text-slate-800">{comment.author}</p>
                                                <span
                                                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${commentRoleBadgeClass(comment.authorRole)}`}
                                                >
                                                    {comment.authorRole}
                                                </span>
                                                <span className="text-[11px] text-slate-500">{formatCommentCreatedAt(comment.createdAt)}</span>
                                            </div>
                                            {comment.authorRole === 'Adviser' && comment.attributedPanelistName ? (
                                                <p className="mt-1 text-[11px] font-semibold text-indigo-700">
                                                    Source Panelist: {comment.attributedPanelistName}
                                                </p>
                                            ) : null}
                                            <p className="mt-1 text-xs text-slate-700">{comment.message}</p>
                                        </>
                                    );

                                    if (!highlightTarget) {
                                        return (
                                            <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                                                {cardContent}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50/70">
                                            <button
                                                type="button"
                                                onClick={() => focusHighlightedComment(highlightTarget)}
                                                className="w-full px-3 py-2 text-left transition hover:bg-slate-100"
                                            >
                                                {cardContent}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex h-[65vh] flex-col rounded-xl border border-slate-200 bg-slate-100 p-4 shadow-sm lg:h-[72vh] lg:p-5">
                        <div className="mb-3">
                            <p className="text-sm font-semibold text-slate-900">PDF Viewer</p>
                            <p className="mt-1 text-xs text-slate-500">
                                {selectedConcept ? selectedConcept.title : 'Select a concept title row to preview the uploaded PDF.'}
                            </p>
                        </div>

                        <div className="min-h-0 flex-1">
                            {!selectedConcept || !selectedConcept.fileUrl ? (
                                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                                    PDF preview is not available for this selected concept submission.
                                </div>
                            ) : (
                                <PdfHighlighterViewer
                                    key={selectedConcept.id}
                                    pdfUrl={selectedConcept.fileUrl}
                                    highlights={getHighlights(selectedConcept.id)}
                                    onAddHighlight={() => {}}
                                    activeHighlightId={
                                        pendingHighlightFocus?.submissionId === selectedConcept.id ? pendingHighlightFocus.highlightId : null
                                    }
                                    onHighlightFocused={(highlightId) => {
                                        setPendingHighlightFocus((currentTarget) => {
                                            if (!currentTarget) {
                                                return null;
                                            }

                                            if (currentTarget.highlightId !== highlightId || currentTarget.submissionId !== selectedConcept.id) {
                                                return currentTarget;
                                            }

                                            return null;
                                        });
                                    }}
                                    containerClassName="h-full pdf-viewer-page-borders"
                                    isReadOnly
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px_300px]">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-800">Participants</h3>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Students</p>
                                <div className="mt-2 space-y-2">
                                    {students.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                            No students assigned yet.
                                        </div>
                                    ) : (
                                        students.map((student) => (
                                            <div key={student.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                                                <p className="text-xs font-semibold text-slate-800">{student.name}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    {student.role}
                                                    {student.email ? ` · ${student.email}` : ''}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-4">
                                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Adviser</p>
                                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                                        <p className="text-xs font-semibold text-slate-800">{adviser?.name ?? 'No adviser assigned'}</p>
                                        <p className="text-[11px] text-slate-500">
                                            {adviser?.role ?? 'Adviser'}
                                            {adviser?.email ? ` · ${adviser.email}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Panelists</p>
                                <div className="mt-2 space-y-2">
                                    {participantPanelists.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                            No panelists assigned yet.
                                        </div>
                                    ) : (
                                        participantPanelists.map((panelist) => (
                                            <div key={panelist.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                                                <p className="text-xs font-semibold text-slate-800">{panelist.name}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    {panelist.role}
                                                    {panelist.email ? ` · ${panelist.email}` : ''}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

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
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-800">Defense Approval</h3>
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Presentation: {defenseStatus}</p>
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
