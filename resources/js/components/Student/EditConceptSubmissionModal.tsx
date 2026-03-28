import { useForm } from '@inertiajs/react';
import { FilePenLine, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type EditableSubmission = {
    id: number;
    title: string;
    status: string;
    requirementType: string;
    submittedAt?: string | null;
};

type EditConceptSubmissionModalProps = {
    open: boolean;
    submission: EditableSubmission | null;
    onClose: () => void;
    onSuccess?: () => void;
};

type EditConceptSubmissionForm = {
    title: string;
};

const EditConceptSubmissionModal = ({ open, submission, onClose, onSuccess }: EditConceptSubmissionModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const form = useForm<EditConceptSubmissionForm>({
        title: submission?.title ?? '',
    });
    const submissionId = submission?.id ?? null;
    const submissionTitle = submission?.title ?? '';
    const { clearErrors, data, errors, patch, processing, reset, setData } = form;

    React.useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            reset();
            clearErrors();
            return;
        }

        setIsAppearing(false);
        clearErrors();
        setData('title', submissionTitle);

        const animationFrame = window.requestAnimationFrame(() => {
            setIsAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [clearErrors, open, reset, setData, submissionId, submissionTitle]);

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

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!submission || processing || data.title.trim() === '') {
            return;
        }

        patch(`/student/concepts/submissions/${submission.id}`, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                onClose();
                onSuccess?.();
            },
        });
    };

    return createPortal(
        <div
            className={`fixed inset-0 z-[10020] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
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
                        <FilePenLine className="h-5 w-5 text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-800">Edit Concept Details</h2>
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

                <div className="space-y-4 p-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                                <FilePenLine className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-900">Update submission details</p>
                                <p className="text-xs text-emerald-800">Edit the concept title shown for this submission record.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Requirement</label>
                            <div className="mt-1.5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                                {submission?.requirementType ?? 'Concept Paper'}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Status</label>
                            <div className="mt-1.5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                                {submission?.status ?? 'Submitted'}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Concept Title</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(event) => setData('title', event.target.value)}
                                disabled={processing}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                            />
                            {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
                        </div>

                        <div className="mt-4 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-0 pt-3">
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
                                    type="submit"
                                    disabled={processing || data.title.trim() === ''}
                                    className="group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default EditConceptSubmissionModal;
