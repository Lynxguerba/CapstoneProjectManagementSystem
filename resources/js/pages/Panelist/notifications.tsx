import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Filter, Search } from 'lucide-react';
import PanelLayout from './_layout';

type NotificationTone = 'info' | 'success' | 'warning' | 'danger';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  tone: NotificationTone;
  isRead: boolean;
  type: 'assignment' | 'document' | 'schedule' | 'deadline' | 'verdict';
};

const PanelistNotifications = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | NotificationItem['type']>('all');

  const notifications: NotificationItem[] = [
    { id: 'n1', title: 'New group assignment', message: 'You were assigned to Group Alpha (Outline).', date: '2026-03-10', tone: 'info', isRead: false, type: 'assignment' },
    { id: 'n2', title: 'New document uploaded', message: 'Group Beta uploaded Proposal Manuscript.', date: '2026-03-12', tone: 'info', isRead: true, type: 'document' },
    { id: 'n3', title: 'Defense reminder', message: 'Outline Defense for Group Alpha is in 2 days.', date: '2026-03-19', tone: 'warning', isRead: false, type: 'schedule' },
    { id: 'n4', title: 'Evaluation submitted', message: 'Your evaluation for Group Delta has been submitted.', date: '2026-03-11', tone: 'success', isRead: true, type: 'verdict' },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return notifications.filter((n) => {
      const matchesType = filter === 'all' || n.type === filter;
      const matchesQuery = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [notifications, query, filter]);

  const toneStyles: Record<NotificationTone, string> = {
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    danger: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  return (
    <PanelLayout title="Notifications" subtitle="Updates and reminders (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Notification Center</div>
                <div className="text-sm text-slate-500">Mark read/unread is UI-only for now.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="relative w-full sm:w-56">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All types</option>
                  <option value="assignment">Assignments</option>
                  <option value="document">Documents</option>
                  <option value="schedule">Schedule</option>
                  <option value="deadline">Deadlines</option>
                  <option value="verdict">Verdict</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((n) => (
              <div key={n.id} className={`rounded-2xl border p-5 bg-white ${toneStyles[n.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold truncate">{n.title}</div>
                      {!n.isRead ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          NEW
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm text-slate-700">{n.message}</div>
                    <div className="mt-3 text-xs text-slate-600">{n.date}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('UI only: toggle read/unread')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Toggle
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600 lg:col-span-2">
                No notifications found.
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => alert('UI only: mark all as read')}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow"
            >
              Mark all as read
            </button>
            <button
              type="button"
              onClick={() => alert('UI only: clear all')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Clear all
            </button>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistNotifications;
