import { Eye, FileText } from 'lucide-react';
import React from 'react';

type DocumentRow = {
    id: string;
    groupId: number;
    name: string;
    group: string;
    type: string;
    submittedAt: string;
    status: 'Approved' | 'For Review' | 'Revise' | 'Missing';
    iconColor: string;
};

type DocumentsTabProps = {
    documents: DocumentRow[];
    pagedDocuments: DocumentRow[];
    documentsPageStart: number;
    documentsPerPage: number;
    documentsPage: number;
    totalDocumentPages: number;
    filters: React.ReactNode;
    onPrevPage: () => void;
    onNextPage: () => void;
    onReviewDocuments: (groupId: number) => void;
    documentBadge: (status: DocumentRow['status']) => string;
};

const DocumentsTab = ({
    documents,
    pagedDocuments,
    documentsPageStart,
    documentsPerPage,
    documentsPage,
    totalDocumentPages,
    filters,
    onPrevPage,
    onNextPage,
    onReviewDocuments,
    documentBadge,
}: DocumentsTabProps) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FileText className="h-4 w-4 text-emerald-600" /> Submitted Documents
                            </h3>
                            <p className="text-xs text-slate-500">Documents aligned with instructor requirements</p>
                        </div>
                    </div>
                    <div className="border-b border-slate-100 px-6 py-4">{filters}</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Document</th>
                                    <th className="px-6 py-3 text-left">Program Set</th>
                                    <th className="px-6 py-3 text-left">Program</th>
                                    <th className="px-6 py-3 text-left">Submitted</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                            No document activity found for the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    pagedDocuments.map((row) => (
                                        <tr key={row.id} className="text-slate-600 transition-colors hover:bg-emerald-50/40">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${row.iconColor}`}>
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <span
                                                        className={`text-sm font-semibold ${
                                                            row.status === 'Missing' ? 'text-slate-400 italic' : 'text-slate-700'
                                                        }`}
                                                    >
                                                        {row.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 font-semibold text-slate-900">{row.group}</td>
                                            <td className="px-6 py-3">
                                                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-xs text-slate-500">{row.submittedAt}</td>
                                            <td className="px-6 py-3">
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${documentBadge(row.status)}`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => onReviewDocuments(row.groupId)}
                                                        title="Review requirement documents"
                                                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span>Review</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
                        <span>
                            {documents.length === 0
                                ? 'No documents to paginate'
                                : `Showing ${documentsPageStart + 1}–${Math.min(
                                      documentsPageStart + documentsPerPage,
                                      documents.length,
                                  )} of ${documents.length}`}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onPrevPage}
                                disabled={documentsPage === 1}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-[11px] text-slate-500">
                                Page {documentsPage} of {totalDocumentPages}
                            </span>
                            <button
                                type="button"
                                onClick={onNextPage}
                                disabled={documentsPage === totalDocumentPages}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsTab;
