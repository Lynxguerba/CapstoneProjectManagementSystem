import { motion } from 'framer-motion';
import { PencilLine, RefreshCcw, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import ProgramSetRenameModal from './ProgramSetRenameModal';

type ProgramSetDetails = {
    id: number;
    name: string;
    program: string;
    school_year: string;
    instructor_name?: string | null;
};

type EnrolledStudent = {
    id: number;
    fullName: string;
    email?: string;
    program?: string | null;
    status: 'active' | 'inactive';
    createdAt: string;
};

type ProgramSetDetailsModalProps = {
    open: boolean;
    onClose: () => void;
    programSetId?: number | null;
};

const ProgramSetDetailsModal = ({ open, onClose, programSetId }: ProgramSetDetailsModalProps) => {
    const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [programSet, setProgramSet] = React.useState<ProgramSetDetails | null>(null);
    const [students, setStudents] = React.useState<EnrolledStudent[]>([]);

    React.useEffect(() => {
        if (!open || !programSetId) {
            return;
        }

        let isActive = true;
        const controller = new AbortController();

        const loadDetails = async () => {
            setIsLoading(true);
            setErrorMessage('');
            setProgramSet(null);
            setStudents([]);

            try {
                const response = await fetch(`/instructor/students/${programSetId}/details`, {
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Failed to load program set details.');
                }

                const payload = await response.json();
                if (!isActive) {
                    return;
                }

                setProgramSet(payload.programSet ?? null);
                setStudents(Array.isArray(payload.enrolledStudents) ? payload.enrolledStudents : []);
            } catch (error) {
                if (!isActive || controller.signal.aborted) {
                    return;
                }

                setErrorMessage('Unable to load program set details right now.');
                setProgramSet(null);
                setStudents([]);
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        loadDetails();

        return () => {
            isActive = false;
            controller.abort();
        };
    }, [open, programSetId]);

    React.useEffect(() => {
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

    const closeModal = () => {
        onClose();
    };

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isRenameModalOpen) {
                    closeModal();
                }
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Program Set</p>
                        <div className="mt-1 flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-slate-900">{programSet?.name ?? 'Loading...'}</h2>
                            <button
                                type="button"
                                onClick={() => setIsRenameModalOpen(true)}
                                disabled={!programSet}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <PencilLine className="h-3 w-3" />
                                Rename
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (!programSetId) {
                                    return;
                                }

                                setIsLoading(true);
                                fetch(`/instructor/students/${programSetId}/details`, {
                                    headers: {
                                        Accept: 'application/json',
                                    },
                                })
                                    .then((response) => {
                                        if (!response.ok) {
                                            throw new Error('Failed to load program set details.');
                                        }

                                        return response.json();
                                    })
                                    .then((payload) => {
                                        setProgramSet(payload.programSet ?? null);
                                        setStudents(Array.isArray(payload.enrolledStudents) ? payload.enrolledStudents : []);
                                    })
                                    .catch(() => {
                                        setErrorMessage('Unable to load program set details right now.');
                                    })
                                    .finally(() => {
                                        setIsLoading(false);
                                    });
                            }}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    {errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
                    ) : null}

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase">Enrolled Students</p>
                            <p className="text-xs font-semibold text-slate-500">{students.length} total</p>
                        </div>
                        <div className="max-h-[45vh] overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Fullname</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Program</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-emerald-50/40">
                                            <td className="px-4 py-3 font-semibold text-slate-800">{student.fullName}</td>
                                            <td className="px-4 py-3 text-slate-500">{student.email ?? '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{student.program ?? 'Unassigned'}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                        student.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-200 text-slate-600'
                                                    }`}
                                                >
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{student.createdAt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!isLoading && students.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-500">No students enrolled yet.</div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </motion.div>
            <ProgramSetRenameModal
                open={isRenameModalOpen}
                programSetId={programSet?.id ?? 0}
                currentName={programSet?.name ?? ''}
                onClose={() => setIsRenameModalOpen(false)}
                onRenamed={(name) => {
                    setProgramSet((previous) => (previous ? { ...previous, name } : previous));
                }}
            />
        </div>,
        document.body,
    );
};

export default ProgramSetDetailsModal;
