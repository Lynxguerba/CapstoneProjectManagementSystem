import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import InstructorLayout from './_layout';

type ScheduleRow = {
    id: string;
    group: string;
    date: string;
    time: string;
    room: string;
    panel: string[];
    paymentStatus: 'Unpaid' | 'Paid' | 'Verified';
};

const SchedulingPage = () => {
    const [group, setGroup] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [room, setRoom] = useState('');
    const [panel, setPanel] = useState('');

    const [rows, setRows] = useState<ScheduleRow[]>([
        {
            id: 's1',
            group: 'Group 2',
            date: '2026-03-20',
            time: '9:00 AM - 10:00 AM',
            room: 'Room 101',
            panel: ['Prof. A', 'Prof. B', 'Prof. C'],
            paymentStatus: 'Paid',
        },
    ]);

    const [calendarDay, setCalendarDay] = useState('2026-03-20');

    const addSchedule = () => {
        if (!group || !date || !time || !room) {
            alert('Please complete group, date, time, and room. (UI only)');
            return;
        }

        const conflict = rows.find((r) => r.date === date && r.time === time && r.room === room);
        if (conflict) {
            alert('Schedule conflict detected (UI only).');
            return;
        }

        setRows([
            ...rows,
            {
                id: `${Date.now()}`,
                group,
                date,
                time,
                room,
                panel: panel
                    ? panel
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean)
                    : ['TBD'],
                paymentStatus: 'Verified',
            },
        ]);

        setGroup('');
        setDate('');
        setTime('');
        setRoom('');
        setPanel('');
    };

    const dayItems = useMemo(() => rows.filter((r) => r.date === calendarDay), [rows, calendarDay]);

    const badge = (value: ScheduleRow['paymentStatus']) => {
        const map: Record<ScheduleRow['paymentStatus'], string> = {
            Unpaid: 'bg-rose-100 text-rose-700',
            Paid: 'bg-amber-100 text-amber-700',
            Verified: 'bg-teal-100 text-teal-700',
        };

        return map[value];
    };

    return (
        <InstructorLayout title="Defense Scheduling" subtitle="Calendar + schedule table (UI only)">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Schedule Table</h3>
                            <p className="text-sm text-slate-500">Conflict detection demo included</p>
                        </div>
                        <button
                            onClick={() => alert('UI only: open bulk scheduling flow')}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 transition-all hover:bg-slate-50"
                        >
                            Bulk Schedule
                        </button>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-4 text-left font-semibold">Group</th>
                                    <th className="py-4 text-left font-semibold">Date</th>
                                    <th className="py-4 text-left font-semibold">Time</th>
                                    <th className="py-4 text-left font-semibold">Room</th>
                                    <th className="py-4 text-left font-semibold">Panel</th>
                                    <th className="py-4 text-left font-semibold">Payment</th>
                                    <th className="py-4 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((r) => (
                                    <tr key={r.id} className="transition-colors hover:bg-slate-50">
                                        <td className="py-4 font-medium text-slate-800">{r.group}</td>
                                        <td className="py-4 text-slate-600">{r.date}</td>
                                        <td className="py-4 text-slate-600">{r.time}</td>
                                        <td className="py-4 text-slate-600">{r.room}</td>
                                        <td className="py-4 text-slate-600">{r.panel.join(', ')}</td>
                                        <td className="py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(r.paymentStatus)}`}>
                                                {r.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => alert('UI only: edit schedule')}
                                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => alert('UI only: view group details')}
                                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Calendar (Simplified)</h3>
                        <p className="text-sm text-slate-500">Pick a date to see scheduled defenses</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">Date</label>
                        <input
                            type="date"
                            value={calendarDay}
                            onChange={(e) => setCalendarDay(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="mt-3 space-y-3">
                            {dayItems.length === 0 ? <div className="text-sm text-slate-500">No schedules for this day.</div> : null}
                            {dayItems.map((r) => (
                                <div key={r.id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-slate-800">{r.group}</div>
                                            <div className="mt-1 text-sm text-slate-600">
                                                {r.room} • {r.time}
                                            </div>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(r.paymentStatus)}`}>
                                            {r.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        <h4 className="font-semibold text-slate-800">Add Schedule</h4>
                        <div className="mt-4 grid grid-cols-1 gap-3">
                            <input
                                value={group}
                                onChange={(e) => setGroup(e.target.value)}
                                placeholder="Group (e.g., Group 1)"
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Time</option>
                                <option>8:00 AM - 9:00 AM</option>
                                <option>9:00 AM - 10:00 AM</option>
                                <option>10:00 AM - 11:00 AM</option>
                            </select>
                            <select
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Room</option>
                                <option>Room 101</option>
                                <option>Room 102</option>
                            </select>
                            <input
                                value={panel}
                                onChange={(e) => setPanel(e.target.value)}
                                placeholder="Panel (comma-separated)"
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={addSchedule}
                                className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-3 font-medium text-white transition-all hover:shadow-lg"
                            >
                                Add Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </InstructorLayout>
    );
};

export default SchedulingPage;
