import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
        panel: panel ? panel.split(',').map((x) => x.trim()).filter(Boolean) : ['TBD'],
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Schedule Table</h3>
              <p className="text-sm text-slate-500">Conflict detection demo included</p>
            </div>
            <button
              onClick={() => alert('UI only: open bulk scheduling flow')}
              className="bg-white border border-slate-300 text-slate-800 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-medium"
            >
              Bulk Schedule
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-4 font-semibold">Group</th>
                  <th className="text-left py-4 font-semibold">Date</th>
                  <th className="text-left py-4 font-semibold">Time</th>
                  <th className="text-left py-4 font-semibold">Room</th>
                  <th className="text-left py-4 font-semibold">Panel</th>
                  <th className="text-left py-4 font-semibold">Payment</th>
                  <th className="text-left py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-medium text-slate-800">{r.group}</td>
                    <td className="py-4 text-slate-600">{r.date}</td>
                    <td className="py-4 text-slate-600">{r.time}</td>
                    <td className="py-4 text-slate-600">{r.room}</td>
                    <td className="py-4 text-slate-600">{r.panel.join(', ')}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(r.paymentStatus)}`}>{r.paymentStatus}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert('UI only: edit schedule')}
                          className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => alert('UI only: view group details')}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition"
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
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
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />

            <div className="mt-3 space-y-3">
              {dayItems.length === 0 ? <div className="text-sm text-slate-500">No schedules for this day.</div> : null}
              {dayItems.map((r) => (
                <div key={r.id} className="p-4 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{r.group}</div>
                      <div className="text-sm text-slate-600 mt-1">{r.room} • {r.time}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(r.paymentStatus)}`}>{r.paymentStatus}</span>
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
                className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Time</option>
                <option>8:00 AM - 9:00 AM</option>
                <option>9:00 AM - 10:00 AM</option>
                <option>10:00 AM - 11:00 AM</option>
              </select>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Room</option>
                <option>Room 101</option>
                <option>Room 102</option>
              </select>
              <input
                value={panel}
                onChange={(e) => setPanel(e.target.value)}
                placeholder="Panel (comma-separated)"
                className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={addSchedule}
                className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
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
