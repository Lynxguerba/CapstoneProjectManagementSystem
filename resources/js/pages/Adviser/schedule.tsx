import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarDays, List } from 'lucide-react';
import AdviserLayout from './_layout';

type ViewMode = 'calendar' | 'list';

type ScheduleItem = {
  id: string;
  group: string;
  date: string;
  time: string;
  room: string;
  panel: string;
  status: 'Scheduled' | 'Completed' | 'Re-Defense';
};

const AdviserSchedule = () => {
  const [view, setView] = useState<ViewMode>('list');

  const items: ScheduleItem[] = [
    {
      id: 's1',
      group: 'Group Beta',
      date: '2026-03-21',
      time: '9:00 AM - 10:00 AM',
      room: 'Room 101',
      panel: 'Panel A',
      status: 'Scheduled',
    },
    {
      id: 's2',
      group: 'Group Gamma',
      date: '2026-03-28',
      time: '1:00 PM - 2:00 PM',
      room: 'Room 102',
      panel: 'Panel B',
      status: 'Scheduled',
    },
    {
      id: 's3',
      group: 'Group Delta',
      date: '2026-03-10',
      time: '10:00 AM - 11:00 AM',
      room: 'Room 201',
      panel: 'Panel A',
      status: 'Completed',
    },
  ];

  const statusPill = (s: ScheduleItem['status']): string => {
    if (s === 'Completed') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (s === 'Re-Defense') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  const calendarDays = useMemo(() => {
    const start = new Date('2026-03-01T00:00:00');
    const days: Array<{ key: string; label: string; date: string }> = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const date = `${yyyy}-${mm}-${dd}`;
      days.push({ key: date, label: String(d.getDate()), date });
    }
    return days;
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    items.forEach((i) => {
      map.set(i.date, [...(map.get(i.date) ?? []), i]);
    });
    return map;
  }, [items]);

  return (
    <AdviserLayout title="Schedule" subtitle="Defense schedule for assigned groups (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Defense Scheduling</div>
                <div className="text-sm text-slate-500">View as calendar or list.</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${view === 'list'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <List size={16} />
                List
              </button>
              <button
                type="button"
                onClick={() => setView('calendar')}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${view === 'calendar'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <CalendarDays size={16} />
                Calendar
              </button>
            </div>
          </div>
        </motion.section>

        {view === 'list' ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-3 font-semibold">Group</th>
                    <th className="text-left py-3 font-semibold">Date</th>
                    <th className="text-left py-3 font-semibold">Time</th>
                    <th className="text-left py-3 font-semibold">Room</th>
                    <th className="text-left py-3 font-semibold">Panel</th>
                    <th className="text-left py-3 font-semibold">Status</th>
                    <th className="text-right py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="py-3 font-semibold text-slate-900">{i.group}</td>
                      <td className="py-3 text-slate-600 whitespace-nowrap">{i.date}</td>
                      <td className="py-3 text-slate-600 whitespace-nowrap">{i.time}</td>
                      <td className="py-3 text-slate-600 whitespace-nowrap">{i.room}</td>
                      <td className="py-3 text-slate-600 whitespace-nowrap">{i.panel}</td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(i.status)}`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => alert('UI only: view details')} className="rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-800">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-sm font-semibold text-slate-900">March 2026 (dummy)</div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {calendarDays.map((d) => {
                const entries = byDate.get(d.date) ?? [];
                return (
                  <div key={d.key} className="rounded-2xl border border-slate-200 bg-white p-2 min-h-20">
                    <div className="text-xs font-semibold text-slate-700">{d.label}</div>
                    <div className="mt-2 space-y-1">
                      {entries.slice(0, 2).map((e) => (
                        <div key={e.id} className="rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-[10px] font-semibold text-indigo-700 truncate">
                          {e.group}
                        </div>
                      ))}
                      {entries.length > 2 ? (
                        <div className="text-[10px] text-slate-500 font-semibold">+{entries.length - 2} more</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </AdviserLayout>
  );
};

export default AdviserSchedule;
