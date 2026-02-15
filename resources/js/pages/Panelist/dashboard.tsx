import React from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Scale,
  Users,
} from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import PanelLayout from './_layout';

type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
};

type PendingDocument = {
  id: string;
  group: string;
  documentType: string;
  uploadedAt: string;
  status: 'Not Reviewed' | 'In Progress' | 'Reviewed';
};

type UpcomingDefense = {
  id: string;
  group: string;
  defenseType: 'Outline' | 'Pre-Deployment' | 'Final';
  date: string;
  time: string;
  room: string;
};

const PanelistDashboard = () => {
  const stats = [
    {
      label: 'Total Assigned Groups',
      value: 8,
      icon: Users,
      tone: 'from-slate-800 to-slate-700',
    },
    {
      label: 'Pending Evaluations',
      value: 3,
      icon: ClipboardCheck,
      tone: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Upcoming Defenses',
      value: 2,
      icon: CalendarClock,
      tone: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Completed Evaluations',
      value: 5,
      icon: Scale,
      tone: 'from-indigo-500 to-violet-500',
    },
  ] as const;

  const upcomingDefenses: UpcomingDefense[] = [
    { id: 'ud1', group: 'Group Alpha', defenseType: 'Outline', date: '2026-03-21', time: '9:00 AM', room: 'Room 101' },
    { id: 'ud2', group: 'Group Delta', defenseType: 'Final', date: '2026-03-28', time: '1:00 PM', room: 'Room 202' },
    { id: 'ud3', group: 'Group Gamma', defenseType: 'Pre-Deployment', date: '2026-04-03', time: '10:30 AM', room: 'Online' },
  ];

  const pendingDocuments: PendingDocument[] = [
    { id: 'pd1', group: 'Group Beta', documentType: 'Proposal Manuscript', uploadedAt: '2026-03-12', status: 'Not Reviewed' },
    { id: 'pd2', group: 'Group Alpha', documentType: 'Presentation Slides', uploadedAt: '2026-03-13', status: 'In Progress' },
    { id: 'pd3', group: 'Group Delta', documentType: 'Final Manuscript', uploadedAt: '2026-03-10', status: 'Not Reviewed' },
  ];

  const urgentTasks = [
    { label: 'Defenses within 3 days', value: 1, tone: 'bg-rose-50 text-rose-700 border-rose-200' },
    { label: 'Pending evaluations', value: 3, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Documents needing review', value: 2, tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ] as const;

  const notifications: DashboardNotification[] = [
    { id: 'n1', title: 'New Document Uploaded', message: 'Group Beta uploaded Proposal Manuscript.', date: '2026-03-12', tone: 'info' },
    { id: 'n2', title: 'Defense Reminder', message: 'Outline Defense for Group Alpha is in 2 days.', date: '2026-03-19', tone: 'warning' },
    { id: 'n3', title: 'Evaluation Submitted', message: 'You submitted evaluation for Group Omega.', date: '2026-03-11', tone: 'success' },
  ];

  const toneStyles: Record<DashboardNotification['tone'], string> = {
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    danger: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  const reviewBreakdownData = [
    { id: 0, value: 4, label: 'Reviewed', color: '#10b981' },
    { id: 1, value: 3, label: 'In Progress', color: '#6366f1' },
    { id: 2, value: 5, label: 'Not Reviewed', color: '#f59e0b' },
  ] as const;

  return (
    <PanelLayout title="Dashboard" subtitle="Evaluation workspace overview (UI only)">
      <div className="space-y-8">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * idx }}
              className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{card.label}</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{card.value}</div>
                  <div className="mt-3 text-sm text-slate-600">Dummy summary</div>
                </div>
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${card.tone} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                  <card.icon size={20} className="text-white" />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.tone} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl`} />
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={18} className="text-slate-700" />
                  <h3 className="text-lg font-semibold text-slate-900">Scoring Trend</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">Line chart using MUI X Charts (dummy).</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                MUI X Charts
              </span>
            </div>

            <Box sx={{ mt: 3 }}>
              <LineChart
                height={260}
                xAxis={[{ data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], scaleType: 'point' }]}
                series={[{ data: [82, 78, 85, 88, 84, 90], label: 'Avg Score Given', color: '#4f46e5', area: true }]}
                margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                grid={{ vertical: true, horizontal: true }}
              />
              <Typography sx={{ mt: 1, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                Dummy analytics only. Real data will come from backend.
              </Typography>
            </Box>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-slate-700" />
                  <h3 className="text-lg font-semibold text-slate-900">Document Review Status</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">Pie chart distribution (dummy).</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                MUI X Charts
              </span>
            </div>

            <Box sx={{ mt: 2 }}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 flex justify-center">
                  <PieChart
                    height={260}
                    series={[
                      {
                        data: [...reviewBreakdownData],
                        innerRadius: 60,
                        outerRadius: 100,
                        paddingAngle: 3,
                        cornerRadius: 6,
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { innerRadius: 60, additionalRadius: -4, color: 'gray' },
                      },
                    ]}
                    slotProps={{ legend: { hidden: true } }}
                  />
                </div>

                <div className="lg:w-44">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Legend</div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
                    {reviewBreakdownData.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium truncate">{item.label}</span>
                        <span className="ml-auto text-slate-500 tabular-nums">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Box>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upcoming Defense Schedule</h3>
                <p className="text-sm text-slate-500 mt-1">Quick view of what you need to attend.</p>
              </div>
              <a
                href="/panelist/schedule"
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow-lg"
              >
                Open schedule
              </a>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-3 font-semibold">Group</th>
                    <th className="text-left py-3 font-semibold">Defense Type</th>
                    <th className="text-left py-3 font-semibold">Date & Time</th>
                    <th className="text-left py-3 font-semibold">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingDefenses.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">{row.group}</td>
                      <td className="py-3 text-slate-600">{row.defenseType}</td>
                      <td className="py-3 text-slate-600">{row.date} • {row.time}</td>
                      <td className="py-3 text-slate-600">{row.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-slate-700" />
                <h3 className="text-lg font-semibold text-slate-900">Recent Notifications</h3>
              </div>
              <a href="/panelist/notifications" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                View all
              </a>
            </div>

            <div className="mt-5 space-y-3">
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
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 xl:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen size={18} className="text-slate-700" />
                  <h3 className="text-lg font-semibold text-slate-900">Documents Pending Review</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">Open the document review center to comment.</p>
              </div>
              <a
                href="/panelist/documents"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Open documents
              </a>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-3 font-semibold">Group</th>
                    <th className="text-left py-3 font-semibold">Document Type</th>
                    <th className="text-left py-3 font-semibold">Upload Date</th>
                    <th className="text-left py-3 font-semibold">Review Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingDocuments.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">{row.group}</td>
                      <td className="py-3 text-slate-600">{row.documentType}</td>
                      <td className="py-3 text-slate-600">{row.uploadedAt}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${row.status === 'Reviewed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.status === 'In Progress'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-lg font-semibold text-slate-900">Urgent Tasks</div>
            <p className="text-sm text-slate-500 mt-1">Auto-highlighted items (dummy).</p>

            <div className="mt-5 space-y-3">
              {urgentTasks.map((t) => (
                <div key={t.label} className={`rounded-2xl border p-4 ${t.tone} bg-white`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-2xl font-bold tabular-nums">{t.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistDashboard;
