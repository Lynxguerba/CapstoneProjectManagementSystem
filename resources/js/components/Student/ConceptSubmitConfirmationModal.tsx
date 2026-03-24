import { CheckCircle2, FileText, UploadCloud, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type ConceptSubmitConfirmationModalProps = {
    open: boolean;
    title: string;
    categoryName: string;
    fileName: string;
    requirementLabel: string;
    deadlineLabel?: string | null;
    processing: boolean;
    progressPercentage?: number | null;
    onClose: () => void;
    onConfirm: () => void;
};

const ConceptSubmitConfirmationModal = ({
    open,
    title,
    categoryName,
    fileName,
    requirementLabel,
    deadlineLabel,
    processing,
    progressPercentage,
    onClose,
    onConfirm,
}: ConceptSubmitConfirmationModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(true);
    }, [open]);

    React.useEffect(() => {
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
    }, [onClose, open, processing]);

    const shouldRender = open || isAppearing;

    if (!shouldRender || typeof document === 'undefined') {
        return null;
    }

    const progressLabel = typeof progressPercentage === 'number' ? `${Math.round(progressPercentage)}%` : null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm transition-opacity duration-200 ${
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
                className={`w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-gray-800" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Confirm Concept Submission</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-900">Review before uploading</p>
                                <p className="text-xs text-emerald-800">Confirm the title, file, and active concept requirement before submission.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                        <div className="flex items-start gap-3">
                            <FileText className="mt-0.5 h-4 w-4 text-emerald-600" />
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Concept Title</p>
                                <p className="mt-1 font-medium text-slate-900">{title}</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Category</p>
                                <p className="mt-1 text-sm text-slate-700">{categoryName}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Selected File</p>
                                <p className="mt-1 break-all text-sm text-slate-700">{fileName}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Requirement</p>
                                <p className="mt-1 text-sm text-slate-700">{requirementLabel}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Deadline</p>
                            <p className="mt-1 text-sm text-slate-700">{deadlineLabel ?? 'No deadline declared yet.'}</p>
                        </div>
                    </div>

                    {processing ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-center justify-between gap-3 text-sm font-medium text-emerald-800">
                                <span className="inline-flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Uploading concept paper
                                </span>
                                <span>{progressLabel ?? 'Starting...'}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                                <div
                                    className="h-full rounded-full bg-emerald-600 transition-all duration-200"
                                    style={{ width: `${Math.max(progressPercentage ?? 12, 12)}%` }}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                        {processing ? 'Uploading...' : 'Confirm Submission'}
                    </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConceptSubmitConfirmationModal;
