import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight } from 'lucide-react';
import React from 'react';
import InstructorLayout from '../_layout';

type GroupSummary = {
    id: number;
    name: string;
    programSetName?: string | null;
    program?: string | null;
    academicYear?: string | null;
};

type SignaturePayload = {
    signatureData: string;
    mimeType?: string | null;
};

type PanelistSheetRow = {
    id: number;
    name: string;
    email?: string | null;
    role?: string | null;
    panelSlot?: number | null;
    signedAt?: string | null;
    evaluationData?: {
        defenseDate?: string | null;
        presenters?: string[];
        individualScores?: Record<string, number | null>;
        groupScores?: Record<string, number | string | null>;
        passingGradeDate?: string | null;
    } | null;
    eSignature?: SignaturePayload | null;
};

type PageProps = {
    group?: GroupSummary | null;
    panelists?: PanelistSheetRow[];
    selectedPanelistId?: number | null;
    presenters?: string[];
    conceptVerdict?: string | null;
    defenseHeaderTitle?: string | null;
    defenseDate?: string | null;
};

type IndividualCriterion = {
    id: string;
    title: string;
    items: string[];
};

type GroupCriterion = {
    id: string;
    title: string;
    items: string[];
};

const scoreScale = [1, 2, 3, 4, 5] as const;

const individualCriteria: IndividualCriterion[] = [
    {
        id: 'disposition',
        title: 'I. Disposition (20%)',
        items: ['Generally neat in appearance', 'Projects an aura of confidence', 'Preparedness and teamwork'],
    },
    {
        id: 'organization',
        title: 'a. Organization of Content',
        items: [
            'Sense of segmentation',
            'Presentation is not interrupted to reload a file.',
            'Smoothness of presentation flow',
            'No inconsistencies within content',
        ],
    },
    {
        id: 'manner',
        title: 'b. Manner of Presentation',
        items: [
            'The presenter does not tend to talk to the screen.',
            'Does not have some hesitancy in speaking.',
            'Less consulting of notes and has good eye contact with panelists.',
            'The volume of voice is adequate and can be heard by everyone.',
            'Does not delve too long into a specific subject matter.',
            'Use of clear visuals and appropriate materials for presentation.',
        ],
    },
    {
        id: 'defense',
        title: 'c. Ability to Defend Ideas and Technical Output',
        items: [
            'Ability to respond to questions and criticisms.',
            'Has good responses to critiques and comments.',
            'Does not have the tendency to go into other issues when answering questions.',
            'Attitude towards suggestions given (i.e., receptive, not hostile or indifferent).',
        ],
    },
];

const groupCriteria: GroupCriterion[] = [
    {
        id: 'system',
        title: 'System (50%)',
        items: [
            'The design of the system is based on the objectives.',
            'Technical output as a reliable proof of concept of the study.',
            'Degree of impact on the panelist.',
            'Exhibits ease of use and user-friendliness.',
        ],
    },
    {
        id: 'documentation',
        title: 'Documentation (50%)',
        items: ['Mechanics - Spelling/Punctuation/Grammar/Structure', 'Completeness', 'Content (should be correct and consistent)'],
    },
];

const verdictOptions = ['Passed (No revisions needed)', 'Passed (With revisions needed)', 'Conditional Passed', 'Failed'] as const;

const getLocalDateInputValue = (): string => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60_000;
    const localDate = new Date(now.getTime() - timezoneOffset);

    return localDate.toISOString().slice(0, 10);
};

const buildPresenterRows = (presenters: string[]): string[] => {
    const cleanedPresenters = presenters.map((presenter) => presenter.trim()).filter((presenter) => presenter !== '');

    if (cleanedPresenters.length >= 4) {
        return cleanedPresenters;
    }

    return [...cleanedPresenters, ...Array.from({ length: 4 - cleanedPresenters.length }, () => '')];
};

