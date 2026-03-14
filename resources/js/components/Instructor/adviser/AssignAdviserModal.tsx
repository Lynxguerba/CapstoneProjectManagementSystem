import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Search, UserCheck, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import adviserAssignment from '../../../routes/instructor/adviser-assignment';

type AdviserOption = {
    id: number;
    name: string;
    email: string;
    advised_groups_count: number;
};

type AssignAdviserModalProps = {
    open: boolean;
    groupId?: number | null;
    groupName?: string | null;
    currentAdviser?: string | null;
    advisers: AdviserOption[];
    onClose: () => void;
};

const MAX_LOAD = 5;

const AssignAdviserModal = ({
    open,
    groupId,
    groupName,
    currentAdviser,
    advisers,
    onClose,
}: AssignAdviserModalProps) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isAssigning, setIsAssigning] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            setSearchQuery('');
            setIsAssigning(false);
        }
    }, [open]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isAssigning) {
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
    }, [open, onClose, isAssigning]);

    const filteredAdvisers = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return advisers;
        }

        return advisers.filter((adviser) => {
            return adviser.name.toLowerCase().includes(query) || adviser.email.toLowerCase().includes(query);
        });
    }, [advisers, searchQuery]);

    const assignAdviser = (adviserId: number) => {
        if (!groupId || isAssigning) {
            return;
        }

        setIsAssigning(true);

        router.post(
            adviserAssignment.assign.url(),
            {
                group_id: groupId,
                adviser_id: adviserId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['groups', 'advisers'] });
                    onClose();
                },
                onFinish: () => {
                    setIsAssigning(false);
                },
            },
        );
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
                if (event.target === event.currentTarget && !isAssigning) {
                    onClose();
                }
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Assign Adviser</p>
                        <h2 className="text-lg font-semibold text-emerald-900">{groupName ?? 'Selected Group'}</h2>
                        <p className="text-xs text-emerald-700">Current adviser: {currentAdviser || 'Unassigned'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isAssigning}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search adviser by name or email"
                            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-3">
                        {filteredAdvisers.map((adviser) => {
                            const load = adviser.advised_groups_count ?? 0;
                            const progress = Math.min(100, Math.round((load / MAX_LOAD) * 100));
                            const isFull = load >= MAX_LOAD;
                            const status = isFull ? 'Full' : load >= MAX_LOAD - 1 ? 'Partial' : 'Available';
                            const statusClasses = isFull
                                ? 'bg-rose-100 text-rose-700'
                                : status === 'Partial'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700';

                            return (
                                <div
                                    key={adviser.id}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{adviser.name}</p>
                                            <p className="text-xs text-slate-500">{adviser.email}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>{status}</span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                                        <span>Load: {load} / {MAX_LOAD}</span>
                                        <button
                                            type="button"
                                            onClick={() => assignAdviser(adviser.id)}
                                            disabled={isAssigning || isFull}
                                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <UserCheck className="h-3 w-3" />
                                            Assign
                                        </button>
                                    </div>

                                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            );
                        })}

                        {filteredAdvisers.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                                No advisers match your search.
                            </div>
                        ) : null}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
};

export default AssignAdviserModal;
