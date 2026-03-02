import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import InstructorLayout from './_layout';

type DeadlineRow = {
    id: string;
    phase: string;
    due: string;
    status: 'On Track' | 'Near Deadline' | 'Overdue';
    reason?: string;
};

const DeadlinesPage = () => {
    const [phase, setPhase] = useState('Concept');
    const [due, setDue] = useState('');
    const [reason, setReason] = useState('');

    const [rows, setRows] = useState<DeadlineRow[]>([
        { id: 'd1', phase: 'Concept', due: '2026-03-25', status: 'Near Deadline' },
        { id: 'd2', phase: 'Proposal', due: '2026-04-10', status: 'On Track' },
        { id: 'd3', phase: 'Final Manuscript', due: '2026-04-15', status: 'On Track' },
        { id: 'd4', phase: 'Defense', due: '2026-04-20', status: 'On Track' },
    ]);

    const statusColor = (value: DeadlineRow['status']) => {
        const map: Record<DeadlineRow['status'], string> = {
            'On Track': 'bg-teal-100 text-teal-700',
            'Near Deadline': 'bg-amber-100 text-amber-700',
            Overdue: 'bg-rose-100 text-rose-700',
        };

        return map[value];
    };

    const countdown = useMemo(() => {
        const to = rows[0]?.due;
        if (!to) {
            return null;
        }

        const dueDate = new Date(to);
        const now = new Date();
        const diff = dueDate.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return Number.isFinite(days) ? days : null;
    }, [rows]);

    const addDeadline = () => {
        if (!phase || !due) {
            alert('Please fill phase and date. (UI only)');
            return;
        }

        setRows([
            {
                id: `${Date.now()}`,
                phase,
                due,
                status: 'On Track',
                reason: reason || undefined,
            },
            ...rows,
        ]);

        setDue('');
        setReason('');
    };

    return (
        <InstructorLayout title="Deadline Management" subtitle="Set deadlines, extend with reason, and monitor status colors">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Deadlines</h3>
                                <p className="text-sm text-slate-500">Green / Yellow / Red indicators (UI only)</p>
                            </div>
                            <button
                                onClick={() => alert('UI only: notify 3 days before deadline')}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-50"
                            >
                                Trigger Reminder
                            </button>
                        </div>

                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-600">
                                        <th className="py-4 text-left font-semibold">Phase</th>
                                        <th className="py-4 text-left font-semibold">Deadline</th>
                                        <th className="py-4 text-left font-semibold">Status</th>
                                        <th className="py-4 text-left font-semibold">Extension Reason</th>
                                        <th className="py-4 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map((r) => (
                                        <tr key={r.id} className="transition-colors hover:bg-slate-50">
                                            <td className="py-4 font-medium text-slate-800">{r.phase}</td>
                                            <td className="py-4 text-slate-600">{r.due}</td>
                                            <td className="py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(r.status)}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-slate-600">{r.reason ?? '—'}</td>
                                            <td className="py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => alert('UI only: extend deadline')}
                                                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                    >
                                                        Extend
                                                    </button>
                                                    <button
                                                        onClick={() => alert('UI only: edit deadline')}
                                                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800">Set / Extend</h3>
                        <p className="mt-1 text-sm text-slate-500">UI form only</p>

                        <div className="mt-6 space-y-3">
                            <label className="text-sm font-semibold text-slate-700">Phase</label>
                            <select
                                value={phase}
                                onChange={(e) => setPhase(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Concept</option>
                                <option>Proposal</option>
                                <option>Final Manuscript</option>
                                <option>Defense</option>
                            </select>

                            <label className="text-sm font-semibold text-slate-700">Deadline Date</label>
                            <input
                                type="date"
                                value={due}
                                onChange={(e) => setDue(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />

                            <label className="text-sm font-semibold text-slate-700">Reason (optional)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                placeholder="Reason for extension..."
                            />

                            <button
                                onClick={addDeadline}
                                className="w-full rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
                            >
                                Save Deadline
                            </button>

                            {countdown !== null ? (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                                    <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Countdown (Top Deadline)</div>
                                    <div className="mt-2 text-2xl font-bold text-slate-900">{countdown} day(s)</div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </motion.div>
        </InstructorLayout>
    );
};

export default DeadlinesPage;
