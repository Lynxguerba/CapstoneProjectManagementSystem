import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Eye, FileCheck2 } from 'lucide-react';
import InstructorLayout from '../_layout';

type RequirementDocumentStatus = 'Missing' | 'Submitted' | 'Approved' | 'Revision Required';

type GroupDocumentContext = {
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
};

type RequirementDocumentRow = {
    requirementId: number;
    requirementType: string;
    academicYear: string;
    dueDate?: string | null;
    status: RequirementDocumentStatus;
    fileName?: string | null;
    submittedAt?: string | null;
    canReview: boolean;
    reviewUrl?: string | null;
};

type PageProps = {
    selectedGroup?: GroupDocumentContext | null;
    documents?: RequirementDocumentRow[];
    activeStage?: string | null;
};

const statusBadge = (status: RequirementDocumentStatus): string => {
    if (status === 'Approved') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'Revision Required') {
        return 'border-amber-200 bg-amber-100 text-amber-700';
    }

    if (status === 'Submitted') {
        return 'border-indigo-200 bg-indigo-100 text-indigo-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-600';
};

const GroupRequirementDocumentsPage = () => {
    const { props } = usePage<PageProps>();
    const selectedGroup = props.selectedGroup ?? null;
    const documents = props.documents ?? [];
    const normalizedStage = (props.activeStage ?? 'Concept').trim().toLowerCase();
    const isOutlineStage = normalizedStage === 'outline';
    const phaseLabel = isOutlineStage ? 'Phase 2' : 'Phase 1';
    const phaseDocumentsHref = isOutlineStage ? '/instructor/phase2?tab=documents' : '/instructor/phase1?tab=documents';

    return (
        <InstructorLayout title="Group Requirement Documents" subtitle="Review required submissions generated from Requirements Manager">
            <div className="space-y-6">
                <div className="space-y-3">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Dashboard
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <Link href={phaseDocumentsHref} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            {phaseLabel}
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-800" aria-current="page">
                            Submitted Documents
                        </span>
                    </nav>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Group: <span className="text-emerald-700">{selectedGroup?.name ?? 'No group selected'}</span>
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {selectedGroup?.programSetName ?? '—'} • {selectedGroup?.program ?? '—'} • {selectedGroup?.schoolYear ?? '—'}
                        </p>
                    </div>

                    {selectedGroup?.adviser ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">Adviser:</span> {selectedGroup.adviser.name}
                            <span className="ml-3 text-xs text-slate-500">{selectedGroup.adviser.email ?? 'No email'}</span>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            No adviser assignment found for this group.
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FileCheck2 className="h-4 w-4 text-emerald-600" />
                            Requirement-Based Documents
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">Generated from the Requirements Manager tab for the selected group.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left sm:px-6">Requirement</th>
                                    <th className="px-4 py-3 text-left sm:px-6">Academic Year</th>
                                    <th className="px-4 py-3 text-left sm:px-6">Due Date</th>
                                    <th className="px-4 py-3 text-left sm:px-6">Submitted</th>
                                    <th className="px-4 py-3 text-left sm:px-6">Status</th>
                                    <th className="px-4 py-3 text-left sm:px-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 sm:px-6">
                                            No requirement documents found for this group.
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((document) => (
                                        <tr
                                            key={document.requirementId}
                                            className="align-top text-slate-700 transition-colors hover:bg-emerald-50/40"
                                        >
                                            <td className="px-4 py-3 font-semibold text-slate-900 sm:px-6">{document.requirementType}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 sm:px-6">{document.academicYear}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 sm:px-6">{document.dueDate ?? '—'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 sm:px-6">{document.submittedAt ?? '—'}</td>
                                            <td className="px-4 py-3 sm:px-6">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(document.status)}`}
                                                >
                                                    {document.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 sm:px-6">
                                                {document.canReview && document.reviewUrl ? (
                                                    <Link
                                                        href={document.reviewUrl}
                                                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span>Review</span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Review unavailable</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
};

export default GroupRequirementDocumentsPage;
