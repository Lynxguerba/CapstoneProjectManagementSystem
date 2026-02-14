import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import InstructorLayout from './_layout';

type EvalRow = {
  id: string;
  group: string;
  panelMember: string;
  score: number;
  remarks: string;
  submittedAt: string;
};

const EvaluationPage = () => {
  const [groupFilter, setGroupFilter] = useState<'all' | 'Group 1' | 'Group 2' | 'Group 3'>('all');
  const [search, setSearch] = useState('');

  const rows: EvalRow[] = [
    {
      id: 'e1',
      group: 'Group 2',
      panelMember: 'Prof. A',
      score: 92,
      remarks: 'Well-structured; minor UI polish recommended.',
      submittedAt: '2026-03-20',
    },
    {
      id: 'e2',
      group: 'Group 2',
      panelMember: 'Prof. B',
      score: 89,
      remarks: 'Good implementation; tighten documentation.',
      submittedAt: '2026-03-20',
    },
    {
      id: 'e3',
      group: 'Group 1',
      panelMember: 'Prof. C',
      score: 78,
      remarks: 'Scope too broad for timeline; clarify features.',
      submittedAt: '2026-03-18',
    },
  ];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesGroup = groupFilter === 'all' || r.group === groupFilter;
      const matchesSearch = !s || r.panelMember.toLowerCase().includes(s) || r.remarks.toLowerCase().includes(s);
      return matchesGroup && matchesSearch;
    });
  }, [rows, groupFilter, search]);

  const summary = useMemo(() => {
    const perGroup = new Map<string, number[]>();
    for (const r of filtered) {
      const list = perGroup.get(r.group) ?? [];
      list.push(r.score);
      perGroup.set(r.group, list);
    }

    return Array.from(perGroup.entries()).map(([group, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const submitted = scores.length;
      return { group, avg: Math.round(avg * 10) / 10, submitted };
    });
  }, [filtered]);

  return (
    <InstructorLayout title="Panel Evaluation Monitoring" subtitle="Track submissions, averages, and remarks (UI only)">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {summary.length === 0 ? (
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-sm text-slate-500">
              No evaluation rows for selected filters.
            </div>
          ) : (
            summary.map((s) => (
              <div key={s.group} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="text-sm font-semibold text-slate-600">{s.group}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{s.avg}</div>
                <div className="mt-1 text-sm text-slate-500">Average score</div>
                <div className="mt-4 text-xs text-slate-600 font-medium">{s.submitted} panel submission(s)</div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Evaluation Records</h3>
              <p className="text-sm text-slate-500">Instructor view-only monitoring</p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value as any)}
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                <option value="all">All Groups</option>
                <option value="Group 1">Group 1</option>
                <option value="Group 2">Group 2</option>
                <option value="Group 3">Group 3</option>
              </select>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search panel member or remarks..."
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />

              <button
                onClick={() => alert('UI only: export summary')}
                className="bg-white border border-slate-300 text-slate-800 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                Export
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-4 font-semibold">Group</th>
                  <th className="text-left py-4 font-semibold">Panel Member</th>
                  <th className="text-left py-4 font-semibold">Score</th>
                  <th className="text-left py-4 font-semibold">Remarks</th>
                  <th className="text-left py-4 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-medium text-slate-800">{r.group}</td>
                    <td className="py-4 text-slate-700">{r.panelMember}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">{r.score}</span>
                    </td>
                    <td className="py-4 text-slate-600 max-w-xl">{r.remarks}</td>
                    <td className="py-4 text-slate-600">{r.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </InstructorLayout>
  );
};

export default EvaluationPage;
