import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CalendarClock, ChevronRight, CreditCard, FileText, Filter, Search, ShieldCheck } from 'lucide-react';
import React from 'react';
import AddRequirementModal from '../../components/Instructor/requirements/AddRequirementModal';
import DeleteRequirementModal from '../../components/Instructor/requirements/DeleteRequirementModal';
import EditRequirementModal from '../../components/Instructor/requirements/EditRequirementModal';
import InstructorLayout from './_layout';
import DeadlinesTab from './phase2/DeadlinesTab';
import DefenseTab from './phase2/DefenseTab';
import DocumentsTab from './phase2/DocumentsTab';
import PaymentsTab from './phase2/PaymentsTab';

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
    concept_verdict?: string | null;
    approved_concept_submission_id?: number | null;
    leader_name?: string | null;
    members?: GroupMember[];
    members_count?: number;
    panelists_count?: number;
    receipt_signed_count?: number;
    receipt_required_count?: number;
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

type RequirementRecord = {
    id: number;
    requirement_type: string;
    due_date: string | null;
    academic_year_id: number | null;
    academic_year_label?: string | null;
};

type Phase2Props = {
    programSets?: ProgramSetOption[];
    groups?: GroupRow[];
    defenseSchedules?: DefenseScheduleRow[];
    requirements?: RequirementRecord[];
    documentSubmissions?: DocumentSubmissionRow[];
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
    groupId: number;
    group: string;
    members: { initials: string; color: string }[];
    submittedAt: string;
    status: 'Verified' | 'Pending' | 'Not Paid';
    statusLabel: string;
    reviewUrl: string;
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

const avatarColors = ['bg-emerald-600', 'bg-emerald-500', 'bg-emerald-700', 'bg-slate-600', 'bg-slate-500', 'bg-emerald-400'];
const isTabKey = (value: string | null): value is TabKey =>
    value === 'deadlines' || value === 'documents' || value === 'defense' || value === 'payments';

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

    const initials = parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    return initials || '—';
};

const resolveSubmissionStatus = (submission: DocumentSubmissionRow): 'Missing' | 'Submitted' | 'Approved' | 'Revision Required' => {
    if (submission.status === 'Approved') {
        return 'Approved';
    }

    if (submission.status === 'Revision Required') {
        return 'Revision Required';
    }

    return 'Submitted';
};

const isPhaseOneApproved = (group: GroupRow): boolean => {
    // Check if they have at least 3 panelists (requirement from user)
    const panelistsCount = Number(group.panelists_count ?? 0);
    if (panelistsCount < 3) {
        return false;
    }

    if (typeof group.approved_concept_submission_id === 'number' && group.approved_concept_submission_id > 0) {
        return true;
    }

    const verdict = (group.concept_verdict ?? '').trim().toLowerCase();
    if (verdict === '') {
        return false;
    }

    const failedVerdicts = ['failed', 'deffered', 'deferred'];
    if (failedVerdicts.some((item) => verdict.includes(item))) {
        return false;
    }

    return verdict.includes('pass') || verdict.includes('approved');
};

