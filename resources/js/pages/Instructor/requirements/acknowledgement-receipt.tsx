import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight, ReceiptText } from 'lucide-react';
import React from 'react';
import InstructorLayout from '../_layout';

type GroupSummary = {
    id: number;
    name: string;
    programSetName?: string | null;
    academicYear?: string | null;
};

type DefenseSummary = {
    typeKey?: string | null;
    program?: string | null;
    dateLabel?: string | null;
    timeLabel?: string | null;
};

type ProjectSummary = {
    leaderName?: string | null;
    memberNames?: string[];
};

type SignaturePayload = {
    signatureData: string;
    mimeType?: string | null;
};

type FacultyRow = {
    id: string;
    userId?: number | null;
    name: string;
    role: string;
    amountReceived: string;
    dateReceived: string;
    signedAt?: string | null;
    eSignature?: SignaturePayload | null;
};

type InstructorSummary = {
    name?: string | null;
    eSignature?: SignaturePayload | null;
};

type AcknowledgementReceiptProps = {
    group?: GroupSummary | null;
    defense?: DefenseSummary | null;
    project?: ProjectSummary | null;
    facultyRows?: FacultyRow[];
    instructor?: InstructorSummary | null;
};

const defenseTypeOptions: Array<{ key: string; label: string }> = [
    { key: 'concept_presentation', label: 'Concept Presentation' },
    { key: 'outline_defense', label: 'Outline Defense' },
    { key: 'pre_deployment_defense', label: 'Pre-deployment Defense' },
    { key: 'final_defense', label: 'Final Defense' },
];

const programOptions = ['BSIT', 'BSIS'] as const;

const resolveSignatureDataUrl = (signature: SignaturePayload | null | undefined): string | null => {
    if (!signature || typeof signature.signatureData !== 'string') {
        return null;
    }

    const normalizedData = signature.signatureData.trim();
    if (normalizedData === '') {
        return null;
    }

    if (normalizedData.startsWith('data:image/')) {
        return normalizedData;
    }

    const mimeType = typeof signature.mimeType === 'string' && signature.mimeType.trim() !== '' ? signature.mimeType.trim() : 'image/png';

    return `data:${mimeType};base64,${normalizedData}`;
};

const buildGroupLabel = (group: GroupSummary | null): string => {
    if (!group) {
        return 'No group selected';
    }

    const details = [group.name, group.programSetName ?? '', group.academicYear ?? ''].filter((value) => value.trim() !== '');

    return details.join(' | ');
};

