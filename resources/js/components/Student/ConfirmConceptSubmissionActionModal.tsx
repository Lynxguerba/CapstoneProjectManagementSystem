import { AlertTriangle, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type ConfirmConceptSubmissionActionModalProps = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    processing: boolean;
    tone?: 'danger' | 'neutral';
    onClose: () => void;
    onConfirm: () => void;
};

const ConfirmConceptSubmissionActionModal = ({
    open,
    title,
    message,
    confirmLabel,
    processing,
    tone = 'neutral',
    onClose,
    onConfirm,
}: ConfirmConceptSubmissionActionModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);

    React.useEffect(() => {
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

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const accentPanelClass = tone === 'danger' ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50';
    const accentIconClass = tone === 'danger' ? 'bg-gradient-to-br from-rose-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600';
    const accentTitleClass = tone === 'danger' ? 'text-rose-900' : 'text-emerald-900';
    const accentTextClass = tone === 'danger' ? 'text-rose-800' : 'text-emerald-800';
    const confirmButtonClass = tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700';

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
                className={`w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className={`rounded-lg border p-3 ${accentPanelClass}`}>
                        <div className="flex items-center gap-2">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm ${accentIconClass}`}>
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${accentTitleClass}`}>
                                    {tone === 'danger' ? 'This action cannot be undone' : 'Please confirm this action'}
                                </p>
                                <p className={`text-xs ${accentTextClass}`}>{message}</p>
                            </div>
                        </div>
                    </div>
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
                            className={`group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${confirmButtonClass}`}
                        >
                            <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                            {processing ? 'Processing...' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmConceptSubmissionActionModal;
