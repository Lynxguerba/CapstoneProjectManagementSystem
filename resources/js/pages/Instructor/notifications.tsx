import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import InstructorLayout from './_layout';

type NotificationType = 'Concept Submitted' | 'Adviser Approved' | 'Evaluation Submitted' | 'Deadline Approaching' | 'Payment Verified';

type NotificationRow = {
    id: string;
    type: NotificationType;
    message: string;
    at: string;
    unread: boolean;
};

const NotificationsPage = () => {
    const [type, setType] = useState<'all' | NotificationType>('all');
    const [onlyUnread, setOnlyUnread] = useState(false);

    const rows: NotificationRow[] = [
        { id: 'n1', type: 'Concept Submitted', message: 'Group 1 submitted a concept paper.', at: '2026-03-12 09:02', unread: true },
        { id: 'n2', type: 'Adviser Approved', message: 'Adviser approved Group 2 concept.', at: '2026-03-10 13:11', unread: false },
        { id: 'n3', type: 'Evaluation Submitted', message: 'Panel evaluation submitted for Group 2.', at: '2026-03-20 10:40', unread: true },
        { id: 'n4', type: 'Deadline Approaching', message: 'Concept deadline is in 3 days.', at: '2026-03-22 08:00', unread: true },
        { id: 'n5', type: 'Payment Verified', message: 'Payment verified for Group 1.', at: '2026-03-12 14:30', unread: false },
    ];

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            const matchesType = type === 'all' || r.type === type;
            const matchesUnread = !onlyUnread || r.unread;
            return matchesType && matchesUnread;
        });
    }, [rows, type, onlyUnread]);

    const pill = (t: NotificationType) => {
        const map: Record<NotificationType, string> = {
            'Concept Submitted': 'bg-indigo-100 text-indigo-700',
            'Adviser Approved': 'bg-teal-100 text-teal-700',
            'Evaluation Submitted': 'bg-amber-100 text-amber-700',
            'Deadline Approaching': 'bg-rose-100 text-rose-700',
            'Payment Verified': 'bg-slate-100 text-slate-700',
        };

        return map[t];
    };

    return (
        <InstructorLayout title="Notifications" subtitle="Central notification center (UI only)">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Inbox</h3>
                            <p className="text-sm text-slate-500">Filter by type and unread</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="Concept Submitted">Concept Submitted</option>
                                <option value="Adviser Approved">Adviser Approved</option>
                                <option value="Evaluation Submitted">Evaluation Submitted</option>
                                <option value="Deadline Approaching">Deadline Approaching</option>
                                <option value="Payment Verified">Payment Verified</option>
                            </select>

                            <button
                                onClick={() => setOnlyUnread((v) => !v)}
                                className={`rounded-xl border px-5 py-2.5 text-sm font-medium shadow-sm transition-all ${onlyUnread ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
                            >
                                {onlyUnread ? 'Showing Unread' : 'Show Unread Only'}
                            </button>

                            <button
                                onClick={() => alert('UI only: mark all read')}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-50"
                            >
                                Mark All Read
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                        {filtered.map((r) => (
                            <div
                                key={r.id}
                                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill(r.type)}`}>{r.type}</span>
                                        {r.unread ? <span className="text-xs font-semibold text-rose-600">Unread</span> : null}
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-slate-800">{r.message}</div>
                                    <div className="mt-1 text-xs text-slate-500">{r.at}</div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => alert('UI only: open notification')}
                                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        Open
                                    </button>
                                    <button
                                        onClick={() => alert('UI only: dismiss notification')}
                                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filtered.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-500">No notifications for this filter.</div>
                        ) : null}
                    </div>
                </div>
            </motion.div>
        </InstructorLayout>
    );
};

export default NotificationsPage;
