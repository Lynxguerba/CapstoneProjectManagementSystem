import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Filter, Search } from 'lucide-react';
import PanelLayout from '../_layout';

type PastEvalRow = {
  id: string;
  group: string;
  projectTitle: string;
  defenseType: 'Outline' | 'Pre-Deployment' | 'Final';
  defenseDate: string;
  score: number;
  verdict: 'Approved' | 'Re-Defense';
};

const PanelistPastEvaluations = () => {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<'all' | '2025-2026' | '2024-2025'>('2025-2026');

  const rows: PastEvalRow[] = useMemo(
    () => [
      { id: 'p1', group: 'Group Delta', projectTitle: 'Library Asset Tracking', defenseType: 'Final', defenseDate: '2026-03-28', score: 88, verdict: 'Approved' },
      { id: 'p2', group: 'Group Omega', projectTitle: 'Barangay Service Portal', defenseType: 'Outline', defenseDate: '2026-02-14', score: 76, verdict: 'Re-Defense' },
      { id: 'p3', group: 'Group Sigma', projectTitle: 'Inventory Forecasting Tool', defenseType: 'Pre-Deployment', defenseDate: '2026-01-30', score: 84, verdict: 'Approved' },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      const matchesYear = year === 'all' || year === '2025-2026';
      const matchesQuery = !q || r.group.toLowerCase().includes(q) || r.projectTitle.toLowerCase().includes(q);
      return matchesYear && matchesQuery;
    });
  }, [rows, query, year]);

  const verdictPill = (v: PastEvalRow['verdict']): string => {
    if (v === 'Approved') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <PanelLayout title="Past Evaluations" subtitle="Evaluation archive and history (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Evaluation History</div>
                <div className="text-sm text-slate-500">Search by group/title and filter by academic year.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search group or title..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="relative w-full sm:w-52">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All years</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
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
                  <th className="text-left py-3 font-semibold">Defense</th>
                  <th className="text-left py-3 font-semibold">Date</th>
                  <th className="text-left py-3 font-semibold">Score</th>
                  <th className="text-left py-3 font-semibold">Verdict</th>
                  <th className="text-right py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{r.group}</td>
                    <td className="py-3 text-slate-700 min-w-[220px]">{r.projectTitle}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{r.defenseType}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{r.defenseDate}</td>
                    <td className="py-3 text-slate-700 tabular-nums">{r.score}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${verdictPill(r.verdict)}`}>
                        {r.verdict}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => alert('UI only: view evaluation details')}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          View details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-600">
                      No past evaluations found.
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

export default PanelistPastEvaluations;
