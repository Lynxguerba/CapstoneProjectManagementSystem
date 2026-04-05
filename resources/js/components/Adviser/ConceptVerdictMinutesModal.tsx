import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronsLeft, PanelRightOpen, PenLine, Scale, ShieldAlert, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export type ConceptVerdictMinutesDocument = {
    file_name: string;
    file_url: string;
    signed_at?: string | null;
};

type ScheduleSummary = {
    scheduledDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
} | null;

type PanelistSummary = {
    id: number;
    name: string;
    role: string;
};

type ConceptVerdictMinutesModalProps = {
    open: boolean;
    onClose: () => void;
    groupName: string;
    verdict?: string | null;
    approvedTitle?: string | null;
    decidedAt?: string | null;
    decidedBy?: string | null;
    schedule?: ScheduleSummary;
    proponents: string[];
    panelists: PanelistSummary[];
    hasESignature: boolean;
    canGenerate: boolean;
    disabledReason?: string | null;
    processing: boolean;
    errorMessage?: string | null;
    minutesDocument: ConceptVerdictMinutesDocument | null;
    onGenerate: () => void;
};

const parseDate = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
};

const formatDateLabel = (value?: string | null): string => {
    const date = parseDate(value);
    if (!date) {
        return value ?? '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
};

const formatTimeLabel = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const segments = value.split(':');
    if (segments.length < 2) {
        return value;
    }

    const hours = Number(segments[0]);
    const minutes = Number(segments[1]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return value;
    }

    const normalizedHours = hours % 12 || 12;
    const suffix = hours >= 12 ? 'PM' : 'AM';

    return `${normalizedHours}:${minutes.toString().padStart(2, '0')} ${suffix}`;
};

