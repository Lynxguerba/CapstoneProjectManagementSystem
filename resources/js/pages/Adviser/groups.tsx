import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { Filter, Search, Users } from 'lucide-react';
import AdviserLayout from './_layout';

type GroupStatus = 'On Track' | 'Needs Review' | 'For Defense' | 'Revision Cycle';

type Group = {
  id: string;
  name: string;
  members: string[];
  currentPhase: string;
  conceptStatus: string;
  documentStatus: string;
  defenseSchedule: string;
  status: GroupStatus;
};

const AdviserGroups = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | GroupStatus>('all');

  const groups: Group[] = [
    {
      id: 'g1',
      name: 'Group Alpha',
      members: ['Juan D.', 'Maria S.', 'Carlo T.', 'Ana P.'],
      currentPhase: 'Concept',
      conceptStatus: 'Pending',
      documentStatus: '—',
      defenseSchedule: '—',
      status: 'Needs Review',
    },
    {
      id: 'g2',
      name: 'Group Beta',
      members: ['Mark R.', 'Lea C.', 'John K.', 'Kate V.'],
      currentPhase: 'Outline Defense',
      conceptStatus: 'Approved',
      documentStatus: 'For Revision',
      defenseSchedule: '2026-03-21 • 9:00 AM',
      status: 'Revision Cycle',
    },
    {
      id: 'g3',
      name: 'Group Gamma',
      members: ['Luis A.', 'Ella M.', 'Ryan L.', 'Mia G.'],
      currentPhase: 'Pre-Oral',
      conceptStatus: 'Approved',
      documentStatus: 'Approved',
      defenseSchedule: '2026-03-28 • 1:00 PM',
      status: 'For Defense',
    },
    {
      id: 'g4',
      name: 'Group Delta',
      members: ['Tom B.', 'Amy J.', 'Ken S.', 'Lara N.'],
      currentPhase: 'Final Defense',
      conceptStatus: 'Approved',
      documentStatus: 'Pending',
      defenseSchedule: 'TBD',
      status: 'On Track',
    },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => {
      const matchesQuery = !q || g.name.toLowerCase().includes(q) || g.members.some((m) => m.toLowerCase().includes(q));
      const matchesStatus = status === 'all' || g.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [groups, query, status]);

  const statusPill = (s: GroupStatus): string => {
    if (s === 'For Defense') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }

    if (s === 'Needs Review') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    if (s === 'Revision Cycle') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <AdviserLayout title="Groups" subtitle="Assigned capstone groups (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Group Directory</div>
                <div className="text-sm text-slate-500">Search, filter, and open details.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search group or member..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="relative w-full sm:w-56">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All statuses</option>
                  <option value="On Track">On Track</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="For Defense">For Defense</option>
                  <option value="Revision Cycle">Revision Cycle</option>
                </select>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">Groups ({filtered.length})</div>
            <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">UI only</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Group</th>
                  <th className="text-left py-3 font-semibold">Members</th>
                  <th className="text-left py-3 font-semibold">Phase</th>
                  <th className="text-left py-3 font-semibold">Concept</th>
                  <th className="text-left py-3 font-semibold">Documents</th>
                  <th className="text-left py-3 font-semibold">Defense</th>
                  <th className="text-left py-3 font-semibold">Status</th>
                  <th className="text-right py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-900 whitespace-nowrap">{g.name}</td>
                    <td className="py-3 text-slate-600 min-w-52">
                      <div className="line-clamp-2">{g.members.join(', ')}</div>
                    </td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{g.currentPhase}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{g.conceptStatus}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{g.documentStatus}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{g.defenseSchedule}</td>
                    <td className="py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(g.status)}`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Link
                        href="/adviser/group-details"
                        preserveScroll
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-800"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserGroups;
