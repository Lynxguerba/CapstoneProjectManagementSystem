import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ClipboardCheck, Save } from 'lucide-react';
import PanelLayout from '../_layout';

type Verdict = 'Approve' | 'Re-Defense' | 'Conditional Approval';

type Criterion = {
  key: string;
  title: string;
  description: string;
};

const PanelistEvaluationForm = () => {
  const [groupId, setGroupId] = useState('g1');

  const groups = [
    {
      id: 'g1',
      name: 'Group Alpha',
      projectTitle: 'Smart Attendance via QR',
      defenseType: 'Outline',
      defenseDate: '2026-03-21 • 9:00 AM',
      coPanelists: 'Prof. A. Reyes, Prof. J. Ramos',
    },
    {
      id: 'g2',
      name: 'Group Delta',
      projectTitle: 'Library Asset Tracking',
      defenseType: 'Final',
      defenseDate: '2026-03-28 • 1:00 PM',
      coPanelists: 'Prof. L. Cruz, Prof. A. Reyes',
    },
  ];

  const selected = useMemo(() => groups.find((g) => g.id === groupId) ?? groups[0], [groups, groupId]);

  const criteria: Criterion[] = [
    { key: 'presentation', title: 'Presentation Quality', description: 'Clarity, time management, visual aids.' },
    { key: 'technical', title: 'Technical Understanding', description: 'Concept grasp, Q&A, problem-solving.' },
    { key: 'feasibility', title: 'Project Feasibility', description: 'Scope, implementation plan, resources.' },
    { key: 'documentation', title: 'Documentation Quality', description: 'Completeness, accuracy, citations.' },
    { key: 'innovation', title: 'Innovation / Originality', description: 'Uniqueness, contribution, creativity.' },
    { key: 'qa', title: 'Q&A Performance', description: 'Response quality, confidence, collaboration.' },
  ];

  const [scores, setScores] = useState<Record<string, number>>({
    presentation: 8,
    technical: 8,
    feasibility: 7,
    documentation: 8,
    innovation: 7,
    qa: 8,
  });

  const total = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);
  const maxTotal = criteria.length * 10;
  const percent = Math.round((total / maxTotal) * 100);

  const [overallComments, setOverallComments] = useState('');
  const [verdict, setVerdict] = useState<Verdict>('Approve');
  const [revisions, setRevisions] = useState('');

  const scorePill = (p: number): string => {
    if (p >= 85) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (p >= 70) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <PanelLayout title="Evaluation & Scoring" subtitle="Submit scores after defense (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Select Group</div>
                <div className="text-sm text-slate-500">Pick a defense schedule item.</div>
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
                    {g.name} • {g.defenseType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 lg:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Defense Info</div>
              <div className="mt-2 text-xl font-bold text-slate-900">{selected.name}</div>
              <div className="mt-1 text-sm text-slate-600">{selected.projectTitle}</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Defense Type</div>
                  <div className="font-semibold text-slate-800">{selected.defenseType}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Date</div>
                  <div className="font-semibold text-slate-800">{selected.defenseDate}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-slate-500">Co-Panelists</div>
                  <div className="font-semibold text-slate-800">{selected.coPanelists}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total Score</div>
              <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{total} / {maxTotal}</div>
              <div className="mt-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${scorePill(percent)}`}>
                  {percent}%
                </span>
              </div>
              <div className="mt-4 text-sm text-slate-600">Auto-calculated (dummy).</div>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="text-lg font-semibold text-slate-900">Evaluation Criteria</div>
          <div className="text-sm text-slate-500 mt-1">Score each criterion from 1–10.</div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {criteria.map((c) => (
              <div key={c.key} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{c.description}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums">
                    {scores[c.key] ?? 0}
                  </div>
                </div>

                <input
                  type="range"
                  min={1}
                  max={10}
                  value={scores[c.key] ?? 0}
                  onChange={(e) => setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))}
                  className="mt-4 w-full"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-lg font-semibold text-slate-900">Overall Comments</div>
            <div className="text-sm text-slate-500 mt-1">Strengths, improvements, recommendations.</div>
            <textarea
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              rows={6}
              placeholder="Write your overall feedback..."
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-lg font-semibold text-slate-900">Verdict</div>
            <div className="text-sm text-slate-500 mt-1">Recommend the outcome.</div>

            <select
              value={verdict}
              onChange={(e) => setVerdict(e.target.value as any)}
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Approve">Approve</option>
              <option value="Re-Defense">Re-Defense</option>
              <option value="Conditional Approval">Conditional Approval</option>
            </select>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-600">Required revisions (if needed)</label>
              <textarea
                value={revisions}
                onChange={(e) => setRevisions(e.target.value)}
                rows={5}
                placeholder="List required changes..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => alert('UI only: save as draft')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save draft
              </button>
              <button
                type="button"
                onClick={() => alert('UI only: submit evaluation (final)')}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow inline-flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Submit evaluation
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistEvaluationForm;
