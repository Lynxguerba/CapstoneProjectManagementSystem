import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { BadgeCheck, Crown, Mail, Shield, UserCheck, Users, ChevronRight } from 'lucide-react';
import React from 'react';
import studentRoutes from '../../routes/student';
import StudentLayout from './_layout';

type GroupSummary = {
    id: number;
    name: string;
    programSet?: string | null;
    academicYear?: string | null;
    currentStage: string;
};

type GroupMember = {
    id: number;
    name: string;
    role: string;
    email?: string | null;
    isLeader: boolean;
};

type GroupAdviser = {
    name: string;
    email?: string | null;
    assignedAt?: string | null;
};

type GroupPanelist = {
    id: number;
    name: string;
    role: string;
    slot: number;
    email?: string | null;
};

type PendingAdviserRequest = {
    id: number;
    adviserId?: number | null;
    adviserName?: string | null;
    requestedAt?: string | null;
};

type ProgressStep = {
    label: string;
    done: boolean;
    current: boolean;
};

type StudentGroupPageProps = {
    group?: GroupSummary | null;
    isGroupLeader?: boolean;
    members?: GroupMember[];
    adviser?: GroupAdviser | null;
    pendingAdviserRequest?: PendingAdviserRequest | null;
    panelists?: GroupPanelist[];
    progress?: ProgressStep[];
    auth?: {
        user?: {
            id?: number;
        } | null;
    };
};

const defaultProgress: ProgressStep[] = [
    { label: 'Concept', done: false, current: true },
    { label: 'Outline', done: false, current: false },
    { label: 'Pre-Deployment', done: false, current: false },
    { label: 'Deployment', done: false, current: false },
    { label: 'Final', done: false, current: false },
];

