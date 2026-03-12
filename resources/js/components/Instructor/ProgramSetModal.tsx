import { useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, FolderPlus, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ProgramType = 'BSIT' | 'BSIS';

type AddProgramSetForm = {
    name: string;
    program: ProgramType;
    academic_year_id: number | null;
};

type AddProgramSetModalProps = {
    open: boolean;
    onClose: () => void;
};

const AddProgramSetModal = ({ open, onClose }: AddProgramSetModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);

    const addProgramSetForm = useForm<AddProgramSetForm>({
        name: '',
        program: 'BSIT',
        academic_year_id: null,
    });

    const { props } = usePage<any>();
    const academicYears = (props.academicYears ?? []) as { id: number; label: string; is_current: boolean }[];

    useEffect(() => {
        if (academicYears.length && addProgramSetForm.data.academic_year_id === null) {
            // prefer current year if available
            const current = academicYears.find((ay) => ay.is_current);
            addProgramSetForm.setData('academic_year_id', (current ?? academicYears[0]).id);
        }
    }, [academicYears, addProgramSetForm.data.academic_year_id]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !addProgramSetForm.processing) {
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
    }, [open, onClose, addProgramSetForm.processing]);

    useEffect(() => {
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

    const submitForm = () => {
        // post to backend endpoint
        addProgramSetForm.post('/instructor/program-sets', {
            preserveScroll: true,
            onSuccess: () => {
                addProgramSetForm.reset();
                onClose();
            },
        });
    };

    if (!open || typeof document === 'undefined') {
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
                if (event.target === event.currentTarget && !addProgramSetForm.processing) {
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
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <FolderPlus className="h-5 w-5 text-gray-800" />
                        <h2 className="text-lg font-bold text-gray-800">Add Program Set</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={addProgramSetForm.processing}
                        className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-900">Ready to create a new program set?</p>
                                <p className="text-xs text-emerald-800">
                                    Fill in the details below to add a new capstone project set for your students.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Set Name</label>
                            <input
                                value={addProgramSetForm.data.name}
                                onChange={(event) => addProgramSetForm.setData('name', event.target.value)}
                                placeholder="e.g., BSIT-A-20250-2026"
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                            {addProgramSetForm.errors.name ? <p className="mt-1 text-xs text-rose-600">{addProgramSetForm.errors.name}</p> : null}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Program</label>
                                <select
                                    value={addProgramSetForm.data.program}
                                    onChange={(event) => addProgramSetForm.setData('program', event.target.value as ProgramType)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="BSIT">BSIT</option>
                                    <option value="BSIS">BSIS</option>
                                </select>
                                {addProgramSetForm.errors.program ? (
                                    <p className="mt-1 text-xs text-rose-600">{addProgramSetForm.errors.program}</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">School Year</label>
                                <select
                                    value={addProgramSetForm.data.academic_year_id ?? ''}
                                    onChange={(event) =>
                                        addProgramSetForm.setData(
                                            'academic_year_id',
                                            event.target.value ? Number(event.target.value) : null,
                                        )
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                >
                                    {academicYears.length ? (
                                        academicYears.map((ay) => (
                                            <option key={ay.id} value={ay.id}>
                                                {ay.label}{ay.is_current ? ' (current)' : ''}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="">No academic years available</option>
                                        </>
                                    )}
                                </select>
                                {addProgramSetForm.errors.academic_year_id ? (
                                    <p className="mt-1 text-xs text-rose-600">{addProgramSetForm.errors.academic_year_id}</p>
                                ) : null}
                            </div>
                        </div>

                        
                    </form>
                </div>

                <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={addProgramSetForm.processing}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submitForm}
                            disabled={addProgramSetForm.processing}
                            className="group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                            {addProgramSetForm.processing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FolderPlus className="h-4 w-4" />
                                    Create Program Set
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default AddProgramSetModal;
