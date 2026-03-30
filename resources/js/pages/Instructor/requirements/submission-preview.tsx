import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, FileText } from 'lucide-react';
import InstructorLayout from '../_layout';

type SubmissionPreview = {
    id: number;
    groupId?: number | null;
    groupName: string;
    programSetName?: string | null;
    program?: string | null;
    requirementType: string;
    fileName: string;
    fileUrl: string;
    status?: string | null;
    adviserStatus?: string | null;
    submittedAt?: string | null;
    signedAt?: string | null;
};

type PageProps = {
    submission: SubmissionPreview;
};

const SubmissionPreviewPage = () => {
    const { props } = usePage<PageProps>();
    const submission = props.submission;
    const requirementDocumentsHref = submission.groupId
        ? `/instructor/requirements/documents?group=${submission.groupId}`
        : '/instructor/requirements/documents';

    return (
        <InstructorLayout title="Requirement Submission Preview" subtitle="Preview generated recommendation and signed requirement documents">
            <div className="space-y-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/instructor/phase1?tab=documents" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Phase 1
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href={requirementDocumentsHref} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Requirement Documents
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Preview
                    </span>
                </nav>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">{submission.requirementType}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Group {submission.groupName}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{submission.programSetName ?? 'Program set'}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{submission.program ?? 'Program'}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <div>
                            <span className="font-semibold text-slate-900">File:</span> {submission.fileName}
                        </div>
                        <div>
                            <span className="font-semibold text-slate-900">Submitted:</span> {submission.submittedAt ?? '—'}
                        </div>
                        <div>
                            <span className="font-semibold text-slate-900">Instructor Status:</span> {submission.status ?? 'Submitted'}
                        </div>
                        <div>
                            <span className="font-semibold text-slate-900">Adviser Signed:</span> {submission.signedAt ?? '—'}
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            PDF Preview
                        </h3>
                    </div>
                    <div className="bg-slate-100 p-4">
                        <iframe
                            key={submission.fileUrl}
                            src={`${submission.fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                            title={submission.fileName}
                            className="h-[74vh] w-full rounded-2xl border border-slate-200 bg-white"
                        />
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
};

export default SubmissionPreviewPage;
