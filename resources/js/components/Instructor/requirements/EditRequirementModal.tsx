import { useForm } from '@inertiajs/react';
import { AlertCircle, PencilLine, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type AcademicYearOption = {
    value: string;
    label: string;
    isCurrent?: boolean;
};

type RequirementRecord = {
    id: number;
    requirement_type: string;
    due_date: string | null;
    is_mandatory: boolean;
    academic_year_id: number | null;
};

type RequirementFormData = {
    requirement_type: string;
    due_date: string;
    academic_year_id: string;
    is_mandatory: boolean;
};

type EditRequirementModalProps = {
    open: boolean;
    requirement: RequirementRecord | null;
    academicYearOptions: AcademicYearOption[];
    onClose: () => void;
};

const EditRequirementModal = ({ open, requirement, academicYearOptions, onClose }: EditRequirementModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);

    const defaultAcademicYearId = React.useMemo(() => {
        return academicYearOptions.find((option) => option.isCurrent)?.value ?? academicYearOptions[0]?.value ?? '';
    }, [academicYearOptions]);

    const editForm = useForm<RequirementFormData>({
        requirement_type: requirement?.requirement_type ?? '',
        due_date: requirement?.due_date ?? '',
        academic_year_id: requirement?.academic_year_id ? String(requirement.academic_year_id) : defaultAcademicYearId,
        is_mandatory: requirement?.is_mandatory ?? true,
    });

    React.useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            editForm.reset();
            editForm.clearErrors();
            return;
        }

        setIsAppearing(true);

        if (requirement) {
            editForm.setData({
                requirement_type: requirement.requirement_type ?? '',
                due_date: requirement.due_date ?? '',
                academic_year_id: requirement.academic_year_id ? String(requirement.academic_year_id) : defaultAcademicYearId,
                is_mandatory: requirement.is_mandatory ?? true,
            });
        } else {
            editForm.setData({
                requirement_type: '',
                due_date: '',
                academic_year_id: defaultAcademicYearId,
                is_mandatory: true,
            });
        }
    }, [open, requirement, defaultAcademicYearId]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !editForm.processing) {
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
    }, [open, onClose, editForm.processing]);

    const isFormValid =
        editForm.data.requirement_type.trim() !== '' && editForm.data.due_date !== '' && editForm.data.academic_year_id !== '';

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!requirement || !isFormValid || editForm.processing) {
            return;
        }

        editForm.patch(`/instructor/requirements/${requirement.id}`, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                editForm.reset();
                onClose();
            },
        });
    };

    const shouldRender = open || isAppearing;

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
                if (event.target === event.currentTarget && !editForm.processing) {
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
                        <PencilLine className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">Edit Requirement</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={editForm.processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Requirement Type</label>
                        <input
                            type="text"
                            value={editForm.data.requirement_type}
                            onChange={(event) => editForm.setData('requirement_type', event.target.value)}
                            placeholder="e.g., Concept Paper"
                            disabled={editForm.processing}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                        />
                        {editForm.errors.requirement_type ? <p className="mt-1 text-xs text-rose-600">{editForm.errors.requirement_type}</p> : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Academic Year</label>
                            <select
                                value={editForm.data.academic_year_id}
                                onChange={(event) => editForm.setData('academic_year_id', event.target.value)}
                                disabled={editForm.processing}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                            >
                                {academicYearOptions.length === 0 ? (
                                    <option value="" disabled>
                                        No academic years found
                                    </option>
                                ) : (
                                    academicYearOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                            {option.isCurrent ? ' (current)' : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                            {editForm.errors.academic_year_id ? <p className="mt-1 text-xs text-rose-600">{editForm.errors.academic_year_id}</p> : null}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Due Date</label>
                            <input
                                type="date"
                                value={editForm.data.due_date}
                                onChange={(event) => editForm.setData('due_date', event.target.value)}
                                disabled={editForm.processing}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                            />
                            {editForm.errors.due_date ? <p className="mt-1 text-xs text-rose-600">{editForm.errors.due_date}</p> : null}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                    editForm.data.is_mandatory ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'
                                }`}
                            >
                                <AlertCircle className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Mandatory for Defense</p>
                                <p className="text-xs text-slate-500">Blocks defense scheduling until approved.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={editForm.data.is_mandatory}
                                onChange={(event) => editForm.setData('is_mandatory', event.target.checked)}
                                disabled={editForm.processing}
                                className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600" />
                            <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={editForm.processing}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid || editForm.processing}
                            className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Update Requirement
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
};

export default EditRequirementModal;
