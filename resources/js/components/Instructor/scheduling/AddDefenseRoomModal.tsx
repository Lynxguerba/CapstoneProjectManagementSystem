import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { DoorOpen, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import defenseRooms from '../../../routes/instructor/defense-rooms';

type AddDefenseRoomModalProps = {
    open: boolean;
    onClose: () => void;
};

type AddDefenseRoomForm = {
    name: string;
    capacity: string;
    notes: string;
    is_active: boolean;
};

const AddDefenseRoomModal = ({ open, onClose }: AddDefenseRoomModalProps) => {
    const form = useForm<AddDefenseRoomForm>({
        name: '',
        capacity: '',
        notes: '',
        is_active: true,
    });

    const [errorMessage, setErrorMessage] = React.useState('');

    React.useEffect(() => {
        if (!open) {
            form.reset();
            form.clearErrors();
            setErrorMessage('');
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
    }, [open, onClose, form.processing]);

    const submitForm = () => {
        setErrorMessage('');

        form.post(defenseRooms.store.url(), {
            preserveScroll: true,
            onError: (errors) => {
                const firstError = errors.name || errors.capacity || errors.notes || errors.is_active;
                if (firstError) {
                    setErrorMessage(firstError);
                }
            },
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
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
                if (event.target === event.currentTarget && !form.processing) {
                    onClose();
                }
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                            <DoorOpen className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Defense Rooms</p>
                            <h2 className="text-lg font-semibold text-emerald-900">Add New Room</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={form.processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                    {errorMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div>
                        <label className="text-xs font-semibold text-slate-600">Room Name</label>
                        <input
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            placeholder="e.g., Room 201"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-600">Capacity</label>
                        <input
                            type="number"
                            min={1}
                            value={form.data.capacity}
                            onChange={(event) => form.setData('capacity', event.target.value)}
                            placeholder="e.g., 30"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-600">Notes (optional)</label>
                        <textarea
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                            rows={3}
                            placeholder="Add notes about room availability or equipment."
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Mark room as active
                    </label>
                </div>

                <div className="border-t border-emerald-100 bg-white px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={form.processing}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submitForm}
                            disabled={form.processing}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing ? 'Saving...' : 'Save Room'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
};

export default AddDefenseRoomModal;