const Phase2Page = () => {
    const { props } = usePage<Phase2Props>();
    const programSets = props.programSets ?? [];
    const allGroups = props.groups ?? [];
    const defenseSchedules = props.defenseSchedules ?? [];
    const requirements = props.requirements ?? [];
    const documentSubmissions = props.documentSubmissions ?? [];
    const academicYears = props.academicYears ?? [];

    const groups = React.useMemo(() => allGroups.filter((group) => isPhaseOneApproved(group)), [allGroups]);

    const currentAcademicYearRecord = academicYears.find((year) => year.is_current) ?? academicYears[0];
    const currentAcademicYear = currentAcademicYearRecord?.label ?? 'All';
    const currentAcademicYearId = currentAcademicYearRecord ? String(currentAcademicYearRecord.id) : '';

    const [activeTab, setActiveTab] = React.useState<TabKey>(() => {
        if (typeof window === 'undefined') {
            return 'deadlines';
        }

        const tabFromUrl = new URLSearchParams(window.location.search).get('tab');
        return isTabKey(tabFromUrl) ? tabFromUrl : 'deadlines';
    });
    const [selectedAcademicYear, setSelectedAcademicYear] = React.useState(currentAcademicYear || 'All');
    const [selectedProgramSet, setSelectedProgramSet] = React.useState('All');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [requirementsStatus, setRequirementsStatus] = React.useState<'All' | 'Due Soon' | 'On Track'>('All');
    const [documentsPage, setDocumentsPage] = React.useState(1);
    const [deadlinesPage, setDeadlinesPage] = React.useState(1);
    const [defensePage, setDefensePage] = React.useState(1);
    const [paymentsPage, setPaymentsPage] = React.useState(1);
    const [editingRequirement, setEditingRequirement] = React.useState<RequirementRecord | null>(null);
    const [deletingRequirement, setDeletingRequirement] = React.useState<RequirementRecord | null>(null);
    const [selectedDocumentStatus, setSelectedDocumentStatus] = React.useState('All');
    const [selectedDefenseStatus, setSelectedDefenseStatus] = React.useState('All');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = React.useState('All');

    const academicYearOptions = React.useMemo(() => ['All', ...academicYears.map((year) => year.label)], [academicYears]);

    React.useEffect(() => {
        if (selectedAcademicYear === 'All') {
            return;
        }

        if (!academicYearOptions.includes(selectedAcademicYear)) {
            setSelectedAcademicYear('All');
        }
    }, [academicYearOptions, selectedAcademicYear]);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const url = new URL(window.location.href);
        const currentTab = url.searchParams.get('tab');

        if (activeTab === 'deadlines') {
            if (currentTab === null) {
                return;
            }

            url.searchParams.delete('tab');
        } else {
            if (currentTab === activeTab) {
                return;
            }

            url.searchParams.set('tab', activeTab);
        }

        const query = url.searchParams.toString();
        const nextUrl = `${url.pathname}${query !== '' ? `?${query}` : ''}${url.hash}`;
        window.history.replaceState(window.history.state, '', nextUrl);
    }, [activeTab]);

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

        const filtered = selectedAcademicYear === 'All' ? options : options.filter((option) => option.academicYear === selectedAcademicYear);

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

            const haystack = `${group.name} ${group.program_set_name ?? ''} ${group.leader_name ?? ''} ${group.program ?? ''}`.trim().toLowerCase();

            return haystack.includes(query);
        });
    }, [groups, searchTerm, selectedAcademicYear, selectedProgramSetId]);

    const filteredGroupsWithoutYear = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return groups.filter((group) => {
            if (selectedProgramSetId !== null && group.program_set_id !== selectedProgramSetId) {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = `${group.name} ${group.program_set_name ?? ''} ${group.leader_name ?? ''} ${group.program ?? ''}`.trim().toLowerCase();

            return haystack.includes(query);
        });
    }, [groups, searchTerm, selectedProgramSetId]);

    const outlineSchedules = React.useMemo(
        () => defenseSchedules.filter((schedule) => (schedule.stage ?? '').toLowerCase() === 'outline'),
        [defenseSchedules],
    );

    const scheduleByGroupId = React.useMemo(() => {
        const map = new Map<number, DefenseScheduleRow>();

        outlineSchedules.forEach((schedule) => {
            if (schedule.group_id) {
                map.set(schedule.group_id, schedule);
            }
        });

        return map;
    }, [outlineSchedules]);

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

        if (requirementsStatus !== 'All') {
            filtered = filtered.filter((row) => row.status === requirementsStatus);
        }

        return filtered;
    }, [deadlines, requirementsStatus]);

    const deadlinesPerPage = 6;
    const totalDeadlinePages = Math.max(1, Math.ceil(filteredDeadlines.length / deadlinesPerPage));
    const deadlinesPageStart = (deadlinesPage - 1) * deadlinesPerPage;
    const pagedDeadlines = filteredDeadlines.slice(deadlinesPageStart, deadlinesPageStart + deadlinesPerPage);

    React.useEffect(() => {
        setDeadlinesPage(1);
    }, [filteredDeadlines.length, requirementsStatus]);

    React.useEffect(() => {
        if (deadlinesPage > totalDeadlinePages) {
            setDeadlinesPage(totalDeadlinePages);
        }
    }, [deadlinesPage, totalDeadlinePages]);

    const latestRequirementSubmissionsByGroupId = React.useMemo(() => {
        const groupedSubmissions = new Map<number, Map<number, DocumentSubmissionRow>>();

        documentSubmissions.forEach((submission) => {
            const submissionsByRequirement = groupedSubmissions.get(submission.group_id) ?? new Map<number, DocumentSubmissionRow>();
            const existingSubmission = submissionsByRequirement.get(submission.document_requirement_id);

            if (!existingSubmission) {
                submissionsByRequirement.set(submission.document_requirement_id, submission);
                groupedSubmissions.set(submission.group_id, submissionsByRequirement);
                return;
            }

            const submittedAt = submission.submitted_at ?? '';
            const existingSubmittedAt = existingSubmission.submitted_at ?? '';

            if (submittedAt > existingSubmittedAt || (submittedAt === existingSubmittedAt && submission.id > existingSubmission.id)) {
                submissionsByRequirement.set(submission.document_requirement_id, submission);
            }

            groupedSubmissions.set(submission.group_id, submissionsByRequirement);
        });

        return new Map(
            Array.from(groupedSubmissions.entries()).map(([groupId, submissionsByRequirement]) => [groupId, Array.from(submissionsByRequirement.values())]),
        );
    }, [documentSubmissions]);

    const documents = React.useMemo(() => {
        const iconTone: Record<DocumentRow['status'], string> = {
            Approved: 'bg-emerald-50 text-emerald-600',
            'For Review': 'bg-emerald-50 text-emerald-500',
            Revise: 'bg-emerald-50 text-emerald-500',
            Missing: 'bg-slate-100 text-slate-400',
        };

        return filteredGroupsWithoutYear.map((group) => {
            const submissions = latestRequirementSubmissionsByGroupId.get(group.id) ?? [];
            const normalizedStatuses = submissions.map((submission) => resolveSubmissionStatus(submission));

            const hasSubmissions = normalizedStatuses.length > 0;
            const hasRevision = normalizedStatuses.some((status) => status === 'Revision Required');
            const allApproved = hasSubmissions && normalizedStatuses.every((status) => status === 'Approved');

            let status: DocumentRow['status'] = 'Missing';
            if (!hasSubmissions) {
                status = 'Missing';
            } else if (hasRevision) {
                status = 'Revise';
            } else if (allApproved) {
                status = 'Approved';
            } else {
                status = 'For Review';
            }

            const latestSubmittedAt = submissions.reduce((latest, submission) => {
                const submittedAt = submission.submitted_at ?? '';
                if (submittedAt === '') {
                    return latest;
                }

                if (!latest || submittedAt > latest) {
                    return submittedAt;
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
    }, [filteredGroupsWithoutYear, latestRequirementSubmissionsByGroupId]);

    const filteredDocuments = React.useMemo(() => {
        if (selectedDocumentStatus === 'All') {
            return documents;
        }

        return documents.filter((doc) => doc.status === selectedDocumentStatus);
    }, [documents, selectedDocumentStatus]);

    const documentsPerPage = 6;
    const totalDocumentPages = Math.max(1, Math.ceil(filteredDocuments.length / documentsPerPage));
    const documentsPageStart = (documentsPage - 1) * documentsPerPage;
    const pagedDocuments = filteredDocuments.slice(documentsPageStart, documentsPageStart + documentsPerPage);

    React.useEffect(() => {
        setDocumentsPage(1);
    }, [filteredDocuments.length, searchTerm, selectedProgramSet]);

    React.useEffect(() => {
        if (documentsPage > totalDocumentPages) {
            setDocumentsPage(totalDocumentPages);
        }
    }, [documentsPage, totalDocumentPages]);

    const payments = React.useMemo(() => {
        return filteredGroupsWithoutYear.map((group) => {
            const schedule = scheduleByGroupId.get(group.id);
            const members = group.members ?? [];
            const initials = members.map((member, index) => ({
                initials: getInitials(member.name),
                color: avatarColors[(index + group.id) % avatarColors.length],
            }));
            const receiptSignedCount = Number(group.receipt_signed_count ?? 0);
            const receiptRequiredCount = Number(group.receipt_required_count ?? 0);
            let status: PaymentRow['status'] = 'Not Paid';
            let statusLabel = 'No Faculty Assigned';

            if (receiptRequiredCount > 0 && receiptSignedCount <= 0) {
                status = 'Pending';
                statusLabel = `Unsigned (${receiptSignedCount}/${receiptRequiredCount})`;
            } else if (receiptRequiredCount > 0 && receiptSignedCount < receiptRequiredCount) {
                status = 'Pending';
                statusLabel = `Partially Signed (${receiptSignedCount}/${receiptRequiredCount})`;
            } else if (receiptRequiredCount > 0) {
                status = 'Verified';
                statusLabel = `Fully Signed (${receiptSignedCount}/${receiptRequiredCount})`;
            }

            return {
                id: `payment-${group.id}`,
                groupId: group.id,
                group: group.name,
                members: initials,
                submittedAt: schedule?.created_at ? formatDateLabel(schedule.created_at) : formatDateLabel(group.created_at),
                status,
                statusLabel,
                reviewUrl: `/instructor/requirements/documents/acknowledgement?group=${group.id}&stage=Outline`,
            } satisfies PaymentRow;
        });
    }, [filteredGroupsWithoutYear, scheduleByGroupId]);

    const filteredPayments = React.useMemo(() => {
        if (selectedPaymentStatus === 'All') {
            return payments;
        }

        return payments.filter((payment) => payment.status === selectedPaymentStatus);
    }, [payments, selectedPaymentStatus]);

    const defenseRows = React.useMemo(() => {
        return filteredGroupsWithoutYear.map((group) => {
            const schedule = scheduleByGroupId.get(group.id);
            const panelistsCount = Number(group.panelists_count ?? 0);
            const status = panelistsCount > 0 ? `Available (${panelistsCount} Panelist${panelistsCount === 1 ? '' : 's'})` : 'No Panelists Assigned';

            return {
                id: `defense-${group.id}`,
                groupId: group.id,
                group: group.name,
                programSet: group.program_set_name ?? '—',
                scheduleDate: schedule?.scheduled_date ? formatDateLabel(schedule.scheduled_date) : '—',
                scheduleTime: schedule?.start_time && schedule?.end_time ? formatTimeRange(schedule.start_time, schedule.end_time) : '--',
                room: schedule?.room?.name ?? '—',
                status,
                canReview: panelistsCount > 0,
                reviewUrl: `/instructor/requirements/documents/evaluation?group=${group.id}&stage=Outline`,
            };
        });
    }, [filteredGroupsWithoutYear, scheduleByGroupId]);

    const filteredDefenseRows = React.useMemo(() => {
        if (selectedDefenseStatus === 'All') {
            return defenseRows;
        }

        return defenseRows.filter((row) => {
            if (selectedDefenseStatus === 'Available') {
                return row.status.startsWith('Available');
            }
            return row.status === selectedDefenseStatus;
        });
    }, [defenseRows, selectedDefenseStatus]);

    const defensePerPage = 6;
    const totalDefensePages = Math.max(1, Math.ceil(filteredDefenseRows.length / defensePerPage));
    const defensePageStart = (defensePage - 1) * defensePerPage;
    const pagedDefenseRows = filteredDefenseRows.slice(defensePageStart, defensePageStart + defensePerPage);

    const paymentsPerPage = 6;
    const totalPaymentsPages = Math.max(1, Math.ceil(filteredPayments.length / paymentsPerPage));
    const paymentsPageStart = (paymentsPage - 1) * paymentsPerPage;
    const pagedPayments = filteredPayments.slice(paymentsPageStart, paymentsPageStart + paymentsPerPage);

    React.useEffect(() => {
        setDefensePage(1);
        setPaymentsPage(1);
    }, [filteredGroupsWithoutYear.length, searchTerm, selectedProgramSet, selectedDefenseStatus, selectedPaymentStatus]);

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
        router.visit(`/instructor/requirements/documents?group=${groupId}&stage=Outline`);
    };

    const tabs = React.useMemo(
        () => [
            {
                id: 'deadlines' as const,
                label: 'Outline Requirements',
                count: String(deadlines.length),
                icon: CalendarClock,
                badge: 'bg-emerald-100 text-emerald-700',
                iconClass: 'text-emerald-600',
            },
            {
                id: 'documents' as const,
                label: 'Outline Submissions',
                count: String(documents.length),
                icon: FileText,
                badge: 'bg-slate-100 text-slate-600',
                iconClass: 'text-slate-500',
            },
            {
                id: 'defense' as const,
                label: 'Outline Review Status',
                count: String(defenseRows.length),
                icon: ShieldCheck,
                badge: 'bg-emerald-100 text-emerald-700',
                iconClass: 'text-emerald-600',
            },
            {
                id: 'payments' as const,
                label: 'Outline Payment',
                count: String(payments.length),
                icon: CreditCard,
                badge: 'bg-emerald-100 text-emerald-700',
                iconClass: 'text-emerald-600',
            },
        ],
        [deadlines.length, documents.length, defenseRows.length, payments.length],
    );

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
        if (status.startsWith('Available')) {
            return 'border-emerald-200 bg-emerald-100 text-emerald-700';
        }

        if (status === 'No Panelists Assigned') {
            return 'border-slate-200 bg-slate-100 text-slate-600';
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
                        placeholder="Search approved group, leader, or program set..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm transition-all outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 md:w-60"
                    />
                </div>
                {activeTab === 'deadlines' ? (
                    <div className="relative">
                        <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedAcademicYear}
                            onChange={(event) => setSelectedAcademicYear(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                ) : null}
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <ChevronRight size={12} className="rotate-90" />
                    </div>
                    <select
                        value={selectedProgramSet}
                        onChange={(event) => setSelectedProgramSet(event.target.value)}
                        className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-4 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="All">All Program Sets</option>
                        {programSetOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                {activeTab === 'documents' ? (
                    <div className="relative">
                        <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedDocumentStatus}
                            onChange={(event) => setSelectedDocumentStatus(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="All">All Status</option>
                            <option value="Approved">Approved</option>
                            <option value="For Review">For Review</option>
                            <option value="Revise">Revise</option>
                            <option value="Missing">Missing</option>
                        </select>
                    </div>
                ) : null}
                {activeTab === 'defense' ? (
                    <div className="relative">
                        <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedDefenseStatus}
                            onChange={(event) => setSelectedDefenseStatus(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="All">All Status</option>
                            <option value="Available">Available</option>
                            <option value="No Panelists Assigned">No Panelists Assigned</option>
                        </select>
                    </div>
                ) : null}
                {activeTab === 'payments' ? (
                    <div className="relative">
                        <Filter className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <select
                            value={selectedPaymentStatus}
                            onChange={(event) => setSelectedPaymentStatus(event.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="All">All Status</option>
                            <option value="Verified">Verified</option>
                            <option value="Pending">Pending</option>
                            <option value="Not Paid">Not Paid</option>
                        </select>
                    </div>
                ) : null}
                <button
                    type="button"
                    onClick={() => {
                        setSelectedAcademicYear('All');
                        setSelectedProgramSet('All');
                        setSearchTerm('');
                        setSelectedDocumentStatus('All');
                        setSelectedDefenseStatus('All');
                        setSelectedPaymentStatus('All');
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );

    return (
        <InstructorLayout title="Phase 2: Outline" subtitle="Managing project outline requirements and review flow for approved titles">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Phase 2
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
                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tab.badge}`}>{tab.count}</span>
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'deadlines' ? (
                    <DeadlinesTab
                        requirementsStatus={requirementsStatus}
                        rows={filteredDeadlines}
                        pagedRows={pagedDeadlines}
                        pageStart={deadlinesPageStart}
                        perPage={deadlinesPerPage}
                        page={deadlinesPage}
                        totalPages={totalDeadlinePages}
                        onStatusChange={(value) => setRequirementsStatus(value)}
                        onAddRequirement={handleAddRequirement}
                        onEditRequirement={handleEditRequirement}
                        onDeleteRequirement={handleDeleteRequirement}
                        onPrevPage={() => setDeadlinesPage((page) => Math.max(1, page - 1))}
                        onNextPage={() => setDeadlinesPage((page) => Math.min(totalDeadlinePages, page + 1))}
                        formatDateLabel={formatDateLabel}
                        statusBadge={statusBadge}
                        headingTitle="Outline Requirements Manager"
                        headingDescription="Manage submission requirements for groups that passed Phase 1 title approval"
                    />
                ) : null}

                {activeTab === 'documents' ? (
                    <DocumentsTab
                        documents={filteredDocuments}
                        pagedDocuments={pagedDocuments}
                        documentsPageStart={documentsPageStart}
                        documentsPerPage={documentsPerPage}
                        documentsPage={documentsPage}
                        totalDocumentPages={totalDocumentPages}
                        filters={renderFilters()}
                        onPrevPage={() => setDocumentsPage((page) => Math.max(1, page - 1))}
                        onNextPage={() => setDocumentsPage((page) => Math.min(totalDocumentPages, page + 1))}
                        onReviewDocuments={handleViewDocuments}
                        documentBadge={documentBadge}
                    />
                ) : null}

                {activeTab === 'defense' ? (
                    <DefenseTab
                        rows={filteredDefenseRows}
                        pagedRows={pagedDefenseRows}
                        pageStart={defensePageStart}
                        perPage={defensePerPage}
                        page={defensePage}
                        totalPages={totalDefensePages}
                        filters={renderFilters()}
                        defenseBadge={defenseBadge}
                        onPrevPage={() => setDefensePage((page) => Math.max(1, page - 1))}
                        onNextPage={() => setDefensePage((page) => Math.min(totalDefensePages, page + 1))}
                        headingTitle="Outline Review Status"
                        headingDescription="Monitor outline defense schedules and review evaluation sheets by group"
                    />
                ) : null}

                {activeTab === 'payments' ? (
                    <PaymentsTab
                        payments={filteredPayments}
                        pagedPayments={pagedPayments}
                        pageStart={paymentsPageStart}
                        perPage={paymentsPerPage}
                        page={paymentsPage}
                        totalPages={totalPaymentsPages}
                        filters={renderFilters()}
                        paymentBadge={paymentBadge}
                        onPrevPage={() => setPaymentsPage((page) => Math.max(1, page - 1))}
                        onNextPage={() => setPaymentsPage((page) => Math.min(totalPaymentsPages, page + 1))}
                    />
                ) : null}
            </motion.section>

            <AddRequirementModal
                open={isModalOpen}
                academicYearOptions={academicYearSelectOptions}
                defaultAcademicYearId={defaultAcademicYearId}
                stage="Outline"
                onClose={() => setIsModalOpen(false)}
            />
            <EditRequirementModal
                open={editingRequirement !== null}
                requirement={editingRequirement}
                academicYearOptions={academicYearSelectOptions}
                stage="Outline"
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

export default Phase2Page;
