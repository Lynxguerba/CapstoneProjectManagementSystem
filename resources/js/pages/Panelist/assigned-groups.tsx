import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { Filter, Search, Users } from 'lucide-react';
import PanelLayout from './_layout';

type DefenseType = 'Outline' | 'Pre-Deployment' | 'Final';

type EvalStatus = 'Scheduled' | 'Pending' | 'Evaluated';

type GroupRow = {
  id: string;
  groupName: string;
  projectTitle: string;
  members: Array<{ name: string; role: string }>;
  adviser: string;
  defenseType: DefenseType;
  defenseDate: string;
  evaluationStatus: EvalStatus;
  section: string;
};

const PanelistAssignedGroups = () => {
  const [query, setQuery] = useState('');
  const [defenseType, setDefenseType] = useState<'all' | DefenseType>('all');
  const [status, setStatus] = useState<'all' | EvalStatus>('all');

  const groups: GroupRow[] = [
    {
      id: 'g1',
      groupName: 'Group Alpha',
      projectTitle: 'Smart Attendance via QR',
      members: [
        { name: 'Juan D.', role: 'PM/Analyst' },
        { name: 'Maria S.', role: 'Programmer' },
        { name: 'Carlo T.', role: 'Documentarian' },
      ],
      adviser: 'Prof. L. Cruz',
      defenseType: 'Outline',
      defenseDate: '2026-03-21 • 9:00 AM',
      evaluationStatus: 'Pending',
      section: 'BSIT 4A',
    },
    {
      id: 'g2',
      groupName: 'Group Beta',
      projectTitle: 'Clinic Queue Management',
      members: [
        { name: 'Mark R.', role: 'PM/Analyst' },
        { name: 'Lea C.', role: 'Programmer' },
        { name: 'John K.', role: 'Documentarian' },
      ],
      adviser: 'Prof. A. Reyes',
      defenseType: 'Pre-Deployment',
      defenseDate: '2026-04-03 • 10:30 AM',
      evaluationStatus: 'Scheduled',
      section: 'BSIT 4B',
    },
    {
      id: 'g3',
      groupName: 'Group Delta',
      projectTitle: 'Library Asset Tracking',
      members: [
        { name: 'Tom B.', role: 'PM/Analyst' },
        { name: 'Amy J.', role: 'Programmer' },
        { name: 'Ken S.', role: 'Documentarian' },
      ],
      adviser: 'Prof. J. Ramos',
      defenseType: 'Final',
      defenseDate: '2026-03-28 • 1:00 PM',
      evaluationStatus: 'Evaluated',
      section: 'BSIT 4A',
    },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return groups.filter((g) => {
      const matchesQuery =
        !q ||
        g.groupName.toLowerCase().includes(q) ||
        g.projectTitle.toLowerCase().includes(q) ||
        g.members.some((m) => m.name.toLowerCase().includes(q)) ||
        g.adviser.toLowerCase().includes(q);

      const matchesDefenseType = defenseType === 'all' || g.defenseType === defenseType;
      const matchesStatus = status === 'all' || g.evaluationStatus === status;

      return matchesQuery && matchesDefenseType && matchesStatus;
    });
  }, [groups, query, defenseType, status]);

  const statusPill = (s: EvalStatus): string => {
    if (s === 'Evaluated') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (s === 'Pending') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <PanelLayout title="Assigned Groups" subtitle="Groups assigned to you for evaluation (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Group Directory</div>
                <div className="text-sm text-slate-500">Search, filter, and open actions.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search group, title, member..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="relative w-full sm:w-52">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={defenseType}
                  onChange={(e) => setDefenseType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All defense types</option>
                  <option value="Outline">Outline</option>
                  <option value="Pre-Deployment">Pre-Deployment</option>
                  <option value="Final">Final</option>
                </select>
              </div>

              <div className="relative w-full sm:w-40">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Pending">Pending</option>
                  <option value="Evaluated">Evaluated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Group</th>
                  <th className="text-left py-3 font-semibold">Project</th>
                  <th className="text-left py-3 font-semibold">Adviser</th>
                  <th className="text-left py-3 font-semibold">Defense</th>
                  <th className="text-left py-3 font-semibold">Date</th>
                  <th className="text-left py-3 font-semibold">Status</th>
                  <th className="text-right py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="py-3">
                      <div className="font-semibold text-slate-900">{g.groupName}</div>
                      <div className="text-xs text-slate-500">{g.section}</div>
                    </td>
                    <td className="py-3 text-slate-700">{g.projectTitle}</td>
                    <td className="py-3 text-slate-700">{g.adviser}</td>
                    <td className="py-3 text-slate-700">{g.defenseType}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{g.defenseDate}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(g.evaluationStatus)}`}>
                        {g.evaluationStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/panelist/group-details?group=${encodeURIComponent(g.id)}`}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          View details
                        </Link>
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
                    <td colSpan={7} className="py-10 text-center text-slate-600">
                      No groups match your filters.
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

export default PanelistAssignedGroups;
