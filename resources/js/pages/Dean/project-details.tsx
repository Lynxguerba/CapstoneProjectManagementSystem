import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ChevronRight,
    PencilLine,
    FileText,
    Save,
    BookOpen,
    FileCheck2,
    FolderOpen,
    GraduationCap,
    Tag,
    UserCheck,
    Users,
} from 'lucide-react';
import React from 'react';

import ProjectTitleRenameModal from '@/components/Dean/ProjectTitleRenameModal';
import deanProjectDetails from '@/routes/dean/projects/details';
import DeanLayout from './_layout';

type CategoryOption = {
    id: number;
    name: string;
    description?: string | null;
};

type ApprovedConcept = {
    id: number;
    title: string;
    requirementType: string;
    submittedAt?: string | null;
    instructorStatus: string;
    adviserStatus: string;
    titleCategoryId?: number | null;
    titleCategoryName?: string | null;
    fileUrl?: string | null;
};

type ProjectDetailsPageProps = {
    group?: {
        id: number;
        name: string;
        program?: string | null;
        programSetName?: string | null;
        academicYear?: string | null;
        adviserName?: string | null;
        instructorName?: string | null;
        leaderName?: string | null;
        membersCount?: number;
        members?: Array<{
            id: number;
            name: string;
            role: string;
        }>;
    } | null;
    approvedConcept?: ApprovedConcept | null;
    categoryOptions?: CategoryOption[];
    canSetCategory?: boolean;
};