const mapConceptVerdictToSheetVerdict = (conceptVerdict: string | null | undefined): (typeof verdictOptions)[number] | null => {
    if (conceptVerdict === 'Passed (No revisions needed)') {
        return 'Passed (No revisions needed)';
    }

    if (conceptVerdict === 'Passed (With revisions needed)' || conceptVerdict === 'Pass with revision') {
        return 'Passed (With revisions needed)';
    }

    if (conceptVerdict === 'Conditional Passed' || conceptVerdict === 'Conditional Pass') {
        return 'Conditional Passed';
    }

    if (conceptVerdict === 'Failed' || conceptVerdict === 'Deffered') {
        return 'Failed';
    }

    return null;
};

const buildGroupLabel = (group: GroupSummary | null): string => {
    if (!group) {
        return 'No group selected';
    }

    const details = [group.name, group.programSetName ?? '', group.academicYear ?? ''].filter((value) => value.trim() !== '');

    return details.join(' | ');
};

const resolveSignatureDataUrl = (signature: SignaturePayload | null | undefined): string | null => {
    if (!signature || typeof signature.signatureData !== 'string') {
        return null;
    }

    const normalizedSignatureData = signature.signatureData.trim();
    if (normalizedSignatureData === '') {
        return null;
    }

    if (normalizedSignatureData.startsWith('data:image/')) {
        return normalizedSignatureData;
    }

    const normalizedMimeType = typeof signature.mimeType === 'string' && signature.mimeType.trim() !== '' ? signature.mimeType.trim() : 'image/png';

    return `data:${normalizedMimeType};base64,${normalizedSignatureData}`;
};

