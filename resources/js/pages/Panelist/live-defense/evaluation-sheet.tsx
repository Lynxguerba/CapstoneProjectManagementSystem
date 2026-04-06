import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, Users } from 'lucide-react';
import React from 'react';
import PanelLayout from '../_layout';

type GroupSummary = {
    id: number;
    name: string;
    programSetName?: string | null;
    academicYear?: string | null;
};

type PanelistEvaluationSheetProps = {
    group?: GroupSummary | null;
    presenters?: string[];
    conceptVerdict?: string | null;
    panelistName?: string | null;
    defenseHeaderTitle?: string | null;
    eSignature?: {
        signatureData: string;
        mimeType?: string | null;
    } | null;
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

const verdictOptions = [
    'Passed (No revisions needed)',
    'Passed (With revisions needed)',
    'Conditional Passed',
    'Failed',
] as const;

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

const isAllowedIntegerInput = (value: string): boolean => {
    return value === '' || /^[0-9]+$/.test(value);
};

const resolveSignatureDataUrl = (
    signature: {
        signatureData: string;
        mimeType?: string | null;
    } | null | undefined,
): string | null => {
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

    const normalizedMimeType =
        typeof signature.mimeType === 'string' && signature.mimeType.trim() !== '' ? signature.mimeType.trim() : 'image/png';

    return `data:${normalizedMimeType};base64,${normalizedSignatureData}`;
};

const PanelistEvaluationSheet = () => {
    const { props } = usePage<PanelistEvaluationSheetProps>();
    const group = props.group ?? null;
    const groupLabel = buildGroupLabel(group);
    const groupQuery = group ? `?group=${group.id}` : '';
    const defenseHeaderTitle = React.useMemo(() => {
        const normalizedTitle = (props.defenseHeaderTitle ?? '').trim();

        return normalizedTitle !== '' ? normalizedTitle : 'CONCEPT TITLE DEFENSE';
    }, [props.defenseHeaderTitle]);
    const printedPanelistName = React.useMemo(() => {
        const normalizedName = (props.panelistName ?? '').trim();

        return normalizedName !== '' ? normalizedName : 'Panelist';
    }, [props.panelistName]);
    const signatureDataUrl = React.useMemo(() => resolveSignatureDataUrl(props.eSignature), [props.eSignature]);
    const initialPresenters = React.useMemo(() => buildPresenterRows(props.presenters ?? []), [props.presenters]);
    const [defenseDate, setDefenseDate] = React.useState<string>(() => getLocalDateInputValue());
    const [presenters, setPresenters] = React.useState<string[]>(initialPresenters);
    const [individualScores, setIndividualScores] = React.useState<Record<string, number | null>>(
        Object.fromEntries(individualCriteria.map((criterion) => [criterion.id, null])),
    );
    const [groupScores, setGroupScores] = React.useState<Record<string, string>>({
        system: '',
        documentation: '',
        total: '',
    });
    const lockedVerdictOption = React.useMemo(() => mapConceptVerdictToSheetVerdict(props.conceptVerdict), [props.conceptVerdict]);
    const [passingGradeDate, setPassingGradeDate] = React.useState('');

    React.useEffect(() => {
        setPresenters(initialPresenters);
    }, [initialPresenters]);

    const handleGroupScoreChange = (field: keyof typeof groupScores) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        if (!isAllowedIntegerInput(nextValue)) {
            return;
        }

        setGroupScores((currentScores) => ({
            ...currentScores,
            [field]: nextValue,
        }));
    };

    return (
        <PanelLayout title="Defense Evaluation Sheet" subtitle="Outline / pre-deployment grading form">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/panelist/dashboard" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href="/panelist/schedule" className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Defense Schedule
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <Link href={`/panelist/live-defense${groupQuery}`} className="font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Live Defense
                    </Link>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-800" aria-current="page">
                        Evaluation Sheet
                    </span>
                </nav>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Selected Group</p>
                                <p className="text-xs text-slate-500">{groupLabel}</p>
                            </div>
                        </div>
                        <Link
                            href={`/panelist/live-defense${groupQuery}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Back to Live Defense
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
                        <p className="mt-4 text-center text-3xl font-semibold italic text-slate-900">Institute of Computing</p>
                        <p className="mt-1 text-center text-sm font-bold tracking-wide text-slate-900">{defenseHeaderTitle}</p>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                        <div>
                            <label htmlFor="defense-date" className="text-xs font-semibold text-slate-700">
                                Date:
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                <input
                                    id="defense-date"
                                    type="date"
                                    value={defenseDate}
                                    onChange={(event) => setDefenseDate(event.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-slate-700">Presenters&apos; Names:</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {presenters.map((presenter, index) => (
                                    <div key={`presenter-${index + 1}`} className="flex items-center gap-2">
                                        <span className="w-4 text-xs font-semibold text-slate-600">{index + 1}.</span>
                                        <input
                                            value={presenter}
                                            onChange={(event) =>
                                                setPresenters((currentPresenters) =>
                                                    currentPresenters.map((name, presenterIndex) =>
                                                        presenterIndex === index ? event.target.value : name,
                                                    ),
                                                )
                                            }
                                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
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
                                    <th rowSpan={2} className="w-[70%] border-r border-slate-300 px-3 py-2 text-center text-xs font-semibold">
                                        Criteria and Weight
                                    </th>
                                    <th colSpan={5} className="px-3 py-2 text-center text-xs font-semibold">
                                        Score
                                    </th>
                                </tr>
                                <tr className="bg-slate-50">
                                    {scoreScale.map((score) => (
                                        <th key={`score-scale-${score}`} className="w-10 border-l border-slate-300 px-2 py-1.5 text-center font-semibold">
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
                                                <p className="mb-1 text-xs font-semibold text-slate-900">II. Delivery and Presentation (80%)</p>
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
                                                className={`relative border-t border-l border-slate-300 p-0 text-center transition ${
                                                    individualScores[criterion.id] === score ? 'bg-emerald-50/80' : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <label
                                                    htmlFor={`individual-score-${criterion.id}-${score}`}
                                                    className="absolute inset-0 flex cursor-pointer items-center justify-center"
                                                >
                                                    <input
                                                        id={`individual-score-${criterion.id}-${score}`}
                                                        type="radio"
                                                        name={`individual-score-${criterion.id}`}
                                                        checked={individualScores[criterion.id] === score}
                                                        onChange={() =>
                                                            setIndividualScores((currentScores) => ({
                                                                ...currentScores,
                                                                [criterion.id]: score,
                                                            }))
                                                        }
                                                        className="h-3.5 w-3.5 cursor-pointer accent-emerald-600"
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
                                    <th className="w-[80%] border-r border-slate-300 px-3 py-2 text-center text-xs font-semibold">Criteria and Weight</th>
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
                                                inputMode="numeric"
                                                min={0}
                                                step={1}
                                                pattern="[0-9]*"
                                                value={groupScores[criterion.id] ?? ''}
                                                onChange={handleGroupScoreChange(criterion.id as keyof typeof groupScores)}
                                                onKeyDown={(event) => {
                                                    if (['e', 'E', '+', '-', '.'].includes(event.key)) {
                                                        event.preventDefault();
                                                    }
                                                }}
                                                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-center text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                            />
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50">
                                    <td className="border-t border-r border-slate-300 px-3 py-2 text-right text-xs font-semibold">Total</td>
                                    <td className="border-t border-slate-300 px-3 py-2">
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            step={1}
                                            pattern="[0-9]*"
                                            value={groupScores.total}
                                            onChange={handleGroupScoreChange('total')}
                                            onKeyDown={(event) => {
                                                if (['e', 'E', '+', '-', '.'].includes(event.key)) {
                                                    event.preventDefault();
                                                }
                                            }}
                                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-center text-xs font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6">
                        <p className="text-xs font-semibold text-slate-900">Verdict:</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Auto-filled from Verdict modal: {props.conceptVerdict ?? 'Not set'}
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
                            value={passingGradeDate}
                            onChange={(event) => setPassingGradeDate(event.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                    </div>

                    <div className="mt-10 max-w-sm">
                        <div className="relative h-20">
                            {signatureDataUrl ? (
                                <img
                                    src={signatureDataUrl}
                                    alt={`${printedPanelistName} e-signature`}
                                    className="pointer-events-none absolute top-0 left-1/2 max-h-14 w-auto -translate-x-1/2 object-contain opacity-90"
                                />
                            ) : null}
                            <p className="absolute inset-x-0 bottom-1 text-center text-sm font-semibold text-slate-800">{printedPanelistName}</p>
                            <div className="absolute inset-x-0 bottom-0 border-b border-slate-400" aria-hidden="true" />
                        </div>
                        <p className="mt-2 text-xs text-slate-700">Name and Signature of Panelist</p>
                        {!signatureDataUrl ? (
                            <p className="mt-1 text-[11px] text-amber-700">No registered e-signature found. Add one in Panelist Settings.</p>
                        ) : null}
                    </div>

                   
                </div>
            </motion.section>
        </PanelLayout>
    );
};

export default PanelistEvaluationSheet;
