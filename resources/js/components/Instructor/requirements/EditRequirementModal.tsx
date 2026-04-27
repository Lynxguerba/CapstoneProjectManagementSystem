import { useForm } from '@inertiajs/react';
import { PencilLine, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import { getRequirementTypeOptions, type RequirementStage } from './requirementTypeOptions';

type AcademicYearOption = {
    value: string;
    label: string;
    isCurrent?: boolean;
};

type RequirementRecord = {
    id: number;
    requirement_type: string;
    due_date: string | null;
    academic_year_id: number | null;
};

type RequirementFormData = {
    requirement_type: string;
    due_date: string;
    academic_year_id: string;
};

type EditRequirementModalProps = {
    open: boolean;
    requirement: RequirementRecord | null;
    academicYearOptions: AcademicYearOption[];
    stage?: RequirementStage;
    onClose: () => void;
};

const EditRequirementModal = ({ open, requirement, academicYearOptions, stage = 'Concept', onClose }: EditRequirementModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);

    const defaultAcademicYearId = React.useMemo(() => {
        return academicYearOptions.find((option) => option.isCurrent)?.value ?? academicYearOptions[0]?.value ?? '';
    }, [academicYearOptions]);

    const requirementTypeOptions = React.useMemo(() => {
        return getRequirementTypeOptions(stage, requirement?.requirement_type ?? null);
    }, [requirement?.requirement_type, stage]);

    const editForm = useForm<RequirementFormData>({
        requirement_type: requirement?.requirement_type ?? '',
        due_date: requirement?.due_date ?? '',
        academic_year_id: requirement?.academic_year_id ? String(requirement.academic_year_id) : defaultAcademicYearId,
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
            });
        } else {
            editForm.setData({
                requirement_type: '',
                due_date: '',
                academic_year_id: defaultAcademicYearId,
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

    const isFormValid = editForm.data.requirement_type.trim() !== '' && editForm.data.due_date !== '' && editForm.data.academic_year_id !== '';

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
                        <select
                            value={editForm.data.requirement_type}
                            onChange={(event) => editForm.setData('requirement_type', event.target.value)}
                            disabled={editForm.processing}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                        >
                            <option value="" disabled>
                                Select requirement type
                            </option>
                            {requirementTypeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
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
                            {editForm.errors.academic_year_id ? (
                                <p className="mt-1 text-xs text-rose-600">{editForm.errors.academic_year_id}</p>
                            ) : null}
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