const InstructorEvaluationSheetsPage = () => {
    const { props } = usePage<PageProps>();
    const group = props.group ?? null;
    const panelists = React.useMemo(() => props.panelists ?? [], [props.panelists]);
    const initialPanelistId = props.selectedPanelistId ?? panelists[0]?.id ?? null;
    const [selectedPanelistId, setSelectedPanelistId] = React.useState<number | null>(initialPanelistId);
    const groupLabel = buildGroupLabel(group);
    const presenters = React.useMemo(() => buildPresenterRows(props.presenters ?? []), [props.presenters]);
    const lockedVerdictOption = React.useMemo(() => mapConceptVerdictToSheetVerdict(props.conceptVerdict), [props.conceptVerdict]);
    const defenseDate = React.useMemo(() => {
        const normalizedDate = (props.defenseDate ?? '').trim();

        return normalizedDate !== '' ? normalizedDate : getLocalDateInputValue();
    }, [props.defenseDate]);
    const defenseHeaderTitle = React.useMemo(() => {
        const normalizedTitle = (props.defenseHeaderTitle ?? '').trim();

        return normalizedTitle !== '' ? normalizedTitle : 'CONCEPT TITLE DEFENSE';
    }, [props.defenseHeaderTitle]);

    React.useEffect(() => {
        if (panelists.length === 0) {
            setSelectedPanelistId(null);
            return;
        }

        if (selectedPanelistId !== null && panelists.some((panelist) => panelist.id === selectedPanelistId)) {
            return;
        }

        setSelectedPanelistId(props.selectedPanelistId ?? panelists[0].id);
    }, [panelists, props.selectedPanelistId, selectedPanelistId]);

    const selectedPanelist = React.useMemo(
        () => panelists.find((panelist) => panelist.id === selectedPanelistId) ?? null,
        [panelists, selectedPanelistId],
    );
    const selectedPanelistSigned = typeof selectedPanelist?.signedAt === 'string' && selectedPanelist.signedAt.trim() !== '';
    const selectedEvaluationData = selectedPanelist?.evaluationData ?? null;
    const previewDefenseDate = React.useMemo(() => {
        const savedDefenseDate = (selectedEvaluationData?.defenseDate ?? '').trim();

        return savedDefenseDate !== '' ? savedDefenseDate : defenseDate;
    }, [defenseDate, selectedEvaluationData?.defenseDate]);
    const previewPresenters = React.useMemo(() => {
        const savedPresenters = selectedEvaluationData?.presenters ?? [];
        const hasSavedPresenters = savedPresenters.some((presenter) => presenter.trim() !== '');

        return buildPresenterRows(hasSavedPresenters ? savedPresenters : presenters);
    }, [presenters, selectedEvaluationData?.presenters]);
    const previewIndividualScores = React.useMemo(() => selectedEvaluationData?.individualScores ?? {}, [selectedEvaluationData?.individualScores]);
    const previewGroupScores = React.useMemo(() => selectedEvaluationData?.groupScores ?? {}, [selectedEvaluationData?.groupScores]);
    const previewPassingGradeDate = React.useMemo(
        () => (selectedEvaluationData?.passingGradeDate ?? '').trim(),
        [selectedEvaluationData?.passingGradeDate],
    );
    const panelistSignatureDataUrl = React.useMemo(() => resolveSignatureDataUrl(selectedPanelist?.eSignature), [selectedPanelist?.eSignature]);
    const phaseOneDefenseHref = '/instructor/phase1?tab=defense';

    return (
        <InstructorLayout title="Panelist Evaluation Sheets" subtitle="View-only evaluation forms of assigned panelists">
            <div className="space-y-6">
                <div className="space-y-3">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href="/instructor/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Dashboard
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <Link href="/instructor/phase1?tab=defense" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Phase 1
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <Link href={phaseOneDefenseHref} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                            Defense Status
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-800" aria-current="page">
                            Evaluation Sheets
                        </span>
                    </nav>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Group: <span className="text-emerald-700">{group?.name ?? 'No group selected'}</span>
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">{groupLabel}</p>
                        </div>
                        <Link
                            href={phaseOneDefenseHref}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Back to Defense Status
                        </Link>
                    </div>
                </div>

                {!group ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        No group selected for evaluation sheets.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:overflow-visible">
                        <div className="border-b border-slate-200 md:sticky md:top-20 md:self-start md:border-r md:border-b-0">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                                Assigned Panelists
                            </div>
                            <div className="max-h-[74vh] overflow-auto md:max-h-[calc(100vh-9rem)]">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Panelist</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Sheet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {panelists.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-10 text-center text-xs text-slate-500">
                                                    No panelists are assigned to this group.
                                                </td>
                                            </tr>
                                        ) : (
                                            panelists.map((panelist) => {
                                                const isSelected = panelist.id === selectedPanelistId;
                                                const hasSignature = resolveSignatureDataUrl(panelist.eSignature) !== null;
                                                const isSigned = typeof panelist.signedAt === 'string' && panelist.signedAt.trim() !== '';

                                                return (
                                                    <tr
                                                        key={panelist.id}
                                                        onClick={() => setSelectedPanelistId(panelist.id)}
                                                        className={`cursor-pointer align-top transition-colors ${
                                                            isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-slate-900">{panelist.name}</div>
                                                            <div className="mt-1 text-[11px] text-slate-500">{panelist.email ?? 'No email'}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{panelist.role ?? 'Panel Member'}</td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                                    isSigned
                                                                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                                                                        : hasSignature
                                                                          ? 'border-amber-200 bg-amber-100 text-amber-700'
                                                                          : 'border-amber-200 bg-amber-100 text-amber-700'
                                                                }`}
                                                            >
                                                                {isSigned ? 'Signed' : hasSignature ? 'Awaiting Sign' : 'No e-signature'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex min-h-[26rem] flex-col">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-xs font-semibold text-slate-600 uppercase">Evaluation Sheet Preview</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">
                                    {selectedPanelist
                                        ? `${selectedPanelist.name} (${selectedPanelist.role ?? 'Panel Member'})`
                                        : 'Select a panelist from the list'}
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Instructor view only. This page does not allow modifying panelist evaluation forms.
                                </p>
                                {selectedPanelistSigned ? (
                                    <p className="mt-1 text-[11px] text-emerald-700">Signed at: {selectedPanelist?.signedAt ?? '—'}</p>
                                ) : null}
                            </div>

                            {!selectedPanelist ? (
                                <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
                                    Select a panelist row from the left table to view the evaluation form layout.
                                </div>
                            ) : !selectedPanelistSigned ? (
                                <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
                                    The selected panelist has not signed the evaluation sheet yet.
                                </div>
                            ) : (
                                <motion.div
                                    key={selectedPanelist.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-1 overflow-auto p-4"
                                >
                                    <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-7">
                                        <div className="border-b border-slate-300 pb-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-lg font-semibold tracking-wide text-slate-900">
                                                        DAVAO DEL NORTE STATE COLLEGE
                                                    </p>
                                                    <p className="text-xs text-slate-600">New Visayas, Panabo City, Davao del Norte, 8105</p>
                                                </div>
                                                <div className="text-left text-[11px] text-slate-600 sm:text-right">
                                                    <p>president@dnsc.edu.ph</p>
                                                    <p>dnsc.edu.ph</p>
                                                    <p>@officialdnsc</p>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-center text-3xl font-semibold text-slate-900 italic">Institute of Computing</p>
                                            <p className="mt-1 text-center text-sm font-bold tracking-wide text-slate-900">{defenseHeaderTitle}</p>
                                        </div>

                                        <div className="mt-5 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                                            <div>
                                                <label htmlFor="defense-date-preview" className="text-xs font-semibold text-slate-700">
                                                    Date:
                                                </label>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                                    <input
                                                        id="defense-date-preview"
                                                        type="date"
                                                        value={previewDefenseDate}
                                                        disabled
                                                        className="w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-slate-700">Presenters&apos; Names:</p>
                                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                    {previewPresenters.map((presenter, index) => (
                                                        <div key={`presenter-${index + 1}`} className="flex items-center gap-2">
                                                            <span className="w-4 text-xs font-semibold text-slate-600">{index + 1}.</span>
                                                            <input
                                                                value={presenter}
                                                                disabled
                                                                className="w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-500"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 overflow-hidden rounded-lg border border-slate-300">
                                            <table className="w-full border-collapse text-left text-[11px] text-slate-800">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        <th colSpan={6} className="border-b border-slate-300 px-3 py-2 text-center text-xs font-bold">
                                                            Individual Grade
                                                        </th>
                                                    </tr>
                                                    <tr className="bg-slate-50">
                                                        <th
                                                            rowSpan={2}
                                                            className="w-[70%] border-r border-slate-300 px-3 py-2 text-center text-xs font-semibold"
                                                        >
                                                            Criteria and Weight
                                                        </th>
                                                        <th colSpan={5} className="px-3 py-2 text-center text-xs font-semibold">
                                                            Score
                                                        </th>
                                                    </tr>
                                                    <tr className="bg-slate-50">
                                                        {scoreScale.map((score) => (
                                                            <th
                                                                key={`score-scale-${score}`}
                                                                className="w-10 border-l border-slate-300 px-2 py-1.5 text-center font-semibold"
                                                            >
                                                                {score}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {individualCriteria.map((criterion) => (
                                                        <tr key={criterion.id} className="align-top">
                                                            <td className="border-t border-r border-slate-300 px-3 py-2.5">
                                                                {criterion.id === 'organization' ? (
                                                                    <p className="mb-1 text-xs font-semibold text-slate-900">
                                                                        II. Delivery and Presentation (80%)
                                                                    </p>
                                                                ) : null}
                                                                <p className="text-xs font-semibold text-slate-900">{criterion.title}</p>
                                                                <ul className="mt-1 space-y-1 pl-4 text-[11px] text-slate-700">
                                                                    {criterion.items.map((item) => (
                                                                        <li key={`${criterion.id}-${item}`} className="list-disc">
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                            {scoreScale.map((score) => (
                                                                <td
                                                                    key={`${criterion.id}-${score}`}
                                                                    className="border-t border-l border-slate-300 p-0 text-center"
                                                                >
                                                                    <label className="flex h-full min-h-10 items-center justify-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`individual-score-${criterion.id}`}
                                                                            checked={previewIndividualScores?.[criterion.id] === score}
                                                                            disabled
                                                                            readOnly
                                                                            className="h-3.5 w-3.5 cursor-not-allowed accent-emerald-600"
                                                                            aria-label={`Score ${score} for ${criterion.title}`}
                                                                        />
                                                                    </label>
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-6 overflow-hidden rounded-lg border border-slate-300">
                                            <table className="w-full border-collapse text-left text-[11px] text-slate-800">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        <th colSpan={2} className="border-b border-slate-300 px-3 py-2 text-center text-xs font-bold">
                                                            Group Grade
                                                        </th>
                                                    </tr>
                                                    <tr className="bg-slate-50">
                                                        <th className="w-[80%] border-r border-slate-300 px-3 py-2 text-center text-xs font-semibold">
                                                            Criteria and Weight
                                                        </th>
                                                        <th className="px-3 py-2 text-center text-xs font-semibold">Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groupCriteria.map((criterion) => (
                                                        <tr key={criterion.id} className="align-top">
                                                            <td className="border-t border-r border-slate-300 px-3 py-2.5">
                                                                <p className="text-xs font-semibold text-slate-900">{criterion.title}</p>
                                                                <ul className="mt-1 space-y-1 pl-4 text-[11px] text-slate-700">
                                                                    {criterion.items.map((item) => (
                                                                        <li key={`${criterion.id}-${item}`} className="list-disc">
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                            <td className="border-t border-slate-300 px-3 py-2.5 align-top">
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        previewGroupScores?.[criterion.id] !== null &&
                                                                        previewGroupScores?.[criterion.id] !== undefined
                                                                            ? `${previewGroupScores[criterion.id]}`
                                                                            : ''
                                                                    }
                                                                    disabled
                                                                    className="w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-center text-xs text-slate-500"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-50">
                                                        <td className="border-t border-r border-slate-300 px-3 py-2 text-right text-xs font-semibold">
                                                            Total
                                                        </td>
                                                        <td className="border-t border-slate-300 px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={
                                                                    previewGroupScores?.total !== null && previewGroupScores?.total !== undefined
                                                                        ? `${previewGroupScores.total}`
                                                                        : ''
                                                                }
                                                                disabled
                                                                className="w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-center text-xs font-semibold text-slate-500"
                                                            />
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-6">
                                            <p className="text-xs font-semibold text-slate-900">Verdict:</p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                Auto-filled from verdict: {props.conceptVerdict ?? 'Not set'}
                                            </p>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                {verdictOptions.map((option) => (
                                                    <label
                                                        key={option}
                                                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                                                            lockedVerdictOption === option
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                                : 'border-slate-300 bg-slate-50/60 text-slate-700'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="verdict"
                                                            checked={lockedVerdictOption === option}
                                                            readOnly
                                                            disabled
                                                            className="h-3.5 w-3.5 cursor-not-allowed accent-emerald-600"
                                                        />
                                                        <span>{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                                            <span>To comply the necessary requirements to get a passing grade on</span>
                                            <input
                                                type="date"
                                                value={previewPassingGradeDate}
                                                disabled
                                                className="cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-500"
                                            />
                                        </div>

                                        <div className="mt-10 max-w-sm">
                                            <div className="relative h-20">
                                                {panelistSignatureDataUrl ? (
                                                    <img
                                                        src={panelistSignatureDataUrl}
                                                        alt={`${selectedPanelist.name} e-signature`}
                                                        className="pointer-events-none absolute top-0 left-1/2 max-h-14 w-auto -translate-x-1/2 object-contain opacity-90"
                                                    />
                                                ) : null}
                                                <p className="absolute inset-x-0 bottom-1 text-center text-sm font-semibold text-slate-800">
                                                    {selectedPanelist.name}
                                                </p>
                                                <div className="absolute inset-x-0 bottom-0 border-b border-slate-400" aria-hidden="true" />
                                            </div>
                                            <p className="mt-2 text-xs text-slate-700">Name and Signature of Panelist</p>
                                            {!panelistSignatureDataUrl ? (
                                                <p className="mt-1 text-[11px] text-amber-700">No registered e-signature found for this panelist.</p>
                                            ) : null}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </InstructorLayout>
    );
};

export default InstructorEvaluationSheetsPage;
