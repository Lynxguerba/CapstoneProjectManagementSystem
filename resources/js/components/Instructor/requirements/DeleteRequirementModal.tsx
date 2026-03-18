import { useForm } from '@inertiajs/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type RequirementRecord = {
    id: number;
    requirement_type: string;
    due_date: string | null;
    is_mandatory: boolean;
    academic_year_id: number | null;
    academic_year_label?: string | null;
};

type DeleteRequirementModalProps = {
    open: boolean;
    requirement: RequirementRecord | null;
    onClose: () => void;
};

const formatDateLabel = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
        return value;
    }

    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const DeleteRequirementModal = ({ open, requirement, onClose }: DeleteRequirementModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const deleteForm = useForm({});

    React.useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            deleteForm.reset();
            return;
        }

        setIsAppearing(true);
    }, [open]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !deleteForm.processing) {
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
    }, [open, onClose, deleteForm.processing]);

    const handleDelete = () => {
        if (!requirement || deleteForm.processing) {
            return;
        }

        deleteForm.delete(`/instructor/requirements/${requirement.id}`, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                deleteForm.reset();
                onClose();
            },
        });
    };

    const shouldRender = open || isAppearing;
    const requirementLabel = requirement?.requirement_type?.trim() || 'this requirement';
    const dueDateLabel = formatDateLabel(requirement?.due_date ?? null);

    if (!shouldRender) {
        return null;
    }

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !deleteForm.processing) {
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
                <div className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                            <AlertTriangle className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-rose-900">Delete Requirement</p>
                            <p className="text-xs text-rose-700">This action cannot be undone.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleteForm.processing}
                        className="rounded-lg p-1.5 text-rose-700 transition-all duration-200 hover:rotate-90 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-3 px-4 py-5">
                    <p className="text-sm text-slate-700">
                        Remove <span className="font-semibold text-slate-900">{requirementLabel}</span> from the requirements list?
                    </p>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        Due date: <span className="font-semibold text-rose-900">{dueDateLabel}</span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleteForm.processing}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteForm.processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        {deleteForm.processing ? 'Deleting...' : 'Delete Requirement'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default DeleteRequirementModal;
