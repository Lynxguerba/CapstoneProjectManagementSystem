import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, FileText, MessageSquareText, ShieldCheck, Users } from 'lucide-react';
import React from 'react';
import PanelLayout from './_layout';

type Participant = {
    id: number;
    name: string;
    role: string;
    email?: string | null;
};

type ConceptSubmission = {
    id: number;
    title: string;
    requirementType: string;
    submittedAt?: string | null;
    panelApprovalCount?: number | null;
    panelApprovalTotal?: number | null;
    fileUrl?: string | null;
};

type LiveComment = {
    id: string;
    author: string;
    authorRole: 'Student' | 'Adviser' | 'Panelist';
    message: string;
    createdAt: string;
};

type PanelistLiveDefenseProps = {
    group: {
        id: number;
        name: string;
        programSetName?: string | null;
        academicYear?: string | null;
        defenseStatus?: 'Pending' | 'In Progress' | 'Completed' | string;
    } | null;
    conceptSubmissions?: ConceptSubmission[];
    participants?: {
        students?: Participant[];
        adviser?: Participant | null;
        panelists?: Participant[];
    };
    comments?: LiveComment[];
};

const defenseStatusClass = (status: string): string => {
    if (status === 'Completed') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'In Progress') {
        return 'border-indigo-200 bg-indigo-100 text-indigo-700';
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

const PanelistLiveDefense = () => {
    const { props } = usePage<PanelistLiveDefenseProps>();
    const group = props.group;
    const conceptSubmissions = React.useMemo(() => props.conceptSubmissions ?? [], [props.conceptSubmissions]);
    const students = React.useMemo(() => props.participants?.students ?? [], [props.participants?.students]);
    const adviser = props.participants?.adviser ?? null;
    const panelists = React.useMemo(() => props.participants?.panelists ?? [], [props.participants?.panelists]);
    const serverComments = React.useMemo(() => props.comments ?? [], [props.comments]);
    const [selectedConceptId, setSelectedConceptId] = React.useState<number | null>(conceptSubmissions[0]?.id ?? null);
    const [commentInput, setCommentInput] = React.useState('');
    const [liveComments, setLiveComments] = React.useState<LiveComment[]>(serverComments);

    React.useEffect(() => {
        setSelectedConceptId(conceptSubmissions[0]?.id ?? null);
    }, [conceptSubmissions]);

    React.useEffect(() => {
        setLiveComments(serverComments);
    }, [serverComments]);

    const selectedConcept = React.useMemo(() => {
        return conceptSubmissions.find((submission) => submission.id === selectedConceptId) ?? null;
    }, [conceptSubmissions, selectedConceptId]);

    const handleSubmitComment = (): void => {
        const message = commentInput.trim();
        if (message === '') {
            return;
        }

        const timestamp = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        setLiveComments((previousComments) => [
            ...previousComments,
            {
                id: `c-${Date.now()}`,
                author: 'You',
                authorRole: 'Panelist',
                message,
                createdAt: timestamp,
            },
        ]);
        setCommentInput('');
    };

    if (!group) {
        return (
            <PanelLayout title="Live Defense Board" subtitle="Panel live review workspace">
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-xs text-slate-500 shadow-sm">
                    No assigned group available for live defense.
                </div>
            </PanelLayout>
        );
    }

    const groupLabel = `${group.name}${group.programSetName ? ` · ${group.programSetName}` : ''}${group.academicYear ? ` · ${group.academicYear}` : ''}`;
    const defenseStatus = group.defenseStatus ?? 'Pending';

    return (
        <PanelLayout title="Live Defense Board" subtitle="Panel live review workspace">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/panelist/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/panelist/schedule" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Defense Schedule
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Live Defense
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
                            <div className="inline-flex items-center gap-2">
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${defenseStatusClass(defenseStatus)}`}>
                                    Defense Status: {defenseStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-xs">
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
                                        const isActive = submission.id === selectedConceptId;
                                        const panelApprovalCount = Number(submission.panelApprovalCount ?? 0);
                                        const panelApprovalTotal = Number(submission.panelApprovalTotal ?? 0);

                                        return (
                                            <tr
                                                key={submission.id}
                                                onClick={() => setSelectedConceptId(submission.id)}
                                                className={`cursor-pointer transition-colors ${isActive ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-900">{submission.title}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">{submission.requirementType}</p>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{submission.submittedAt ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
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
                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <MessageSquareText className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-800">Panelist Comments</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            Comments here are visible in the live defense stream for students, adviser, and panelists.
                        </p>

                        <div className="mt-4 flex-1 space-y-2 overflow-auto pr-1">
                            {liveComments.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">No live comments yet.</div>
                            ) : (
                                liveComments.map((comment) => (
                                    <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-semibold text-slate-800">{comment.author}</p>
                                            <span
                                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${commentRoleBadgeClass(comment.authorRole)}`}
                                            >
                                                {comment.authorRole}
                                            </span>
                                            <span className="text-[11px] text-slate-500">{comment.createdAt}</span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-700">{comment.message}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 space-y-2">
                            <textarea
                                value={commentInput}
                                onChange={(event) => setCommentInput(event.target.value)}
                                placeholder="Type your panel comment..."
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSubmitComment}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Send Comment
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 shadow-sm lg:p-5">
                        <div className="mb-3">
                            <p className="text-sm font-semibold text-slate-900">PDF Viewer</p>
                            <p className="mt-1 text-xs text-slate-500">
                                {selectedConcept ? selectedConcept.title : 'Select a concept title row to preview the uploaded PDF.'}
                            </p>
                        </div>

                        {!selectedConcept || !selectedConcept.fileUrl ? (
                            <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                                PDF preview is not available for this selected concept submission.
                            </div>
                        ) : (
                            <iframe
                                key={selectedConcept.fileUrl}
                                src={`${selectedConcept.fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                title={selectedConcept.title}
                                className="h-[65vh] w-full rounded-2xl border border-slate-200 bg-white lg:h-[72vh]"
                            />
                        )}
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
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
                                    {panelists.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                            No panelists assigned yet.
                                        </div>
                                    ) : (
                                        panelists.map((panelist) => (
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
                        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Evaluation Grading</p>
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3">
                            <p className="text-xs text-slate-600">Open scoring form for this defense panel session.</p>
                            <div className="mt-3">
                                <Link
                                    href={`/panelist/evaluation?group=${group.id}`}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Evaluate
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>
        </PanelLayout>
    );
};

export default PanelistLiveDefense;
