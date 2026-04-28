import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronRight,
    ChevronsLeft,
    FileText,
    GraduationCap,
    ListTree,
    PanelRightOpen,
    RotateCcw,
    Search,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RecommendationModal, { type RecommendationDocument } from '@/components/Adviser/RecommendationModal';
import adviserRoutes from '../../routes/adviser';
import manuscriptSubmissionRoutes from '../../routes/adviser/manuscripts/submissions';
import AdviserLayout from './_layout';

type SubmissionStatus = 'Submitted' | 'Approved' | 'Revision Required';

type Manuscript = {
    id: number;
    title: string;
    requirement_type: string;
    stage: string;
    adviser_status: SubmissionStatus;
    submitted_at?: string | null;
    adviser_reviewed_at?: string | null;
    file_size_label?: string | null;
    file_url?: string | null;
};

type GroupManuscriptBundle = {
    group_id: number;
    group_name: string;
    leader_name?: string | null;
    program_set_id?: number | null;
    program_set_name?: string | null;
    school_year?: string | null;
    updated_at?: string | null;
    project_title?: string | null;
    member_names?: string[];
    has_recommendation_requirement?: boolean;
    recommendation_requirement_id?: number | null;
    recommendation_requirement_type?: string | null;
    recommendation_document?: RecommendationDocument | null;
    manuscripts: Manuscript[];
};

type AdviserManuscriptsPageProps = {
    groups?: GroupManuscriptBundle[];
    hasESignature?: boolean;
};

type ReviewNotification = {
    tone: 'success' | 'warning' | 'error';
    title: string;
    message: string;
};

type GroupStageBundle = GroupManuscriptBundle & {
    stage: string;
};