const formatDateLabel = (value?: string | null): string => {
    if (!value) {
        return 'Not assigned yet';
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

const StudentGroup = () => {
    const { props } = usePage<StudentGroupPageProps>();

    const group = props.group ?? null;
    const isGroupLeader = props.isGroupLeader ?? false;
    const members = props.members ?? [];
    const adviser = props.adviser ?? null;
    const pendingAdviserRequest = props.pendingAdviserRequest ?? null;
    const hasPendingRequest = Boolean(pendingAdviserRequest);
    const panelists = props.panelists ?? [];
    const progressSteps = props.progress && props.progress.length > 0 ? props.progress : defaultProgress;
    const currentStudentId = props.auth?.user?.id ?? null;

    const sectionLabel = [group?.programSet, group?.academicYear].filter(Boolean).join(' • ');

    const resolveRoleMeta = (member: GroupMember): { icon: React.ComponentType<{ size?: number; className?: string }>; tone: string } => {
        if (member.isLeader) {
            return { icon: Crown, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        }

        const normalizedRole = member.role.toLowerCase();

        if (normalizedRole.includes('programmer') || normalizedRole.includes('developer')) {
            return { icon: Shield, tone: 'bg-teal-50 text-teal-700 border-teal-200' };
        }

        if (normalizedRole.includes('document')) {
            return { icon: BadgeCheck, tone: 'bg-green-50 text-green-700 border-green-200' };
        }

        return { icon: Users, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    };

    return (
        <StudentLayout title="My Capstone Group" subtitle="Live group profile, adviser handle, and progress">
            <div className="space-y-5">
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href={studentRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Dashboard
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-800" aria-current="page">
                            Capstone Group
                        </span>
                    </nav>
                </motion.section>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Members</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    {group ? `Group ${group.name}${sectionLabel ? ` • ${sectionLabel}` : ''}` : 'No active group assigned yet.'}
                                </p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                {members.length} total
                            </span>
                        </div>

                        <div className="mt-4 space-y-2.5">
                            {members.length > 0 ? (
                                members.map((member) => {
                                    const meta = resolveRoleMeta(member);
                                    const Icon = meta.icon;
                                    const isCurrentStudent = currentStudentId !== null && member.id === currentStudentId;

                                    return (
                                        <div
                                            key={member.id}
                                            className={`rounded-xl border p-3 ${
                                                isCurrentStudent
                                                    ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200'
                                                    : 'border-slate-200 bg-slate-50/70'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0">
                                                    <div className="inline-flex max-w-full items-center gap-2">
                                                        <div className="truncate text-sm font-semibold text-slate-900">{member.name}</div>
                                                        {isCurrentStudent ? (
                                                            <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                                                You
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-600">
                                                        <Mail size={12} />
                                                        <span className="truncate">{member.email ?? 'No email available'}</span>
                                                    </div>
                                                </div>

                                                <div className="inline-flex items-center gap-1.5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                            isCurrentStudent ? `${meta.tone} ring-2 ring-emerald-300` : meta.tone
                                                        }`}
                                                    >
                                                        <Icon size={12} />
                                                        {member.role}
                                                    </span>
                                                    {isCurrentStudent ? (
                                                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                                            Current role
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border border-slate-200 bg-emerald-50/40 p-3 text-xs text-slate-600">
                                    Your account is not yet linked to an active capstone group.
                                </div>
                            )}
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-sm font-semibold text-slate-900">Adviser Handle</h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Assigned adviser for your current group.</p>

                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                            {adviser ? (
                                <div className="space-y-1.5">
                                    <div className="text-sm font-semibold text-slate-900">{adviser.name}</div>
                                    <div className="text-xs text-slate-600">{adviser.email ?? 'No email available'}</div>
                                    <div className="text-[11px] text-slate-500">Assigned on {formatDateLabel(adviser.assignedAt)}</div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-600">No adviser assigned yet.</div>
                            )}
                        </div>

                        {group ? (
                            <div className="mt-4">
                                {hasPendingRequest ? (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                                        {adviser ? 'Reassignment request pending' : 'Adviser request pending'}
                                        {pendingAdviserRequest?.adviserName ? `: ${pendingAdviserRequest.adviserName}` : '.'}
                                    </div>
                                ) : isGroupLeader ? (
                                    <Link
                                        href={studentRoutes.adviserSelection.url()}
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                    >
                                        <UserCheck className="h-3.5 w-3.5" />
                                        {adviser ? 'Request Reassign' : 'Invite Adviser'}
                                    </Link>
                                ) : (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">
                                        Only the Project Manager can request or reassign an adviser.
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div className="mt-4 border-t border-slate-200 pt-4">
                            <h4 className="text-xs font-semibold tracking-wide text-slate-700 uppercase">Group Progress</h4>
                            <div className="mt-3 space-y-2">
                                {progressSteps.map((step) => (
                                    <div key={step.label} className="flex items-center justify-between gap-3">
                                        <div className="text-xs font-medium text-slate-700">{step.label}</div>
                                        <span
                                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                                step.done
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : step.current
                                                      ? 'border-teal-200 bg-teal-50 text-teal-700'
                                                      : 'border-slate-200 bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                            {step.done ? 'Done' : step.current ? 'Current' : 'Next'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Panel Members</h3>
                            <p className="mt-1 text-xs text-slate-500">Assigned panelists for defense evaluation.</p>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            {panelists.length} assigned
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        {panelists.length > 0 ? (
                            panelists.map((panelist) => (
                                <div key={panelist.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                                    <div className="text-sm font-semibold text-slate-900">{panelist.name}</div>
                                    <div className="mt-1 text-xs text-slate-600">{panelist.email ?? 'No email available'}</div>
                                    <div className="mt-2 inline-flex items-center gap-2">
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                            Slot {panelist.slot}
                                        </span>
                                        <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                                            {panelist.role}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-emerald-50/40 p-3 text-xs text-slate-600 md:col-span-3">
                                No panelists have been assigned to your group yet.
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>
        </StudentLayout>
    );
};

export default StudentGroup;
