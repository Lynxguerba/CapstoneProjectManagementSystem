import { useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { PencilLine, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type ProgramSetRenameModalProps = {
    open: boolean;
    programSetId: number;
    currentName: string;
    onClose: () => void;
    onRenamed: (name: string) => void;
};

const ProgramSetRenameModal = ({ open, programSetId, currentName, onClose, onRenamed }: ProgramSetRenameModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);

    const renameForm = useForm<{ name: string }>({
        name: currentName,
    });

    React.useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(true);
        renameForm.setData('name', currentName);
    }, [open, currentName]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !renameForm.processing) {
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
    }, [open, onClose, renameForm.processing]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        renameForm.put(`/instructor/program-sets/${programSetId}`, {
            preserveScroll: true,
            onSuccess: () => {
                onRenamed(renameForm.data.name);
                router.reload({ only: ['programSets'] });
                onClose();
            },
        });
    };

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !renameForm.processing) {
                    onClose();
                }
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <PencilLine className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-emerald-900">Rename Program Set</p>
                            <p className="text-xs text-emerald-700">Update the title for this program set.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={renameForm.processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Program Set Name</label>
                        <input
                            value={renameForm.data.name}
                            onChange={(event) => renameForm.setData('name', event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                            placeholder="Enter program set name"
                        />
                        {renameForm.errors.name ? <p className="mt-1 text-xs text-rose-600">{renameForm.errors.name}</p> : null}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={renameForm.processing}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={renameForm.processing}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {renameForm.processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>,
        document.body,
    );
};

export default ProgramSetRenameModal;
