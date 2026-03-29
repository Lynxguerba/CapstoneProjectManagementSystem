import { useForm } from '@inertiajs/react';
import { FilePlus, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type AcademicYearOption = {
    value: string;
    label: string;
    isCurrent?: boolean;
};

type RequirementFormData = {
    requirement_type: string;
    due_date: string;
    academic_year_id: string;
};

type AddRequirementModalProps = {
    open: boolean;
    academicYearOptions: AcademicYearOption[];
    defaultAcademicYearId: string;
    onClose: () => void;
};

const requirementTypeOptions = ['Concept Papers', 'Manuscript', 'Minutes', 'Recommendation Letter', 'Acknowledgement Receipt', 'Evaluation Sheet'];

const AddRequirementModal = ({ open, academicYearOptions, defaultAcademicYearId, onClose }: AddRequirementModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const wasOpen = React.useRef(false);
    const form = useForm<RequirementFormData>({
        requirement_type: '',
        due_date: '',
        academic_year_id: defaultAcademicYearId,
    });

    React.useEffect(() => {
        if (!open) {
            if (wasOpen.current) {
                wasOpen.current = false;
                setIsAppearing(false);
                form.reset();
                form.clearErrors();
            }
            return;
        }

        if (!wasOpen.current) {
            wasOpen.current = true;
            setIsAppearing(true);
            form.setData({
                requirement_type: '',
                due_date: '',
                academic_year_id: defaultAcademicYearId,
            });
        }
    }, [defaultAcademicYearId, open]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !form.processing) {
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
    }, [form.processing, onClose, open]);

    const isFormValid = form.data.requirement_type.trim() !== '' && form.data.due_date !== '' && form.data.academic_year_id !== '';

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isFormValid || form.processing) {
            return;
        }

        form.post('/instructor/requirements', {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                form.reset();
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
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !form.processing) {
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
                        <FilePlus className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">Add Requirement</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={form.processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Requirement Type</label>
                        <select
                            value={form.data.requirement_type}
                            onChange={(event) => form.setData('requirement_type', event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
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
                        {form.errors.requirement_type ? <p className="mt-1 text-xs text-rose-600">{form.errors.requirement_type}</p> : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Academic Year</label>
                            <select
                                value={form.data.academic_year_id}
                                onChange={(event) => form.setData('academic_year_id', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
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
                            {form.errors.academic_year_id ? <p className="mt-1 text-xs text-rose-600">{form.errors.academic_year_id}</p> : null}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Due Date</label>
                            <input
                                type="date"
                                value={form.data.due_date}
                                onChange={(event) => form.setData('due_date', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                            {form.errors.due_date ? <p className="mt-1 text-xs text-rose-600">{form.errors.due_date}</p> : null}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={form.processing}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid || form.processing}
                            className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Save Requirement
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
};

export default AddRequirementModal;
