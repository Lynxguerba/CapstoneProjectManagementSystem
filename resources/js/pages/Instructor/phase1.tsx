import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Clock3,
    CreditCard,
    FileText,
    Filter,
    RotateCcw,
    Search,
    ShieldCheck,
    Users,
    XCircle,
} from 'lucide-react';
import React from 'react';
import AddRequirementModal from '../../components/Instructor/requirements/AddRequirementModal';
import DeleteRequirementModal from '../../components/Instructor/requirements/DeleteRequirementModal';
import DownloadDocumentsModal from '../../components/Instructor/requirements/DownloadDocumentsModal';
import EditRequirementModal from '../../components/Instructor/requirements/EditRequirementModal';
import InstructorLayout from './_layout';
import DeadlinesTab from './phase1/DeadlinesTab';
import DefenseTab from './phase1/DefenseTab';
import DocumentsTab from './phase1/DocumentsTab';
import PaymentsTab from './phase1/PaymentsTab';

type TabKey = 'deadlines' | 'documents' | 'defense' | 'payments';

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type ProgramSetOption = {
    id: number;
    name?: string | null;
    program?: string | null;
    school_year?: string | null;
};

type GroupMember = {
    id: number;
    name?: string | null;
};

type GroupRow = {
    id: number;
    name: string;
    program_set_id?: number | null;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    leader_name?: string | null;
    members?: GroupMember[];
    members_count?: number;
    created_at?: string | null;
};

type DefenseScheduleRow = {
    id: number;
    group_id?: number | null;
    group_name?: string | null;
    program_set_id?: number | null;
    program_set_name?: string | null;
    program?: string | null;
    school_year?: string | null;
    stage?: string | null;
    status?: 'Scheduled' | 'Completed' | 'Pending' | 'Cancelled' | string | null;
    scheduled_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    room?: {
        id: number;
        name: string;
    } | null;
    created_at?: string | null;
};

type Phase1Props = {
    programSets?: ProgramSetOption[];
    groups?: GroupRow[];
    defenseSchedules?: DefenseScheduleRow[];
    requirements?: RequirementRecord[];
    documentSubmissions?: DocumentSubmissionRow[];
    settings?: {
        titleProposalDeadline?: string | null;
        finalDefenseDeadline?: string | null;
    };
    academicYears?: AcademicYearOption[];
};

type DeadlineRow = {
    id: string;
    requirementType: string;
    academicYear: string;
    dueDate: string | null;
    submitted: number;
    total: number;
    status: 'Due Soon' | 'On Track';
    record: RequirementRecord;
};

type PaymentRow = {
    id: string;
    group: string;
    members: { initials: string; color: string }[];
    submittedAt: string;
    status: 'Verified' | 'Pending' | 'Not Paid';
};

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

type DocumentSubmissionRow = {
    id: number;
    group_id: number;
    document_requirement_id: number;
    requirement_type?: string | null;
    status?: 'Submitted' | 'Approved' | 'Revision Required' | string | null;
    file_name?: string | null;
    file_path?: string | null;
    mime_type?: string | null;
    file_size?: number | null;
    submitted_at?: string | null;
};

type RequirementDocumentDetail = {
    id: number;
    requirementType: string;
    status: 'Missing' | 'Submitted' | 'Approved' | 'Revision Required';
    fileName?: string | null;
    submittedAt?: string | null;
    downloadUrl?: string | null;
};


type RequirementRecord = {
    id: number;
    requirement_type: string;
    due_date: string | null;
    academic_year_id: number | null;
    academic_year_label?: string | null;
};

const avatarColors = [
    'bg-emerald-600',
    'bg-emerald-500',
    'bg-emerald-700',
    'bg-slate-600',
    'bg-slate-500',
    'bg-amber-500',
];

const pad = (value: number): string => value.toString().padStart(2, '0');

const parseDate = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
};

const formatDateLabel = (value?: string | null): string => {
    const date = parseDate(value);
    if (!date) {
        return '—';
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatTime = (value?: string | null): string => {
    if (!value) {
        return '--';
    }

    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return value;
    }

    const normalizedHours = hours % 12 || 12;
    const suffix = hours >= 12 ? 'PM' : 'AM';

    return `${normalizedHours}:${pad(minutes)} ${suffix}`;
};

const formatTimeRange = (start?: string | null, end?: string | null): string => {
    if (!start || !end) {
        return '--';
    }

    return `${formatTime(start)} - ${formatTime(end)}`;
};

const getInitials = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parts = value
        .split(/\s+/)
        .map((part) => part.trim())
        .filter(Boolean);

    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');

    return initials || '—';
};

