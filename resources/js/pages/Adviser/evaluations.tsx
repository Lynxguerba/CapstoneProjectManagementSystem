import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Star } from 'lucide-react';
import AdviserLayout from './_layout';

type Recommendation = 'Ready for Defense' | 'Needs Revision' | 'Recommend Re-Defense';

type RubricItem = {
  key: string;
  label: string;
  score: number;
};

const AdviserEvaluations = () => {
  const [recommendation, setRecommendation] = useState<Recommendation>('Ready for Defense');
  const [notes, setNotes] = useState('');
  const [rubric, setRubric] = useState<RubricItem[]>([
    { key: 'scope', label: 'Scope & Objectives', score: 8 },
    { key: 'method', label: 'Methodology', score: 7 },
    { key: 'docs', label: 'Documentation Quality', score: 8 },
    { key: 'readiness', label: 'Defense Readiness', score: 7 },
  ]);

  const updateScore = (key: string, score: number) => {
    setRubric((prev) => prev.map((r) => (r.key === key ? { ...r, score } : r)));
  };

  const total = rubric.reduce((a, b) => a + b.score, 0);
  const max = rubric.length * 10;

  return (
    <AdviserLayout title="Evaluations" subtitle="Adviser scoring and recommendation (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Rubric Form</div>
                <div className="text-sm text-slate-500">Scores are dummy and not submitted to backend.</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
              <Star size={16} className="text-amber-500" />
              Total: {total}/{max}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-900">Scoring</div>
              <div className="mt-4 space-y-5">
                {rubric.map((r) => (
                  <div key={r.key} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">{r.label}</div>
                      <div className="text-sm font-bold text-slate-900">{r.score}/10</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={r.score}
                      onChange={(e) => updateScore(r.key, Number(e.target.value))}
                      className="mt-3 w-full"
                    />
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${r.score * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-900">Recommendation</div>

              <label className="mt-4 block text-sm font-semibold text-slate-700">Decision</label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as Recommendation)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option>Ready for Defense</option>
                <option>Needs Revision</option>
                <option>Recommend Re-Defense</option>
              </select>

              <label className="mt-4 block text-sm font-semibold text-slate-700">Feedback</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your evaluation feedback..."
                className="mt-2 h-32 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={() => alert('UI only: submit evaluation')}
                className="mt-4 w-full rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800"
              >
                Submit evaluation
              </button>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="text-sm font-semibold text-slate-900">Note</div>
                <div className="mt-1 text-sm text-slate-600">This module is UI-only; scores do not persist.</div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserEvaluations;
