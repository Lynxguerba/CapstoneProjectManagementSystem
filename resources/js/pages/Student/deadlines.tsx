import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock3 } from 'lucide-react';
import StudentLayout from './_layout';

type DeadlineTone = 'on_track' | 'near' | 'overdue';

type DeadlineItem = {
  id: string;
  name: string;
  due: string;
  tone: DeadlineTone;
};

const StudentDeadlines = () => {
  const deadlines: DeadlineItem[] = [
    { id: 'd1', name: 'Concept Deadline', due: '2026-03-18', tone: 'overdue' },
    { id: 'd2', name: 'Manuscript Deadline', due: '2026-03-25', tone: 'near' },
    { id: 'd3', name: 'Defense Schedule', due: '2026-03-22', tone: 'on_track' },
    { id: 'd4', name: 'Deployment Deadline', due: '2026-05-10', tone: 'on_track' },
  ];

  const toneMeta: Record<DeadlineTone, { label: string; pill: string }> = {
    on_track: { label: 'On track', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    near: { label: 'Near deadline', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
    overdue: { label: 'Overdue', pill: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const soonest = useMemo(() => deadlines[1], [deadlines]);

  const notifications = [
    { id: 'n1', title: '3 days before reminder', message: 'Manuscript deadline is approaching.', date: '2026-03-22' },
    { id: 'n2', title: '1 day before reminder', message: 'Defense schedule is tomorrow.', date: '2026-03-21' },
    { id: 'n3', title: 'Overdue alert', message: 'Concept deadline has passed. Contact your adviser.', date: '2026-03-19' },
  ];

  return (
    <StudentLayout title="Deadlines & Notifications" subtitle="Countdown, color coding, and alerts (UI only)">
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Next Deadline</h3>
              <p className="text-sm text-slate-500 mt-1">Countdown UI placeholder (backend will compute later).</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3">
              <Clock3 size={18} className="text-indigo-700" />
              <div className="text-sm font-semibold text-indigo-700">{soonest.name} • {soonest.due}</div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900">Deadlines</h3>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Requirement</th>
                  <th className="text-left py-3 font-semibold">Due</th>
                  <th className="text-left py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deadlines.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">{d.name}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{d.due}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneMeta[d.tone].pill}`}>
                        {toneMeta[d.tone].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{n.date}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{n.title}</div>
                <div className="mt-1 text-sm text-slate-600">{n.message}</div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </StudentLayout>
  );
};

export default StudentDeadlines;