const ConceptVerdictMinutesModal = ({
    open,
    onClose,
    groupName,
    verdict,
    approvedTitle,
    decidedAt,
    decidedBy,
    schedule,
    proponents,
    panelists,
    hasESignature,
    canGenerate,
    disabledReason,
    processing,
    errorMessage,
    minutesDocument,
    onGenerate,
}: ConceptVerdictMinutesModalProps) => {
    const [isAppearing, setIsAppearing] = useState(false);
    const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);

    useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            setIsDetailsCollapsed(false);
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
            if (event.key === 'Escape' && !processing) {
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
    }, [open, onClose, processing]);

    const chairman = useMemo(() => {
        return panelists.find((panelist) => panelist.role === 'Panel Chairman') ?? panelists[0] ?? null;
    }, [panelists]);

    const memberPanelists = useMemo(() => {
        if (!chairman) {
            return panelists;
        }

        return panelists.filter((panelist) => panelist.id !== chairman.id);
    }, [chairman, panelists]);

    const proponentSlots = useMemo(() => {
        const normalizedNames = proponents.map((name) => name.trim()).filter((name) => name !== '');

        return [
            normalizedNames[0] ?? null,
            normalizedNames[1] ?? null,
            normalizedNames[2] ?? null,
            normalizedNames[3] ?? null,
        ];
    }, [proponents]);

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
                if (event.target === event.currentTarget && !processing) {
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
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-emerald-700" />
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900">Minutes of Adviser Verdict</h2>
                            <p className="text-xs text-emerald-700">{groupName}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Close verdict minutes modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div
                    className={`grid grid-cols-1 gap-0 transition-[grid-template-columns] duration-300 ease-in-out ${
                        isDetailsCollapsed
                            ? 'lg:grid-cols-[minmax(0,1fr)_88px]'
                            : 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'
                    }`}
                >
                    <div className="flex min-h-[30rem] flex-col border-b border-slate-200 bg-slate-100 lg:border-r lg:border-b-0">
                        <div className="border-b border-slate-200 bg-white px-4 py-3">
                            <div className="text-xs font-semibold text-slate-600 uppercase">PDF Preview</div>
                            <div className="mt-1 text-sm text-slate-700">{minutesDocument?.file_name ?? 'No generated verdict minutes yet.'}</div>
                        </div>

                        {minutesDocument?.file_url ? (
                            <div className="flex-1 p-4">
                                <iframe
                                    key={minutesDocument.file_url}
                                    src={`${minutesDocument.file_url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                    title={minutesDocument.file_name}
                                    className="h-[58vh] w-full rounded-xl border border-slate-200 bg-white"
                                />
                                <div className="mt-2 text-xs text-slate-500">Generated at: {minutesDocument.signed_at ?? '—'}</div>
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
                                Click the E-Sign button to generate and preview the concept verdict minutes PDF.
                            </div>
                        )}
                    </div>

                    <div
                        className={`overflow-hidden border-slate-200 transition-[padding] duration-300 ease-in-out ${
                            isDetailsCollapsed ? 'px-2 py-3' : 'p-4'
                        }`}
                    >
                        <div className={`flex items-center gap-3 ${isDetailsCollapsed ? 'justify-center' : 'justify-between'}`}>
                            <AnimatePresence initial={false}>
                                {!isDetailsCollapsed ? (
                                    <motion.div
                                        key="verdict-minutes-details-label"
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                                        className="text-xs font-semibold tracking-wide text-slate-600 uppercase"
                                    >
                                        Minutes Details
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                            <button
                                type="button"
                                onClick={() => setIsDetailsCollapsed((current) => !current)}
                                className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label={isDetailsCollapsed ? 'Expand details panel' : 'Collapse details panel'}
                                aria-expanded={!isDetailsCollapsed}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={isDetailsCollapsed ? 'expand' : 'collapse'}
                                        initial={{ opacity: 0, rotate: -90, scale: 0.85 }}
                                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                        exit={{ opacity: 0, rotate: 90, scale: 0.85 }}
                                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                                        className="inline-flex"
                                    >
                                        {isDetailsCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                        </div>

                        <AnimatePresence initial={false}>
                            {!isDetailsCollapsed ? (
                                <motion.div
                                    key="verdict-minutes-details-content"
                                    initial={{ height: 0, opacity: 0, y: -6 }}
                                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                                    exit={{ height: 0, opacity: 0, y: -6 }}
                                    transition={{ duration: 0.24, ease: 'easeInOut' }}
                                    className="mt-3 space-y-4 overflow-hidden"
                                >
                                    {canGenerate ? (
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                                            Concept verdict is set. You can generate the adviser verdict minutes PDF.
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <ShieldAlert className="h-4 w-4" />
                                                Minutes generation is currently disabled
                                            </div>
                                            <p className="mt-1">{disabledReason ?? 'Set the concept verdict first.'}</p>
                                        </div>
                                    )}

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Verdict</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{verdict ?? 'Not set yet'}</p>
                                        <p className="mt-1 text-xs text-slate-600">Approved Title: {approvedTitle ?? 'No approved title for this verdict.'}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Decided by: {decidedBy ?? '—'} · Decided at: {decidedAt ?? '—'}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Defense Schedule</p>
                                        <p className="mt-1 text-sm text-slate-800">Date: {formatDateLabel(schedule?.scheduledDate)}</p>
                                        <p className="mt-1 text-sm text-slate-800">
                                            Time: {formatTimeLabel(schedule?.startTime)} - {formatTimeLabel(schedule?.endTime)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Proponents</p>
                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                            {proponentSlots.map((proponent, index) => (
                                                <div key={`proponent-slot-${index}`} className="text-sm text-slate-800">
                                                    <span className="font-semibold">{index + 1}.</span> {proponent ?? '—'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Panelists</p>
                                        <p className="mt-1 text-sm text-slate-800">
                                            Chairman: <span className="font-semibold">{chairman?.name ?? '—'}</span>
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {memberPanelists.length === 0 ? (
                                                <p className="text-sm text-slate-600">No panel members assigned.</p>
                                            ) : (
                                                memberPanelists.map((panelist, index) => (
                                                    <p key={`member-panelist-${panelist.id}`} className="text-sm text-slate-800">
                                                        {index + 1}. {panelist.name}
                                                    </p>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {!hasESignature ? (
                                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                            Register an e-signature in Adviser Settings before signing these minutes.
                                            <div className="mt-2">
                                                <Link
                                                    href="/adviser/settings"
                                                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 font-semibold text-rose-700 hover:bg-rose-100"
                                                >
                                                    Go to Settings
                                                </Link>
                                            </div>
                                        </div>
                                    ) : null}

                                    {errorMessage ? (
                                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</div>
                                    ) : null}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-3">
                    <div className="text-xs text-emerald-800">
                        This action generates a signed minutes PDF with adviser e-signature only.
                    </div>
                    <button
                        type="button"
                        onClick={onGenerate}
                        disabled={!hasESignature || !canGenerate || processing}
                        className="group relative z-10 inline-flex transform items-center gap-2 overflow-hidden rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-800 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                        {processing ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <PenLine className="h-4 w-4" />
                                <span>{minutesDocument ? 'Re-sign & Regenerate' : 'E-Sign & Generate PDF'}</span>
                                <CheckCircle2 className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConceptVerdictMinutesModal;
