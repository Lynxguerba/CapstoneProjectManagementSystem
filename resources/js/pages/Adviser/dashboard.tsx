import React from 'react';
import { motion } from 'framer-motion';
import {
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
import AdviserLayout from './_layout';

type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
};

const AdviserDashboard = () => {
  const stats = [
    {
      label: 'Assigned Groups',
      value: 6,
      icon: Users,
      tone: 'from-slate-800 to-slate-700',
      pill: 'bg-slate-50 text-slate-700 border-slate-200',
    },
    {
      label: 'Pending Concept Reviews',
      value: 4,
      icon: FileText,
      tone: 'from-amber-500 to-orange-500',
      pill: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'Pending Document Reviews',
      value: 9,
      icon: FolderOpen,
      tone: 'from-indigo-500 to-violet-500',
      pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      label: 'Upcoming Defenses',
      value: 2,
      icon: CalendarClock,
      tone: 'from-emerald-500 to-teal-500',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ] as const;

  const upcomingSchedule = [
    { title: 'Consultation - Group Alpha', date: '2026-03-18', time: '2:00 PM', room: 'Faculty Room' },
    { title: 'Outline Defense - Group Beta', date: '2026-03-21', time: '9:00 AM', room: 'Room 101' },
    { title: 'Document Review - Group Gamma', date: '2026-03-24', time: '1:30 PM', room: 'Online' },
  ];

  const notifications: DashboardNotification[] = [
    { id: 'n1', title: 'Concept Submitted', message: 'Group Alpha submitted 3 concept proposals.', date: '2026-03-12', tone: 'info' },
    { id: 'n2', title: 'Revision Uploaded', message: 'Group Beta uploaded revised manuscript v2.', date: '2026-03-13', tone: 'warning' },
    { id: 'n3', title: 'Document Approved', message: 'You approved Chapter 1-3 for Group Gamma.', date: '2026-03-11', tone: 'success' },
    { id: 'n4', title: 'Defense Scheduled', message: 'Group Beta defense scheduled on Mar 21.', date: '2026-03-14', tone: 'info' },
  ];

  const reviewBreakdownData = [
    { id: 0, value: 12, label: 'Approved', color: '#10b981' },
    { id: 1, value: 7, label: 'Pending', color: '#f59e0b' },
    { id: 2, value: 4, label: 'For Revision', color: '#6366f1' },
    { id: 3, value: 1, label: 'Rejected', color: '#f43f5e' },
  ] as const;

  const toneStyles: Record<DashboardNotification['tone'], string> = {
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    danger: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  return (
    <AdviserLayout title="Dashboard" subtitle="Adviser workspace overview (UI only)">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {stats.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * idx }}
              className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative flex flex-col h-full gap-4">
                {/* Top section with number and icon */}
                <div className="flex items-start justify-between gap-3">
                  <div className="text-3xl font-bold text-slate-900 group-hover:scale-105 transition-transform duration-300">
                    {card.value}
                  </div>

                  {/* Icon with enhanced styling */}
                  <div className="relative flex-shrink-0">
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.tone} opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300`} />

                    {/* Icon container */}
                    <div className={`relative h-12 w-12 rounded-2xl bg-gradient-to-br ${card.tone} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <card.icon size={20} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {/* Label at bottom */}
                <div className="text-sm font-semibold text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                  {card.label}
                </div>
              </div>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.tone} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl`} />
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
              <p className="text-sm text-slate-500 mt-1">Fast navigation to your most common tasks (UI only).</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {
              [
                { label: 'Review Concepts', href: '/adviser/concepts', icon: FileText, tone: 'from-indigo-500 to-violet-500' },
                { label: 'Review Documents', href: '/adviser/documents', icon: FolderOpen, tone: 'from-emerald-500 to-teal-500' },
                { label: 'Group Monitoring', href: '/adviser/groups', icon: Users, tone: 'from-slate-800 to-slate-700' },
                { label: 'Verdict & Remarks', href: '/adviser/verdict', icon: Scale, tone: 'from-amber-500 to-orange-500' },
              ].map((a) => (
                <a
                  key={a.label}
                  href={a.href}
                  className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{a.label}</div>
                      <div className="mt-1 text-sm text-slate-600">Open page</div>
                    </div>
                    <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${a.tone} flex items-center justify-center shadow-sm group-hover:scale-[1.02] transition-transform`}>
                      <a.icon size={18} className="text-white" />
                    </div>
                  </div>
                </a>
              ))
            }
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={18} className="text-slate-700" />
                  <h3 className="text-lg font-semibold text-slate-900">Progress Trend</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">Line chart showing mock review throughput.</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                MUI X Charts
              </span>
            </div>

            <Box sx={{ mt: 3 }}>
              <LineChart
                height={260}
                xAxis={[{ data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], scaleType: 'point' }]}
                series={[{ data: [5, 7, 6, 9, 10, 8], label: 'Approved / Week', color: '#4f46e5', area: true }]}
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
                  <ClipboardCheck size={18} className="text-slate-700" />
                  <h3 className="text-lg font-semibold text-slate-900">Review Breakdown</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">Concepts and documents status.</p>
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

                <div className="lg:w-40">
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
          transition={{ delay: 0.16 }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upcoming Schedule</h3>
                <p className="text-sm text-slate-500 mt-1">Next events involving your assigned groups.</p>
              </div>
              <a
                href="/adviser/schedule"
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow-lg"
              >
                Open schedule
              </a>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-3 font-semibold">Event</th>
                    <th className="text-left py-3 font-semibold">Date</th>
                    <th className="text-left py-3 font-semibold">Time</th>
                    <th className="text-left py-3 font-semibold">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingSchedule.map((row) => (
                    <tr key={row.title} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">{row.title}</td>
                      <td className="py-3 text-slate-600">{row.date}</td>
                      <td className="py-3 text-slate-600">{row.time}</td>
                      <td className="py-3 text-slate-600">{row.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
              <a href="/adviser/notifications" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
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
      </div>
    </AdviserLayout>
  );
};

export default AdviserDashboard;