const AcknowledgementReceiptPage = () => {
    const { props } = usePage<AcknowledgementReceiptProps>();
    const group = props.group ?? null;
    const defense = props.defense ?? null;
    const project = props.project ?? null;
    const facultyRows = React.useMemo(() => props.facultyRows ?? [], [props.facultyRows]);
    const instructor = props.instructor ?? null;
    const groupLabel = buildGroupLabel(group);

    const instructorSignatureDataUrl = React.useMemo(() => resolveSignatureDataUrl(instructor?.eSignature), [instructor?.eSignature]);
    const instructorName = React.useMemo(() => {
        const normalizedName = (instructor?.name ?? '').trim();

        return normalizedName !== '' ? normalizedName : 'Not assigned';
    }, [instructor?.name]);

    const selectedDefenseTypeKey = (defense?.typeKey ?? '').trim();
    const selectedProgram = (defense?.program ?? '').trim().toUpperCase();
    const phaseOnePaymentsHref = '/instructor/phase1?tab=payments';

    return (
        <InstructorLayout title="Acknowledgement Receipt" subtitle="Capstone project defense payment verification (view-only)">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/instructor/phase1?tab=payments" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Phase 1
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href={phaseOnePaymentsHref} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Payment Verification
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Acknowledgement Receipt
                    </span>
                </nav>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Selected Group</p>
                            <p className="text-xs text-slate-500">{groupLabel}</p>
                        </div>
                        <Link
                            href={phaseOnePaymentsHref}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Back to Payment Verification
                        </Link>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-7">
                    <div className="border-b border-slate-300 pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-lg font-semibold tracking-wide text-slate-900">DAVAO DEL NORTE STATE COLLEGE</p>
                                <p className="text-xs text-slate-600">New Visayas, Panabo City, Davao del Norte, 8105</p>
                            </div>
                            <div className="text-left text-[11px] text-slate-600 sm:text-right">
                                <p>president@dnsc.edu.ph</p>
                                <p>dnsc.edu.ph</p>
                                <p>@officialdnsc</p>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-3xl font-semibold text-slate-900 italic">Institute of Computing</p>
                        <p className="mt-2 text-center text-sm font-bold tracking-wide text-slate-900">ACKNOWLEDGEMENT RECEIPT</p>
                        <p className="text-center text-xs font-semibold text-slate-700">Capstone Project Defense Payment</p>
                    </div>

                    <div className="mt-6 grid gap-5 text-xs text-slate-800">
                        <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)]">
                            <p className="font-semibold">Defense Type:</p>
                            <div className="grid gap-1.5">
                                {defenseTypeOptions.map((option) => (
                                    <p key={option.key}>
                                        [{selectedDefenseTypeKey === option.key ? 'x' : ' '}] {option.label}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)]">
                            <p className="font-semibold">Program:</p>
                            <div className="flex flex-wrap gap-7">
                                {programOptions.map((programOption) => (
                                    <p key={programOption}>
                                        [{selectedProgram === programOption ? 'x' : ' '}] {programOption}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)]">
                            <p className="font-semibold">Date and Time of Defense:</p>
                            <p className="underline decoration-slate-300 underline-offset-2">
                                {(defense?.dateLabel ?? 'TBD').trim()} &nbsp;&nbsp; {(defense?.timeLabel ?? 'TBD').trim()}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded border border-slate-300 text-xs">
                        <div className="grid grid-cols-[150px_minmax(0,1fr)] border-b border-slate-300">
                            <div className="border-r border-slate-300 bg-slate-50 px-2 py-1.5 font-semibold">Project Leader:</div>
                            <div className="px-2 py-1.5">{(project?.leaderName ?? 'Not available').trim() || 'Not available'}</div>
                        </div>
                        <div className="grid grid-cols-[150px_minmax(0,1fr)]">
                            <div className="border-r border-slate-300 bg-slate-50 px-2 py-1.5 font-semibold">Members:</div>
                            <div className="px-2 py-1.5">{(project?.memberNames ?? []).join(', ') || 'No members listed'}</div>
                        </div>
                    </div>

                    <div className="mt-5 overflow-x-auto rounded border border-slate-300">
                        <table className="w-full min-w-[840px] border-collapse text-center text-xs text-slate-800">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="border border-slate-300 px-2 py-2 font-semibold">Name of Faculty</th>
                                    <th className="border border-slate-300 px-2 py-2 font-semibold">Role</th>
                                    <th className="border border-slate-300 px-2 py-2 font-semibold">Amount Received</th>
                                    <th className="border border-slate-300 px-2 py-2 font-semibold">Date Received</th>
                                    <th className="border border-slate-300 px-2 py-2 font-semibold">Signature</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facultyRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="border border-slate-300 px-3 py-8 text-slate-500">
                                            No faculty rows available.
                                        </td>
                                    </tr>
                                ) : (
                                    facultyRows.map((facultyRow) => {
                                        const signatureDataUrl = resolveSignatureDataUrl(facultyRow.eSignature);
                                        const isSigned = typeof facultyRow.signedAt === 'string' && facultyRow.signedAt.trim() !== '';

                                        return (
                                            <tr key={facultyRow.id}>
                                                <td className="border border-slate-300 px-2 py-2 text-left font-semibold">{facultyRow.name}</td>
                                                <td className="border border-slate-300 px-2 py-2">{facultyRow.role}</td>
                                                <td className="border border-slate-300 px-2 py-2">{facultyRow.amountReceived}</td>
                                                <td className="border border-slate-300 px-2 py-2">{facultyRow.dateReceived}</td>
                                                <td className="border border-slate-300 px-2 py-1">
                                                    <div className="relative flex min-h-16 items-center justify-center">
                                                        {isSigned && signatureDataUrl ? (
                                                            <img
                                                                src={signatureDataUrl}
                                                                alt={`${facultyRow.name} signature`}
                                                                className="pointer-events-none max-h-12 w-auto object-contain opacity-90"
                                                            />
                                                        ) : (
                                                            <span className="text-[11px] font-semibold text-slate-400">Not signed</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-10 ml-6 max-w-sm">
                        <p className="text-xs text-slate-700">Checked and confirmed by:</p>
                        <div className="relative mt-8 h-20">
                            {instructorSignatureDataUrl ? (
                                <img
                                    src={instructorSignatureDataUrl}
                                    alt={`${instructorName} e-signature`}
                                    className="pointer-events-none absolute top-0 left-1/2 max-h-14 w-auto -translate-x-1/2 object-contain opacity-90"
                                />
                            ) : null}
                            <p className="absolute inset-x-0 bottom-1 text-center text-sm font-semibold text-slate-800">{instructorName}</p>
                            <div className="absolute inset-x-0 bottom-0 border-b border-slate-400" aria-hidden="true" />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-800">Capstone Project Instructor</p>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                        <div className="inline-flex items-center gap-2 font-semibold text-slate-700">
                            <ReceiptText className="h-3.5 w-3.5" />
                            Signature Policy
                        </div>
                        <p className="mt-1">Instructor view is read-only. Faculty signatures are shown here when submitted.</p>
                    </div>
                </div>
            </motion.section>
        </InstructorLayout>
    );
};

export default AcknowledgementReceiptPage;