const AdviserManuscripts = () => {
    const { props } = usePage<AdviserManuscriptsPageProps>();
    const [query, setQuery] = useState('');
    const [selectedProgramSet, setSelectedProgramSet] = useState('All');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('All');
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const [selectedManuscriptId, setSelectedManuscriptId] = useState<number | null>(null);
    const [isSubmissionsPaneCollapsed, setIsSubmissionsPaneCollapsed] = useState(false);
    const [bundles, setBundles] = useState<GroupManuscriptBundle[]>(() => props.groups ?? []);
    const [processingManuscriptId, setProcessingManuscriptId] = useState<number | null>(null);
    const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
    const [isRecommendationGenerating, setIsRecommendationGenerating] = useState(false);
    const [notification, setNotification] = useState<ReviewNotification | null>(null);
    const hasESignature = props.hasESignature ?? false;

    const dismissNotification = useCallback(() => {
        setNotification(null);
    }, []);

    useEffect(() => {
        setBundles(props.groups ?? []);
    }, [props.groups]);

    const transformedBundles = useMemo(() => {
        const result: GroupStageBundle[] = [];

        bundles.forEach((bundle) => {
            const manuscriptsByStage = new Map<string, Manuscript[]>();

            bundle.manuscripts.forEach((manuscript) => {
                const stage = manuscript.stage;
                if (!manuscriptsByStage.has(stage)) {
                    manuscriptsByStage.set(stage, []);
                }
                manuscriptsByStage.get(stage)?.push(manuscript);
            });

            manuscriptsByStage.forEach((manuscripts, stage) => {
                result.push({
                    ...bundle,
                    stage,
                    manuscripts,
                    updated_at: manuscripts[0]?.submitted_at ?? bundle.updated_at,
                });
            });
        });

        // Sort by updated_at descending
        return result.sort((a, b) => {
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return dateB - dateA;
        });
    }, [bundles]);

    useEffect(() => {
        if (!notification) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            dismissNotification();
        }, 4500);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [dismissNotification, notification]);

    const programSetOptions = useMemo(() => {
        const options = new Map<string, { value: string; label: string }>();

        bundles.forEach((bundle) => {
            if (!bundle.program_set_id) {
                return;
            }

            const label = bundle.program_set_name ?? 'Program set';
            options.set(String(bundle.program_set_id), { value: String(bundle.program_set_id), label });
        });

        return Array.from(options.values()).sort((first, second) => first.label.localeCompare(second.label));
    }, [bundles]);

    const academicYearOptions = useMemo(() => {
        const options = new Set<string>();

        bundles.forEach((bundle) => {
            if (bundle.school_year) {
                options.add(bundle.school_year);
            }
        });

        return Array.from(options.values()).sort((first, second) => first.localeCompare(second));
    }, [bundles]);

    useEffect(() => {
        if (selectedProgramSet === 'All') {
            return;
        }

        const stillAvailable = programSetOptions.some((option) => option.value === selectedProgramSet);
        if (!stillAvailable) {
            setSelectedProgramSet('All');
        }
    }, [programSetOptions, selectedProgramSet]);

    useEffect(() => {
        if (selectedAcademicYear === 'All') {
            return;
        }

        const stillAvailable = academicYearOptions.includes(selectedAcademicYear);
        if (!stillAvailable) {
            setSelectedAcademicYear('All');
        }
    }, [academicYearOptions, selectedAcademicYear]);

    const filteredBundles = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return transformedBundles.filter((bundle) => {
            const matchesProgramSet = selectedProgramSet === 'All' || String(bundle.program_set_id) === selectedProgramSet;
            if (!matchesProgramSet) {
                return false;
            }

            const matchesAcademicYear = selectedAcademicYear === 'All' || bundle.school_year === selectedAcademicYear;
            if (!matchesAcademicYear) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            const matchesGroup = bundle.group_name.toLowerCase().includes(normalizedQuery);
            const matchesStage = bundle.stage.toLowerCase().includes(normalizedQuery);
            const matchesManuscript = bundle.manuscripts.some(
                (manuscript) =>
                    manuscript.title.toLowerCase().includes(normalizedQuery) ||
                    manuscript.requirement_type.toLowerCase().includes(normalizedQuery),
            );

            return matchesGroup || matchesManuscript || matchesStage;
        });
    }, [transformedBundles, query, selectedProgramSet, selectedAcademicYear]);

    const selectedGroup = useMemo(
        () => filteredBundles.find((bundle) => bundle.group_id === selectedGroupId && bundle.stage === selectedStage) ?? null,
        [filteredBundles, selectedGroupId, selectedStage],
    );
    const selectedManuscript = useMemo(
        () => selectedGroup?.manuscripts.find((manuscript) => manuscript.id === selectedManuscriptId) ?? null,
        [selectedGroup, selectedManuscriptId],
    );
    const isOutlineStageSelected = selectedGroup?.stage.toLowerCase() === 'outline';
    const projectTitleForRecommendation = useMemo(() => {
        const projectTitle = selectedGroup?.project_title?.trim();
        if (projectTitle) {
            return projectTitle;
        }

        const manuscriptTitle = selectedManuscript?.title.trim() ?? selectedGroup?.manuscripts[0]?.title.trim() ?? '';

        return manuscriptTitle !== '' ? manuscriptTitle : null;
    }, [selectedGroup, selectedManuscript]);
    const recommendationTitles = useMemo(() => {
        if (!projectTitleForRecommendation) {
            return [] as string[];
        }

        return [projectTitleForRecommendation];
    }, [projectTitleForRecommendation]);
    const areAllOutlineManuscriptsApproved = useMemo(() => {
        if (!selectedGroup || !isOutlineStageSelected || selectedGroup.manuscripts.length === 0) {
            return false;
        }

        return selectedGroup.manuscripts.every((manuscript) => manuscript.adviser_status === 'Approved');
    }, [isOutlineStageSelected, selectedGroup]);
    const hasRecommendationRequirement = selectedGroup?.has_recommendation_requirement === true;
    const canGenerateRecommendation = Boolean(
        selectedGroup &&
            isOutlineStageSelected &&
            hasRecommendationRequirement &&
            projectTitleForRecommendation &&
            areAllOutlineManuscriptsApproved,
    );
    const recommendationDisabledReason = useMemo(() => {
        if (!selectedGroup) {
            return 'Select an outline submission first.';
        }

        if (!isOutlineStageSelected) {
            return 'Recommendation for Outline Defense is only available for Outline stage submissions.';
        }

        if (!hasRecommendationRequirement) {
            return 'No outline recommendation document requirement is configured for this group in Requirements Manager.';
        }

        if (!projectTitleForRecommendation) {
            return 'No approved project title is linked to this group yet.';
        }

        if (selectedGroup.manuscripts.length === 0) {
            return 'No outline manuscript submissions are available for recommendation.';
        }

        if (!areAllOutlineManuscriptsApproved) {
            return 'All outline manuscript rows must be approved in Adviser Approval Status before generating recommendation.';
        }

        return null;
    }, [
        areAllOutlineManuscriptsApproved,
        hasRecommendationRequirement,
        isOutlineStageSelected,
        projectTitleForRecommendation,
        selectedGroup,
    ]);

    useEffect(() => {
        if (selectedGroupId === null || selectedStage === null) {
            return;
        }

        const stillAvailable = filteredBundles.some((bundle) => bundle.group_id === selectedGroupId && bundle.stage === selectedStage);
        if (!stillAvailable) {
            setSelectedGroupId(null);
            setSelectedStage(null);
            setSelectedManuscriptId(null);
        }
    }, [filteredBundles, selectedGroupId, selectedStage]);

    useEffect(() => {
        if (selectedManuscriptId === null || !selectedGroup) {
            return;
        }

        const stillAvailable = selectedGroup.manuscripts.some((manuscript) => manuscript.id === selectedManuscriptId);
        if (!stillAvailable) {
            setSelectedManuscriptId(selectedGroup.manuscripts[0]?.id ?? null);
        }
    }, [selectedGroup, selectedManuscriptId]);

    useEffect(() => {
        if (!selectedGroup || !isOutlineStageSelected) {
            setIsRecommendationModalOpen(false);
        }
    }, [isOutlineStageSelected, selectedGroup]);

    const stageBadgeClass = (stage: string): string => {
        const normalized = stage.toLowerCase();
        if (normalized === 'outline') {
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        }
        if (normalized === 'pre-deployment') {
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        }
        if (normalized === 'deployment') {
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        }
        if (normalized === 'final' || normalized === 'finals') {
            return 'border-emerald-200 bg-emerald-600 text-white';
        }
        return 'border-slate-200 bg-slate-50 text-slate-600';
    };

    const formatStage = (stage: string): string => {
        if (stage.toLowerCase() === 'final') {
            return 'Finals';
        }
        return stage;
    };

    const adviserStatusPillClass = (status: SubmissionStatus): string => {
        if (status === 'Approved') {
            return 'border-emerald-200 bg-emerald-100 text-emerald-700';
        }

        if (status === 'Revision Required') {
            return 'border-amber-200 bg-amber-100 text-amber-700';
        }

        return 'border-slate-200 bg-slate-100 text-slate-600';
    };

    const updateAdviserStatus = (manuscriptId: number, adviserStatus: Extract<SubmissionStatus, 'Approved' | 'Revision Required'>): Promise<boolean> => {
        if (processingManuscriptId !== null) {
            return Promise.resolve(false);
        }

        setProcessingManuscriptId(manuscriptId);
        setNotification(null);

        return new Promise((resolve) => {
            router.patch(
                manuscriptSubmissionRoutes.status.url({ submission: manuscriptId }),
                { adviser_status: adviserStatus },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setBundles((currentBundles) =>
                            currentBundles.map((bundle) => ({
                                ...bundle,
                                manuscripts: bundle.manuscripts.map((manuscript) =>
                                    manuscript.id === manuscriptId
                                        ? {
                                              ...manuscript,
                                              adviser_status: adviserStatus,
                                              adviser_reviewed_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
                                          }
                                        : manuscript,
                                ),
                            })),
                        );
                        resolve(true);
                    },
                    onError: () => resolve(false),
                    onCancel: () => resolve(false),
                    onFinish: () => {
                        setProcessingManuscriptId(null);
                    },
                },
            );
        });
    };

    const handleApprove = async (manuscriptId: number): Promise<void> => {
        const isSuccessful = await updateAdviserStatus(manuscriptId, 'Approved');
        if (!isSuccessful) {
            setNotification({
                tone: 'error',
                title: 'Unable to Approve Manuscript',
                message: 'Please try again in a moment.',
            });
            return;
        }

        setNotification({
            tone: 'success',
            title: 'Manuscript Approved',
            message: 'The selected manuscript is now marked as approved.',
        });
    };

    const handleRequestRevision = async (manuscriptId: number): Promise<void> => {
        const isSuccessful = await updateAdviserStatus(manuscriptId, 'Revision Required');
        if (!isSuccessful) {
            setNotification({
                tone: 'error',
                title: 'Unable to Request Revision',
                message: 'Please try again in a moment.',
            });
            return;
        }

        setNotification({
            tone: 'warning',
            title: 'Revision Requested',
            message: 'The selected manuscript is now marked for revision.',
        });
    };

    const handleGenerateRecommendation = async (): Promise<void> => {
        if (!selectedGroup) {
            return;
        }

        if (!canGenerateRecommendation) {
            setNotification({
                tone: 'warning',
                title: 'Recommendation Unavailable',
                message: recommendationDisabledReason ?? 'Complete all prerequisite approvals before generating recommendation.',
            });
            return;
        }

        if (!hasESignature) {
            setNotification({
                tone: 'warning',
                title: 'E-Signature Required',
                message: 'Register your e-signature in Adviser Settings before generating recommendation.',
            });
            return;
        }

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!csrfToken) {
            setNotification({
                tone: 'error',
                title: 'Security Token Missing',
                message: 'Unable to validate request. Refresh the page and try again.',
            });
            return;
        }

        setIsRecommendationGenerating(true);
        setNotification(null);

        try {
            const response = await fetch(`/adviser/manuscripts/groups/${selectedGroup.group_id}/recommendation-outline-defense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({}),
            });

            const payload = (await response.json().catch(() => null)) as {
                message?: string;
                recommendation?: RecommendationDocument;
            } | null;

            if (!response.ok) {
                setNotification({
                    tone: 'error',
                    title: 'Recommendation Generation Failed',
                    message: payload?.message ?? 'Unable to generate outline recommendation letter.',
                });
                return;
            }

            const recommendation = payload?.recommendation ?? null;

            setBundles((currentBundles) =>
                currentBundles.map((bundle) => {
                    if (bundle.group_id !== selectedGroup.group_id) {
                        return bundle;
                    }

                    return {
                        ...bundle,
                        recommendation_document: recommendation,
                    };
                }),
            );

            setNotification({
                tone: 'success',
                title: 'Recommendation Generated',
                message: payload?.message ?? 'Signed outline recommendation letter generated successfully.',
            });
        } catch {
            setNotification({
                tone: 'error',
                title: 'Recommendation Generation Failed',
                message: 'An unexpected error occurred while generating the outline recommendation letter.',
            });
        } finally {
            setIsRecommendationGenerating(false);
        }
    };

    return (
        <AdviserLayout title="Manuscripts" subtitle="Review Phase 2 outline manuscripts from your groups">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href={adviserRoutes.dashboard.url()} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Manuscripts
                    </span>
                </nav>

                <AnimatePresence initial={false}>
                    {notification ? (
                        <motion.div
                            initial={{ opacity: 0, y: -16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4 sm:justify-end sm:px-6"
                        >
                            <div
                                role="alert"
                                className={`pointer-events-auto w-full max-w-[30rem] overflow-hidden rounded-2xl border px-4 py-3 shadow-xl ring-1 ring-black/5 sm:w-fit sm:min-w-[22rem] ${
                                    notification.tone === 'error'
                                        ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50'
                                        : notification.tone === 'warning'
                                          ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
                                          : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                                            notification.tone === 'error'
                                                ? 'bg-rose-100 text-rose-600'
                                                : notification.tone === 'warning'
                                                  ? 'bg-amber-100 text-amber-600'
                                                  : 'bg-emerald-100 text-emerald-600'
                                        }`}
                                    >
                                        {notification.tone === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`text-xs font-bold ${
                                                notification.tone === 'error'
                                                    ? 'text-rose-700'
                                                    : notification.tone === 'warning'
                                                      ? 'text-amber-700'
                                                      : 'text-emerald-700'
                                            }`}
                                        >
                                            {notification.title}
                                        </p>
                                        <p
                                            className={`mt-1 text-xs font-medium ${
                                                notification.tone === 'error'
                                                    ? 'text-rose-700/90'
                                                    : notification.tone === 'warning'
                                                      ? 'text-amber-700/90'
                                                      : 'text-emerald-700/90'
                                            }`}
                                        >
                                            {notification.message}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={dismissNotification}
                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                            notification.tone === 'error'
                                                ? 'border-rose-200 text-rose-500 hover:bg-rose-100'
                                                : notification.tone === 'warning'
                                                  ? 'border-amber-200 text-amber-500 hover:bg-amber-100'
                                                  : 'border-emerald-200 text-emerald-500 hover:bg-emerald-100'
                                        }`}
                                        aria-label="Dismiss notification"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div
                                    className={`mt-3 h-1 w-full overflow-hidden rounded-full ${
                                        notification.tone === 'error'
                                            ? 'bg-rose-100'
                                            : notification.tone === 'warning'
                                              ? 'bg-amber-100'
                                              : 'bg-emerald-100'
                                    }`}
                                >
                                    <motion.div
                                        key={`${notification.tone}-${notification.message}`}
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: 4.5, ease: 'linear' }}
                                        className={`h-full ${
                                            notification.tone === 'error'
                                                ? 'bg-rose-400'
                                                : notification.tone === 'warning'
                                                  ? 'bg-amber-500'
                                                  : 'bg-emerald-500'
                                        }`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <div className={`grid grid-cols-1 gap-5 ${isSubmissionsPaneCollapsed ? 'xl:grid-cols-[88px_minmax(0,1fr)]' : 'xl:grid-cols-3'}`}>
                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ListTree size={16} className="text-emerald-700" />
                                <div className={isSubmissionsPaneCollapsed ? 'hidden' : ''}>
                                    <div className="text-sm font-semibold text-slate-900">Group Manuscripts</div>
                                    <div className="text-xs text-slate-500">Select a group to review.</div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsSubmissionsPaneCollapsed((current) => !current)}
                                className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label={isSubmissionsPaneCollapsed ? 'Expand submissions pane' : 'Collapse submissions pane'}
                            >
                                {isSubmissionsPaneCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                            </button>
                        </div>

                        {isSubmissionsPaneCollapsed ? null : (
                            <div className="mt-4 space-y-2">
                                <div className="relative">
                                    <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search group or manuscript..."
                                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-8 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div className="relative">
                                        <GraduationCap className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={selectedProgramSet}
                                            onChange={(event) => setSelectedProgramSet(event.target.value)}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="All">All Program Sets</option>
                                            {programSetOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={selectedAcademicYear}
                                            onChange={(event) => setSelectedAcademicYear(event.target.value)}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="All">All A.Y.</option>
                                            {academicYearOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 space-y-2">
                            {filteredBundles.map((bundle) => {
                                const isActive = bundle.group_id === selectedGroupId && bundle.stage === selectedStage;
                                const firstLetter = bundle.group_name.trim().charAt(0).toUpperCase() || '?';

                                return (
                                    <button
                                        key={`${bundle.group_id}-${bundle.stage}`}
                                        type="button"
                                        onClick={() => {
                                            setSelectedGroupId(bundle.group_id);
                                            setSelectedStage(bundle.stage);
                                            setSelectedManuscriptId(bundle.manuscripts[0]?.id ?? null);
                                        }}
                                        className={`w-full rounded-xl border text-left transition-colors ${
                                            isActive ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        {isSubmissionsPaneCollapsed ? (
                                            <div className="flex items-center justify-center px-2 py-3">
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${
                                                        isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {firstLetter}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-3 px-4 py-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="truncate text-sm font-semibold text-slate-900">{bundle.group_name}</div>
                                                        <span
                                                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${stageBadgeClass(
                                                                bundle.stage,
                                                            )}`}
                                                        >
                                                            {formatStage(bundle.stage)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-slate-500">
                                                        {bundle.program_set_name ?? 'Program set'}
                                                        {bundle.school_year ? ` • ${bundle.school_year}` : ''}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-slate-500">
                                                        {bundle.manuscripts.length} manuscript{bundle.manuscripts.length === 1 ? '' : 's'} • Updated {bundle.updated_at ?? '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}

                            {filteredBundles.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                                    No manuscript submissions match the current filters.
                                </div>
                            ) : null}
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${isSubmissionsPaneCollapsed ? '' : 'xl:col-span-2'}`}
                    >
                        {!selectedGroup ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                                <div className="text-sm font-semibold text-slate-900">Select a group</div>
                                <div className="mt-1 text-xs text-slate-600">Choose a group from the left to review manuscripts.</div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-900">Group</span>
                                                <span className="font-semibold text-slate-900">{selectedGroup.group_name}</span>
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${stageBadgeClass(selectedGroup.stage)}`}>
                                                    {formatStage(selectedGroup.stage)}
                                                </span>
                                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                                    Leader {selectedGroup.leader_name ?? 'N/A'}
                                                </span>
                                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                                    {selectedGroup.program_set_name ?? 'Program set'}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500">
                                                Project Title: {projectTitleForRecommendation ?? 'No approved project title linked yet.'}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Members: {selectedGroup.member_names?.length ? selectedGroup.member_names.join(' • ') : 'No members found.'}
                                            </div>
                                        </div>
                                        {isOutlineStageSelected ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsRecommendationModalOpen(true)}
                                                disabled={!canGenerateRecommendation}
                                                title={
                                                    canGenerateRecommendation ? 'Open recommendation generator' : (recommendationDisabledReason ?? undefined)
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                Recommendation
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[520px] text-left text-xs">
                                                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">Title</th>
                                                        <th className="px-4 py-3 font-semibold">Requirement</th>
                                                        <th className="px-4 py-3 font-semibold">Submitted Time</th>
                                                        <th className="px-4 py-3 font-semibold">Approval Status</th>
                                                        <th className="px-4 py-3 font-semibold">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedGroup.manuscripts.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                                                No manuscript submissions yet.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        selectedGroup.manuscripts.map((manuscript) => {
                                                            const isActive = manuscript.id === selectedManuscriptId;
                                                            const isProcessing = processingManuscriptId === manuscript.id;

                                                            return (
                                                                <tr
                                                                    key={manuscript.id}
                                                                    onClick={() => setSelectedManuscriptId(manuscript.id)}
                                                                    className={`cursor-pointer transition-colors ${isActive ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                                                                >
                                                                    <td className="px-4 py-3">
                                                                        <div className="font-semibold text-slate-900">{manuscript.title}</div>
                                                                        <div className="mt-1 text-[11px] text-slate-500">{manuscript.file_size_label ?? 'Size unavailable'}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">
                                                                        <div>{manuscript.requirement_type}</div>
                                                                        <div className="mt-1 text-[11px] text-slate-500">{manuscript.stage}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                                        {manuscript.submitted_at ?? '—'}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span
                                                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${adviserStatusPillClass(
                                                                                manuscript.adviser_status,
                                                                            )}`}
                                                                        >
                                                                            {manuscript.adviser_status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    void handleApprove(manuscript.id);
                                                                                }}
                                                                                disabled={processingManuscriptId !== null}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                            >
                                                                                <CheckCircle2 className="h-3 w-3" />
                                                                                {isProcessing ? 'Saving...' : 'Approve'}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    void handleRequestRevision(manuscript.id);
                                                                                }}
                                                                                disabled={processingManuscriptId !== null}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                            >
                                                                                <RotateCcw className="h-3 w-3" />
                                                                                {isProcessing ? 'Saving...' : 'Revision'}
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                        <div className="border-b border-slate-200 bg-white px-4 py-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">PDF Viewer</div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {selectedManuscript ? selectedManuscript.title : 'Select a manuscript row to preview the PDF.'}
                                                    </div>
                                                </div>
                                                {selectedManuscript?.adviser_reviewed_at ? (
                                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                        Reviewed {selectedManuscript.adviser_reviewed_at}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        {!selectedManuscript ? (
                                            <div className="flex min-h-[18rem] items-center justify-center p-6 text-center text-sm text-slate-500">
                                                Select a manuscript from the table to load the PDF viewer.
                                            </div>
                                        ) : selectedManuscript.file_url ? (
                                            <div className="bg-slate-100 p-4 lg:p-5">
                                                <iframe
                                                    key={selectedManuscript.file_url}
                                                    src={`${selectedManuscript.file_url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                                    title={selectedManuscript.title}
                                                    className="h-[72vh] w-full rounded-2xl border border-slate-200 bg-white"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex min-h-[18rem] items-center justify-center p-6 text-center text-sm text-slate-500">
                                                PDF preview is not available for the selected manuscript.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.section>
                </div>
            </motion.section>
            <RecommendationModal
                open={isRecommendationModalOpen && selectedGroup !== null && isOutlineStageSelected}
                onClose={() => setIsRecommendationModalOpen(false)}
                groupName={selectedGroup?.group_name ?? 'Group'}
                leaderName={selectedGroup?.leader_name ?? null}
                modalTitle="Recommendation for Outline Defense"
                recommendationRequirementType={selectedGroup?.recommendation_requirement_type ?? null}
                approvedTitles={recommendationTitles}
                titleSectionLabel="Project Title"
                titlePrefixLabel={null}
                memberNames={selectedGroup?.member_names ?? []}
                hasESignature={hasESignature}
                canGenerate={canGenerateRecommendation}
                readyMessage="The approved project title and adviser-approved outline manuscript are ready for recommendation generation."
                disabledReason={recommendationDisabledReason}
                processing={isRecommendationGenerating}
                recommendationDocument={selectedGroup?.recommendation_document ?? null}
                emptyPreviewMessage="Click the E-Sign button to generate and preview the outline recommendation PDF."
                footerMessage="This action generates a signed outline recommendation letter and stores it in the document review flow."
                generateButtonLabel={selectedGroup?.recommendation_document ? 'Re-sign & Regenerate PDF' : 'E-Sign & Generate PDF'}
                onGenerate={() => {
                    void handleGenerateRecommendation();
                }}
            />
        </AdviserLayout>
    );
};

export default AdviserManuscripts;
