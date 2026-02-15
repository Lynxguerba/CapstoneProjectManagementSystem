import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Clock, X } from 'lucide-react';
import AdviserLayout from './_layout';

type Deadline = {
  id: string;
  name: string;
  due: string;
  scope: string;
  status: 'On Track' | 'Near' | 'Overdue';
};

const AdviserDeadlines = () => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const deadlines: Deadline[] = [
    { id: 'd1', name: 'Concept Approval Window', due: '2026-03-25', scope: 'All groups', status: 'Near' },
    { id: 'd2', name: 'Outline Manuscript v2', due: '2026-03-28', scope: 'Group Beta', status: 'On Track' },
    { id: 'd3', name: 'Pre-Oral Manuscript', due: '2026-03-15', scope: 'Group Delta', status: 'Overdue' },
  ];

  const pill = (s: Deadline['status']): string => {
    if (s === 'Overdue') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (s === 'Near') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <AdviserLayout title="Deadlines" subtitle="Submission deadlines and extensions (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Deadline Tracker</div>
                <div className="text-sm text-slate-500">View deadlines and request extensions (dummy).</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
            >
              Request extension
            </button>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Deadline</th>
                  <th className="text-left py-3 font-semibold">Scope</th>
                  <th className="text-left py-3 font-semibold">Due</th>
                  <th className="text-left py-3 font-semibold">Status</th>
                  <th className="text-right py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deadlines.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 font-semibold text-slate-900 whitespace-nowrap">{d.name}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{d.scope}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{d.due}</td>
                    <td className="py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${pill(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => alert('UI only: open deadline detail')}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
              onClick={() => setOpen(false)}
            >
              <motion.div
                initial={{ y: 18, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 18, opacity: 0, scale: 0.98 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={18} className="text-slate-700" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Request Extension</div>
                      <div className="text-sm text-slate-600">Dummy request form</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-900">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Target deadline</label>
                    <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      {deadlines.map((d) => (
                        <option key={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Proposed new date</label>
                      <input type="date" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Scope</label>
                      <input placeholder="e.g., Group Beta" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Reason</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why an extension is needed..."
                      className="mt-2 h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        alert('UI only: submit extension request');
                        setOpen(false);
                        setReason('');
                      }}
                      className="flex-1 rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800"
                    >
                      Submit request
                    </button>
                    <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </AdviserLayout>
  );
};

export default AdviserDeadlines;
