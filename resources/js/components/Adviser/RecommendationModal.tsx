import { AnimatePresence, motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { CheckCircle2, ChevronsLeft, FileText, PanelRightOpen, PenLine, ShieldAlert, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type RecommendationDocument = {
    id: number;
    file_name: string;
    file_url: string;
    signed_at?: string | null;
};

type RecommendationModalProps = {
    open: boolean;
    onClose: () => void;
    groupName: string;
    leaderName?: string | null;
    recommendationRequirementType?: string | null;
    approvedTitles: string[];
    memberNames: string[];
    hasESignature: boolean;
    canGenerate: boolean;
    disabledReason?: string | null;
    processing: boolean;
    recommendationDocument: RecommendationDocument | null;
    onGenerate: () => void;
};

const RecommendationModal = ({
    open,
    onClose,
    groupName,
    leaderName,
    recommendationRequirementType,
    approvedTitles,
    memberNames,
    hasESignature,
    canGenerate,
    disabledReason,
    processing,
    recommendationDocument,
    onGenerate,
}: RecommendationModalProps) => {
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

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const submittedByNames = memberNames.length === 0 ? 'No student members found.' : memberNames.join(', ');

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
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
                className={`max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-700" />
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900">Recommendation for Title Defense</h2>
                            <p className="text-xs text-emerald-700">
                                {groupName} · Leader {leaderName ?? 'N/A'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Close recommendation modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div
                    className={`grid grid-cols-1 gap-0 transition-[grid-template-columns] duration-300 ease-in-out ${
                        isDetailsCollapsed
                            ? 'lg:grid-cols-[88px_minmax(0,1fr)]'
                            : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]'
                    }`}
                >
                    <div
                        className={`overflow-hidden border-b border-slate-200 transition-[padding] duration-300 ease-in-out lg:border-r lg:border-b-0 ${
                            isDetailsCollapsed ? 'px-2 py-3' : 'p-4'
                        }`}
                    >
                        <div className={`flex items-center gap-3 ${isDetailsCollapsed ? 'justify-center' : 'justify-between'}`}>
                            <AnimatePresence initial={false}>
                                {!isDetailsCollapsed ? (
                                    <motion.div
                                        key="recommendation-details-label"
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                                        className="text-xs font-semibold tracking-wide text-slate-600 uppercase"
                                    >
                                        Recommendation Details
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                            <button
                                type="button"
                                onClick={() => setIsDetailsCollapsed((current) => !current)}
                                className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label={isDetailsCollapsed ? 'Expand recommendation details' : 'Collapse recommendation details'}
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
                                        {isDetailsCollapsed ? (
                                            <PanelRightOpen className="h-4 w-4" />
                                        ) : (
                                            <ChevronsLeft className="h-4 w-4" />
                                        )}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                        </div>

                        <AnimatePresence initial={false}>
                            {!isDetailsCollapsed ? (
                                <motion.div
                                    key="recommendation-details-content"
                                    initial={{ height: 0, opacity: 0, y: -6 }}
                                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                                    exit={{ height: 0, opacity: 0, y: -6 }}
                                    transition={{ duration: 0.24, ease: 'easeInOut' }}
                                    className="mt-3 space-y-4 overflow-hidden"
                                >
                                {canGenerate ? (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                                        All concept submissions are approved and a recommendation requirement is configured.
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <ShieldAlert className="h-4 w-4" />
                                            Recommendation is currently disabled
                                        </div>
                                        <p className="mt-1">{disabledReason ?? 'Complete all required approvals first.'}</p>
                                    </div>
                                )}

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Requirement</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                        {recommendationRequirementType ?? 'Recommendation Letter'}
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Approved Titles</div>
                                    {approvedTitles.length === 0 ? (
                                        <div className="mt-2 text-xs text-slate-500">No approved concept titles found.</div>
                                    ) : (
                                        <div className="mt-2 space-y-1">
                                            {approvedTitles.map((title, index) => (
                                                <div key={`${title}-${index}`} className="text-sm text-slate-800">
                                                    <span className="font-semibold">Title {index + 1}:</span> {title}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                        Prepared and Submitted By
                                    </div>
                                    <div className="mt-1 text-sm text-slate-800">{submittedByNames}</div>
                                </div>

                                {!hasESignature ? (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                        Register an e-signature in Adviser Settings before signing this letter.
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
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <div className="flex min-h-[30rem] flex-col">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="text-xs font-semibold text-slate-600 uppercase">PDF Preview</div>
                            <div className="mt-1 text-sm text-slate-700">{recommendationDocument?.file_name ?? 'No generated recommendation yet.'}</div>
                        </div>

                        {recommendationDocument?.file_url ? (
                            <div className="flex-1 bg-slate-100 p-4">
                                <iframe
                                    key={recommendationDocument.file_url}
                                    src={`${recommendationDocument.file_url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                    title={recommendationDocument.file_name}
                                    className="h-[58vh] w-full rounded-xl border border-slate-200 bg-white"
                                />
                                <div className="mt-2 text-xs text-slate-500">Signed at: {recommendationDocument.signed_at ?? '—'}</div>
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-500">
                                Click the E-Sign button to generate and preview the recommendation PDF.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-3">
                    <div className="text-xs text-emerald-800">
                        This action generates a signed recommendation letter and stores it in the document review flow.
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
                                <span>{recommendationDocument ? 'Re-sign & Regenerate' : 'E-Sign & Generate PDF'}</span>
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

export default RecommendationModal;
