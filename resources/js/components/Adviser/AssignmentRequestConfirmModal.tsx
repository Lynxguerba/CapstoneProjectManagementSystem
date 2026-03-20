import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type AssignmentRequestConfirmModalProps = {
    open: boolean;
    action: 'dismiss' | 'decline';
    groupName?: string | null;
    processing?: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const AssignmentRequestConfirmModal = ({
    open,
    action,
    groupName,
    processing = false,
    onClose,
    onConfirm,
}: AssignmentRequestConfirmModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const isDecline = action === 'decline';
    const title = isDecline ? 'Decline assignment request' : 'Remove reassignment notice';
    const description = isDecline
        ? 'This request will be removed from your list and the instructor will be notified.'
        : 'This notice will be removed from your list.';
    const confirmLabel = isDecline ? 'Decline Request' : 'Remove Notice';

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
    }, [open, onClose, processing]);

    const shouldRender = open || isAppearing;

    if (!shouldRender) {
        return null;
    }

    if (typeof document === 'undefined') {
        return null;
    }

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
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                            <AlertTriangle className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-rose-900">{title}</p>
                            <p className="text-xs text-rose-700">Please confirm this action.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg p-1.5 text-rose-700 transition-all duration-200 hover:rotate-90 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-3 px-4 py-5">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Group</p>
                        <p className="text-sm font-semibold text-slate-800">{groupName ?? 'Selected group'}</p>
                    </div>
                    <p className="text-sm text-slate-600">{description}</p>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? 'Working...' : confirmLabel}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
};

export default AssignmentRequestConfirmModal;