const Phase1Page = () => {
    const { props } = usePage<Phase1Props>();
    const programSets = props.programSets ?? [];
    const groups = props.groups ?? [];
    const defenseSchedules = props.defenseSchedules ?? [];
    const requirements = props.requirements ?? [];
    const documentSubmissions = props.documentSubmissions ?? [];
    const academicYears = props.academicYears ?? [];

    const currentAcademicYearRecord = academicYears.find((year) => year.is_current) ?? academicYears[0];
    const currentAcademicYear = currentAcademicYearRecord?.label ?? 'All';
    const currentAcademicYearId = currentAcademicYearRecord ? String(currentAcademicYearRecord.id) : '';

    const [activeTab, setActiveTab] = React.useState<TabKey>('deadlines');
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(currentAcademicYear || 'All');
    const [selectedProgramSet, setSelectedProgramSet] = React.useState('All');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [requirementsAcademicYear, setRequirementsAcademicYear] = React.useState(currentAcademicYear || 'All');
    const [requirementsStatus, setRequirementsStatus] = React.useState<'All' | 'Due Soon' | 'On Track'>('All');
    const [documentsPage, setDocumentsPage] = React.useState(1);
    const [deadlinesPage, setDeadlinesPage] = React.useState(1);
    const [defensePage, setDefensePage] = React.useState(1);
    const [paymentsPage, setPaymentsPage] = React.useState(1);
    const [editingRequirement, setEditingRequirement] = React.useState<RequirementRecord | null>(null);
    const [deletingRequirement, setDeletingRequirement] = React.useState<RequirementRecord | null>(null);
    const [downloadGroupId, setDownloadGroupId] = React.useState<number | null>(null);

    const academicYearOptions = React.useMemo(() => ['All', ...academicYears.map((year) => year.label)], [academicYears]);

    React.useEffect(() => {
        if (requirementsAcademicYear === 'All') {
            return;
        }

        if (!academicYearOptions.includes(requirementsAcademicYear)) {
            setRequirementsAcademicYear('All');
        }
    }, [academicYearOptions, requirementsAcademicYear]);

    const formatProgramSetLabel = React.useCallback((programSet: ProgramSetOption): string => {
        const name = programSet.name?.trim() ?? '';
        const meta = [programSet.program, programSet.school_year].filter(Boolean).join(' • ');

        if (name && meta) {
            return `${name} (${meta})`;
        }

        return name || meta || 'Program set';
    }, []);

    const programSetOptions = React.useMemo(() => {
        const options = programSets.map((programSet) => ({
            value: String(programSet.id),
            label: formatProgramSetLabel(programSet),
            academicYear: programSet.school_year ?? null,
        }));

        const filtered =
            selectedAcademicYear === 'All'
                ? options
                : options.filter((option) => option.academicYear === selectedAcademicYear);

        return filtered.sort((first, second) => first.label.localeCompare(second.label));
    }, [programSets, formatProgramSetLabel, selectedAcademicYear]);

    const academicYearSelectOptions = React.useMemo(() => {
        return academicYears.map((year) => ({
            value: String(year.id),
            label: year.label,
            isCurrent: year.is_current,
        }));
    }, [academicYears]);

    const defaultAcademicYearId = currentAcademicYearId || (academicYearSelectOptions[0]?.value ?? '');


    React.useEffect(() => {
        if (selectedProgramSet === 'All') {
            return;
        }

        const exists = programSetOptions.some((option) => option.value === selectedProgramSet);
        if (!exists) {
            setSelectedProgramSet('All');
        }
    }, [programSetOptions, selectedProgramSet]);


    const selectedProgramSetId = selectedProgramSet !== 'All' ? Number(selectedProgramSet) : null;

    const filteredGroups = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return groups.filter((group) => {
            if (selectedAcademicYear !== 'All' && group.school_year !== selectedAcademicYear) {
                return false;
            }

            if (selectedProgramSetId !== null && group.program_set_id !== selectedProgramSetId) {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = `${group.name} ${group.program_set_name ?? ''} ${group.leader_name ?? ''} ${group.program ?? ''}`
                .trim()
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [groups, searchTerm, selectedAcademicYear, selectedProgramSetId]);

    const conceptSchedules = React.useMemo(
        () => defenseSchedules.filter((schedule) => (schedule.stage ?? '').toLowerCase() === 'concept'),
        [defenseSchedules],
    );

    const scheduleByGroupId = React.useMemo(() => {
        const map = new Map<number, DefenseScheduleRow>();

        conceptSchedules.forEach((schedule) => {
            if (schedule.group_id) {
                map.set(schedule.group_id, schedule);
            }
        });

        return map;
    }, [conceptSchedules]);

    const completedCount = React.useMemo(() => {
        return filteredGroups.filter((group) => scheduleByGroupId.get(group.id)?.status === 'Completed').length;
    }, [filteredGroups, scheduleByGroupId]);

    const cancelledCount = React.useMemo(() => {
        return filteredGroups.filter((group) => scheduleByGroupId.get(group.id)?.status === 'Cancelled').length;
    }, [filteredGroups, scheduleByGroupId]);

    const totalGroups = filteredGroups.length;
    const pendingCount = Math.max(0, totalGroups - completedCount - cancelledCount);

    const deadlineStatus = React.useCallback((dueDate?: string | null): DeadlineRow['status'] => {
        const date = parseDate(dueDate);
        if (!date) {
            return 'On Track';
        }

        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return diffDays <= 7 ? 'Due Soon' : 'On Track';
    }, []);

    const resolveAcademicYearLabel = React.useCallback(
        (academicYearId?: number | null, fallbackLabel?: string | null) => {
            if (fallbackLabel && fallbackLabel.trim() !== '') {
                return fallbackLabel;
            }

            const match = academicYears.find((year) => year.id === academicYearId);
            return match?.label ?? 'All';
        },
        [academicYears],
    );

    const requirementSubmissionsByRequirementId = React.useMemo(() => {
        const map = new Map<number, Set<number>>();

        documentSubmissions.forEach((submission) => {
            const set = map.get(submission.document_requirement_id) ?? new Set<number>();
            set.add(submission.group_id);
            map.set(submission.document_requirement_id, set);
        });

        return map;
    }, [documentSubmissions]);

    const resolveRequirementCounts = React.useCallback(
        (requirementId: number, academicYearLabel: string) => {
            const normalizedLabel = academicYearLabel.trim();
            const targetGroups =
                normalizedLabel === '' || normalizedLabel === 'All'
                    ? filteredGroups
                    : filteredGroups.filter((group) => group.school_year === normalizedLabel);
            const total = targetGroups.length;
            const submittedGroupIds = requirementSubmissionsByRequirementId.get(requirementId) ?? new Set<number>();
            const submitted = targetGroups.filter((group) => submittedGroupIds.has(group.id)).length;

            return { submitted, total };
        },
        [filteredGroups, requirementSubmissionsByRequirementId],
    );

    const deadlines = React.useMemo(() => {
        return requirements.map((requirement) => {
            const academicYearLabel = resolveAcademicYearLabel(requirement.academic_year_id, requirement.academic_year_label ?? null);
            const counts = resolveRequirementCounts(requirement.id, academicYearLabel);

            return {
                id: String(requirement.id),
                requirementType: requirement.requirement_type,
                academicYear: academicYearLabel,
                dueDate: requirement.due_date,
                submitted: counts.submitted,
                total: counts.total,
                status: deadlineStatus(requirement.due_date),
                record: requirement,
            } satisfies DeadlineRow;
        });
    }, [deadlineStatus, requirements, resolveAcademicYearLabel, resolveRequirementCounts]);

    const filteredDeadlines = React.useMemo(() => {
        let filtered = deadlines;

        if (requirementsAcademicYear !== 'All') {
            filtered = filtered.filter((row) => row.academicYear === requirementsAcademicYear);
        }

        if (requirementsStatus !== 'All') {
            filtered = filtered.filter((row) => row.status === requirementsStatus);
        }

        return filtered;
    }, [deadlines, requirementsAcademicYear, requirementsStatus]);

    const deadlinesPerPage = 6;
    const totalDeadlinePages = Math.max(1, Math.ceil(filteredDeadlines.length / deadlinesPerPage));
    const deadlinesPageStart = (deadlinesPage - 1) * deadlinesPerPage;
    const pagedDeadlines = filteredDeadlines.slice(deadlinesPageStart, deadlinesPageStart + deadlinesPerPage);

    React.useEffect(() => {
        setDeadlinesPage(1);
    }, [filteredDeadlines.length, requirementsAcademicYear, requirementsStatus]);

    React.useEffect(() => {
        if (deadlinesPage > totalDeadlinePages) {
            setDeadlinesPage(totalDeadlinePages);
        }
    }, [deadlinesPage, totalDeadlinePages]);

    const resolvePaymentStatus = (status?: DefenseScheduleRow['status'] | null): PaymentRow['status'] => {
        if (status === 'Completed') {
            return 'Verified';
        }
        if (status === 'Scheduled' || status === 'Pending') {
            return 'Pending';
        }
        return 'Not Paid';
    };

    const requirementsByAcademicYearLabel = React.useMemo(() => {
        const map = new Map<string, RequirementRecord[]>();

        requirements.forEach((requirement) => {
            const label = resolveAcademicYearLabel(requirement.academic_year_id, requirement.academic_year_label ?? null);
            const current = map.get(label) ?? [];
            current.push(requirement);
            map.set(label, current);
        });

        return map;
    }, [requirements, resolveAcademicYearLabel]);

    const documentSubmissionsByGroupId = React.useMemo(() => {
        const map = new Map<number, DocumentSubmissionRow[]>();

        documentSubmissions.forEach((submission) => {
            const list = map.get(submission.group_id) ?? [];
            list.push(submission);
            map.set(submission.group_id, list);
        });

        return map;
    }, [documentSubmissions]);

    const buildDownloadUrl = React.useCallback((submissionId: number) => {
        return `/instructor/document-submissions/${submissionId}/download`;
    }, []);

    const documentDetailsByGroup = React.useMemo(() => {
        const map = new Map<number, RequirementDocumentDetail[]>();

        groups.forEach((group) => {
            const academicYearLabel = group.school_year ?? 'All';
            const requirementsForGroup =
                requirementsByAcademicYearLabel.get(academicYearLabel) ?? requirementsByAcademicYearLabel.get('All') ?? [];
            const submissions = documentSubmissionsByGroupId.get(group.id) ?? [];
            const latestByRequirement = new Map<number, DocumentSubmissionRow>();

            submissions.forEach((submission) => {
                const requirementId = submission.document_requirement_id;
                const existing = latestByRequirement.get(requirementId);
                if (!existing) {
                    latestByRequirement.set(requirementId, submission);
                    return;
                }

                const nextDate = submission.submitted_at ?? '';
                const existingDate = existing.submitted_at ?? '';

                if (nextDate > existingDate || (nextDate === existingDate && submission.id > existing.id)) {
                    latestByRequirement.set(requirementId, submission);
                }
            });

            const details = requirementsForGroup.map((requirement) => {
                const submission = latestByRequirement.get(requirement.id);
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
                    status,
                    fileName: submission?.file_name ?? null,
                    submittedAt: submission?.submitted_at ?? null,
                    downloadUrl: submission ? buildDownloadUrl(submission.id) : null,
                } satisfies RequirementDocumentDetail;
            });

            map.set(group.id, details);
        });

        return map;
    }, [buildDownloadUrl, documentSubmissionsByGroupId, groups, requirementsByAcademicYearLabel]);

    const documents = React.useMemo(() => {
        const iconTone: Record<DocumentRow['status'], string> = {
            Approved: 'bg-emerald-50 text-emerald-600',
            'For Review': 'bg-amber-50 text-amber-600',
            Revise: 'bg-amber-50 text-amber-600',
            Missing: 'bg-slate-100 text-slate-400',
        };

        return filteredGroups.map((group) => {
            const details = documentDetailsByGroup.get(group.id) ?? [];
            const requiredCount = details.length;
            const submittedDocs = details.filter((detail) => detail.status !== 'Missing');
            const submittedCount = submittedDocs.length;
            const hasRevision = details.some((detail) => detail.status === 'Revision Required');
            const allApproved = requiredCount > 0 && details.every((detail) => detail.status === 'Approved');

            let status: DocumentRow['status'] = 'Missing';
            if (requiredCount > 0 && hasRevision) {
                status = 'Revise';
            } else if (requiredCount > 0 && submittedCount === 0) {
                status = 'Missing';
            } else if (requiredCount > 0 && allApproved) {
                status = 'Approved';
            } else if (requiredCount > 0 && submittedCount > 0) {
                status = 'For Review';
            }

            const latestSubmittedAt = submittedDocs.reduce((latest, detail) => {
                if (!detail.submittedAt) {
                    return latest;
                }

                if (!latest || detail.submittedAt > latest) {
                    return detail.submittedAt;
                }

                return latest;
            }, '' as string);

            return {
                id: `doc-${group.id}`,
                groupId: group.id,
                name: group.name,
                group: group.program_set_name ?? '—',
                type: group.program ?? '—',
                submittedAt: latestSubmittedAt ? formatDateLabel(latestSubmittedAt) : '—',
                status,
                iconColor: iconTone[status],
            } satisfies DocumentRow;
        });
    }, [documentDetailsByGroup, filteredGroups]);

    const documentsPerPage = 6;
    const totalDocumentPages = Math.max(1, Math.ceil(documents.length / documentsPerPage));
    const documentsPageStart = (documentsPage - 1) * documentsPerPage;
    const pagedDocuments = documents.slice(documentsPageStart, documentsPageStart + documentsPerPage);

    React.useEffect(() => {
        setDocumentsPage(1);
    }, [documents.length, searchTerm, selectedAcademicYear, selectedProgramSet]);

    React.useEffect(() => {
        if (documentsPage > totalDocumentPages) {
            setDocumentsPage(totalDocumentPages);
        }
    }, [documentsPage, totalDocumentPages]);

    const mandatoryRequirementTargets = React.useMemo(() => {
        return requirements.map((requirement) => ({
            academicYearLabel: resolveAcademicYearLabel(requirement.academic_year_id, requirement.academic_year_label ?? null),
        }));
    }, [requirements, resolveAcademicYearLabel]);

    const groupById = React.useMemo(() => {
        return new Map(filteredGroups.map((group) => [group.id, group]));
    }, [filteredGroups]);

    const downloadGroup = downloadGroupId !== null ? groupById.get(downloadGroupId) ?? null : null;
    const downloadDocuments = downloadGroupId !== null ? documentDetailsByGroup.get(downloadGroupId) ?? [] : [];

    const missingRequirementsByGroupId = React.useMemo(() => {
        const map = new Map<number, boolean>();

        if (mandatoryRequirementTargets.length === 0) {
            return map;
        }

        documents.forEach((doc) => {
            if (doc.status === 'Approved') {
                return;
            }

            const group = groupById.get(doc.groupId);
            if (!group) {
                return;
            }

            const hasMandatoryRequirement = mandatoryRequirementTargets.some((requirement) => {
                if (requirement.academicYearLabel === 'All' || requirement.academicYearLabel.trim() === '') {
                    return true;
                }

                return group.school_year === requirement.academicYearLabel;
            });

            if (hasMandatoryRequirement) {
                map.set(doc.groupId, true);
            }
        });

        return map;
    }, [documents, groupById, mandatoryRequirementTargets]);

    const payments = React.useMemo(() => {
        return filteredGroups.map((group) => {
            const schedule = scheduleByGroupId.get(group.id);
            const status = resolvePaymentStatus(schedule?.status ?? null);
            const members = group.members ?? [];
            const initials = members.map((member, index) => ({
                initials: getInitials(member.name),
                color: avatarColors[(index + group.id) % avatarColors.length],
            }));

            return {
                id: `payment-${group.id}`,
                group: group.name,
                members: initials,
                submittedAt: schedule?.created_at ? formatDateLabel(schedule.created_at) : formatDateLabel(group.created_at),
                status,
            } satisfies PaymentRow;
        });
    }, [filteredGroups, scheduleByGroupId]);

    const defenseRows = React.useMemo(() => {
        return filteredGroups.map((group) => {
            const schedule = scheduleByGroupId.get(group.id);
            const missingRequirements = missingRequirementsByGroupId.get(group.id) ?? false;
            const status = missingRequirements ? 'Missing Requirements' : (schedule?.status ?? 'Not Scheduled');

            return {
                id: `defense-${group.id}`,
                group: group.name,
                programSet: group.program_set_name ?? '—',
                scheduleDate: schedule?.scheduled_date ? formatDateLabel(schedule.scheduled_date) : '—',
                scheduleTime: schedule?.start_time && schedule?.end_time ? formatTimeRange(schedule.start_time, schedule.end_time) : '--',
                room: schedule?.room?.name ?? '—',
                status,
            };
        });
    }, [filteredGroups, missingRequirementsByGroupId, scheduleByGroupId]);

    const defensePerPage = 6;
    const totalDefensePages = Math.max(1, Math.ceil(defenseRows.length / defensePerPage));
    const defensePageStart = (defensePage - 1) * defensePerPage;
    const pagedDefenseRows = defenseRows.slice(defensePageStart, defensePageStart + defensePerPage);

    const paymentsPerPage = 6;
    const totalPaymentsPages = Math.max(1, Math.ceil(payments.length / paymentsPerPage));
    const paymentsPageStart = (paymentsPage - 1) * paymentsPerPage;
    const pagedPayments = payments.slice(paymentsPageStart, paymentsPageStart + paymentsPerPage);

    React.useEffect(() => {
        setDefensePage(1);
        setPaymentsPage(1);
    }, [filteredGroups.length, searchTerm, selectedAcademicYear, selectedProgramSet]);

    React.useEffect(() => {
        if (defensePage > totalDefensePages) {
            setDefensePage(totalDefensePages);
        }
    }, [defensePage, totalDefensePages]);

    React.useEffect(() => {
        if (paymentsPage > totalPaymentsPages) {
            setPaymentsPage(totalPaymentsPages);
        }
    }, [paymentsPage, totalPaymentsPages]);

    const documentSummary = React.useMemo(() => {
        const counts = documents.reduce(
            (carry, doc) => {
                carry[doc.status] = (carry[doc.status] ?? 0) + 1;
                return carry;
            },
            {
                Approved: 0,
                'For Review': 0,
                Revise: 0,
                Missing: 0,
            } as Record<DocumentRow['status'], number>,
        );

        return [
            {
                label: 'Approved',
                count: counts.Approved,
                tone: 'border-emerald-100 bg-emerald-50',
                icon: CheckCircle2,
                iconClass: 'text-emerald-500',
                countClass: 'text-emerald-600',
            },
            {
                label: 'For Review',
                count: counts['For Review'],
                tone: 'border-amber-100 bg-amber-50',
                icon: Clock3,
                iconClass: 'text-amber-500',
                countClass: 'text-amber-600',
            },
            {
                label: 'Revise',
                count: counts.Revise,
                tone: 'border-amber-100 bg-amber-50',
                icon: RotateCcw,
                iconClass: 'text-amber-500',
                countClass: 'text-amber-600',
            },
            {
                label: 'Missing',
                count: counts.Missing,
                tone: 'border-slate-200 bg-slate-50',
                icon: XCircle,
                iconClass: 'text-slate-500',
                countClass: 'text-slate-600',
            },
        ];
    }, [documents]);

    const handleAddRequirement = () => {
        setEditingRequirement(null);
        setDeletingRequirement(null);
        setIsModalOpen(true);
    };

    const handleEditRequirement = (record: RequirementRecord) => {
        setDeletingRequirement(null);
        setEditingRequirement(record);
    };

    const handleDeleteRequirement = (record: RequirementRecord) => {
        setEditingRequirement(null);
        setDeletingRequirement(record);
    };

    const handleViewDocuments = (groupId: number) => {
        router.visit(`/instructor/requirements/${groupId}/documents`);
    };

    const handleOpenDownload = (groupId: number) => {
        setDownloadGroupId(groupId);
    };

    const handleCloseDownload = () => {
        setDownloadGroupId(null);
    };

    const handlePrevDeadlinesPage = () => {
        setDeadlinesPage((page) => Math.max(1, page - 1));
    };

    const handleNextDeadlinesPage = () => {
        setDeadlinesPage((page) => Math.min(totalDeadlinePages, page + 1));
    };

    const handlePrevDocumentsPage = () => {
        setDocumentsPage((page) => Math.max(1, page - 1));
    };

    const handleNextDocumentsPage = () => {
        setDocumentsPage((page) => Math.min(totalDocumentPages, page + 1));
    };

    const handlePrevDefensePage = () => {
        setDefensePage((page) => Math.max(1, page - 1));
    };

    const handleNextDefensePage = () => {
        setDefensePage((page) => Math.min(totalDefensePages, page + 1));
    };

    const handlePrevPaymentsPage = () => {
        setPaymentsPage((page) => Math.max(1, page - 1));
    };

    const handleNextPaymentsPage = () => {
        setPaymentsPage((page) => Math.min(totalPaymentsPages, page + 1));
    };

    const tabs = React.useMemo(
        () => [
            {
                id: 'deadlines' as const,
                label: 'Requirements Manager',
                count: String(deadlines.length),
                icon: CalendarClock,
                badge: 'bg-amber-100 text-amber-700',
                iconClass: 'text-amber-600',
            },
            {
                id: 'documents' as const,
                label: 'Groups Documents',
                count: String(documents.length),
                icon: FileText,
                badge: 'bg-slate-100 text-slate-600',
                iconClass: 'text-slate-500',
            },
            {
                id: 'defense' as const,
                label: 'Defense Status',
                count: String(defenseRows.length),
                icon: ShieldCheck,
                badge: 'bg-emerald-100 text-emerald-700',
                iconClass: 'text-emerald-600',
            },
            {
                id: 'payments' as const,
                label: 'Payment Verification',
                count: String(payments.length),
                icon: CreditCard,
                badge: 'bg-emerald-100 text-emerald-700',
                iconClass: 'text-emerald-600',
            },
        ],
        [deadlines.length, documents.length, defenseRows.length, payments.length],
    );

    const overviewCards = [
        {
            label: 'Total Groups',
            value: String(totalGroups),
            icon: Users,
            iconTone: 'bg-emerald-100 text-emerald-600',
            valueTone: 'text-slate-900',
        },
        {
            label: 'Approved',
            value: String(completedCount),
            icon: CheckCircle2,
            iconTone: 'bg-emerald-100 text-emerald-600',
            valueTone: 'text-emerald-600',
        },
        {
            label: 'Pending',
            value: String(pendingCount),
            icon: Clock3,
            iconTone: 'bg-amber-100 text-amber-600',
            valueTone: 'text-amber-600',
        },
        {
            label: 'Re-defense',
            value: String(cancelledCount),
            icon: RotateCcw,
            iconTone: 'bg-slate-100 text-slate-600',
            valueTone: 'text-slate-600',
        },
    ];

    const statusBadge = (status: DeadlineRow['status']) => {
        return status === 'Due Soon' ? 'border-amber-200 bg-amber-100 text-amber-700' : 'border-emerald-200 bg-emerald-100 text-emerald-700';
    };

    const paymentBadge = (status: PaymentRow['status']) => {
        if (status === 'Verified') {
            return 'border-emerald-200 bg-emerald-100 text-emerald-700';
        }
        if (status === 'Pending') {
            return 'border-amber-200 bg-amber-100 text-amber-700';
        }
        return 'border-slate-200 bg-slate-100 text-slate-600';
    };

    const documentBadge = (status: DocumentRow['status']) => {
        if (status === 'Approved') {
            return 'border-emerald-200 bg-emerald-100 text-emerald-700';
        }
        if (status === 'For Review') {
            return 'border-amber-200 bg-amber-100 text-amber-700';
        }
        if (status === 'Revise') {
            return 'border-amber-200 bg-amber-100 text-amber-700';
        }
        return 'border-slate-200 bg-slate-100 text-slate-500';
    };

    const defenseBadge = (status: string) => {
        if (status === 'Missing Requirements') {
            return 'border-rose-200 bg-rose-100 text-rose-700';
        }
        if (status === 'Completed') {
            return 'border-emerald-200 bg-emerald-100 text-emerald-700';
        }
        if (status === 'Scheduled') {
            return 'border-indigo-200 bg-indigo-100 text-indigo-700';
        }
        if (status === 'Pending') {
            return 'border-amber-200 bg-amber-100 text-amber-700';
        }
        if (status === 'Cancelled') {
            return 'border-rose-200 bg-rose-100 text-rose-700';
        }
        return 'border-slate-200 bg-slate-100 text-slate-600';
    };

    const renderFilters = () => (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search group, leader, or program set..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 md:w-60"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <select
                        value={selectedAcademicYear}
                        onChange={(event) => setSelectedAcademicYear(event.target.value)}
                        className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    >
                        {academicYearOptions.map((year) => {
                            const isCurrent = academicYears.find((ay) => ay.label === year)?.is_current;
                            return (
                                <option key={year} value={year}>
                                    {year === 'All' ? 'All Years' : `${year}${isCurrent ? ' (current)' : ''}`}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <ChevronRight size={12} className="rotate-90" />
                    </div>
                    <select
                        value={selectedProgramSet}
                        onChange={(event) => setSelectedProgramSet(event.target.value)}
                        className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="All">All Program Sets</option>
                        {programSetOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedAcademicYear('All');
                        setSelectedProgramSet('All');
                        setSearchTerm('');
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );

    return (
        <InstructorLayout title="Phase 1: Concept" subtitle='Defining core objectives, system architecture, and project scope'>
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Phase 1
                    </span>
                </nav>
                <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                                    isActive
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${tab.iconClass}`} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tab.badge}`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'deadlines' ? (
                    <DeadlinesTab
                        academicYearOptions={academicYearOptions}
                        academicYears={academicYears}
                        requirementsAcademicYear={requirementsAcademicYear}
                        requirementsStatus={requirementsStatus}
                        rows={filteredDeadlines}
                        pagedRows={pagedDeadlines}
                        pageStart={deadlinesPageStart}
                        perPage={deadlinesPerPage}
                        page={deadlinesPage}
                        totalPages={totalDeadlinePages}
                        onAcademicYearChange={setRequirementsAcademicYear}
                        onStatusChange={(value) => setRequirementsStatus(value)}
                        onAddRequirement={handleAddRequirement}
                        onEditRequirement={handleEditRequirement}
                        onDeleteRequirement={handleDeleteRequirement}
                        onPrevPage={handlePrevDeadlinesPage}
                        onNextPage={handleNextDeadlinesPage}
                        formatDateLabel={formatDateLabel}
                        statusBadge={statusBadge}
                    />
                ) : null}

                {activeTab === 'documents' ? (
                    <DocumentsTab
                        documents={documents}
                        pagedDocuments={pagedDocuments}
                        documentsPageStart={documentsPageStart}
                        documentsPerPage={documentsPerPage}
                        documentsPage={documentsPage}
                        totalDocumentPages={totalDocumentPages}
                        filters={renderFilters()}
                        onPrevPage={handlePrevDocumentsPage}
                        onNextPage={handleNextDocumentsPage}
                        onViewDocuments={handleViewDocuments}
                        onOpenDownload={handleOpenDownload}
                        documentBadge={documentBadge}
                    />
                ) : null}


                {activeTab === 'defense' ? (
                    <DefenseTab
                        rows={defenseRows}
                        pagedRows={pagedDefenseRows}
                        pageStart={defensePageStart}
                        perPage={defensePerPage}
                        page={defensePage}
                        totalPages={totalDefensePages}
                        filters={renderFilters()}
                        defenseBadge={defenseBadge}
                        onPrevPage={handlePrevDefensePage}
                        onNextPage={handleNextDefensePage}
                    />
                ) : null}


                {activeTab === 'payments' ? (
                    <PaymentsTab
                        payments={payments}
                        pagedPayments={pagedPayments}
                        pageStart={paymentsPageStart}
                        perPage={paymentsPerPage}
                        page={paymentsPage}
                        totalPages={totalPaymentsPages}
                        filters={renderFilters()}
                        paymentBadge={paymentBadge}
                        onPrevPage={handlePrevPaymentsPage}
                        onNextPage={handleNextPaymentsPage}
                    />
                ) : null}

            </motion.section>
            <DownloadDocumentsModal
                open={downloadGroupId !== null}
                groupName={downloadGroup?.name ?? 'Selected group'}
                documents={downloadDocuments}
                onClose={handleCloseDownload}
            />
            <AddRequirementModal
                open={isModalOpen}
                academicYearOptions={academicYearSelectOptions}
                defaultAcademicYearId={defaultAcademicYearId}
                onClose={() => setIsModalOpen(false)}
            />
            <EditRequirementModal
                open={editingRequirement !== null}
                requirement={editingRequirement}
                academicYearOptions={academicYearSelectOptions}
                onClose={() => setEditingRequirement(null)}
            />
            <DeleteRequirementModal
                open={deletingRequirement !== null}
                requirement={deletingRequirement}
                onClose={() => setDeletingRequirement(null)}
            />
        </InstructorLayout>
    );
};

export default Phase1Page;
