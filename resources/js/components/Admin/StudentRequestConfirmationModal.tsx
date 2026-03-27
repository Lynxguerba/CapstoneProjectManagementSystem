import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type PendingAction = 'approve' | 'reject';

type StudentPreview = {
    fullName: string;
    email?: string;
    program?: string;
    status: string;
    createdAt: string;
};

type StudentRequestConfirmationModalProps = {
    open: boolean;
    action: PendingAction | null;
    student: StudentPreview | null;
    processing: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const StudentRequestConfirmationModal = ({
    open,
    action,
    student,
    processing,
    onClose,
    onConfirm,
}: StudentRequestConfirmationModalProps) => {
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
    }, [open, onClose, processing]);

    if (!open || !action || !student) {
        return null;
    }

    if (typeof document === 'undefined') {
        return null;
    }

    const isApprove = action === 'approve';
    const title = isApprove ? 'Approve Student Request' : 'Reject Student Request';
    const confirmationLabel = isApprove ? 'Approve Request' : 'Reject Request';
    const tone = isApprove
        ? {
              icon: CheckCircle2,
              accent: 'text-emerald-700',
              panel: 'border-emerald-200 bg-emerald-50',
              button: 'bg-emerald-600 hover:bg-emerald-700',
          }
        : {
              icon: AlertTriangle,
              accent: 'text-rose-700',
              panel: 'border-rose-200 bg-rose-50',
              button: 'bg-rose-600 hover:bg-rose-700',
          };

    const ToneIcon = tone.icon;

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
                className={`max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <ToneIcon className={`h-5 w-5 ${tone.accent}`} />
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

                <div className="space-y-3 p-4">
                    <div className={`rounded-lg border p-3 ${tone.panel}`}>
                        <p className={`text-sm font-bold ${tone.accent}`}>
                            {isApprove ? 'Confirm approval for this student request?' : 'Confirm rejection for this student request?'}
                        </p>
                        <p className={`mt-1 text-xs ${tone.accent}`}>
                            {isApprove
                                ? 'This will approve the account and update the student status.'
                                : 'This will reject the account request and apply the rejection action.'}
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Request Preview</p>
                        <div className="space-y-1.5 text-sm text-slate-700">
                            <p>
                                <span className="font-semibold text-slate-900">Name:</span> {student.fullName}
                            </p>
                            <p>
                                <span className="font-semibold text-slate-900">Email:</span> {student.email ?? '—'}
                            </p>
                            <p>
                                <span className="font-semibold text-slate-900">Program:</span> {student.program ?? 'Unassigned'}
                            </p>
                            <p>
                                <span className="font-semibold text-slate-900">Status:</span> {student.status}
                            </p>
                            <p>
                                <span className="font-semibold text-slate-900">Created:</span> {student.createdAt}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tone.button}`}
                    >
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {processing ? 'Processing...' : confirmationLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default StudentRequestConfirmationModal;
