import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Search } from 'lucide-react';
import PanelLayout from './_layout';

type DefenseType = 'Outline' | 'Pre-Deployment' | 'Final';

type ScheduleRow = {
  id: string;
  date: string;
  time: string;
  group: string;
  projectTitle: string;
  room: string;
  defenseType: DefenseType;
  coPanelists: string;
  documentReviewStatus: 'Not Reviewed' | 'In Progress' | 'Reviewed';
  evaluationStatus: 'Pending' | 'Submitted' | 'Locked';
};

const PanelistSchedule = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | DefenseType>('all');

  const schedule: ScheduleRow[] = [
    {
      id: 's1',
      date: '2026-03-21',
      time: '9:00 AM',
      group: 'Group Alpha',
      projectTitle: 'Smart Attendance via QR',
      room: 'Room 101',
      defenseType: 'Outline',
      coPanelists: 'Prof. A. Reyes, Prof. J. Ramos',
      documentReviewStatus: 'In Progress',
      evaluationStatus: 'Pending',
    },
    {
      id: 's2',
      date: '2026-03-28',
      time: '1:00 PM',
      group: 'Group Delta',
      projectTitle: 'Library Asset Tracking',
      room: 'Room 202',
      defenseType: 'Final',
      coPanelists: 'Prof. L. Cruz, Prof. A. Reyes',
      documentReviewStatus: 'Reviewed',
      evaluationStatus: 'Submitted',
    },
    {
      id: 's3',
      date: '2026-04-03',
      time: '10:30 AM',
      group: 'Group Beta',
      projectTitle: 'Clinic Queue Management',
      room: 'Online',
      defenseType: 'Pre-Deployment',
      coPanelists: 'Prof. J. Ramos, Prof. L. Cruz',
      documentReviewStatus: 'Not Reviewed',
      evaluationStatus: 'Pending',
    },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return schedule.filter((s) => {
      const matchesType = type === 'all' || s.defenseType === type;
      const matchesQuery =
        !q ||
        s.group.toLowerCase().includes(q) ||
        s.projectTitle.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q) ||
        s.coPanelists.toLowerCase().includes(q);

      return matchesType && matchesQuery;
    });
  }, [schedule, query, type]);

  const badge = (value: string): string => {
    if (value === 'Reviewed' || value === 'Submitted' || value === 'Locked') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (value === 'In Progress') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }

    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <PanelLayout title="Defense Schedule" subtitle="Your assigned defenses (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Schedule List View</div>
                <div className="text-sm text-slate-500">Calendar view can be added later; this is UI-only list.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search group, room, panelist..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="relative w-full sm:w-52">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All types</option>
                  <option value="Outline">Outline</option>
                  <option value="Pre-Deployment">Pre-Deployment</option>
                  <option value="Final">Final</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Date & Time</th>
                  <th className="text-left py-3 font-semibold">Group</th>
                  <th className="text-left py-3 font-semibold">Project</th>
                  <th className="text-left py-3 font-semibold">Room</th>
                  <th className="text-left py-3 font-semibold">Type</th>
                  <th className="text-left py-3 font-semibold">Co-Panel</th>
                  <th className="text-left py-3 font-semibold">Docs</th>
                  <th className="text-left py-3 font-semibold">Evaluation</th>
                  <th className="text-right py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-3 text-slate-700 whitespace-nowrap">{row.date} • {row.time}</td>
                    <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{row.group}</td>
                    <td className="py-3 text-slate-700 min-w-[220px]">{row.projectTitle}</td>
                    <td className="py-3 text-slate-700">{row.room}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{row.defenseType}</td>
                    <td className="py-3 text-slate-700 min-w-[220px]">{row.coPanelists}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge(row.documentReviewStatus)}`}>
                        {row.documentReviewStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge(row.evaluationStatus)}`}>
                        {row.evaluationStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href="/panelist/group-details"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Details
                        </a>
                        <a
                          href="/panelist/documents"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Review docs
                        </a>
                        <a
                          href="/panelist/evaluation"
                          className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-3 py-2 text-xs font-semibold text-white hover:shadow"
                        >
                          Evaluate
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-600">
                      No schedule items match.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistSchedule;
