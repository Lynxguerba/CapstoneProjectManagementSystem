import { X, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ConceptRejectModalProps = {
    open: boolean;
    groupName?: string | null;
    conceptTitle?: string | null;
    onClose: () => void;
    onConfirm: () => void;
};

const ConceptRejectModal = ({ open, groupName, conceptTitle, onClose, onConfirm }: ConceptRejectModalProps) => {
    const [isAppearing, setIsAppearing] = useState(false);

    useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(true);
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
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
    }, [open, onClose]);

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
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[90vh] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">Reject Submission</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Group</p>
                        <p className="text-sm font-semibold text-slate-800">{groupName ?? 'Selected group'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Submission</p>
                        <p className="text-sm font-semibold text-slate-800">{conceptTitle ?? 'Selected submission'}</p>
                    </div>
                    <p className="text-sm text-slate-600">This will mark the submission as rejected (UI only).</p>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md"
                        >
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConceptRejectModal;
