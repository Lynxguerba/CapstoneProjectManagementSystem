import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Download, FileText } from 'lucide-react';
import React from 'react';
import InstructorLayout from '../_layout';

type GroupSummary = {
    id: number;
    name: string;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
};

type RequirementRecord = {
    id: number;
    requirement_type: string;
    due_date: string | null;
    academic_year_label?: string | null;
};

type DocumentSubmissionRow = {
    id: number;
    document_requirement_id: number;
    status?: 'Submitted' | 'Approved' | 'Revision Required' | string | null;
    file_name?: string | null;
    submitted_at?: string | null;
};

type RequirementRow = {
    id: number;
    requirementType: string;
    dueDate: string | null;
    status: 'Missing' | 'Submitted' | 'Approved' | 'Revision Required';
    fileName?: string | null;
    submittedAt?: string | null;
    downloadUrl?: string | null;
};

type PageProps = {
    group: GroupSummary;
    requirements?: RequirementRecord[];
    documentSubmissions?: DocumentSubmissionRow[];
};

const statusStyles: Record<RequirementRow['status'], string> = {
    Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Submitted: 'border-amber-200 bg-amber-50 text-amber-700',
    'Revision Required': 'border-rose-200 bg-rose-50 text-rose-700',
    Missing: 'border-slate-200 bg-slate-100 text-slate-600',
};

const formatDateLabel = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
        return value;
    }

    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const buildDownloadUrl = (submissionId: number): string => `/instructor/document-submissions/${submissionId}/download`;

const GroupDocumentsPage = () => {
    const { props } = usePage<PageProps>();
    const group = props.group;
    const requirements = props.requirements ?? [];
    const submissions = props.documentSubmissions ?? [];

    const latestSubmissionByRequirement = React.useMemo(() => {
        const map = new Map<number, DocumentSubmissionRow>();

        submissions.forEach((submission) => {
            const requirementId = submission.document_requirement_id;
            const existing = map.get(requirementId);
            if (!existing) {
                map.set(requirementId, submission);
                return;
            }

            const nextDate = submission.submitted_at ?? '';
            const existingDate = existing.submitted_at ?? '';

            if (nextDate > existingDate || (nextDate === existingDate && submission.id > existing.id)) {
                map.set(requirementId, submission);
            }
        });

        return map;
    }, [submissions]);

    const rows = React.useMemo(() => {
        return requirements.map((requirement) => {
            const submission = latestSubmissionByRequirement.get(requirement.id);
            const status = submission?.status === 'Revision Required'
                ? 'Revision Required'
                : submission?.status === 'Approved'
                  ? 'Approved'
                  : submission
                    ? 'Submitted'
                    : 'Missing';

            return {
                id: requirement.id,
                requirementType: requirement.requirement_type,
                dueDate: requirement.due_date,
                status,
                fileName: submission?.file_name ?? null,
                submittedAt: submission?.submitted_at ?? null,
                downloadUrl: submission ? buildDownloadUrl(submission.id) : null,
            } satisfies RequirementRow;
        });
    }, [latestSubmissionByRequirement, requirements]);

    const handleDownload = (url?: string | null) => {
        if (!url) {
            return;
        }

        window.location.assign(url);
    };

    return (
        <InstructorLayout title="Group Documents" subtitle="Review submitted documents per requirement">
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                            <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                                Dashboard
                            </Link>
                            <ChevronRight className="h-3 w-3 text-slate-400" />
                            <Link href="/instructor/phase1" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                                Phase 1
                            </Link>
                            <ChevronRight className="h-3 w-3 text-slate-400" />
                            <span className="font-semibold text-slate-800" aria-current="page">
                                Group {group.name}
                            </span>
                        </nav>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">{group.name}</h2>
                        <p className="text-sm text-slate-500">
                            {group.program_set_name ?? 'Program set'} • {group.program ?? 'Program'} • {group.school_year ?? 'Academic year'}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
                        {rows.length} requirement(s)
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            Requirement Documents
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 text-left">Requirement</th>
                                    <th className="px-6 py-3 text-left">Due Date</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">File</th>
                                    <th className="px-6 py-3 text-left">Submitted</th>
                                    <th className="px-6 py-3 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                            No requirements found for this group yet.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.id} className="text-slate-600">
                                            <td className="px-6 py-3 font-semibold text-slate-900">{row.requirementType}</td>
                                            <td className="px-6 py-3 text-xs text-slate-500">{formatDateLabel(row.dueDate)}</td>
                                            <td className="px-6 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                        statusStyles[row.status]
                                                    }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-xs text-slate-500">{row.fileName ?? '—'}</td>
                                            <td className="px-6 py-3 text-xs text-slate-500">{formatDateLabel(row.submittedAt)}</td>
                                            <td className="px-6 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownload(row.downloadUrl)}
                                                    disabled={!row.downloadUrl}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    Download
                                                </button>
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

export default GroupDocumentsPage;
