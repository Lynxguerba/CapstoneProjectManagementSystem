import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import InstructorLayout from './_layout';

type GroupStatus = 'Concept Pending' | 'Concept Approved' | 'Concept Rejected';

type GroupRow = {
  id: string;
  name: string;
  members: number;
  section: string;
  adviser: string;
  conceptStatus: GroupStatus;
  defenseStatus: 'Not Scheduled' | 'Scheduled' | 'Completed';
  paymentStatus: 'Unpaid' | 'Paid' | 'Verified';
};

const GroupsPage = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | GroupStatus>('all');

  const groups: GroupRow[] = [
    {
      id: 'g1',
      name: 'Group 1',
      members: 4,
      section: 'BSIT-4A',
      adviser: 'Prof. Cruz',
      conceptStatus: 'Concept Pending',
      defenseStatus: 'Not Scheduled',
      paymentStatus: 'Verified',
    },
    {
      id: 'g2',
      name: 'Group 2',
      members: 4,
      section: 'BSIT-4B',
      adviser: 'Prof. Reyes',
      conceptStatus: 'Concept Approved',
      defenseStatus: 'Scheduled',
      paymentStatus: 'Paid',
    },
    {
      id: 'g3',
      name: 'Group 3',
      members: 3,
      section: 'BSIS-4A',
      adviser: 'Prof. Santos',
      conceptStatus: 'Concept Rejected',
      defenseStatus: 'Not Scheduled',
      paymentStatus: 'Unpaid',
    },
  ];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return groups.filter((g) => {
      const matchesSearch = !s || g.name.toLowerCase().includes(s) || g.adviser.toLowerCase().includes(s);
      const matchesStatus = status === 'all' || g.conceptStatus === status;
      return matchesSearch && matchesStatus;
    });
  }, [groups, search, status]);

  const badge = (value: string) => {
    const map: Record<string, string> = {
      'Concept Pending': 'bg-amber-100 text-amber-700',
      'Concept Approved': 'bg-teal-100 text-teal-700',
      'Concept Rejected': 'bg-rose-100 text-rose-700',
      'Not Scheduled': 'bg-slate-100 text-slate-700',
      Scheduled: 'bg-indigo-100 text-indigo-700',
      Completed: 'bg-teal-100 text-teal-700',
      Unpaid: 'bg-rose-100 text-rose-700',
      Paid: 'bg-amber-100 text-amber-700',
      Verified: 'bg-teal-100 text-teal-700',
    };

    return map[value] ?? 'bg-slate-100 text-slate-700';
  };

  return (
    <InstructorLayout title="Groups Management" subtitle="Monitor capstone groups, statuses, and quick actions">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">All Groups</h3>
              <p className="text-sm text-slate-500">UI-only preview using dummy data</p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search group or adviser..."
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                <option value="all">All Concept Status</option>
                <option value="Concept Pending">Concept Pending</option>
                <option value="Concept Approved">Concept Approved</option>
                <option value="Concept Rejected">Concept Rejected</option>
              </select>

              <button
                onClick={() => alert('UI only: open Assign Panel modal')}
                className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-medium"
              >
                Assign Panel
              </button>
              <button
                onClick={() => alert('UI only: open Schedule modal')}
                className="bg-white border border-slate-300 text-slate-800 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                Schedule Defense
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-4 font-semibold">Group</th>
                  <th className="text-left py-4 font-semibold">Members</th>
                  <th className="text-left py-4 font-semibold">Section</th>
                  <th className="text-left py-4 font-semibold">Adviser</th>
                  <th className="text-left py-4 font-semibold">Concept</th>
                  <th className="text-left py-4 font-semibold">Defense</th>
                  <th className="text-left py-4 font-semibold">Payment</th>
                  <th className="text-left py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-medium text-slate-800">{g.name}</td>
                    <td className="py-4 text-slate-600">{g.members}</td>
                    <td className="py-4 text-slate-600">{g.section}</td>
                    <td className="py-4 text-slate-600">{g.adviser}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(g.conceptStatus)}`}>{g.conceptStatus}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(g.defenseStatus)}`}>{g.defenseStatus}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(g.paymentStatus)}`}>{g.paymentStatus}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert(`UI only: open ${g.name} details`)}
                          className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => alert('UI only: validate requirements')}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition"
                        >
                          Validate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No groups match your filters.</div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </InstructorLayout>
  );
};

export default GroupsPage;