const ProjectDetails = () => {
    const { props } = usePage<ProjectDetailsPageProps>();
    const group = props.group ?? null;
    const approvedConcept = props.approvedConcept ?? null;
    const categoryOptions = React.useMemo(() => props.categoryOptions ?? [], [props.categoryOptions]);
    const canSetCategory = props.canSetCategory === true;
    const [showRenameModal, setShowRenameModal] = React.useState(false);
    const form = useForm<{ title_category_id: string }>({
        title_category_id: approvedConcept?.titleCategoryId ? String(approvedConcept.titleCategoryId) : '',
    });
    const memberList = group?.members ?? [];

    React.useEffect(() => {
        const nextCategoryValue = approvedConcept?.titleCategoryId ? String(approvedConcept.titleCategoryId) : '';
        if (form.data.title_category_id !== nextCategoryValue) {
            form.setData('title_category_id', nextCategoryValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [approvedConcept?.titleCategoryId]);

    const submitCategory = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (group === null || approvedConcept === null) {
            return;
        }

        form.put(deanProjectDetails.category.update.url({ group: group.id }), {
            preserveScroll: true,
        });
    };

    return (
        <DeanLayout title="Project Detail" subtitle="Approved concept title details and category assignment">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/dean/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/dean/projects" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Projects
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Detail
                    </span>
                </nav>

                {group === null ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-amber-900">Project not found.</h3>
                        <p className="mt-2 text-sm text-amber-800">Select a project from the Projects page.</p>
                    </div>
                ) : approvedConcept === null ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-amber-900">No approved concept title yet.</h3>
                        <p className="mt-2 text-sm text-amber-800">Only approved concept titles can be managed on this page.</p>
                    </div>
                ) : (
                    <div className="grid h-[82vh] grid-cols-[360px_minmax(0,1fr)] gap-5">
                        <div className="flex h-full flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            {/* ── Header ── */}
                            <div className="rounded-xl bg-emerald-600 px-4 py-3">
                                <p className="text-[10px] font-semibold tracking-widest text-emerald-200 uppercase">
                                    {group.programSetName || 'Unassigned Set'}
                                    {group.academicYear ? ` · ${group.academicYear}` : ''}
                                </p>
                                <h3 className="mt-0.5 text-sm font-bold text-white">{group.name}</h3>
                            </div>

                            {/* ── Approved Title ── */}
                            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                                <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-emerald-600 uppercase">
                                    <FileCheck2 className="h-3.5 w-3.5" />
                                    Project Title
                                </dt>
                                <div className="mt-1 flex items-start gap-2">
                                    <p className="min-w-0 flex-1 text-xs leading-snug font-medium text-emerald-900">{approvedConcept.title}</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowRenameModal(true)}
                                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                                    >
                                        <PencilLine className="h-3 w-3" />
                                        Rename
                                    </button>
                                </div>
                            </div>

                            {/* ── Info Grid ── */}
                            <dl className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                                    <dt className="flex items-center gap-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                                        <BookOpen className="h-3 w-3 text-emerald-500" />
                                        Program
                                    </dt>
                                    <dd className="mt-1 truncate text-[11px] font-medium text-slate-700">{group.program || '—'}</dd>
                                </div>

                                <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                                    <dt className="flex items-center gap-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                                        <UserCheck className="h-3 w-3 text-emerald-500" />
                                        Adviser
                                    </dt>
                                    <dd className="mt-1 truncate text-[11px] font-medium text-slate-700">{group.adviserName || 'Unassigned'}</dd>
                                </div>

                                <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                                    <dt className="flex items-center gap-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                                        <GraduationCap className="h-3 w-3 text-emerald-500" />
                                        Instructor
                                    </dt>
                                    <dd className="mt-1 truncate text-[11px] font-medium text-slate-700">{group.instructorName || 'Unassigned'}</dd>
                                </div>

                                <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                                    <dt className="flex items-center gap-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                                        <Users className="h-3 w-3 text-emerald-500" />
                                        Members
                                    </dt>
                                    <dd className="mt-1 text-[11px] font-medium text-slate-700">{group.membersCount ?? 0}</dd>
                                </div>
                            </dl>

                            {/* ── Current Category ── */}
                            <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                                <dt className="flex items-center gap-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                                    <Tag className="h-3 w-3 text-emerald-500" />
                                    Current Category
                                </dt>
                                <dd className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {approvedConcept.titleCategoryName || 'Not Set'}
                                </dd>
                            </div>

                            {/* ── Team Members ── */}
                            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                                <dt className="mb-1.5 flex items-center gap-1 text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                                    <Users className="h-3 w-3 text-emerald-500" />
                                    Team Members
                                </dt>
                                <div className="space-y-1.5">
                                    {/* Project Manager — always pinned at top */}
                                    <div className="flex items-center justify-between rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5">
                                        <p className="truncate pr-2 text-[11px] font-medium text-slate-700">{group.leaderName || 'Unassigned'}</p>
                                        <span className="shrink-0 rounded-full bg-emerald-200 px-2 py-0.5 text-[9px] font-semibold text-emerald-800">
                                            Project Manager
                                        </span>
                                    </div>

                                    {/* Rest of members */}
                                    {memberList.length > 0 ? (
                                        memberList.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-2 py-1.5"
                                            >
                                                <p className="truncate pr-2 text-[11px] font-medium text-slate-700">{member.name}</p>
                                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                                                    {member.role}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[11px] text-slate-500">No members available.</p>
                                    )}
                                </div>
                            </div>

                            {/* ── Spacer ── */}
                            <div className="flex-1" />

                            {/* ── Set Category Form ── */}
                            <form onSubmit={submitCategory} className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <label
                                    htmlFor="title_category_id"
                                    className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase"
                                >
                                    <FolderOpen className="h-3.5 w-3.5 text-emerald-600" />
                                    Set Project Category
                                </label>

                                <select
                                    id="title_category_id"
                                    value={form.data.title_category_id}
                                    onChange={(event) => form.setData('title_category_id', event.target.value)}
                                    disabled={!canSetCategory || form.processing}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
                                >
                                    <option value="">N/A (No Category)</option>
                                    {categoryOptions.map((option) => (
                                        <option key={option.id} value={String(option.id)}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>

                                {group.program ? (
                                    <p className="text-[11px] text-slate-500">Showing {group.program} categories for this group.</p>
                                ) : null}

                                {form.errors.title_category_id ? <p className="text-xs text-rose-600">{form.errors.title_category_id}</p> : null}
                                {categoryOptions.length === 0 ? (
                                    <p className="text-xs text-amber-700">No categories configured for this program yet.</p>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={!canSetCategory || form.processing}
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    {form.processing ? 'Saving...' : 'Save Category'}
                                </button>

                                {form.recentlySuccessful ? (
                                    <p className="text-center text-[11px] font-medium text-emerald-600">✓ Category saved successfully.</p>
                                ) : null}
                            </form>

                            <ProjectTitleRenameModal
                                open={showRenameModal}
                                groupId={group.id}
                                currentTitle={approvedConcept.title}
                                onClose={() => setShowRenameModal(false)}
                            />
                        </div>

                        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="p-4">
                                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Project File</p>
                            </div>
                            <div className="flex-1 overflow-hidden rounded-b-2xl border-t border-slate-100 bg-slate-50">
                                {approvedConcept.fileUrl ? (
                                    <iframe
                                        key={approvedConcept.fileUrl}
                                        src={`${approvedConcept.fileUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                        title={`${approvedConcept.title} PDF Preview`}
                                        className="h-full w-full"
                                    />
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
                                        <FileText className="h-6 w-6 text-slate-300" />
                                        PDF preview is unavailable for this submission.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </motion.section>
        </DeanLayout>
    );
};

export default ProjectDetails;
