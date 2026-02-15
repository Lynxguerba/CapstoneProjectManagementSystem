import React from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import StudentLayout from './_layout';

type ProgressStep = {
  key: string;
  label: string;
  status: 'done' | 'current' | 'next';
};

type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
};

const StudentDashboard = () => {
  const steps: ProgressStep[] = [
    { key: 'concept', label: 'Concept Phase', status: 'done' },
    { key: 'outline', label: 'Outline Defense', status: 'current' },
    { key: 'predeploy', label: 'Pre-Deployment', status: 'next' },
    { key: 'deployment', label: 'Deployment', status: 'next' },
    { key: 'archived', label: 'Archived', status: 'next' },
  ];

  const statusCards = [
    {
      title: 'Concept Status',
      value: 'Approved',
      sub: 'Concept 2 accepted by adviser',
      icon: CheckCircle2,
      tone: 'from-teal-500 to-emerald-500',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Defense Schedule',
      value: 'Outline Defense',
      sub: 'Mar 22, 2026 • 9:00 AM',
      icon: CalendarClock,
      tone: 'from-indigo-500 to-violet-500',
      pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Payment Status',
      value: 'Verified',
      sub: 'Receipt validated',
      icon: CreditCard,
      tone: 'from-slate-700 to-slate-900',
      pill: 'bg-slate-50 text-slate-700 border-slate-200',
    },
    {
      title: 'Verdict Status',
      value: 'Pending',
      sub: 'Waiting for panel evaluation',
      icon: FileCheck2,
      tone: 'from-amber-500 to-orange-500',
      pill: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ] as const;

  const upcomingSchedule = [
    { title: 'Consultation with Adviser', date: '2026-03-18', time: '3:00 PM', location: 'Faculty Room' },
    { title: 'Outline Defense', date: '2026-03-22', time: '9:00 AM', location: 'Room 101' },
    { title: 'Document Revision Check', date: '2026-03-24', time: '1:30 PM', location: 'Online (Meet)' },
  ];

  const deadlines = [
    { name: 'Outline Defense Slides', due: '2026-03-20', status: 'near' as const },
    { name: 'Proposal Manuscript v2', due: '2026-03-25', status: 'on_track' as const },
    { name: 'Pre-Deployment Requirements', due: '2026-04-10', status: 'on_track' as const },
  ];

  const notifications: DashboardNotification[] = [
    { id: 'n1', title: 'Adviser Comment', message: 'Please refine the scope in your concept description.', date: '2026-03-12', tone: 'info' },
    { id: 'n2', title: 'Deadline Approaching', message: 'Slides due in 2 days.', date: '2026-03-18', tone: 'warning' },
    { id: 'n3', title: 'Payment Verified', message: 'Your defense payment was verified.', date: '2026-03-10', tone: 'success' },
    { id: 'n4', title: 'Schedule Published', message: 'Outline defense schedule is now available.', date: '2026-03-14', tone: 'info' },
  ];

  const toneStyles: Record<DashboardNotification['tone'], string> = {
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    danger: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  const deadlinePill = (status: 'on_track' | 'near' | 'overdue'): string => {
    if (status === 'overdue') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (status === 'near') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <StudentLayout title="Dashboard" subtitle="Your capstone workspace overview">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="text-slate-700" size={18} />
                <h3 className="text-lg font-semibold text-slate-900">Progress Tracker</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">Track your capstone phase from concept to archiving.</p>
            </div>
            <button
              type="button"
              onClick={() => alert('UI only: open full progress details')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              View details
            </button>
          </div>

          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {steps.map((step, idx) => {
                const isDone = step.status === 'done';
                const isCurrent = step.status === 'current';

                return (
                  <div key={step.key} className="relative">
                    <div
                      className={`rounded-2xl border p-4 ${isCurrent
                        ? 'border-indigo-200 bg-indigo-50'
                        : isDone
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-800">{step.label}</div>
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center ${isCurrent
                            ? 'bg-indigo-600'
                            : isDone
                              ? 'bg-emerald-600'
                              : 'bg-slate-400'
                            }`}
                        >
                          {isDone ? (
                            <CheckCircle2 size={16} className="text-white" />
                          ) : isCurrent ? (
                            <Clock3 size={16} className="text-white" />
                          ) : (
                            <ShieldAlert size={16} className="text-white" />
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">Step {idx + 1} of {steps.length}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {statusCards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * idx }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{card.title}</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{card.value}</div>
                  <div className="mt-2 text-sm text-slate-600">{card.sub}</div>
                </div>
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${card.tone} flex items-center justify-center shadow-sm`}>
                  <card.icon size={18} className="text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${card.pill}`}>
                  Updated just now (dummy)
                </span>
              </div>
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upcoming Schedule</h3>
                <p className="text-sm text-slate-500 mt-1">Next events you need to attend.</p>
              </div>
              <button
                type="button"
                onClick={() => alert('UI only: go to defense schedule page')}
                className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow-lg"
              >
                Open schedule
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-3 font-semibold">Event</th>
                    <th className="text-left py-3 font-semibold">Date</th>
                    <th className="text-left py-3 font-semibold">Time</th>
                    <th className="text-left py-3 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingSchedule.map((row) => (
                    <tr key={row.title} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">{row.title}</td>
                      <td className="py-3 text-slate-600">{row.date}</td>
                      <td className="py-3 text-slate-600">{row.time}</td>
                      <td className="py-3 text-slate-600">{row.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Deadline Countdown</h3>
                <p className="text-sm text-slate-500 mt-1">Stay compliant and on track.</p>
              </div>
              <Clock3 size={18} className="text-slate-600" />
            </div>

            <div className="mt-5 space-y-3">
              {deadlines.map((d) => (
                <div
                  key={d.name}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 truncate">{d.name}</div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${deadlinePill(d.status === 'near' ? 'near' : 'on_track')}`}>
                      {d.status === 'near' ? 'Near deadline' : 'On track'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">Due: {d.due}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => alert('UI only: go to deadlines & notifications')}
              className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              View deadlines
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
            </div>
            <button
              type="button"
              onClick={() => alert('UI only: open notifications center')}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              View all
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((n) => (
              <div key={n.id} className={`rounded-2xl border p-4 ${toneStyles[n.tone]} bg-white`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs opacity-80 whitespace-nowrap">{n.date}</div>
                </div>
                <div className="mt-1 text-sm text-slate-700">{n.message}</div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
