import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Scale, Users } from 'lucide-react';
import PanelLayout from '../_layout';

type Verdict = 'Approve' | 'Re-Defense';

type PanelScore = {
  name: string;
  score: number | null;
  status: 'Submitted' | 'Pending';
};

const PanelistVerdictRecommendation = () => {
  const [groupId, setGroupId] = useState('g1');
  const [verdict, setVerdict] = useState<Verdict>('Approve');
  const [reasoning, setReasoning] = useState('');

  const groups = [
    { id: 'g1', name: 'Group Alpha', title: 'Smart Attendance via QR' },
    { id: 'g2', name: 'Group Delta', title: 'Library Asset Tracking' },
  ];

  const selected = useMemo(() => groups.find((g) => g.id === groupId) ?? groups[0], [groups, groupId]);

  const scores: PanelScore[] = useMemo(
    () => [
      { name: 'You', score: 86, status: 'Submitted' },
      { name: 'Prof. A. Reyes', score: 83, status: 'Submitted' },
      { name: 'Prof. J. Ramos', score: null, status: 'Pending' },
    ],
    []
  );

  const average = useMemo(() => {
    const submitted = scores.filter((s) => typeof s.score === 'number') as Array<{ score: number }>;
    if (submitted.length === 0) {
      return null;
    }
    return Math.round(submitted.reduce((a, b) => a + b.score, 0) / submitted.length);
  }, [scores]);

  return (
    <PanelLayout title="Verdict Recommendation" subtitle="Recommend approve or re-defense (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Select Group</div>
                <div className="text-sm text-slate-500">Verdict recommendation is allowed after evaluation (logic to be enforced later).</div>
              </div>
            </div>

            <div className="w-full lg:w-80">
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Group</div>
            <div className="mt-2 text-xl font-bold text-slate-900">{selected.name}</div>
            <div className="mt-1 text-sm text-slate-600">{selected.title}</div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Average panel score</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{average === null ? '—' : average}</div>
                <div className="mt-2 text-sm text-slate-600">Calculated from submitted scores (dummy).</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-700" />
                  <div className="text-sm font-semibold text-slate-900">Panel Scores</div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scores.map((s) => (
                    <div key={s.name} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-xs text-slate-500">{s.name}</div>
                      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{s.score === null ? '—' : s.score}</div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${s.status === 'Submitted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="text-lg font-semibold text-slate-900">Your Recommendation</div>
          <div className="text-sm text-slate-500 mt-1">You can modify until instructor finalizes (UI only).</div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Verdict</label>
              <select
                value={verdict}
                onChange={(e) => setVerdict(e.target.value as any)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Approve">Approve</option>
                <option value="Re-Defense">Re-Defense</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Reasoning (required if re-defense)</label>
              <input
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Explain your reasoning..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => alert('UI only: submit recommendation')}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow inline-flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              Submit recommendation
            </button>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistVerdictRecommendation;
