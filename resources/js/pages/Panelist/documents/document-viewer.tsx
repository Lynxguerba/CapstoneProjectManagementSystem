import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, FileText, Info, MessageSquareText, User, Users } from 'lucide-react';
import React from 'react';
import PanelLayout from '../_layout';

type LiveComment = {
    id: string;
    author: string;
    authorRole: string;
    message: string;
    createdAt: string;
};

type GroupMember = {
    name: string;
    role: string;
};

type GroupDetails = {
    name: string;
    program: string;
    academicYear: string;
    adviser: {
        name: string;
        email: string;
    } | null;
    members: GroupMember[];
};

interface Props {
    document: {
        id: number;
        group: string;
        fileName: string;
        fileUrl: string;
        category: string;
        uploadedAt: string;
        status: string;
    };
    groupDetails: GroupDetails;
    comments: LiveComment[];
}

const commentRoleBadgeClass = (role: string): string => {
    const r = role?.toLowerCase() || '';
    if (r === 'panelist') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (r === 'adviser' || r === 'faculty') {
        return 'border-indigo-200 bg-indigo-100 text-indigo-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-600';
};

const PanelistDocumentViewer = ({ document, groupDetails, comments }: Props) => {
    const categoryLower = document.category?.toLowerCase() || '';
    const isConceptPaper = categoryLower.includes('concept');
    const isProcessRelated = isConceptPaper || categoryLower.includes('manuscript');

    return (
        <PanelLayout title="Document Viewer" subtitle="View document and project details">
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-5"
            >
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/panelist/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/panelist/documents" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Documents
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Viewer
                    </span>
                </nav>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
                    <div className="flex h-[75vh] flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-emerald-600" />
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">{document.fileName}</h3>
                                    <p className="text-[10px] text-slate-500">{document.group} • {document.category}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 p-4">
                            {document.fileUrl ? (
                                <iframe
                                    src={`${document.fileUrl}#toolbar=0`}
                                    className="h-full w-full rounded-lg border border-slate-200 shadow-inner bg-white"
                                    title={document.fileName}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                                    Document file is not available for preview.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex h-[75vh] flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        {isProcessRelated ? (
                            <>
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquareText className="h-4 w-4 text-emerald-600" />
                                        <h3 className="text-sm font-semibold text-slate-800">Live Defense Comments</h3>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">Feedback from live defense board</p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                                    {comments.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-500">
                                            No live comments recorded yet.
                                        </div>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-xs font-semibold text-slate-800">{comment.author}</p>
                                                    <span
                                                        className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${commentRoleBadgeClass(comment.authorRole)}`}
                                                    >
                                                        {comment.authorRole}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 ml-auto">{comment.createdAt}</span>
                                                </div>
                                                <p className="mt-2 text-xs leading-relaxed text-slate-700">{comment.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-emerald-600" />
                                        <h3 className="text-sm font-semibold text-slate-800">Document Details</h3>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">Project and submission information</p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/30">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                                <FileText size={14} />
                                                Submission Info
                                            </h4>
                                            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">{isConceptPaper ? 'Review Status' : 'Requirement Status'}</span>
                                                    <span className="font-semibold text-emerald-600">{document.status}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Uploaded At</span>
                                                    <span className="font-semibold text-slate-700">{document.uploadedAt}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Category</span>
                                                    <span className="font-semibold text-slate-700">{document.category}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                                <User size={14} />
                                                Adviser
                                            </h4>
                                            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                                                {groupDetails.adviser ? (
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-800">{groupDetails.adviser.name}</p>
                                                        <p className="text-[10px] text-slate-500">{groupDetails.adviser.email}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500">No adviser assigned</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                                <Users size={14} />
                                                Group Members
                                            </h4>
                                            <div className="mt-2 space-y-2">
                                                {groupDetails.members.map((member, i) => (
                                                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                                                        <p className="text-xs font-semibold text-slate-800">{member.name}</p>
                                                        <p className="text-[10px] text-slate-500">{member.role || 'Member'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.section>
        </PanelLayout>
    );
};

export default PanelistDocumentViewer;
