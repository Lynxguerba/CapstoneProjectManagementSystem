import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import InstructorLayout from './_layout';

type Verdict = 'Approved' | 'Re-Defense';

type VerdictRow = {
  id: string;
  group: string;
  title: string;
  avgScore: number;
  recommendation: 'Approve' | 'Re-Defense' | 'Pending';
  suggestedVerdict: Verdict;
  finalVerdict?: Verdict;
  updatedAt: string;
};

const VerdictPage = () => {
  const [selectedGroup, setSelectedGroup] = useState('Group 2');
  const [history, setHistory] = useState<{ at: string; group: string; action: string }[]>([
    { at: '2026-03-20 11:10', group: 'Group 2', action: 'Verdict set to Approved' },
  ]);

  const rows: VerdictRow[] = [
    {
      id: 'v1',
      group: 'Group 2',
      title: 'Smart Attendance with QR + Face Match',
      avgScore: 90.5,
      recommendation: 'Approve',
      suggestedVerdict: 'Approved',
      finalVerdict: 'Approved',
      updatedAt: '2026-03-20',
    },
    {
      id: 'v2',
      group: 'Group 1',
      title: 'Capstone Projects Management System',
      avgScore: 79.1,
      recommendation: 'Pending',
      suggestedVerdict: 'Re-Defense',
      updatedAt: '2026-03-18',
    },
    {
      id: 'v3',
      group: 'Group 3',
      title: 'Inventory Forecasting for Campus Supplies',
      avgScore: 72.4,
      recommendation: 'Re-Defense',
      suggestedVerdict: 'Re-Defense',
      finalVerdict: 'Re-Defense',
      updatedAt: '2026-03-17',
    },
  ];

  const current = useMemo(() => rows.find((r) => r.group === selectedGroup) ?? rows[0], [rows, selectedGroup]);

  const setVerdict = (value: Verdict) => {
    const at = new Date();
    const stamp = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')} ${String(
      at.getHours(),
    ).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;

    setHistory([{ at: stamp, group: current.group, action: `Verdict set to ${value}` }, ...history]);
    alert(`UI only: saved verdict = ${value}`);
  };

  const badge = (value: string) => {
    const map: Record<string, string> = {
      Approved: 'bg-teal-100 text-teal-700',
      'Re-Defense': 'bg-rose-100 text-rose-700',
      Pending: 'bg-amber-100 text-amber-700',
      Approve: 'bg-teal-100 text-teal-700',
    };

    return map[value] ?? 'bg-slate-100 text-slate-700';
  };

  return (
    <InstructorLayout title="Verdict Management" subtitle="Finalize outcomes based on panel results (UI only)">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Decision Panel</h3>
                <p className="text-sm text-slate-500">Consolidated scores + recommendations</p>
              </div>

              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                {rows.map((r) => (
                  <option key={r.id} value={r.group}>
                    {r.group}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="text-sm text-slate-500 font-semibold">Average Score</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{current.avgScore}</div>
              </div>
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="text-sm text-slate-500 font-semibold">Recommendation</div>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(current.recommendation)}`}>{current.recommendation}</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="text-sm text-slate-500 font-semibold">Suggested Verdict</div>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(current.suggestedVerdict)}`}>{current.suggestedVerdict}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-700">{current.title}</div>
              <div className="mt-4 flex gap-3 flex-wrap">
                <button
                  onClick={() => setVerdict('Approved')}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  Approve
                </button>
                <button
                  onClick={() => setVerdict('Re-Defense')}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  Re-Defense
                </button>
                <button
                  onClick={() => alert('UI only: open verdict history details')}
                  className="bg-white border border-slate-300 text-slate-800 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all font-semibold"
                >
                  View History
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800">All Groups</h3>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-4 font-semibold">Group</th>
                    <th className="text-left py-4 font-semibold">Average</th>
                    <th className="text-left py-4 font-semibold">Recommendation</th>
                    <th className="text-left py-4 font-semibold">Final Verdict</th>
                    <th className="text-left py-4 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-medium text-slate-800">{r.group}</td>
                      <td className="py-4 text-slate-600">{r.avgScore}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(r.recommendation)}`}>{r.recommendation}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(r.finalVerdict ?? 'Pending')}`}>{r.finalVerdict ?? 'Pending'}</span>
                      </td>
                      <td className="py-4 text-slate-600">{r.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800">History Log</h3>
          <p className="text-sm text-slate-500 mt-1">Latest actions</p>

          <div className="mt-6 space-y-3">
            {history.map((h, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <div className="text-xs text-slate-500">{h.at}</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">{h.group}</div>
                <div className="mt-1 text-sm text-slate-600">{h.action}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </InstructorLayout>
  );
};

export default VerdictPage;
