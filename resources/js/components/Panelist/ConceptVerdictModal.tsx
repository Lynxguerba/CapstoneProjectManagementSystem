import { router } from '@inertiajs/react';
import { CheckCircle2, Scale, ShieldCheck, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export type ConceptVerdictValue =
    | 'Passed (No revisions needed)'
    | 'Passed (With revisions needed)'
    | 'Conditional Passed'
    | 'Deffered'
    | 'Failed'
    | 'Pass with revision'
    | 'Conditional Pass';

type ConceptVerdictOptionValue = 'Passed (No revisions needed)' | 'Passed (With revisions needed)' | 'Conditional Passed' | 'Deffered' | 'Failed';

type ConceptSubmission = {
    id: number;
    title: string;
    requirementType: string;
    submittedAt?: string | null;
    panelistApprovalStatus?: string;
};

type ConceptVerdictModalProps = {
    open: boolean;
    onClose: () => void;
    groupId: number;
    groupLabel: string;
    conceptSubmissions: ConceptSubmission[];
    canEdit: boolean;
    initialVerdict?: ConceptVerdictValue | null;
    initialApprovedSubmissionId?: number | null;
    decidedBy?: string | null;
    decidedAt?: string | null;
};

const verdictOptions: Array<{ value: ConceptVerdictOptionValue; label: string }> = [
    { value: 'Passed (No revisions needed)', label: 'Passed (No revisions needed)' },
    { value: 'Passed (With revisions needed)', label: 'Passed (With revisions needed)' },
    { value: 'Conditional Passed', label: 'Conditional Passed' },
    { value: 'Deffered', label: 'Deffered (Re-defense)' },
    { value: 'Failed', label: 'Failed' },
];

const normalizeConceptVerdictValue = (verdict: ConceptVerdictValue | null | undefined): ConceptVerdictOptionValue | '' => {
    if (verdict === null || verdict === undefined) {
        return '';
    }

    if (verdict === 'Pass with revision') {
        return 'Passed (With revisions needed)';
    }

    if (verdict === 'Conditional Pass') {
        return 'Conditional Passed';
    }

    if (verdictOptions.some((option) => option.value === verdict)) {
        return verdict as ConceptVerdictOptionValue;
    }

    return '';
};

const isPassedVerdict = (verdict: ConceptVerdictOptionValue | ''): boolean => {
    return verdict === 'Passed (No revisions needed)' || verdict === 'Passed (With revisions needed)';
};

const panelistApprovalStatusClass = (status: string): string => {
    if (status === 'Approved') {
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (status === 'Rejected') {
        return 'border-rose-200 bg-rose-100 text-rose-700';
    }

    return 'border-amber-200 bg-amber-100 text-amber-700';
};

const ConceptVerdictModal = ({
    open,
    onClose,
    groupId,
    groupLabel,
    conceptSubmissions,
    canEdit,
    initialVerdict = null,
    initialApprovedSubmissionId = null,
    decidedBy = null,
    decidedAt = null,
}: ConceptVerdictModalProps) => {
    const [selectedVerdict, setSelectedVerdict] = useState<ConceptVerdictOptionValue | ''>('');
    const [selectedApprovedSubmissionId, setSelectedApprovedSubmissionId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isAppearing, setIsAppearing] = useState(false);

    const selectedApprovedTitle = useMemo(() => {
        return conceptSubmissions.find((submission) => submission.id === selectedApprovedSubmissionId) ?? null;
    }, [conceptSubmissions, selectedApprovedSubmissionId]);
    const isPassedVerdictSelected = isPassedVerdict(selectedVerdict);

    useEffect(() => {
        if (!open) {
            setSelectedVerdict('');
            setSelectedApprovedSubmissionId(null);
            setFormError(null);
            setIsSaving(false);
            setIsAppearing(false);
            return;
        }

        setSelectedVerdict(normalizeConceptVerdictValue(initialVerdict));
        setSelectedApprovedSubmissionId(initialApprovedSubmissionId ?? null);
        setFormError(null);
        setIsSaving(false);
    }, [open, initialVerdict, initialApprovedSubmissionId]);

    useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSaving) {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose, isSaving]);

    const handleVerdictChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const nextVerdict = event.target.value as ConceptVerdictOptionValue | '';
        setSelectedVerdict(nextVerdict);
        setFormError(null);

        if (!isPassedVerdict(nextVerdict)) {
            setSelectedApprovedSubmissionId(null);
        }
    };

    const handleSave = (): void => {
        if (!canEdit || isSaving) {
            return;
        }

        if (selectedVerdict === '') {
            setFormError('Select a concept verdict first.');
            return;
        }

        if (isPassedVerdict(selectedVerdict) && selectedApprovedSubmissionId === null) {
            setFormError('Select the approved concept title when verdict is a Passed option.');
            return;
        }

        setFormError(null);
        setIsSaving(true);
        router.post(
            '/panelist/live-defense/verdict',
            {
                group_id: groupId,
                verdict: selectedVerdict,
                approved_document_submission_id: isPassedVerdict(selectedVerdict) ? selectedApprovedSubmissionId : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                },
                onError: (errors) => {
                    const firstError =
                        errors.verdict ||
                        errors.approved_document_submission_id ||
                        errors.group_id ||
                        Object.values(errors)[0] ||
                        'Unable to save concept verdict.';
                    setFormError(String(firstError));
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className={`fixed inset-0 z-[10010] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSaving) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-gray-800" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Concept Verdict</h2>
                            <p className="text-xs text-slate-600">Panel chairman can set the final concept verdict.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                        aria-label="Close concept verdict modal"
                        disabled={isSaving}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-[calc(92vh-124px)] space-y-4 overflow-y-auto bg-slate-100 p-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Group</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{groupLabel}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                            <span>Decided by: {decidedBy ?? 'Not set yet'}</span>
                            <span>Decided at: {decidedAt ?? 'Not set yet'}</span>
                        </div>
                    </div>

                    {!canEdit ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            View only. Only the Panel Chairman can modify verdict and approved title selection.
                        </div>
                    ) : null}

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-end">
                            <div>
                                <label htmlFor="concept-verdict-select" className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                    Verdict
                                </label>
                                <select
                                    id="concept-verdict-select"
                                    value={selectedVerdict}
                                    onChange={handleVerdictChange}
                                    disabled={!canEdit || isSaving}
                                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                                >
                                    <option value="">Select verdict</option>
                                    {verdictOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                {isPassedVerdictSelected ? (
                                    <p>
                                        Approved title selection is required.
                                        <span className="block text-[11px] text-slate-500">
                                            Selected: {selectedApprovedTitle ? selectedApprovedTitle.title : 'No title selected'}
                                        </span>
                                    </p>
                                ) : (
                                    <p>Approved title action is enabled only when verdict is a Passed option.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Title</th>
                                        <th className="px-4 py-3 font-semibold">Submitted</th>
                                        <th className="px-4 py-3 font-semibold">Panelist Approval</th>
                                        <th className="px-4 py-3 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {conceptSubmissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                                No concept titles are available yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        conceptSubmissions.map((submission) => {
                                            const panelistApprovalStatus = submission.panelistApprovalStatus ?? 'Pending';
                                            const isSelectedSubmission = submission.id === selectedApprovedSubmissionId;
                                            const isActionEnabled = canEdit && isPassedVerdictSelected && !isSaving;

                                            return (
                                                <tr key={submission.id} className={isSelectedSubmission ? 'bg-emerald-50/70' : ''}>
                                                    <td className="px-4 py-3">
                                                        <p className="font-semibold text-slate-900">{submission.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">{submission.requirementType}</p>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{submission.submittedAt ?? '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${panelistApprovalStatusClass(panelistApprovalStatus)}`}
                                                        >
                                                            {panelistApprovalStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedApprovedSubmissionId(submission.id)}
                                                            disabled={!isActionEnabled}
                                                            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                                                                isSelectedSubmission
                                                                    ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                                        >
                                                            <ShieldCheck className="h-3.5 w-3.5" />
                                                            {isSelectedSubmission ? 'Selected' : 'Set as approved title'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {formError ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</div>
                    ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Close
                    </button>

                    {canEdit ? (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Save Verdict
                                </>
                            )}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConceptVerdictModal;
