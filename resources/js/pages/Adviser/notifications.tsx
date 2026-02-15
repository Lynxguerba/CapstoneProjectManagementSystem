import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Filter } from 'lucide-react';
import AdviserLayout from './_layout';

type Tone = 'info' | 'success' | 'warning' | 'danger';

type Item = {
  id: string;
  title: string;
  message: string;
  date: string;
  tone: Tone;
};

const AdviserNotifications = () => {
  const [tone, setTone] = useState<'all' | Tone>('all');

  const items: Item[] = [
    { id: 'n1', title: 'Concept Submitted', message: 'Group Alpha submitted concept proposals.', date: '2026-03-12', tone: 'info' },
    { id: 'n2', title: 'Deadline Approaching', message: 'Outline document deadline is in 2 days.', date: '2026-03-18', tone: 'warning' },
    { id: 'n3', title: 'Document Approved', message: 'You approved Chapter 1–3 for Group Gamma.', date: '2026-03-11', tone: 'success' },
    { id: 'n4', title: 'Resubmission Required', message: 'Group Beta needs revision on manuscript.', date: '2026-03-13', tone: 'danger' },
  ];

  const toneStyles: Record<Tone, string> = {
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    danger: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  const filtered = useMemo(() => {
    if (tone === 'all') {
      return items;
    }

    return items.filter((i) => i.tone === tone);
  }, [items, tone]);

  return (
    <AdviserLayout title="Notifications" subtitle="System alerts and updates (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Notification Center</div>
                <div className="text-sm text-slate-500">Filter and browse updates.</div>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </select>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((n) => (
              <div key={n.id} className={`rounded-2xl border p-5 ${toneStyles[n.tone]} bg-white`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs opacity-80 whitespace-nowrap">{n.date}</div>
                </div>
                <div className="mt-2 text-sm text-slate-700">{n.message}</div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => alert('UI only: mark as read')} className="rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                    Mark as read
                  </button>
                  <button type="button" onClick={() => alert('UI only: open related page')} className="rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-800">
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserNotifications;
